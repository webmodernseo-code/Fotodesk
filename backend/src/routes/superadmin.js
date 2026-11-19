const express = require('express');
const { body, param, validationResult } = require('express-validator');

const { db, logActivity } = require('../database/db');
const { adminAuth } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/permissions');
const quotaService = require('../services/quotaService');
const { safeValidationErrors } = require('../utils/routeHelpers');
const logger = require('../utils/logger');

const router = express.Router();

// Strict Super Admin guard on every /api/superadmin/* endpoint
router.use(adminAuth, requireSuperAdmin());

/**
 * 6.1 GET /api/superadmin/overview
 */
router.get('/overview', async (_req, res) => {
  try {
    const [studios, usersCountRow, commissionsRows, payoutsRows, affiliatesRows] = await Promise.all([
      db('studios as s')
        .leftJoin('admin_users as au', 'au.id', 's.owner_admin_id')
        .select(
          's.id',
          's.name',
          's.slug',
          's.plan_id',
          's.plan_status',
          's.status',
          's.billing_interval',
          's.monthly_price',
          's.referred_by_code',
          's.storage_limit_gb',
          's.created_at',
          'au.email as owner_email'
        ),
      db('admin_users').count('* as count').first(),
      db('affiliate_commissions').select('id', 'affiliate_account_id', 'referred_studio_id', 'status', 'commission_minor', 'created_at').catch(() => []),
      db('affiliate_payout_requests').orderBy('requested_at', 'desc').select('*').catch(() => []),
      db('affiliate_accounts').select('id', 'display_name', 'email', 'referral_code', 'is_active', 'created_at').catch(() => []),
    ]);

    const now = Date.now();
    const dayMs = 86_400_000;
    let activeStudios = 0;
    let suspendedStudios = 0;
    let proStudios = 0;
    let starterStudios = 0;
    let mrrEur = 0;
    let new7d = 0;
    let new30d = 0;
    let new90d = 0;

    for (const s of studios) {
      if (s.status === 'suspended') suspendedStudios += 1;
      else activeStudios += 1;

      if (s.plan_id === 'pro_monthly' || s.plan_id === 'pro_yearly' || s.plan_id === 'pro') {
        proStudios += 1;
        mrrEur += Number(s.monthly_price || 9.9);
      } else {
        starterStudios += 1;
      }

      const createdMs = s.created_at ? new Date(s.created_at).getTime() : 0;
      if (createdMs && now - createdMs <= 7 * dayMs) new7d += 1;
      if (createdMs && now - createdMs <= 30 * dayMs) new30d += 1;
      if (createdMs && now - createdMs <= 90 * dayMs) new90d += 1;
    }

    const pendingCommissionsMinor = commissionsRows
      .filter((c) => c.status === 'pending')
      .reduce((acc, c) => acc + Number(c.commission_minor || 0), 0);
    const harvestedCommissionsMinor = commissionsRows
      .filter((c) => c.status === 'approved' || c.status === 'paid')
      .reduce((acc, c) => acc + Number(c.commission_minor || 0), 0);

    const pendingPayoutsCount = payoutsRows.filter((p) => p.status === 'pending').length;

    return res.json({
      kpis: {
        totalStudios: studios.length,
        activeStudios,
        suspendedStudios,
        totalUsers: Number(usersCountRow?.count || 0),
        starterStudios,
        proStudios,
        mrrEur: Number(mrrEur.toFixed(2)),
        arrEur: Number((mrrEur * 12).toFixed(2)),
        pendingCommissionsMinor,
        pendingPayoutsCount,
      },
      metrics: {
        totalStudios: studios.length,
        payingStudios: proStudios,
        mrrEur: Number(mrrEur.toFixed(2)),
        totalAffiliates: affiliatesRows.length,
        totalClicks: 0,
        affiliatePendingEur: Number((pendingCommissionsMinor / 100).toFixed(2)),
        affiliateHarvestedEur: Number((harvestedCommissionsMinor / 100).toFixed(2)),
        pendingPayoutRequestsCount: pendingPayoutsCount,
      },
      studios: studios.map((s) => ({
        id: s.id,
        name: s.name,
        planId: s.plan_id || 'starter',
        planStatus: s.status === 'suspended' ? 'suspended' : (s.plan_status || 'active'),
        billingInterval: s.billing_interval || 'monthly',
        monthlyPrice: Number(s.monthly_price || 0),
        referredByCode: s.referred_by_code || undefined,
        storageLimitGb: Number(s.storage_limit_gb ?? 3),
        createdAt: s.created_at,
        ownerEmail: s.owner_email || undefined,
      })),
      affiliates: affiliatesRows.map((a) => ({
        id: a.id,
        displayName: a.display_name,
        email: a.email,
        referralCode: a.referral_code,
        isActive: Boolean(a.is_active),
        createdAt: a.created_at,
      })),
      referrals: commissionsRows.map((c) => ({
        id: c.id,
        affiliateId: c.affiliate_account_id,
        status: c.status,
        commissionAmount: Number((Number(c.commission_minor || 0) / 100).toFixed(2)),
        currency: 'EUR',
        createdAt: c.created_at,
      })),
      payoutRequests: payoutsRows,
      growth: {
        last7DaysStudios: new7d,
        last30DaysStudios: new30d,
        last90DaysStudios: new90d,
      },
      alerts: [
        ...(suspendedStudios > 0
          ? [{ type: 'warning', message: `${suspendedStudios} studio(s) actuellement suspendu(s).` }]
          : []),
        ...(pendingPayoutsCount > 0
          ? [{ type: 'info', message: `${pendingPayoutsCount} demande(s) de virement affilié en attente.` }]
          : []),
      ],
    });
  } catch (error) {
    logger.error('GET /api/superadmin/overview error:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement de la vue Super Admin.' });
  }
});

