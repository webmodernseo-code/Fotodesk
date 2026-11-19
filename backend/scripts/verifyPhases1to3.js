const crypto = require('crypto');
const { db } = require('../src/database/db');

const BASE = 'http://localhost:3001';

async function request(path, { method = 'GET', body, cookie } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers.Cookie = cookie;
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
  const email = `e2e_${uniq}@fotodesk.test`;
  const studioName = `Studio E2E ${uniq}`;
  let cookie = '';
  let createdStudioId = null;
  let createdAdminId = null;

  try {
    // 1. Register new studio (Phase 2.1)
    const reg = await request('/api/auth/register', {
      method: 'POST',
      body: { email, password: 'Password123!', studioName },
    });
    if (reg.status !== 201) {
      throw new Error(`POST /api/auth/register failed: ${reg.status} ${JSON.stringify(reg.json)}`);
    }
    cookie = mergeCookies(cookie, reg.setCookie);
    createdAdminId = reg.json.user.id;
    createdStudioId = reg.json.studio.id;
    console.log('OK 2.1 POST /api/auth/register ->', reg.status, 'studioId:', createdStudioId);

    // 2. GET /api/auth/me (Phase 2.1)
    const me = await request('/api/auth/me', { cookie });
    if (me.status !== 200 || !me.json.studio || !me.json.modulePermissions) {
      throw new Error(`GET /api/auth/me failed: ${me.status} ${JSON.stringify(me.json)}`);
    }
    console.log('OK 2.1 GET /api/auth/me ->', me.status, 'studio:', me.json.studio.name);

    // 3. GET /api/admin/settings/sessions (Phase 2.2)
    const sess = await request('/api/admin/settings/sessions', { cookie });
    if (sess.status !== 200 || !Array.isArray(sess.json.sessions) || sess.json.sessions.length < 1) {
      throw new Error(`GET /api/admin/settings/sessions failed: ${sess.status} ${JSON.stringify(sess.json)}`);
    }
    console.log('OK 2.2 GET /api/admin/settings/sessions ->', sess.status, 'count:', sess.json.sessions.length);

    // 4. Team members CRUD (Phase 2.3)
    const addMember = await request('/api/admin/team-members', {
      method: 'POST',
      cookie,
      body: {
        email: `member_${uniq}@fotodesk.test`,
        modulePermissions: { clients: { view: true, create: true, edit: false, delete: false } },
      },
    });
    if (addMember.status !== 201) {
      throw new Error(`POST /api/admin/team-members failed: ${addMember.status} ${JSON.stringify(addMember.json)}`);
    }
    const memberId = addMember.json.member.id;
    console.log('OK 2.3 POST /api/admin/team-members ->', addMember.status, 'memberId:', memberId);

    const listMembers = await request('/api/admin/team-members', { cookie });
    if (listMembers.status !== 200 || listMembers.json.members.length < 2) {
      throw new Error(`GET /api/admin/team-members failed: ${listMembers.status} ${JSON.stringify(listMembers.json)}`);
    }
    console.log('OK 2.3 GET /api/admin/team-members ->', listMembers.status, 'count:', listMembers.json.members.length);

    const delMember = await request(`/api/admin/team-members/${memberId}`, { method: 'DELETE', cookie });
    if (delMember.status !== 200) {
      throw new Error(`DELETE /api/admin/team-members/:id failed: ${delMember.status} ${JSON.stringify(delMember.json)}`);
    }
    console.log('OK 2.3 DELETE /api/admin/team-members/:id ->', delMember.status);

    // 5. Phase 3 Studio APIs
    const overview = await request('/api/admin/dashboard/overview', { cookie });
    if (overview.status !== 200 || !overview.json.kpis) {
      throw new Error(`GET /api/admin/dashboard/overview failed: ${overview.status} ${JSON.stringify(overview.json)}`);
    }
    console.log('OK 3.1 GET /api/admin/dashboard/overview ->', overview.status);

    const customers = await request('/api/admin/customers', { cookie });
    if (customers.status !== 200) {
      throw new Error(`GET /api/admin/customers failed: ${customers.status} ${JSON.stringify(customers.json)}`);
    }
    console.log('OK 3.2 GET /api/admin/customers ->', customers.status);

    const projects = await request('/api/admin/projects', { cookie });
    if (projects.status !== 200) {
      throw new Error(`GET /api/admin/projects failed: ${projects.status} ${JSON.stringify(projects.json)}`);
    }
    console.log('OK 3.3 GET /api/admin/projects ->', projects.status);

    const cal = await request('/api/admin/calendar/events', { cookie });
    if (cal.status !== 200) {
      throw new Error(`GET /api/admin/calendar/events failed: ${cal.status} ${JSON.stringify(cal.json)}`);
    }
    console.log('OK 3.4 GET /api/admin/calendar/events ->', cal.status);

    const inv = await request('/api/admin/invoices', { cookie });
    console.log('INFO 3.5 GET /api/admin/invoices ->', inv.status, inv.status === 403 ? '(bills flag off)' : '');

    const port = await request('/api/admin/portfolio', { cookie });
    if (port.status !== 200) {
      throw new Error(`GET /api/admin/portfolio failed: ${port.status} ${JSON.stringify(port.json)}`);
    }
    console.log('OK 3.6 GET /api/admin/portfolio ->', port.status);

    console.log('ALL PHASES 1-3 LIVE E2E CHECKS PASSED');
  } finally {
    // Cleanup temporary E2E rows
    if (createdStudioId) {
      await db('member_module_permissions').where({ studio_id: createdStudioId }).del().catch(() => {});
      await db('studio_memberships').where({ studio_id: createdStudioId }).del().catch(() => {});
      await db('studios').where({ id: createdStudioId }).del().catch(() => {});
    }
    if (createdAdminId) {
      await db('admin_sessions').where({ admin_id: createdAdminId }).del().catch(() => {});
      await db('admin_users').where({ id: createdAdminId }).del().catch(() => {});
    }
    await db('admin_users').where('email', `member_${uniq}@fotodesk.test`).del().catch(() => {});
    await db('affiliate_accounts').where('email', email).del().catch(() => {});
    await db.destroy();
  }
}

main().catch((err) => {
  console.error('E2E CHECK FAILED:', err);
  process.exit(1);
});
