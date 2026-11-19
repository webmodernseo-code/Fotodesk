require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { db } = require('../src/database/db');

const BASE = 'http://localhost:3001';

async function request(path, { method = 'GET', body, cookie, bearer } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers.Cookie = cookie;
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json, setCookie };
}

function mergeCookies(existing, setCookieArr) {
  const map = new Map();
  if (existing) {
    for (const part of existing.split(';')) {
      const [k, ...v] = part.trim().split('=');
      if (k) map.set(k, v.join('='));
    }
  }
  for (const raw of setCookieArr || []) {
    const first = raw.split(';')[0];
    const [k, ...v] = first.split('=');
    if (k) map.set(k.trim(), v.join('='));
  }
  return Array.from(map.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
}

async function main() {
  const uniq = crypto.randomBytes(3).toString('hex');
  const referrerEmail = `ref_${uniq}@fotodesk.test`;
  const childEmail = `child_${uniq}@fotodesk.test`;
  let refCookie = '';
  let childCookie = '';
  let refStudioId = null;
  let refAdminId = null;
  let childStudioId = null;
  let childAdminId = null;

  try {
    // Register Referrer Studio
    const regRef = await request('/api/auth/register', {
      method: 'POST',
      body: { email: referrerEmail, password: 'Password123!', studioName: `Referrer ${uniq}` },
    });
    if (regRef.status !== 201) throw new Error(`Register referrer failed: ${regRef.status}`);
    refCookie = mergeCookies(refCookie, regRef.setCookie);
    refStudioId = regRef.json.studio.id;
    refAdminId = regRef.json.user.id;

    // 5.2 Referrer affiliate overview
    const affOverview = await request('/api/admin/affiliates/overview', { cookie: refCookie });
    if (affOverview.status !== 200 || !affOverview.json.referralCode) {
      throw new Error(`GET /api/admin/affiliates/overview failed: ${affOverview.status} ${JSON.stringify(affOverview.json)}`);
    }
    const referralCode = affOverview.json.referralCode;
    console.log('OK 5.2 GET /api/admin/affiliates/overview ->', affOverview.status, 'code:', referralCode);

    // Register Child Studio using referralCode
    const regChild = await request('/api/auth/register', {
      method: 'POST',
      body: { email: childEmail, password: 'Password123!', studioName: `Child ${uniq}`, refCode: referralCode },
    });
    if (regChild.status !== 201) throw new Error(`Register child failed: ${regChild.status}`);
    childCookie = mergeCookies(childCookie, regChild.setCookie);
    childStudioId = regChild.json.studio.id;
    childAdminId = regChild.json.user.id;

    // 4.2 GET /api/admin/galleries
    const galleries = await request('/api/admin/galleries', { cookie: childCookie });
    if (galleries.status !== 200) throw new Error(`GET /api/admin/galleries failed: ${galleries.status}`);
    console.log('OK 4.2 GET /api/admin/galleries ->', galleries.status);

    // 4.1 Starter video gallery blocked (403)
    const starterVid = await request('/api/admin/video-galleries', {
      method: 'POST',
      cookie: childCookie,
      body: { title: 'Test Starter Block' },
    });
    if (starterVid.status !== 403) {
      throw new Error(`Expected 403 for Starter video gallery, got ${starterVid.status} ${JSON.stringify(starterVid.json)}`);
    }
    console.log('OK 4.1 Starter video quota blocked -> 403', starterVid.json.code);

    // 5.1 GET /api/admin/subscription & POST /upgrade (pro_monthly)
    const subGet = await request('/api/admin/subscription', { cookie: childCookie });
    if (subGet.status !== 200 || subGet.json.subscription.planId !== 'starter') {
      throw new Error(`GET /api/admin/subscription failed: ${subGet.status}`);
    }
    console.log('OK 5.1 GET /api/admin/subscription ->', subGet.status, subGet.json.subscription.planId);

    const upgrade = await request('/api/admin/subscription/upgrade', {
      method: 'POST',
      cookie: childCookie,
      body: { planId: 'pro_monthly' },
    });
    if (upgrade.status !== 200 || !upgrade.json.affiliateCommissionGenerated) {
      throw new Error(`POST /api/admin/subscription/upgrade failed: ${upgrade.status} ${JSON.stringify(upgrade.json)}`);
    }
    console.log('OK 5.1+5.3 POST /api/admin/subscription/upgrade -> 200 (20% commission generated)');

    // Verify 20% commission (198 minor) on referrer's overview
    const affAfter = await request('/api/admin/affiliates/overview', { cookie: refCookie });
    if (affAfter.json.stats.pendingCommissionMinor !== 198) {
      throw new Error(`Expected 198 minor commission, got ${JSON.stringify(affAfter.json.stats)}`);
    }
    const commissionId = affAfter.json.commissions[0].id;
    console.log('OK 5.3 Referrer commission verified -> 198 minor (1.98 EUR)');

    // 4.3 Pro video gallery creation + public verify-code
    const proVid = await request('/api/admin/video-galleries', {
      method: 'POST',
      cookie: childCookie,
      body: { title: `Film Mariage ${uniq}`, accessCode: '123456' },
    });
    if (proVid.status !== 201) {
      throw new Error(`POST /api/admin/video-galleries failed: ${proVid.status} ${JSON.stringify(proVid.json)}`);
    }
    const vgSlug = proVid.json.gallery.slug;
    console.log('OK 4.3 POST /api/admin/video-galleries -> 201 slug:', vgSlug);

    const pubVerify = await request(`/api/public/video-galleries/${vgSlug}/verify-code`, {
      method: 'POST',
      body: { code: '123456' },
    });
    if (pubVerify.status !== 200 || !pubVerify.json.verified) {
      throw new Error(`POST /api/public/video-galleries/:slug/verify-code failed: ${pubVerify.status}`);
    }
    console.log('OK 4.3 POST /api/public/video-galleries/:slug/verify-code -> 200');

    // 6.x Guard check: studio admin must get 403 on /api/superadmin/overview
    const nonSa = await request('/api/superadmin/overview', { cookie: childCookie });
    if (nonSa.status !== 403) throw new Error(`Expected 403 on /api/superadmin/overview for studio admin, got ${nonSa.status}`);
    console.log('OK 6.0 SuperAdmin guard blocked studio user -> 403');

    // Mint super_admin token for founder@fotodesk.com
    const founder = await db('admin_users').where({ email: 'founder@fotodesk.com' }).first();
    if (!founder) throw new Error('founder@fotodesk.com not found in admin_users');
    const saToken = jwt.sign(
      { id: founder.id, username: founder.username, type: 'admin', role: 'super_admin', loginTime: Date.now() },
      process.env.JWT_SECRET,
      { expiresIn: '1h', issuer: 'picpeak-auth' }
    );

    const saOverview = await request('/api/superadmin/overview', { bearer: saToken });
    if (saOverview.status !== 200) throw new Error(`GET /api/superadmin/overview failed: ${saOverview.status}`);
    console.log('OK 6.1 GET /api/superadmin/overview -> 200 studios:', saOverview.json.kpis.totalStudios);

    const saStudios = await request('/api/superadmin/studios', { bearer: saToken });
    if (saStudios.status !== 200) throw new Error(`GET /api/superadmin/studios failed: ${saStudios.status}`);
    console.log('OK 6.2 GET /api/superadmin/studios -> 200');

    const suspend = await request(`/api/superadmin/studios/${childStudioId}/status`, {
      method: 'PATCH',
      bearer: saToken,
      body: { status: 'suspended', reason: 'Test audit E2E' },
    });
    if (suspend.status !== 200 || suspend.json.studio.status !== 'suspended') {
      throw new Error(`PATCH /api/superadmin/studios/:id/status failed: ${suspend.status}`);
    }
    // Suspended studio must be blocked by attachStudioContext (403 STUDIO_SUSPENDED)
    const blockedReq = await request('/api/admin/dashboard/overview', { cookie: childCookie });
    if (blockedReq.status !== 403) {
      throw new Error(`Expected 403 for suspended studio, got ${blockedReq.status}`);
    }
    console.log('OK 6.2 Suspended studio blocked -> 403', blockedReq.json.code);

    const reactivate = await request(`/api/superadmin/studios/${childStudioId}/status`, {
      method: 'PATCH',
      bearer: saToken,
      body: { status: 'active', reason: 'Fin test audit' },
    });
    if (reactivate.status !== 200) throw new Error(`Reactivate failed: ${reactivate.status}`);
    console.log('OK 6.2 Studio reactivated -> 200');

    const approveComm = await request(`/api/superadmin/commissions/${commissionId}/approve`, {
      method: 'PATCH',
      bearer: saToken,
    });
    if (approveComm.status !== 200 || approveComm.json.commission.status !== 'approved') {
      throw new Error(`PATCH /api/superadmin/commissions/:id/approve failed: ${approveComm.status}`);
    }
    console.log('OK 6.6 PATCH /api/superadmin/commissions/:id/approve -> 200');

    for (const ep of ['/api/superadmin/users', '/api/superadmin/subscriptions', '/api/superadmin/affiliates', '/api/superadmin/payouts', '/api/superadmin/settings']) {
      const r = await request(ep, { bearer: saToken });
      if (r.status !== 200) throw new Error(`GET ${ep} failed: ${r.status}`);
      console.log(`OK 6.x GET ${ep} -> 200`);
    }

    // 7.1 Studio settings
    const putProfile = await request('/api/admin/settings/studio-profile', {
      method: 'PUT',
      cookie: childCookie,
      body: { city: 'Lyon', country: 'France' },
    });
    if (putProfile.status !== 200 || putProfile.json.profile.city !== 'Lyon') {
      throw new Error(`PUT /api/admin/settings/studio-profile failed: ${putProfile.status}`);
    }
    console.log('OK 7.1 PUT /api/admin/settings/studio-profile -> 200');

    for (const pref of ['account-preferences', 'notifications', 'workspace-preferences']) {
      const rPut = await request(`/api/admin/settings/${pref}`, {
        method: 'PUT',
        cookie: childCookie,
        body: { enabled: true },
      });
      const rGet = await request(`/api/admin/settings/${pref}`, { cookie: childCookie });
      if (rPut.status !== 200 || rGet.status !== 200) {
        throw new Error(`Settings ${pref} failed: ${rPut.status}/${rGet.status}`);
      }
      console.log(`OK 7.1 GET/PUT /api/admin/settings/${pref} -> 200`);
    }

    const putPass = await request('/api/admin/settings/password', {
      method: 'PUT',
      cookie: childCookie,
      body: { currentPassword: 'Password123!', newPassword: 'NewPassword123!' },
    });
    if (putPass.status !== 200) throw new Error(`PUT /api/admin/settings/password failed: ${putPass.status}`);
    console.log('OK 7.1 PUT /api/admin/settings/password -> 200');

    console.log('ALL PHASES 4-7 LIVE E2E CHECKS PASSED');
  } finally {
    for (const sid of [childStudioId, refStudioId].filter(Boolean)) {
      await db('video_galleries').where({ studio_id: sid }).del().catch(() => {});
      await db('affiliate_commissions').where({ referred_studio_id: sid }).del().catch(() => {});
      await db('subscription_invoices').where({ studio_id: sid }).del().catch(() => {});
      await db('studio_status_history').where({ studio_id: sid }).del().catch(() => {});
      await db('studio_memberships').where({ studio_id: sid }).del().catch(() => {});
      await db('app_settings').where('setting_key', 'like', `studio_${sid}_%`).del().catch(() => {});
      await db('studios').where({ id: sid }).del().catch(() => {});
    }
    for (const aid of [childAdminId, refAdminId].filter(Boolean)) {
      await db('admin_sessions').where({ admin_id: aid }).del().catch(() => {});
      await db('admin_users').where({ id: aid }).del().catch(() => {});
    }
    await db('affiliate_accounts').whereIn('email', [referrerEmail, childEmail]).del().catch(() => {});
    await db.destroy();
  }
}

main().catch((err) => {
  console.error('E2E PHASES 4-7 FAILED:', err);
  process.exit(1);
});
