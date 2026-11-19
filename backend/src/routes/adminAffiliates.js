const express = require('express');
const crypto = require('crypto');

const { db } = require('../database/db');
const { adminAuth } = require('../middleware/auth');
const { attachStudioContext } = require('../middleware/studioContext');
const { requireModulePermission } = require('../middleware/modulePermissions');
const logger = require('../utils/logger');

const router = express.Router();

router.use(adminAuth, attachStudioContext);

/**
 * GET /api/admin/affiliates/overview
 * Returns the studio's unique referral code, referred studios, conversions, and 20% commissions.
 */
router.get('/overview', requireModulePermission('affiliate', 'view'), async (req, res) => {
  try {
    const email = (req.admin.email || '').toLowerCase();
    let account = email ? await db('affiliate_accounts').where({ email }).first() : null;

    if (!account) {
      const code = `FD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const [inserted] = await db('affiliate_accounts').insert({
        email: email || `studio-${req.studioId}@fotodesk.local`,
        password_hash: 'studio-linked',
        display_name: req.studio.name || req.admin.username,
        referral_code: code,
        is_active: true,
        created_at: new Date(),
      });
      const id = typeof inserted === 'object' ? inserted.id : inserted;
      account = await db('affiliate_accounts').where({ id }).first();
    }

    const [referredStudios, commissions] = await Promise.all([
      db('studios')
        .where({ referred_by_code: account.referral_code })
        .select('id', 'name', 'plan_id', 'status', 'created_at')
        .orderBy('created_at', 'desc'),
      db('affiliate_commissions as ac')
        .leftJoin('studios as s', 's.id', 'ac.referred_studio_id')
        .where('ac.affiliate_account_id', account.id)
        .select(
          'ac.id',
          'ac.referred_studio_id',
          's.name as studio_name',
          'ac.plan_id',
          'ac.base_amount_minor',
          'ac.commission_rate',
          'ac.commission_minor',
          'ac.status',
          'ac.created_at',
          'ac.approved_at',
          'ac.paid_at'
        )
        .orderBy('ac.created_at', 'desc'),
    ]);

    let pendingMinor = 0;
    let approvedMinor = 0;
    let paidMinor = 0;
    for (const c of commissions) {
      const amt = Number(c.commission_minor || 0);
      if (c.status === 'paid') paidMinor += amt;
      else if (c.status === 'approved') approvedMinor += amt;
      else pendingMinor += amt;
    }

    return res.json({
      referralCode: account.referral_code,
      commissionRate: 0.2,
      stats: {
        referredStudiosCount: referredStudios.length,
        proConversionsCount: commissions.length,
        pendingCommissionMinor: pendingMinor,
        approvedCommissionMinor: approvedMinor,
        paidCommissionMinor: paidMinor,
        totalCommissionMinor: pendingMinor + approvedMinor + paidMinor,
      },
      referredStudios,
      commissions,
    });
  } catch (error) {
    logger.error('GET /api/admin/affiliates/overview error:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement du programme d’affiliation.' });
  }
});

module.exports = router;