/**
 * 6.2 Studios management
 */
router.get('/studios', async (_req, res) => {
  try {
    const studios = await db('studios as s')
      .leftJoin('admin_users as au', 'au.id', 's.owner_admin_id')
      .select(
        's.id',
        's.name',
        's.slug',
        's.plan_id',
        's.status',
        's.suspension_reason',
        's.monthly_price',
        's.city',
        's.country',
        's.created_at',
        'au.email as owner_email',
        'au.username as owner_username'
      )
      .orderBy('s.created_at', 'desc');
    return res.json({ studios });
  } catch (error) {
    logger.error('GET /api/superadmin/studios error:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement des studios.' });
  }
});

router.get('/studios/:id', [param('id').isInt({ min: 1 })], async (req, res) => {
  try {
    const studio = await db('studios').where({ id: Number(req.params.id) }).first();
    if (!studio) return res.status(404).json({ error: 'Studio introuvable.' });

    const [statusHistory, members, quotaState] = await Promise.all([
      db('studio_status_history')
        .where({ studio_id: studio.id })
        .orderBy('created_at', 'desc'),
      db('studio_memberships as sm')
        .join('admin_users as au', 'au.id', 'sm.admin_id')
        .where('sm.studio_id', studio.id)
        .select('au.id', 'au.username', 'au.email', 'au.is_active', 'sm.role'),
      quotaService.getStudioUsage(studio.id),
    ]);

    return res.json({ studio, statusHistory, members, quota: quotaState });
  } catch (error) {
    logger.error('GET /api/superadmin/studios/:id error:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement du studio.' });
  }
});

router.patch(
  '/studios/:id/status',
  [
    param('id').isInt({ min: 1 }),
    body('status').isIn(['active', 'suspended']),
    body('reason').optional({ nullable: true }).isString().trim().isLength({ max: 1000 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: safeValidationErrors(errors) });
      }

      const studioId = Number(req.params.id);
      const nextStatus = req.body.status;
      const reason = (req.body.reason || '').trim();

      if (nextStatus === 'suspended' && !reason) {
        return res.status(400).json({ error: 'Un motif est obligatoire pour suspendre un studio.' });
      }

      const studio = await db('studios').where({ id: studioId }).first();
      if (!studio) return res.status(404).json({ error: 'Studio introuvable.' });

      await db.transaction(async (trx) => {
        await trx('studios').where({ id: studioId }).update({
          status: nextStatus,
          suspension_reason: nextStatus === 'suspended' ? reason : null,
          updated_at: new Date(),
        });

        await trx('studio_status_history').insert({
          studio_id: studioId,
          from_status: studio.status || 'active',
          to_status: nextStatus,
          changed_by_admin_id: req.admin.id,
          reason: reason || null,
          created_at: new Date(),
        });
      });

      const updated = await db('studios').where({ id: studioId }).first();
      return res.json({ studio: updated });
    } catch (error) {
      logger.error('PATCH /api/superadmin/studios/:id/status error:', error);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du statut du studio.' });
    }
  }
);

