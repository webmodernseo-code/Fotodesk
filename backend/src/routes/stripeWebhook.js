const crypto = require('crypto');
const { db } = require('../database/db');
const quotaService = require('../services/quotaService');
const commissionService = require('../services/commissionService');
const logger = require('../utils/logger');

const SIGNATURE_TOLERANCE_SEC = 300; // 5 minutes

/**
 * Verifies Stripe's `Stripe-Signature` header (`t=<ts>,v1=<hex>`) against the
 * raw request body using timing-safe HMAC-SHA256 comparison.
 */
function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!rawBody || !signatureHeader || !secret) return false;
  const parts = String(signatureHeader)
    .split(',')
    .map((p) => p.trim());
  const timestampPart = parts.find((p) => p.startsWith('t='));
  const v1Signatures = parts.filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
  if (!timestampPart || v1Signatures.length === 0) return false;

  const timestamp = Number(timestampPart.slice(2));
  if (!Number.isFinite(timestamp)) return false;

  const ageSec = Math.abs(Math.floor(Date.now() / 1000) - timestamp);
  if (ageSec > SIGNATURE_TOLERANCE_SEC) return false;

  const payload = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');

  return v1Signatures.some((sig) => {
    try {
      const sigBuf = Buffer.from(sig, 'hex');
      return sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf);
    } catch {
      return false;
    }
  });
}

async function handleConfirmedPayment({ studioId, planId, amountMinor, currency, invoiceRef }) {
  const numericStudioId = Number(studioId);
  if (!Number.isInteger(numericStudioId) || numericStudioId < 1) {
    return { skipped: 'missing_studio_id' };
  }

  const normalizedPlan = planId === 'pro_yearly' ? 'pro_yearly' : 'pro_monthly';
  const limits = quotaService.getPlanLimits(normalizedPlan);
  const invoiceNumber = `STRIPE-${String(invoiceRef).slice(0, 56)}`;

  const existing = await db('subscription_invoices')
    .where({ invoice_number: invoiceNumber })
    .first('id');
  if (existing) {
    return { duplicate: true, invoiceId: existing.id };
  }

  const [inserted] = await db('subscription_invoices')
    .insert({
      studio_id: numericStudioId,
      plan_id: normalizedPlan,
      billing_interval: normalizedPlan === 'pro_yearly' ? 'yearly' : 'monthly',
      amount_minor: Number.isFinite(Number(amountMinor)) ? Number(amountMinor) : limits.monthlyPriceMinor,
      currency: String(currency || 'EUR').toUpperCase(),
      status: 'paid',
      invoice_number: invoiceNumber,
      paid_at: new Date(),
      created_at: new Date(),
    })
    .returning('id');
  const invoiceId = typeof inserted === 'object' ? inserted.id : inserted;

  await db('studios')
    .where({ id: numericStudioId })
    .update({
      plan_id: normalizedPlan,
      status: 'active',
      storage_limit_bytes: limits.storageLimitBytes,
      max_galleries: limits.maxGalleries,
      updated_at: new Date(),
    });

  await commissionService.processFirstProPaymentCommission({
    studioId: numericStudioId,
    subscriptionInvoiceId: invoiceId,
    planId: normalizedPlan,
    amountMinor: Number.isFinite(Number(amountMinor)) ? Number(amountMinor) : limits.monthlyPriceMinor,
  });

  return { duplicate: false, invoiceId };
}

async function stripeWebhookHandler(req, res) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return res.status(503).json({ error: 'Stripe webhook secret is not configured.' });
  }

  const sig = req.headers['stripe-signature'];
  if (!verifyStripeSignature(req.body, sig, secret)) {
    return res.status(400).json({ error: 'Invalid Stripe webhook signature.' });
  }

  let event;
  try {
    const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);
    event = JSON.parse(raw);
  } catch {
    return res.status(400).json({ error: 'Invalid webhook JSON payload.' });
  }

  try {
    const obj = event?.data?.object || {};
    const meta = obj.metadata || obj.subscription_details?.metadata || {};

    switch (event.type) {
      case 'checkout.session.completed': {
        const result = await handleConfirmedPayment({
          studioId: meta.studioId,
          planId: meta.planId,
          amountMinor: obj.amount_total,
          currency: obj.currency,
          invoiceRef: obj.invoice || obj.id || event.id,
        });
        return res.json({ received: true, ...result });
      }
      case 'invoice.payment_succeeded': {
        const result = await handleConfirmedPayment({
          studioId: meta.studioId,
          planId: meta.planId,
          amountMinor: obj.amount_paid,
          currency: obj.currency,
          invoiceRef: obj.id || event.id,
        });
        return res.json({ received: true, ...result });
      }
      case 'invoice.payment_failed': {
        if (meta.studioId) {
          logger.warn('Stripe invoice payment failed', { studioId: meta.studioId, eventId: event.id });
        }
        return res.json({ received: true });
      }
      case 'customer.subscription.deleted': {
        const studioId = Number(meta.studioId);
        if (Number.isInteger(studioId) && studioId > 0) {
          const starterLimits = quotaService.getPlanLimits('starter');
          await db('studios')
            .where({ id: studioId })
            .update({
              plan_id: 'starter',
              storage_limit_bytes: starterLimits.storageLimitBytes,
              max_galleries: starterLimits.maxGalleries,
              updated_at: new Date(),
            });
        }
        return res.json({ received: true });
      }
      case 'charge.refunded': {
        const invoiceRef = obj.invoice ? `STRIPE-${String(obj.invoice).slice(0, 56)}` : null;
        if (invoiceRef) {
          const inv = await db('subscription_invoices').where({ invoice_number: invoiceRef }).first('id');
          if (inv) {
            await db('subscription_invoices').where({ id: inv.id }).update({ status: 'refunded' });
            await commissionService.cancelCommissionForInvoice(inv.id);
          }
        }
        return res.json({ received: true });
      }
      default:
        return res.json({ received: true, ignored: true });
    }
  } catch (error) {
    logger.error('Stripe webhook handler error:', error);
    return res.status(500).json({ error: 'Webhook processing failed.' });
  }
}

module.exports = stripeWebhookHandler;
module.exports.verifyStripeSignature = verifyStripeSignature;

