const express = require('express');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');

const { db } = require('../database/db');
const { adminAuth } = require('../middleware/auth');
const { attachStudioContext } = require('../middleware/studioContext');
const { requireModulePermission } = require('../middleware/modulePermissions');
const quotaService = require('../services/quotaService');
const commissionService = require('../services/commissionService');
const { safeValidationErrors } = require('../utils/routeHelpers');
const logger = require('../utils/logger');

const router = express.Router();

router.use(adminAuth, attachStudioContext);

const UPGRADE_PLANS = {
  pro_monthly: {
    planId: 'pro_monthly',
    billingInterval: 'monthly',
    amountMinor: 990, // 9,90 EUR
    monthlyPrice: 9.9,
  },
  pro_yearly: {
    planId: 'pro_yearly',
    billingInterval: 'yearly',
    amountMinor: 9900, // 99,00 EUR
    monthlyPrice: 8.25,
  },
};

/**
 * GET /api/admin/subscription
 * Returns current studio plan, quota usage, and subscription invoices.
 */
router.get('/', requireModulePermission('settings', 'view'), async (req, res) => {
  try {
    const [quotaState, invoices] = await Promise.all([
      quotaService.getStudioUsage(req.studioId),
      db('subscription_invoices')
        .where({ studio_id: req.studioId })
        .orderBy('created_at', 'desc'),
    ]);

    return res.json({
      subscription: {
        studioId: req.studioId,
        planId: req.studio.plan_id || 'starter',
        planStatus: req.studio.plan_status || 'active',
        billingInterval: req.studio.billing_interval || 'monthly',
        monthlyPrice: Number(req.studio.monthly_price || 0),
      },
      limits: quotaState.limits,
      usage: quotaState.usage,
      invoices,
    });
  } catch (error) {
    logger.error('GET /api/admin/subscription error:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement de la souscription.' });
  }
});

/**
 * POST /api/admin/subscription/upgrade
 * Upgrades a studio to pro_monthly or pro_yearly, creates a paid subscription invoice,
 * and triggers the 20% first-payment affiliate commission if applicable.
 */
router.post(
  '/upgrade',
  requireModulePermission('settings', 'edit'),
  [body('planId').isIn(['pro_monthly', 'pro_yearly'])],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: safeValidationErrors(errors) });
      }

      const plan = UPGRADE_PLANS[req.body.planId];
      const invoiceNumber = `SUB-${new Date().getUTCFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      const invoice = await db.transaction(async (trx) => {
        await trx('studios').where({ id: req.studioId }).update({
          plan_id: plan.planId,
          plan_status: 'active',
          billing_interval: plan.billingInterval,
          monthly_price: plan.monthlyPrice,
          storage_limit_gb: 100,
          video_storage_limit_min: 500,
          video_playback_limit_min: 1000,
          updated_at: new Date(),
        });

        const [inserted] = await trx('subscription_invoices').insert({
          studio_id: req.studioId,
          plan_id: plan.planId,
          billing_interval: plan.billingInterval,
          amount_minor: plan.amountMinor,
          currency: 'EUR',
          status: 'paid',
          invoice_number: invoiceNumber,
          paid_at: new Date(),
          created_at: new Date(),
        });
        const id = typeof inserted === 'object' ? inserted.id : inserted;
        return await trx('subscription_invoices').where({ id }).first();
      });

      const commission = await commissionService.processFirstProPaymentCommission({
        studioId: req.studioId,
        subscriptionInvoiceId: invoice.id,
        planId: plan.planId,
        amountMinor: plan.amountMinor,
      });

      const updatedStudio = await db('studios').where({ id: req.studioId }).first();
      const quotaState = await quotaService.getStudioUsage(req.studioId);

      return res.json({
        subscription: {
          studioId: updatedStudio.id,
          planId: updatedStudio.plan_id,
          planStatus: updatedStudio.plan_status,
          billingInterval: updatedStudio.billing_interval,
          monthlyPrice: Number(updatedStudio.monthly_price),
        },
        limits: quotaState.limits,
        usage: quotaState.usage,
        invoice,
        affiliateCommissionGenerated: Boolean(commission),
      });
    } catch (error) {
      logger.error('POST /api/admin/subscription/upgrade error:', error);
      return res.status(500).json({ error: 'Erreur lors de la mise à niveau de l’abonnement.' });
    }
  }
);

/**
 * POST /api/admin/subscription/checkout
 * Creates a Stripe Checkout session when STRIPE_SECRET_KEY is configured,
 * or returns a structured local simulation fallback in dev/demo mode.
 */
router.post(
  '/checkout',
  requireModulePermission('settings', 'edit'),
  [body('planId').isIn(['pro_monthly', 'pro_yearly'])],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: safeValidationErrors(errors) });
      }

      const plan = UPGRADE_PLANS[req.body.planId];
      const stripeKey = process.env.STRIPE_SECRET_KEY;

      if (!stripeKey) {
        return res.json({
          mode: 'local_simulation',
          planId: plan.planId,
          amountMinor: plan.amountMinor,
          currency: 'EUR',
          checkoutUrl: null,
        });
      }

      const stripe = require('stripe')(stripeKey);
      const appUrl = process.env.APP_URL || 'http://localhost:5173';
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: req.admin.email || undefined,
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: { name: `FotoDesk ${plan.planId === 'pro_yearly' ? 'Pro Annuel' : 'Pro Mensuel'}` },
              unit_amount: plan.amountMinor,
              recurring: { interval: plan.billingInterval === 'yearly' ? 'year' : 'month' },
            },
            quantity: 1,
          },
        ],
        metadata: {
          studioId: String(req.studioId),
          planId: plan.planId,
        },
        success_url: `${appUrl}/admin/subscription?checkout=success`,
        cancel_url: `${appUrl}/admin/subscription?checkout=cancel`,
      });

      return res.json({ mode: 'stripe', checkoutUrl: session.url, sessionId: session.id });
    } catch (error) {
      logger.error('POST /api/admin/subscription/checkout error:', error);
      return res.status(500).json({ error: 'Erreur lors de la création de la session de paiement.' });
    }
  }
);

module.exports = router;

