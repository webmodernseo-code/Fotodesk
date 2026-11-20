const { db } = require('../database/db');
const logger = require('../utils/logger');

const COMMISSION_RATE = 0.2; // 20% on first Pro payment only

/**
 * Generates a 20% affiliate commission strictly on the first successful Pro payment
 * for a referred studio. Renewals or already-commissioned studios produce no commission.
 */
async function processFirstProPaymentCommission({
  studioId,
  subscriptionInvoiceId,
  planId,
  amountMinor,
}) {
  try {
    const studio = await db('studios').where({ id: Number(studioId) }).first();
    if (!studio || !studio.referred_by_code) {
      return null;
    }

    const affiliate = await db('affiliate_accounts')
      .where({ referral_code: studio.referred_by_code, is_active: true })
      .first();
    if (!affiliate) {
      return null;
    }

    // Strict first-payment rule: if a commission already exists for this studio, skip renewals.
    const existing = await db('affiliate_commissions')
      .where({ referred_studio_id: Number(studioId) })
      .first('id');
    if (existing) {
      return null;
    }

    const commissionMinor = Math.round(Number(amountMinor) * COMMISSION_RATE);
    if (commissionMinor <= 0) {
      return null;
    }

    const [inserted] = await db('affiliate_commissions').insert({
      affiliate_account_id: affiliate.id,
      referred_studio_id: Number(studioId),
      subscription_invoice_id: Number(subscriptionInvoiceId),
      plan_id: planId,
      base_amount_minor: Number(amountMinor),
      commission_rate: COMMISSION_RATE,
      commission_minor: commissionMinor,
      status: 'pending',
      created_at: new Date(),
    }).returning('id');

    const id = typeof inserted === 'object' ? inserted.id : inserted;
    return await db('affiliate_commissions').where({ id }).first();
  } catch (error) {
    logger.error('processFirstProPaymentCommission error:', error);
    return null;
  }
}

/**
 * Cancels pending/approved commission when the underlying subscription invoice is refunded.
 */
async function cancelCommissionForInvoice(subscriptionInvoiceId) {
  if (!subscriptionInvoiceId) return 0;
  try {
    return await db('affiliate_commissions')
      .where({ subscription_invoice_id: Number(subscriptionInvoiceId) })
      .whereIn('status', ['pending', 'approved'])
      .update({ status: 'cancelled' });
  } catch (error) {
    logger.error('cancelCommissionForInvoice error:', error);
    return 0;
  }
}

module.exports = {
  COMMISSION_RATE,
  processFirstProPaymentCommission,
  cancelCommissionForInvoice,
};

