'use strict';

const { db } = require('../database/db');
const { AppError } = require('../utils/errors');

const BYTES_PER_GB = 1024 * 1024 * 1024;

/**
 * Calculate total storage used by a studio in bytes.
 * Scopes photos by events.studio_id and transfers by transfers.studio_id.
 * @param {number} studioId
 * @returns {Promise<{ usedBytes: number, usedGb: number, photoBytes: number, transferBytes: number }>}
 */
async function getStudioStorageUsage(studioId) {
  const sid = Number(studioId) || 1;

  // 1. Storage from gallery photos
  const photoRow = await db('photos')
    .join('events', 'events.id', 'photos.event_id')
    .where('events.studio_id', sid)
    .sum('photos.size_bytes as total_bytes')
    .first();

  const photoBytes = Number(photoRow?.total_bytes) || 0;

  // 2. Storage from transfer files (linked via photo_id)
  let transferBytes = 0;
  if (await db.schema.hasTable('transfer_files') && await db.schema.hasTable('transfers')) {
    const transferRow = await db('transfer_files')
      .join('transfers', 'transfers.id', 'transfer_files.transfer_id')
      .join('photos', 'photos.id', 'transfer_files.photo_id')
      .where('transfers.studio_id', sid)
      .whereNull('photos.event_id') // Avoid double-counting if photo already belongs to an event
      .sum('photos.size_bytes as total_bytes')
      .first();
    transferBytes = Number(transferRow?.total_bytes) || 0;
  }

  const usedBytes = photoBytes + transferBytes;
  const usedGb = Number((usedBytes / BYTES_PER_GB).toFixed(2));

  return {
    usedBytes,
    usedGb,
    photoBytes,
    transferBytes
  };
}

/**
 * Retrieve studio plan details and current quota consumption.
 * @param {number} studioId
 */
async function getStudioPlanDetails(studioId) {
  const sid = Number(studioId) || 1;
  const studio = await db('studios').where({ id: sid }).first();
  if (!studio) {
    throw new AppError('Studio introuvable', 404);
  }

  const limitGb = Number(studio.storage_limit_gb) || 15;
  const limitBytes = limitGb * BYTES_PER_GB;
  const usage = await getStudioStorageUsage(sid);

  const percentUsed = limitBytes > 0
    ? Math.min(100, Number(((usage.usedBytes / limitBytes) * 100).toFixed(1)))
    : 0;

  return {
    studioId: studio.id,
    studioName: studio.name,
    planId: studio.plan_id || 'free',
    planStatus: studio.plan_status || 'active',
    billingInterval: studio.billing_interval || 'month',
    monthlyPrice: Number(studio.monthly_price) || 0,
    storageLimitGb: limitGb,
    storageLimitBytes: limitBytes,
    storageUsedGb: usage.usedGb,
    storageUsedBytes: usage.usedBytes,
    percentUsed,
    isQuotaExceeded: usage.usedBytes >= limitBytes
  };
}

/**
 * Assert that adding `additionalBytes` will not exceed the studio's storage limit.
 * Throws 413 AppError if quota is exceeded.
 * @param {number} studioId
 * @param {number} [additionalBytes=0]
 */
async function assertStudioStorageQuota(studioId, additionalBytes = 0) {
  if (!(await db.schema.hasTable('studios'))) return;
  const sid = Number(studioId) || 1;
  const details = await getStudioPlanDetails(sid);

  const projectedBytes = details.storageUsedBytes + Number(additionalBytes);
  if (projectedBytes > details.storageLimitBytes) {
    const err = new AppError(
      `Limite de stockage de votre forfait (${details.storageLimitGb} Go) atteinte. Veuillez contacter l'administrateur FotoDesk pour passer au forfait supérieur.`,
      413,
      'STUDIO_STORAGE_LIMIT_EXCEEDED'
    );
    err.details = {
      planId: details.planId,
      storageLimitGb: details.storageLimitGb,
      currentUsedGb: details.storageUsedGb,
      additionalMb: Math.round(additionalBytes / (1024 * 1024))
    };
    throw err;
  }
}

module.exports = {
  getStudioStorageUsage,
  getStudioPlanDetails,
  assertStudioStorageQuota
};
