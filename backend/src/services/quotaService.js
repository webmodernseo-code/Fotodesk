const { db } = require('../database/db');

const GB_BYTES = 1024 * 1024 * 1024;

const PLAN_LIMITS = {
  starter: {
    planId: 'starter',
    maxPhotoGalleries: 3,
    photoStorageBytes: 3 * GB_BYTES,
    photoStorageGb: 3,
    videoStorageMin: 0,
    videoPlaybackMinPerMonth: 0,
    monthlyPriceMinor: 0,
  },
  pro_monthly: {
    planId: 'pro_monthly',
    maxPhotoGalleries: null,
    photoStorageBytes: 100 * GB_BYTES,
    photoStorageGb: 100,
    videoStorageMin: 500,
    videoPlaybackMinPerMonth: 1000,
    monthlyPriceMinor: 990,
  },
  pro_yearly: {
    planId: 'pro_yearly',
    maxPhotoGalleries: null,
    photoStorageBytes: 100 * GB_BYTES,
    photoStorageGb: 100,
    videoStorageMin: 500,
    videoPlaybackMinPerMonth: 1000,
    monthlyPriceMinor: 9900,
  },
};

function getPlanLimits(planId = 'starter') {
  if (planId === 'pro') return PLAN_LIMITS.pro_monthly;
  return PLAN_LIMITS[planId] || PLAN_LIMITS.starter;
}

function getCurrentMonthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
}

/**
 * Resets monthly video playback counter if the current UTC month is newer than video_playback_reset_at.
 */
async function ensureMonthlyPlaybackWindow(studioId) {
  const monthStart = getCurrentMonthStart();
  const studio = await db('studios').where({ id: Number(studioId) }).first();
  if (!studio) return null;

  const resetAt = studio.video_playback_reset_at ? new Date(studio.video_playback_reset_at) : null;
  if (!resetAt || resetAt < monthStart) {
    await db('studios').where({ id: Number(studioId) }).update({
      video_playback_used_min: 0,
      video_playback_reset_at: monthStart,
      updated_at: new Date(),
    });
    studio.video_playback_used_min = 0;
    studio.video_playback_reset_at = monthStart;
  }
  return studio;
}

/**
 * Computes current storage, gallery, and video usage for a studio.
 */
async function getStudioUsage(studioId) {
  const studio = await ensureMonthlyPlaybackWindow(studioId);
  const limits = getPlanLimits(studio?.plan_id || 'starter');

  const [galleriesRow, photoBytesRow, videoRow] = await Promise.all([
    db('events').where({ studio_id: Number(studioId) }).count('* as count').first(),
    db('photos')
      .join('events', 'events.id', 'photos.event_id')
      .where('events.studio_id', Number(studioId))
      .sum('photos.size_bytes as totalBytes')
      .first()
      .catch(() => ({ totalBytes: 0 })),
    db('video_gallery_items')
      .where({ studio_id: Number(studioId) })
      .sum('duration_sec as totalSec')
      .first()
      .catch(() => ({ totalSec: 0 })),
  ]);

  const photoGalleriesUsed = Number(galleriesRow?.count || 0);
  const photoStorageUsedBytes = Number(photoBytesRow?.totalBytes || 0);
  const videoStorageUsedMin = Math.ceil(Number(videoRow?.totalSec || 0) / 60);
  const videoPlaybackUsedMin = Number(studio?.video_playback_used_min || 0);

  return {
    planId: limits.planId,
    limits,
    usage: {
      photoGalleriesUsed,
      photoStorageUsedBytes,
      videoStorageUsedMin,
      videoPlaybackUsedMin,
    },
  };
}

/**
 * Throws a structured quota error with HTTP status 403 or 413 if creating a photo gallery exceeds the plan limit.
 */
async function assertCanCreatePhotoGallery(studioId) {
  const { limits, usage } = await getStudioUsage(studioId);
  if (limits.maxPhotoGalleries !== null && usage.photoGalleriesUsed >= limits.maxPhotoGalleries) {
    const err = new Error(
      `Limite atteinte : votre offre ${limits.planId} autorise au maximum ${limits.maxPhotoGalleries} galeries photo.`
    );
    err.statusCode = 403;
    err.code = 'QUOTA_PHOTO_GALLERIES_EXCEEDED';
    throw err;
  }
}

/**
 * Throws HTTP 413 if uploading additionalBytes exceeds the studio's photo storage quota.
 */
async function assertCanUploadPhotoBytes(studioId, additionalBytes = 0) {
  const { limits, usage } = await getStudioUsage(studioId);
  if (usage.photoStorageUsedBytes + Number(additionalBytes || 0) > limits.photoStorageBytes) {
    const err = new Error(
      `Espace de stockage photo dépassé (limite : ${limits.photoStorageGb} Go).`
    );
    err.statusCode = 413;
    err.code = 'QUOTA_PHOTO_STORAGE_EXCEEDED';
    throw err;
  }
}

/**
 * Throws HTTP 403 (Starter) or 413 (storage limit exceeded) when uploading video minutes.
 */
async function assertCanUploadVideoMinutes(studioId, additionalMin = 0) {
  const { limits, usage } = await getStudioUsage(studioId);
  if (limits.videoStorageMin <= 0) {
    const err = new Error('Les galeries vidéo nécessitent un abonnement Pro.');
    err.statusCode = 403;
    err.code = 'QUOTA_VIDEO_NOT_INCLUDED';
    throw err;
  }
  if (usage.videoStorageUsedMin + Number(additionalMin || 0) > limits.videoStorageMin) {
    const err = new Error(
      `Quota de stockage vidéo dépassé (limite : ${limits.videoStorageMin} min).`
    );
    err.statusCode = 413;
    err.code = 'QUOTA_VIDEO_STORAGE_EXCEEDED';
    throw err;
  }
}

/**
 * Increments monthly video playback minutes and enforces the monthly playback quota.
 */
async function recordVideoPlaybackSeconds(studioId, seconds = 60) {
  const studio = await ensureMonthlyPlaybackWindow(studioId);
  const limits = getPlanLimits(studio?.plan_id || 'starter');
  if (limits.videoPlaybackMinPerMonth <= 0) {
    const err = new Error('La lecture vidéo nécessite un abonnement Pro.');
    err.statusCode = 403;
    err.code = 'QUOTA_VIDEO_PLAYBACK_EXCEEDED';
    throw err;
  }

  const addMin = Math.max(1, Math.ceil(Number(seconds || 0) / 60));
  const nextUsed = Number(studio.video_playback_used_min || 0) + addMin;
  if (nextUsed > limits.videoPlaybackMinPerMonth) {
    const err = new Error(
      `Quota mensuel de lecture vidéo dépassé (${limits.videoPlaybackMinPerMonth} min/mois).`
    );
    err.statusCode = 403;
    err.code = 'QUOTA_VIDEO_PLAYBACK_EXCEEDED';
    throw err;
  }

  await db('studios').where({ id: Number(studioId) }).update({
    video_playback_used_min: nextUsed,
    updated_at: new Date(),
  });

  return { usedMin: nextUsed, limitMin: limits.videoPlaybackMinPerMonth };
}

module.exports = {
  PLAN_LIMITS,
  getPlanLimits,
  getStudioUsage,
  assertCanCreatePhotoGallery,
  assertCanUploadPhotoBytes,
  assertCanUploadVideoMinutes,
  recordVideoPlaybackSeconds,
};

