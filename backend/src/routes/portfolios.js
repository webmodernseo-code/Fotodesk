const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { db } = require('../database/db');
const { adminAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { getStoragePath } = require('../config/storage');

const adminRouter = express.Router();
const publicRouter = express.Router();
const keyFor = (studioId) => `portfolio_studio_${studioId}`;
const legacyKeyFor = (id) => `portfolio_user_${id}`;
const slugify = (value) => String(value || '').trim().toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const parse = (value) => { try { return JSON.parse(value); } catch { return null; } };

const portfolioStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = path.join(getStoragePath(), 'uploads/portfolio');
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `portfolio-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`);
  }
});
const portfolioUpload = multer({
  storage: portfolioStorage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

adminRouter.post('/upload', adminAuth, portfolioUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });
  const url = `/uploads/portfolio/${req.file.filename}`;
  res.json({ url });
});

async function allProfiles() {
  const rows = await db('app_settings')
    .where('setting_key', 'like', 'portfolio_studio_%')
    .orWhere('setting_key', 'like', 'portfolio_user_%');
  return rows.map((row) => parse(row.setting_value)).filter(Boolean);
}

const DEFAULT_PORTFOLIO_PHOTOS = [];

const DEFAULT_LUXURY_PROFILE = {
  enabled: false,
  title: '',
  intro: '',
  name: '',
  role: 'Photographe professionnel',
  profileUrl: '',
  email: '',
  phone: '',
  location: '',
  instagram: '',
  facebook: '',
  linkedin: '',
  youtube: '',
  tiktok: '',
  pinterest: '',
  behance: '',
  website: '',

  // Hero Section
  heroOverline: 'PHOTOGRAPHIE PROFESSIONNELLE',
  heroTitle: "Capturer l'instant avec élégance",
  heroSubtitle: 'Des histoires vraies, des émotions sincères, des images intemporelles.',
  heroButtonText: 'Découvrir mon univers',
  heroQuote: '',
  heroImageUrl: '',

  // Stats
  stats: [],

  // About Section
  aboutTitle: 'À propos',
  aboutText: '',
  aboutImageUrl: '',
  aboutSignature: '',

  // Design & Accent Color
  accentColor: '#10b981',

  // Social networks visibility
  visibleSocials: {
    instagram: true,
    facebook: true,
    linkedin: true,
    youtube: false,
    tiktok: false,
    pinterest: false,
    behance: false,
    website: false
  },

  // Categories & Photos de vitrine (Indépendantes des dossiers clients)
  categories: ['Tout', 'Portrait', 'Mariage', 'Mode', 'Événementiel', 'Lifestyle', 'Produit', 'Noir & Blanc'],
  portfolioPhotos: DEFAULT_PORTFOLIO_PHOTOS,
  galleryIds: []
};

function mergeProfileWithDefaults(saved, fallbackUsername, adminId, studioId) {
  const merged = { ...DEFAULT_LUXURY_PROFILE, ...saved };
  if (!merged.name && fallbackUsername) merged.name = fallbackUsername;
  if (!merged.slug) merged.slug = slugify(fallbackUsername) || `studio-${studioId || adminId || 1}`;
  if (!merged.accentColor || merged.accentColor === '#C89561') merged.accentColor = DEFAULT_LUXURY_PROFILE.accentColor;
  if (!merged.visibleSocials || typeof merged.visibleSocials !== 'object') {
    merged.visibleSocials = DEFAULT_LUXURY_PROFILE.visibleSocials;
  }
  if (!Array.isArray(merged.stats)) merged.stats = DEFAULT_LUXURY_PROFILE.stats;
  if (!Array.isArray(merged.categories) || merged.categories.length === 0) merged.categories = DEFAULT_LUXURY_PROFILE.categories;
  if (!Array.isArray(merged.portfolioPhotos)) merged.portfolioPhotos = DEFAULT_PORTFOLIO_PHOTOS;
  return merged;
}

