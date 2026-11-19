const { db } = require('../database/db');
const logger = require('../utils/logger');

const STUDIO_MODULES = [
  'dashboard',
  'clients',
  'projects',
  'calendar',
  'photoGalleries',
  'videoGalleries',
  'invoices',
  'landingBuilder',
  'affiliate',
  'settings',
];

const ACTION_COLUMN_MAP = {
  view: 'can_view',
  create: 'can_create',
  edit: 'can_edit',
  delete: 'can_delete',
};

function buildFullMatrix() {
  const matrix = {};
  for (const mod of STUDIO_MODULES) {
    matrix[mod] = { view: true, create: true, edit: true, delete: true };
  }
  return matrix;
}

function buildEmptyMatrix() {
  const matrix = {};
  for (const mod of STUDIO_MODULES) {
    matrix[mod] = { view: false, create: false, edit: false, delete: false };
  }
  return matrix;
}

/**
 * Returns the full module permission matrix for a given admin in a studio.
 * Studio owners and super_admin automatically receive full access.
 */
async function getModulePermissionsForAdmin(adminId, studioId, adminContext = {}) {
  const isSuperAdmin =
    adminContext.roleName === 'super_admin' || Number(adminContext.roleId) === 1;
  if (isSuperAdmin || adminContext.studioRole === 'owner') {
    return buildFullMatrix();
  }

  const matrix = buildEmptyMatrix();
  try {
    const rows = await db('member_module_permissions')
      .where({ studio_id: Number(studioId), admin_id: Number(adminId) })
      .select('module_id', 'can_view', 'can_create', 'can_edit', 'can_delete');

    if (rows.length === 0) {
      // Check if admin is the studio owner in studios table
      const owned = await db('studios')
        .where({ id: Number(studioId), owner_admin_id: Number(adminId) })
        .first('id');
      if (owned) {
        return buildFullMatrix();
      }
      return matrix;
    }

    for (const row of rows) {
      if (matrix[row.module_id]) {
        matrix[row.module_id] = {
          view: Boolean(row.can_view),
          create: Boolean(row.can_create),
          edit: Boolean(row.can_edit),
          delete: Boolean(row.can_delete),
        };
      }
    }
  } catch (error) {
    logger.warn('Failed to load member_module_permissions', { error: error.message });
  }

  return matrix;
}

/**
 * Upserts a member's module permissions matrix inside a studio.
 */
async function saveModulePermissionsForMember(studioId, adminId, permissionsMatrix = {}) {
  const normalized = {};
  for (const mod of STUDIO_MODULES) {
    const entry = permissionsMatrix[mod] || {};
    normalized[mod] = {
      view: Boolean(entry.view ?? entry.can_view),
      create: Boolean(entry.create ?? entry.can_create),
      edit: Boolean(entry.edit ?? entry.can_edit),
      delete: Boolean(entry.delete ?? entry.can_delete),
    };
  }

  for (const mod of STUDIO_MODULES) {
    const p = normalized[mod];
    await db('member_module_permissions')
      .insert({
        studio_id: Number(studioId),
        admin_id: Number(adminId),
        module_id: mod,
        can_view: p.view,
        can_create: p.create,
        can_edit: p.edit,
        can_delete: p.delete,
        updated_at: new Date(),
      })
      .onConflict(['studio_id', 'admin_id', 'module_id'])
      .merge({
        can_view: p.view,
        can_create: p.create,
        can_edit: p.edit,
        can_delete: p.delete,
        updated_at: new Date(),
      });
  }

  return normalized;
}

/**
 * Express middleware enforcing granular module access (`view`, `create`, `edit`, `delete`)
 * for team members while allowing studio owners and super_admin through.
 */
function requireModulePermission(moduleId, action = 'view') {
  if (!STUDIO_MODULES.includes(moduleId)) {
    throw new Error(`Unknown studio module: ${moduleId}`);
  }
  if (!ACTION_COLUMN_MAP[action]) {
    throw new Error(`Unknown module action: ${action}`);
  }

  return async (req, res, next) => {
    try {
      if (!req.admin) {
        return res.status(401).json({ error: 'Authentification requise.' });
      }

      const isSuperAdmin =
        req.admin.roleName === 'super_admin' || Number(req.admin.roleId) === 1;
      if (isSuperAdmin || req.admin.studioRole === 'owner') {
        return next();
      }

      const studioId = Number(req.studioId || req.admin.studioId || 1);
      const matrix = await getModulePermissionsForAdmin(req.admin.id, studioId, req.admin);
      const allowed = Boolean(matrix[moduleId] && matrix[moduleId][action]);

      if (!allowed) {
        return res.status(403).json({
          error: 'Accès refusé pour ce module.',
          code: 'MODULE_PERMISSION_DENIED',
          module: moduleId,
          action,
        });
      }

      return next();
    } catch (error) {
      logger.error('requireModulePermission error:', error);
      return res.status(500).json({ error: 'Erreur lors de la vérification des permissions.' });
    }
  };
}

module.exports = {
  STUDIO_MODULES,
  getModulePermissionsForAdmin,
  saveModulePermissionsForMember,
  requireModulePermission,
};