router.post(
  '/studios/:id/plan',
  [
    param('id').isInt({ min: 1 }),
    body('planId').isString().trim().notEmpty(),
    body('planStatus').optional().isString().trim(),
    body('monthlyPrice').optional().isNumeric(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: safeValidationErrors(errors) });

      const studioId = Number(req.params.id);
      const studio = await db('studios').where({ id: studioId }).first();
      if (!studio) return res.status(404).json({ error: 'Studio introuvable.' });

      const planId = req.body.planId;
      const planStatus = req.body.planStatus || studio.plan_status || 'active';
      const monthlyPrice =
        req.body.monthlyPrice !== undefined
          ? Number(req.body.monthlyPrice)
          : (planId.startsWith('pro') ? 9.9 : 0);

      const isPro = planId.startsWith('pro') || planId === 'studio';
      await db('studios').where({ id: studioId }).update({
        plan_id: planId,
        plan_status: planStatus,
        status: planStatus === 'canceled' || planStatus === 'suspended' ? 'suspended' : 'active',
        monthly_price: monthlyPrice,
        storage_limit_gb: isPro ? 100 : 3,
        video_storage_limit_min: isPro ? 500 : 0,
        video_playback_limit_min: isPro ? 1000 : 0,
        updated_at: new Date(),
      });

      return res.json({ ok: true, planId, planStatus, monthlyPrice });
    } catch (error) {
      logger.error('POST /api/superadmin/studios/:id/plan error:', error);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du plan du studio.' });
    }
  }
);

/**
 * 6.3 Users management
 */
router.get('/users', async (_req, res) => {
  try {
    const users = await db('admin_users as au')
      .leftJoin('roles as r', 'r.id', 'au.role_id')
      .leftJoin('studio_memberships as sm', 'sm.admin_id', 'au.id')
      .leftJoin('studios as s', 's.id', 'sm.studio_id')
      .select(
        'au.id',
        'au.username',
        'au.email',
        'au.is_active',
        'au.last_login',
        'au.created_at',
        'r.name as role_name',
        's.id as studio_id',
        's.name as studio_name'
      )
      .orderBy('au.created_at', 'desc');
    return res.json({ users });
  } catch (error) {
    logger.error('GET /api/superadmin/users error:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement des utilisateurs.' });
  }
});

router.get('/users/:id', [param('id').isInt({ min: 1 })], async (req, res) => {
  try {
    const user = await db('admin_users as au')
      .leftJoin('roles as r', 'r.id', 'au.role_id')
      .where('au.id', Number(req.params.id))
      .first('au.id', 'au.username', 'au.email', 'au.is_active', 'au.last_login', 'au.created_at', 'r.name as role_name');
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    const memberships = await db('studio_memberships as sm')
      .join('studios as s', 's.id', 'sm.studio_id')
      .where('sm.admin_id', user.id)
      .select('s.id', 's.name', 's.plan_id', 'sm.role');

    return res.json({ user, memberships });
  } catch (error) {
    logger.error('GET /api/superadmin/users/:id error:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement de l’utilisateur.' });
  }
});

router.patch(
  '/users/:id/status',
  [param('id').isInt({ min: 1 }), body('isActive').isBoolean()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: safeValidationErrors(errors) });

      const userId = Number(req.params.id);
      if (userId === Number(req.admin.id) && req.body.isActive === false) {
        return res.status(400).json({ error: 'Vous ne pouvez pas suspendre votre propre compte.' });
      }

      const updated = await db('admin_users')
        .where({ id: userId })
        .update({ is_active: Boolean(req.body.isActive), updated_at: new Date() });
      if (!updated) return res.status(404).json({ error: 'Utilisateur introuvable.' });

      const user = await db('admin_users').where({ id: userId }).first('id', 'username', 'email', 'is_active');
      return res.json({ user });
    } catch (error) {
      logger.error('PATCH /api/superadmin/users/:id/status error:', error);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du statut utilisateur.' });
    }
  }
);

/**
 * 6.4 Subscriptions
 */
router.get('/subscriptions', async (_req, res) => {
  try {
    const [studios, invoices] = await Promise.all([
      db('studios').select('id', 'name', 'plan_id', 'plan_status', 'billing_interval', 'monthly_price', 'storage_limit_gb'),
      db('subscription_invoices').orderBy('created_at', 'desc').limit(100),
    ]);
    return res.json({ studios, invoices });
  } catch (error) {
    logger.error('GET /api/superadmin/subscriptions error:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement des souscriptions.' });
  }
});

router.get('/subscriptions/:id', [param('id').isInt({ min: 1 })], async (req, res) => {
  try {
    const studioId = Number(req.params.id);
    const studio = await db('studios').where({ id: studioId }).first();
    if (!studio) return res.status(404).json({ error: 'Souscription studio introuvable.' });

    const [invoices, quota] = await Promise.all([
      db('subscription_invoices').where({ studio_id: studioId }).orderBy('created_at', 'desc'),
      quotaService.getStudioUsage(studioId),
    ]);

    return res.json({ studio, invoices, quota });
  } catch (error) {
    logger.error('GET /api/superadmin/subscriptions/:id error:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement de la souscription.' });
  }
});

/**
 * 6.5 Affiliates
 */
router.get('/affiliates', async (_req, res) => {
  try {
    const affiliates = await db('affiliate_accounts')
      .select('id', 'email', 'display_name', 'referral_code', 'is_active', 'created_at')
      .orderBy('created_at', 'desc');
    return res.json({ affiliates });
  } catch (error) {
    logger.error('GET /api/superadmin/affiliates error:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement des affiliés.' });
  }
});