adminRouter.get('/', adminAuth, requirePermission('events.view'), async (req, res, next) => {
  try {
    const studioId = req.studioId || req.admin?.studioId || req.admin.id;
    const user = await db('admin_users').where('id', req.admin.id).first('username');
    const row = (await db('app_settings').where('setting_key', keyFor(studioId)).first())
      || (await db('app_settings').where('setting_key', legacyKeyFor(req.admin.id)).first());
    const saved = row ? parse(row.setting_value) : null;
    const profile = mergeProfileWithDefaults(saved, user?.username, req.admin.id, studioId);
    profile.adminId = req.admin.id;
    profile.studioId = studioId;

    if (!saved) {
      await db('app_settings').insert({
        setting_key: keyFor(studioId),
        setting_value: JSON.stringify(profile),
        setting_type: 'portfolio',
        updated_at: new Date()
      }).onConflict('setting_key').merge();
    }
    res.json(profile);
  } catch (error) { next(error); }
});

adminRouter.put('/', adminAuth, requirePermission('events.view'), async (req, res, next) => {
  try {
    const studioId = req.studioId || req.admin?.studioId || req.admin.id;
    const slug = slugify(req.body.slug);
    if (slug.length < 3) return res.status(400).json({ error: 'Le pseudo doit contenir au moins 3 caractères.' });
    const profiles = await allProfiles();
    if (profiles.some((profile) => profile.slug === slug && Number(profile.studioId || profile.adminId) !== Number(studioId))) {
      return res.status(409).json({ error: 'Ce pseudo est déjà utilisé.' });
    }

    const currentProfile = (await db('app_settings').where('setting_key', keyFor(studioId)).first())
      || (await db('app_settings').where('setting_key', legacyKeyFor(req.admin.id)).first())
      || {};
    const parsedCurrent = parse(currentProfile.setting_value) || {};

    const profile = {
      ...parsedCurrent,
      ...req.body,
      adminId: req.admin.id,
      studioId,
      enabled: req.body.enabled === true,
      slug,
      title: String(req.body.title || '').trim().slice(0, 120),
      intro: String(req.body.intro || '').trim().slice(0, 1000),
      name: String(req.body.name || req.admin.username || '').trim().slice(0, 120),
      role: String(req.body.role || 'Photographe professionnel').trim().slice(0, 120),
      profileUrl: String(req.body.profileUrl || '').trim().slice(0, 1000),
      email: String(req.body.email || '').trim().slice(0, 254),
      phone: String(req.body.phone || '').trim().slice(0, 60),
      location: String(req.body.location || '').trim().slice(0, 120),
      instagram: String(req.body.instagram || '').trim().slice(0, 500),
      facebook: String(req.body.facebook || '').trim().slice(0, 500),
      linkedin: String(req.body.linkedin || '').trim().slice(0, 500),
      youtube: String(req.body.youtube || '').trim().slice(0, 500),
      tiktok: String(req.body.tiktok || '').trim().slice(0, 500),
      pinterest: String(req.body.pinterest || '').trim().slice(0, 500),
      behance: String(req.body.behance || '').trim().slice(0, 500),
      website: String(req.body.website || '').trim().slice(0, 500),
      visibleSocials: req.body.visibleSocials && typeof req.body.visibleSocials === 'object'
        ? {
            instagram: req.body.visibleSocials.instagram !== false,
            facebook: req.body.visibleSocials.facebook !== false,
            linkedin: req.body.visibleSocials.linkedin !== false,
            youtube: req.body.visibleSocials.youtube === true,
            tiktok: req.body.visibleSocials.tiktok === true,
            pinterest: req.body.visibleSocials.pinterest === true,
            behance: req.body.visibleSocials.behance !== false,
            website: req.body.visibleSocials.website === true,
          }
        : DEFAULT_LUXURY_PROFILE.visibleSocials,

      // Design
      accentColor: String(req.body.accentColor || '#10b981').trim().slice(0, 30),

      // Hero
      heroOverline: String(req.body.heroOverline || 'PHOTOGRAPHIE PROFESSIONNELLE').trim().slice(0, 100),
      heroTitle: String(req.body.heroTitle || "Capturer l'instant avec élégance").trim().slice(0, 160),
      heroSubtitle: String(req.body.heroSubtitle || 'Des histoires vraies, des émotions sincères, des images intemporelles.').trim().slice(0, 300),
      heroButtonText: String(req.body.heroButtonText || 'Découvrir mon univers').trim().slice(0, 80),
      heroQuote: String(req.body.heroQuote || '').trim().slice(0, 200),
      heroImageUrl: String(req.body.heroImageUrl || '').trim().slice(0, 1000),

      // Stats
      stats: Array.isArray(req.body.stats) && req.body.stats.length <= 4
        ? req.body.stats.map((s) => ({
            number: String(s?.number || '').trim().slice(0, 20),
            label: String(s?.label || '').trim().slice(0, 60)
          }))
        : (parsedCurrent.stats || DEFAULT_LUXURY_PROFILE.stats),

      // About
      aboutTitle: String(req.body.aboutTitle || 'À propos').trim().slice(0, 80),
      aboutText: String(req.body.aboutText || '').trim().slice(0, 2000),
      aboutImageUrl: String(req.body.aboutImageUrl || '').trim().slice(0, 1000),
      aboutSignature: String(req.body.aboutSignature || '').trim().slice(0, 80),

      categories: Array.isArray(req.body.categories) && req.body.categories.length
        ? req.body.categories.map((c) => String(c).trim()).filter(Boolean).slice(0, 20)
        : DEFAULT_LUXURY_PROFILE.categories,

      portfolioPhotos: Array.isArray(req.body.portfolioPhotos)
        ? req.body.portfolioPhotos.map((p, idx) => ({
            id: String(p?.id || `p-${Date.now()}-${idx}`),
            title: String(p?.title || 'Sans titre').trim().slice(0, 120),
            category: String(p?.category || 'Portrait').trim().slice(0, 60),
            imageUrl: String(p?.imageUrl || '').trim(),
            aspect: String(p?.aspect || 'aspect-[3/4]')
          })).filter((p) => Boolean(p.imageUrl))
        : (parsedCurrent.portfolioPhotos || DEFAULT_PORTFOLIO_PHOTOS),

      updatedAt: new Date().toISOString(),
    };

    await db('app_settings').insert({
      setting_key: keyFor(studioId),
      setting_value: JSON.stringify(profile),
      setting_type: 'portfolio',
      updated_at: new Date()
    }).onConflict('setting_key').merge({
      setting_value: JSON.stringify(profile),
      updated_at: new Date()
    });
    res.json(profile);
  } catch (error) { next(error); }
});

