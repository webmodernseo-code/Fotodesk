const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, param, validationResult } = require('express-validator');

const { db } = require('../database/db');
const quotaService = require('../services/quotaService');
const { safeValidationErrors } = require('../utils/routeHelpers');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/public/video-galleries/:slug
 * Public metadata shell for a client video gallery.
 */
router.get('/:slug', async (req, res) => {
  try {
    const gallery = await db('video_galleries').where({ slug: req.params.slug }).first();
    if (!gallery) {
      return res.status(404).json({ error: 'Galerie vidéo introuvable.' });
    }
    if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Cette galerie vidéo a expiré.' });
    }

    const videos = gallery.is_protected
      ? []
      : await db('video_gallery_items')
          .where({ gallery_id: gallery.id })
          .orderBy('sort_order', 'asc')
          .select('id', 'title', 'duration_sec', 'mime_type', 'created_at');

    return res.json({
      gallery: {
        id: gallery.id,
        title: gallery.title,
        slug: gallery.slug,
        clientName: gallery.client_name,
        isProtected: Boolean(gallery.is_protected),
        expiresAt: gallery.expires_at,
      },
      videos,
    });
  } catch (error) {
    logger.error('GET /api/public/video-galleries/:slug error:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement de la galerie vidéo.' });
  }
});

/**
 * POST /api/public/video-galleries/:slug/verify-code
 * Verifies the client access code and returns a short-lived access token + video list.
 */
router.post(
  '/:slug/verify-code',
  [body('code').isString().trim().notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: safeValidationErrors(errors) });
      }

      const gallery = await db('video_galleries').where({ slug: req.params.slug }).first();
      if (!gallery) {
        return res.status(404).json({ error: 'Galerie vidéo introuvable.' });
      }
      if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
        return res.status(410).json({ error: 'Cette galerie vidéo a expiré.' });
      }

      if (gallery.is_protected && gallery.access_code_hash) {
        const ok = await bcrypt.compare(req.body.code, gallery.access_code_hash);
        if (!ok) {
          return res.status(401).json({ error: 'Code d’accès invalide.', code: 'INVALID_ACCESS_CODE' });
        }
      }

      const videos = await db('video_gallery_items')
        .where({ gallery_id: gallery.id })
        .orderBy('sort_order', 'asc')
        .select('id', 'title', 'duration_sec', 'mime_type', 'created_at');

      const token = jwt.sign(
        { type: 'video_gallery', galleryId: gallery.id, slug: gallery.slug },
        process.env.JWT_SECRET || 'fotodesk-dev-secret',
        { expiresIn: '24h', issuer: 'picpeak-auth' }
      );

      return res.json({ verified: true, token, videos });
    } catch (error) {
      logger.error('POST /api/public/video-galleries/:slug/verify-code error:', error);
      return res.status(500).json({ error: 'Erreur lors de la vérification du code.' });
    }
  }
);

/**
 * GET /api/public/video-galleries/:slug/videos/:videoId/comments
 * Lists timestamped comments ordered by timestamp_sec.
 */
router.get(
  '/:slug/videos/:videoId/comments',
  [param('videoId').isInt({ min: 1 })],
  async (req, res) => {
    try {
      const gallery = await db('video_galleries').where({ slug: req.params.slug }).first();
      if (!gallery) {
        return res.status(404).json({ error: 'Galerie vidéo introuvable.' });
      }

      const comments = await db('video_comments')
        .where({
          studio_id: gallery.studio_id,
          event_id: gallery.id,
          photo_id: Number(req.params.videoId),
        })
        .orderBy('timestamp_sec', 'asc')
        .orderBy('created_at', 'asc');

      return res.json({ comments });
    } catch (error) {
      logger.error('GET video comments error:', error);
      return res.status(500).json({ error: 'Erreur lors du chargement des commentaires.' });
    }
  }
);

/**
 * POST /api/public/video-galleries/:slug/videos/:videoId/comments
 * Creates a timestamped client comment on a video.
 */
router.post(
  '/:slug/videos/:videoId/comments',
  [
    param('videoId').isInt({ min: 1 }),
    body('authorName').isString().trim().isLength({ min: 1, max: 120 }),
    body('timestampSec').isInt({ min: 0 }),
    body('commentText').isString().trim().isLength({ min: 1, max: 2000 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: safeValidationErrors(errors) });
      }

      const gallery = await db('video_galleries').where({ slug: req.params.slug }).first();
      if (!gallery) {
        return res.status(404).json({ error: 'Galerie vidéo introuvable.' });
      }

      const video = await db('video_gallery_items')
        .where({ id: Number(req.params.videoId), gallery_id: gallery.id })
        .first('id');
      if (!video) {
        return res.status(404).json({ error: 'Vidéo introuvable.' });
      }

      const [inserted] = await db('video_comments').insert({
        studio_id: gallery.studio_id,
        event_id: gallery.id,
        photo_id: video.id,
        author_name: req.body.authorName,
        timestamp_sec: Number(req.body.timestampSec),
        comment_text: req.body.commentText,
        created_at: new Date(),
      });
      const id = typeof inserted === 'object' ? inserted.id : inserted;
      const comment = await db('video_comments').where({ id }).first();

      return res.status(201).json({ comment });
    } catch (error) {
      logger.error('POST video comment error:', error);
      return res.status(500).json({ error: 'Erreur lors de l’ajout du commentaire.' });
    }
  }
);

/**
 * POST /api/public/video-galleries/:slug/videos/:videoId/playback
 * Records monthly video playback usage and enforces the studio monthly limit.
 */
router.post(
  '/:slug/videos/:videoId/playback',
  [param('videoId').isInt({ min: 1 }), body('seconds').optional().isInt({ min: 1, max: 3600 })],
  async (req, res) => {
    try {
      const gallery = await db('video_galleries').where({ slug: req.params.slug }).first();
      if (!gallery) {
        return res.status(404).json({ error: 'Galerie vidéo introuvable.' });
      }

      const usage = await quotaService.recordVideoPlaybackSeconds(
        gallery.studio_id,
        Number(req.body.seconds || 60)
      );

      return res.json({ recorded: true, playback: usage });
    } catch (error) {
      if (error.statusCode === 403 || error.statusCode === 413) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      logger.error('POST video playback error:', error);
      return res.status(500).json({ error: 'Erreur lors du suivi de lecture vidéo.' });
    }
  }
);

module.exports = router;

