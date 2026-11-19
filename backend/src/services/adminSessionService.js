const { db } = require('../database/db');
const logger = require('../utils/logger');

/**
 * Extracts a concise human-readable device/browser label from a User-Agent string.
 * @param {string} userAgent
 * @returns {string}
 */
function parseDeviceName(userAgent = '') {
  const ua = String(userAgent || '');
  let browser = 'Navigateur web';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = 'Google Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';

  let os = '';
  if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/iPhone|iPad|iOS/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return os ? `${browser} sur ${os}` : browser;
}

/**
 * Records a newly issued admin session in admin_sessions (best-effort).
 */
async function createSession({ adminId, jti, ipAddress = null, userAgent = '' }) {
  try {
    const deviceName = parseDeviceName(userAgent);
    await db('admin_sessions').insert({
      admin_id: Number(adminId),
      token_jti: jti || null,
      device_name: deviceName,
      browser_location: ipAddress ? `IP ${ipAddress}` : 'Session web',
      ip_address: ipAddress || null,
      user_agent: String(userAgent || '').slice(0, 500),
      is_revoked: false,
      last_active_at: new Date(),
      created_at: new Date(),
    });
  } catch (error) {
    logger.warn('Could not persist admin_session (best-effort)', { error: error.message });
  }
}

/**
 * Marks a session as revoked by its JWT jti.
 */
async function revokeSessionByJti(jti) {
  if (!jti) return false;
  try {
    const updated = await db('admin_sessions')
      .where({ token_jti: jti, is_revoked: false })
      .update({ is_revoked: true, revoked_at: new Date() });
    return updated > 0;
  } catch (error) {
    logger.warn('Could not revoke admin_session by jti', { error: error.message });
    return false;
  }
}

/**
 * Checks whether a session jti has been explicitly revoked in admin_sessions.
 */
async function isSessionRevoked(jti) {
  if (!jti) return false;
  try {
    const row = await db('admin_sessions')
      .where({ token_jti: jti })
      .first('is_revoked');
    return Boolean(row && row.is_revoked);
  } catch (_) {
    return false;
  }
}

/**
 * Lists active (non-revoked) sessions for a given admin user.
 */
async function listSessionsForAdmin(adminId, currentJti = null) {
  const rows = await db('admin_sessions')
    .where({ admin_id: Number(adminId), is_revoked: false })
    .orderBy('last_active_at', 'desc')
    .select('id', 'device_name', 'browser_location', 'ip_address', 'token_jti', 'last_active_at', 'created_at');

  return rows.map((row) => ({
    id: row.id,
    deviceName: row.device_name,
    location: row.browser_location || row.ip_address || 'Session web',
    ipAddress: row.ip_address,
    lastActiveAt: row.last_active_at,
    createdAt: row.created_at,
    isCurrent: Boolean(currentJti && row.token_jti && row.token_jti === currentJti),
  }));
}

/**
 * Revokes a session belonging to the specified admin user.
 */
async function revokeSessionById(adminId, sessionId) {
  const updated = await db('admin_sessions')
    .where({ id: Number(sessionId), admin_id: Number(adminId), is_revoked: false })
    .update({ is_revoked: true, revoked_at: new Date() });
  return updated > 0;
}

module.exports = {
  parseDeviceName,
  createSession,
  revokeSessionByJti,
  isSessionRevoked,
  listSessionsForAdmin,
  revokeSessionById,
};