// GET /api/public/portfolio (default portfolio)
publicRouter.get('/', async (req, res, next) => {
  try {
    const profiles = await allProfiles();
    const isPreview = req.query.preview === 'true';
    const profile = profiles.find((item) => isPreview || item.enabled) || profiles[0];
    if (!profile) return res.status(404).json({ error: 'Portfolio indisponible' });
    const merged = mergeProfileWithDefaults(profile, profile?.name, profile?.adminId);
    res.json(merged);
  } catch (error) { next(error); }
});

// GET /api/public/portfolio/:slug
publicRouter.get('/:slug', async (req, res, next) => {
  try {
    const slug = slugify(req.params.slug);
    const profiles = await allProfiles();
    const isPreview = req.query.preview === 'true' || slug === 'preview' || slug === 'default';
    let profile = profiles.find((item) => item.slug === slug);
    if (!profile && (slug === 'preview' || slug === 'default')) {
      profile = profiles[0];
    }
    if (!profile || (!profile.enabled && !isPreview)) {
      return res.status(404).json({ error: 'Portfolio indisponible' });
    }
    const merged = mergeProfileWithDefaults(profile, profile?.name, profile?.adminId);
    res.json(merged);
  } catch (error) { next(error); }
});

module.exports = { adminRouter, publicRouter };
