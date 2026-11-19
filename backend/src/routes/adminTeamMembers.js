const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { body, param, validationResult } = require('express-validator');

const { db, logActivity } = require('../database/db');
const { adminAuth } = require('../middleware/auth');
const { attachStudioContext } = require('../middleware/studioContext');
const {
  requireModulePermission,
  getModulePermissionsForAdmin,
  saveModulePermissionsForMember,
} = require('../middleware/modulePermissions');
const { safeValidationErrors } = require('../utils/routeHelpers');
const logger = require('../utils/logger');

const router = express.Router();

router.use(adminAuth, attachStudioContext);

/**
 * GET /api/admin/team-members
 * Lists all members belonging to the current studio with their module permissions.
 */
router.get('/', requireModulePermission('settings', 'view'), async (req, res) => {
  try {
    const members = await db('studio_memberships as sm')
      .join('admin_users as au', 'au.id', 'sm.admin_id')
      .leftJoin('roles as r', 'r.id', 'au.role_id')
      .where('sm.studio_id', req.studioId)
      .select(
        'au.id',
        'au.username',
        'au.email',
        'au.is_active',
        'au.last_login',
        'au.must_change_password',
        'au.created_at',
        'sm.role as studio_role',
        'r.name as role_name'
      )
      .orderBy('sm.created_at', 'asc');

    const enriched = await Promise.all(
      members.map(async (m) => ({
        id: m.id,
        username: m.username,
        email: m.email,
        isActive: Boolean(m.is_active),
        studioRole: m.studio_role,
        mustChangePassword: Boolean(m.must_change_password),
        lastLogin: m.last_login,
        createdAt: m.created_at,
        modulePermissions: await getModulePermissionsForAdmin(m.id, req.studioId, {
          roleName: m.role_name,
          studioRole: m.studio_role,
        }),
      }))
    );

    return res.json({ members: enriched });
  } catch (error) {
    logger.error('GET /api/admin/team-members error:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement des membres.' });
  }
});

/**
 * POST /api/admin/team-members
 * Creates or attaches a team member to the current studio with granular module permissions.
 */
router.post(
  '/',
  requireModulePermission('settings', 'create'),
  [
    body('email').isEmail().normalizeEmail(),
    body('username').optional().isString().trim().isLength({ min: 2, max: 64 }),
    body('password').optional().isString().isLength({ min: 8, max: 128 }),
    body('modulePermissions').optional().isObject(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: safeValidationErrors(errors) });
      }

      const email = req.body.email.toLowerCase();
      const username = (req.body.username || email.split('@')[0]).trim();
      const rawPassword = req.body.password || crypto.randomBytes(12).toString('hex');

      const existingMembership = await db('studio_memberships as sm')
        .join('admin_users as au', 'au.id', 'sm.admin_id')
        .where('sm.studio_id', req.studioId)
        .where('au.email', email)
        .first('au.id');

      if (existingMembership) {
        return res.status(409).json({ error: 'Ce membre fait déjà partie de ce studio.' });
      }

      let adminUser = await db('admin_users').where({ email }).first();
      if (!adminUser) {
        const usernameConflict = await db('admin_users').where({ username }).first('id');
        const finalUsername = usernameConflict
          ? `${username}_${crypto.randomBytes(2).toString('hex')}`
          : username;

        const studioRoleRow = await db('roles').where({ name: 'admin' }).first('id');
        const roleId = studioRoleRow ? studioRoleRow.id : 2;
        const passwordHash = await bcrypt.hash(rawPassword, 10);

        const [inserted] = await db('admin_users').insert({
          username: finalUsername,
          email,
          password_hash: passwordHash,
          role_id: roleId,
          is_active: true,
          must_change_password: !req.body.password,
          created_at: new Date(),
          updated_at: new Date(),
        });
        const newId = typeof inserted === 'object' ? inserted.id : inserted;
        adminUser = await db('admin_users').where({ id: newId }).first();
      }

      await db('studio_memberships').insert({
        studio_id: req.studioId,
        admin_id: adminUser.id,
        role: 'member',
        created_at: new Date(),
      });

      const savedMatrix = await saveModulePermissionsForMember(
        req.studioId,
        adminUser.id,
        req.body.modulePermissions || {}
      );

      await logActivity(
        'team_member_added',
        { studio_id: req.studioId, member_id: adminUser.id, email },
        null,
        { type: 'admin', id: req.admin.id, name: req.admin.username }
      );

      return res.status(201).json({
        member: {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
          isActive: Boolean(adminUser.is_active),
          studioRole: 'member',
          mustChangePassword: Boolean(adminUser.must_change_password),
          modulePermissions: savedMatrix,
        },
      });
    } catch (error) {
      logger.error('POST /api/admin/team-members error:', error);
      return res.status(500).json({ error: 'Erreur lors de l’ajout du membre.' });
    }
  }
);

