const { db } = require('../database/db');
const logger = require('../utils/logger');

/**
 * Resolves the active studio for a request and checks whether a non-super-admin
 * caller is blocked by a suspended studio status.
 *
 * @param {import('express').Request} req
 * @returns {Promise<{ studio: object | null, blocked: boolean, statusCode?: number, body?: object }>}
 */
async function resolveStudioContext(req) {
  const studioId = Number(req.studioId || req.admin?.studioId || 1);
  const studio = await db('studios').where({ id: studioId }).first();

  if (!studio) {
    return {
      studio: null,
      blocked: true,
      statusCode: 404,
      body: {
        error: 'Studio introuvable.',
        code: 'STUDIO_NOT_FOUND',
      },
    };
  }

  const isSuperAdmin =
    req.admin?.roleName === 'super_admin' || Number(req.admin?.roleId) === 1;

  if (studio.status === 'suspended' && !isSuperAdmin) {
    return {
      studio,
      blocked: true,
      statusCode: 403,
      body: {
        error: 'Ce studio est actuellement suspendu.',
        code: 'STUDIO_SUSPENDED',
        reason: studio.suspension_reason || null,
      },
    };
  }

  return { studio, blocked: false };
}

/**
 * Express middleware that attaches req.studio and req.studioId and rejects
 * requests targeting a suspended studio for non-super-admin accounts.
 */
async function attachStudioContext(req, res, next) {
  try {
    const result = await resolveStudioContext(req);
    if (result.blocked) {
      return res.status(result.statusCode).json(result.body);
    }

    req.studio = result.studio;
    req.studioId = Number(result.studio.id);
    return next();
  } catch (error) {
    logger.error('Studio context middleware error:', error);
    return res.status(500).json({ error: 'Erreur lors de la résolution du studio.' });
  }
}

module.exports = {
  attachStudioContext,
  resolveStudioContext,
};
