const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { body, param, validationResult } = require('express-validator');

const { db } = require('../database/db');
const { adminAuth } = require('../middleware/auth');
const { attachStudioContext } = require('../middleware/studioContext');
const { requireModulePermission } = require('../middleware/modulePermissions');
const { getStoragePath } = require('../config/storage');
const quotaService = require('../services/quotaService');
const { safeValidationErrors } = require('../utils/routeHelpers');
const logger = require('../utils/logger');

const execFileAsync = promisify(execFile);
const router = express.Router();

router.use(adminAuth, attachStudioContext);

const videoStorage = multer.diskStorage({
  destination: async (req, _file, cb) => {
    const dir = path.join(getStoragePath(), 'uploads', 'video-galleries', String(req.studioId));
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, `video-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  },
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB
});

async function extractVideoDurationSec(filePath) {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath,
    ]);
    const parsed = Math.round(parseFloat(String(stdout).trim()));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch (_) {
    return 0;
  }
}

router.get('/', requireModulePermission('videoGalleries', 'view'), async (req, res) => {
  try {
    const galleries = await db('video_galleries')
      .where({ studio_id: req.studioId })
      .orderBy('created_at', 'desc');

    const items = await db('video_gallery_items')
      .where({ studio_id: req.studioId })
      .select('gallery_id', 'duration_sec', 'size_bytes');

    const statsByGallery = new Map();
    for (const item of items) {
      const prev = statsByGallery.get(item.gallery_id) || { count: 0, totalDurationSec: 0, totalBytes: 0 };
      prev.count += 1;
      prev.totalDurationSec += Number(item.duration_sec || 0);
      prev.totalBytes += Number(item.size_bytes || 0);
      statsByGallery.set(item.gallery_id, prev);
    }

    const enriched = galleries.map((g) => {
      const s = statsByGallery.get(g.id) || { count: 0, totalDurationSec: 0, totalBytes: 0 };
      return {
        id: g.id,
        title: g.title,
        slug: g.slug,
        clientName: g.client_name,
        projectId: g.project_id,
        isProtected: Boolean(g.is_protected),
        expiresAt: g.expires_at,
        status: g.status,
        videosCount: s.count,
        totalDurationSec: s.totalDurationSec,
        totalBytes: s.totalBytes,
        createdAt: g.created_at,
      };
    });

    return res.json({ galleries: enriched });
  } catch (error) {
    logger.error('GET /api/admin/video-galleries error:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement des galeries vidéo.' });
  }
});

router.post(
  '/',
  requireModulePermission('videoGalleries', 'create'),
  [
    body('title').isString().trim().isLength({ min: 1, max: 255 }),
    body('clientName').optional({ nullable: true }).isString().trim().isLength({ max: 255 }),
    body('projectId').optional({ nullable: true }).isInt({ min: 1 }),
    body('accessCode').optional({ nullable: true }).isString().trim().isLength({ min: 4, max: 64 }),
    body('expiresAt').optional({ nullable: true }).isISO8601(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: safeValidationErrors(errors) });
      }

      // Starter plan has 0 video storage quota -> returns 403 QUOTA_VIDEO_NOT_INCLUDED
      await quotaService.assertCanUploadVideoMinutes(req.studioId, 0);

      const baseSlug = req.body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'video-gallery';
      const slug = `${baseSlug}-${crypto.randomBytes(3).toString('hex')}`;

      const accessCodeHash = req.body.accessCode
        ? await bcrypt.hash(req.body.accessCode, 10)
        : null;

      const [inserted] = await db('video_galleries').insert({
        studio_id: req.studioId,
        title: req.body.title,
        slug,
        client_name: req.body.clientName || null,
        project_id: req.body.projectId || null,
        access_code_hash: accessCodeHash,
        is_protected: Boolean(accessCodeHash),
        expires_at: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      });
      const id = typeof inserted === 'object' ? inserted.id : inserted;
      const gallery = await db('video_galleries').where({ id }).first();

      return res.status(201).json({ gallery });
    } catch (error) {
      if (error.statusCode === 403 || error.statusCode === 413) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      logger.error('POST /api/admin/video-galleries error:', error);
      return res.status(500).json({ error: 'Erreur lors de la création de la galerie vidéo.' });
    }
  }
);

router.get(
  '/:id',
  requireModulePermission('videoGalleries', 'view'),
  [param('id').isInt({ min: 1 })],
  async (req, res) => {
    try {
      const gallery = await db('video_galleries')
        .where({ id: Number(req.params.id), studio_id: req.studioId })
        .first();
      if (!gallery) {
        return res.status(404).json({ error: 'Galerie vidéo introuvable.' });
      }

      const [videos, comments] = await Promise.all([
        db('video_gallery_items').where({ gallery_id: gallery.id }).orderBy('sort_order', 'asc'),
        db('video_comments')
          .where({ studio_id: req.studioId, event_id: gallery.id })
          .orderBy('timestamp_sec', 'asc'),
      ]);

      return res.json({ gallery, videos, comments });
    } catch (error) {
      logger.error('GET /api/admin/video-galleries/:id error:', error);
      return res.status(500).json({ error: 'Erreur lors du chargement de la galerie vidéo.' });
    }
  }
);

router.post(
  '/:id/videos',
  requireModulePermission('videoGalleries', 'create'),
  videoUpload.single('video'),
  async (req, res) => {
    try {
      const gallery = await db('video_galleries')
        .where({ id: Number(req.params.id), studio_id: req.studioId })
        .first();
      if (!gallery) {
        return res.status(404).json({ error: 'Galerie vidéo introuvable.' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier vidéo reçu.' });
      }

      const probedSec = await extractVideoDurationSec(req.file.path);
      const durationSec = probedSec > 0 ? probedSec : Math.max(0, Number(req.body.durationSec || 0));
      const addMin = Math.ceil(durationSec / 60);

      await quotaService.assertCanUploadVideoMinutes(req.studioId, addMin);

      const [inserted] = await db('video_gallery_items').insert({
        gallery_id: gallery.id,
        studio_id: req.studioId,
        title: req.body.title || req.file.originalname,
        filename: req.file.filename,
        file_path: req.file.path,
        size_bytes: req.file.size,
        duration_sec: durationSec,
        mime_type: req.file.mimetype || 'video/mp4',
        created_at: new Date(),
      });
      const id = typeof inserted === 'object' ? inserted.id : inserted;
      const video = await db('video_gallery_items').where({ id }).first();

      return res.status(201).json({ video });
    } catch (error) {
      if (error.statusCode === 403 || error.statusCode === 413) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      logger.error('POST /api/admin/video-galleries/:id/videos error:', error);
      return res.status(500).json({ error: 'Erreur lors de l’envoi de la vidéo.' });
    }
  }
);

router.delete(
  '/:id',
  requireModulePermission('videoGalleries', 'delete'),
  [param('id').isInt({ min: 1 })],
  async (req, res) => {
    try {
      const deleted = await db('video_galleries')
        .where({ id: Number(req.params.id), studio_id: req.studioId })
        .del();
      if (!deleted) {
        return res.status(404).json({ error: 'Galerie vidéo introuvable.' });
      }
      return res.json({ success: true, id: Number(req.params.id) });
    } catch (error) {
      logger.error('DELETE /api/admin/video-galleries/:id error:', error);
      return res.status(500).json({ error: 'Erreur lors de la suppression de la galerie vidéo.' });
    }
  }
);

module.exports = router;