/**
 * PUT /api/admin/team-members/:id/permissions
 * Updates the module permission matrix for a member of the current studio.
 */
router.put(
  '/:id/permissions',
  requireModulePermission('settings', 'edit'),
  [param('id').isInt({ min: 1 }), body('modulePermissions').isObject()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: safeValidationErrors(errors) });
      }

      const memberId = Number(req.params.id);
      const membership = await db('studio_memberships')
        .where({ studio_id: req.studioId, admin_id: memberId })
        .first();

      if (!membership) {
        return res.status(404).json({ error: 'Membre introuvable dans ce studio.' });
      }
      if (membership.role === 'owner') {
        return res.status(400).json({ error: 'Les droits du propriétaire du studio ne peuvent pas être restreints.' });
      }

      const savedMatrix = await saveModulePermissionsForMember(
        req.studioId,
        memberId,
        req.body.modulePermissions
      );

      return res.json({ memberId, modulePermissions: savedMatrix });
    } catch (error) {
      logger.error('PUT /api/admin/team-members/:id/permissions error:', error);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour des permissions.' });
    }
  }
);

/**
 * POST /api/admin/team-members/:id/resend-invite
 * Marks an invitation as resent for a studio member.
 */
router.post(
  '/:id/resend-invite',
  requireModulePermission('settings', 'edit'),
  [param('id').isInt({ min: 1 })],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: safeValidationErrors(errors) });
      }

      const memberId = Number(req.params.id);
      const membership = await db('studio_memberships')
        .where({ studio_id: req.studioId, admin_id: memberId })
        .first();

      if (!membership) {
        return res.status(404).json({ error: 'Membre introuvable dans ce studio.' });
      }

      await logActivity(
        'team_member_invite_resent',
        { studio_id: req.studioId, member_id: memberId },
        null,
        { type: 'admin', id: req.admin.id, name: req.admin.username }
      );

      return res.json({ success: true, memberId });
    } catch (error) {
      logger.error('POST /api/admin/team-members/:id/resend-invite error:', error);
      return res.status(500).json({ error: 'Erreur lors du renvoi de l’invitation.' });
    }
  }
);

/**
 * DELETE /api/admin/team-members/:id
 * Removes a member from the current studio and deletes their module permissions.
 */
router.delete(
  '/:id',
  requireModulePermission('settings', 'delete'),
  [param('id').isInt({ min: 1 })],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: safeValidationErrors(errors) });
      }

      const memberId = Number(req.params.id);
      if (memberId === Number(req.admin.id)) {
        return res.status(400).json({ error: 'Vous ne pouvez pas vous retirer vous-même.' });
      }

      const membership = await db('studio_memberships')
        .where({ studio_id: req.studioId, admin_id: memberId })
        .first();

      if (!membership) {
        return res.status(404).json({ error: 'Membre introuvable dans ce studio.' });
      }
      if (membership.role === 'owner') {
        return res.status(400).json({ error: 'Le propriétaire du studio ne peut pas être retiré.' });
      }

      await db.transaction(async (trx) => {
        await trx('member_module_permissions')
          .where({ studio_id: req.studioId, admin_id: memberId })
          .del();
        await trx('studio_memberships')
          .where({ studio_id: req.studioId, admin_id: memberId })
          .del();
      });

      return res.json({ success: true, memberId });
    } catch (error) {
      logger.error('DELETE /api/admin/team-members/:id error:', error);
      return res.status(500).json({ error: 'Erreur lors de la suppression du membre.' });
    }
  }
);

module.exports = router;