router.patch(
  '/affiliates/:id/status',
  [param('id').isInt({ min: 1 }), body('isActive').isBoolean()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: safeValidationErrors(errors) });

      const updated = await db('affiliate_accounts')
        .where({ id: Number(req.params.id) })
        .update({ is_active: Boolean(req.body.isActive) });
      if (!updated) return res.status(404).json({ error: 'Affilié introuvable.' });

      const affiliate = await db('affiliate_accounts').where({ id: Number(req.params.id) }).first();
      return res.json({ affiliate });
    } catch (error) {
      logger.error('PATCH /api/superadmin/affiliates/:id/status error:', error);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour de l’affilié.' });
    }
  }
);

/**
 * 6.6 Commissions
 */
router.get('/commissions', async (_req, res) => {
  try {
    const commissions = await db('affiliate_commissions as ac')
      .leftJoin('affiliate_accounts as aa', 'aa.id', 'ac.affiliate_account_id')
      .leftJoin('studios as s', 's.id', 'ac.referred_studio_id')
      .select(
        'ac.*',
        'aa.email as affiliate_email',
        'aa.referral_code',
        's.name as referred_studio_name'
      )
      .orderBy('ac.created_at', 'desc');
    return res.json({ commissions });
  } catch (error) {
    logger.error('GET /api/superadmin/commissions error:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement des commissions.' });
  }
});

router.patch(
  '/commissions/:id/approve',
  [param('id').isInt({ min: 1 })],
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const updated = await db('affiliate_commissions')
        .where({ id })
        .update({ status: 'approved', approved_at: new Date() });
      if (!updated) return res.status(404).json({ error: 'Commission introuvable.' });

      const commission = await db('affiliate_commissions').where({ id }).first();
      await logActivity(
        'superadmin_commission_approved',
        { commission_id: id },
        null,
        { type: 'admin', id: req.admin.id, name: req.admin.username }
      );
      return res.json({ commission });
    } catch (error) {
      logger.error('PATCH /api/superadmin/commissions/:id/approve error:', error);
      return res.status(500).json({ error: 'Erreur lors de l’approbation de la commission.' });
    }
  }
);

/**
 * 6.7 Payouts
 */
router.get('/payouts', async (_req, res) => {
  try {
    const payouts = await db('affiliate_payout_requests as apr')
      .leftJoin('affiliate_accounts as aa', 'aa.id', 'apr.affiliate_id')
      .select('apr.*', 'aa.email as affiliate_email', 'aa.display_name as affiliate_name')
      .orderBy('apr.requested_at', 'desc');
    return res.json({ payouts });
  } catch (error) {
    logger.error('GET /api/superadmin/payouts error:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement des virements.' });
  }
});

router.get('/payouts/:id', [param('id').isInt({ min: 1 })], async (req, res) => {
  try {
    const payout = await db('affiliate_payout_requests').where({ id: Number(req.params.id) }).first();
    if (!payout) return res.status(404).json({ error: 'Demande de virement introuvable.' });
    return res.json({ payout });
  } catch (error) {
    logger.error('GET /api/superadmin/payouts/:id error:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement du virement.' });
  }
});

/**
 * 6.8 Global platform settings
 */
router.get('/settings', async (_req, res) => {
  try {
    const row = await db('app_settings').where({ setting_key: 'superadmin_platform_settings' }).first();
    const settings = row?.setting_value ? JSON.parse(row.setting_value) : {
      platformName: 'FotoDesk',
      maintenanceMode: false,
      affiliateRatePercent: 20,
      starterMaxGalleries: 3,
      starterStorageGb: 3,
      proStorageGb: 100,
    };
    return res.json({ settings });
  } catch (error) {
    logger.error('GET /api/superadmin/settings error:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement des paramètres plateforme.' });
  }
});

router.put('/settings', [body('settings').isObject()], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: safeValidationErrors(errors) });

    const serialized = JSON.stringify(req.body.settings);
    const existing = await db('app_settings').where({ setting_key: 'superadmin_platform_settings' }).first('id');
    if (existing) {
      await db('app_settings')
        .where({ setting_key: 'superadmin_platform_settings' })
        .update({ setting_value: serialized, updated_at: new Date() });
    } else {
      await db('app_settings').insert({
        setting_key: 'superadmin_platform_settings',
        setting_value: serialized,
        setting_type: 'superadmin',
        updated_at: new Date(),
      });
    }
    return res.json({ settings: req.body.settings });
  } catch (error) {
    logger.error('PUT /api/superadmin/settings error:', error);
    return res.status(500).json({ error: 'Erreur lors de la sauvegarde des paramètres plateforme.' });
  }
});

module.exports = router;

