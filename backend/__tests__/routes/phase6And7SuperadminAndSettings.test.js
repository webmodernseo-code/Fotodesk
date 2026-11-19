const express = require('express');
const request = require('supertest');

let mockRole = { roleId: 2, roleName: 'admin', studioId: 2 };

jest.mock('../../src/middleware/auth', () => ({
  adminAuth: (req, _res, next) => {
    req.admin = {
      id: mockRole.roleId === 1 ? 1 : 2,
      username: mockRole.roleId === 1 ? 'founder' : 'user_b',
      roleId: mockRole.roleId,
      roleName: mockRole.roleName,
      studioId: mockRole.studioId,
      studioRole: 'owner',
    };
    req.studioId = mockRole.studioId;
    next();
  },
}));

const mockFirst = jest.fn();
const mockUpdate = jest.fn(async () => 1);
const mockInsert = jest.fn(async () => [1]);
const mockSelect = jest.fn(async () => []);

let studiosSelectResult = [];
let mockRoleName = 'admin';

function makeChain(tableName) {
  const selectResult = () => {
    if (tableName === 'studios') return studiosSelectResult;
    return [];
  };
  let pending;
  const exec = () => (pending ??= Promise.resolve(selectResult()));
  const chain = {
    where: jest.fn(() => chain),
    leftJoin: jest.fn(() => chain),
    join: jest.fn(() => chain),
    orderBy: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    count: jest.fn(() => chain),
    select: jest.fn(() => chain),
    first: (...args) => {
      if (tableName === 'admin_users') return Promise.resolve({ role_name: mockRoleName, count: 2 });
      return mockFirst(...args);
    },
    update: mockUpdate,
    insert: mockInsert,
    then: (resolve, reject) => exec().then(resolve, reject),
    catch: (onRejected) => exec().catch(onRejected),
  };
  return chain;
}

const mockDb = jest.fn((tableName) => makeChain(tableName));
mockDb.transaction = async (cb) => cb(mockDb);

jest.mock('../../src/database/db', () => ({
  db: mockDb,
  logActivity: jest.fn(async () => {}),
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const superadminRouter = require('../../src/routes/superadmin');
const adminSettingsRouter = require('../../src/routes/adminSettings');

describe('Phase 6 & 7 Super Admin Guard and Studio Settings', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/superadmin', superadminRouter);
  app.use('/api/admin/settings', adminSettingsRouter);
  app.use((err, _req, res, _next) => {
    res.status(err.statusCode || 500).json({ error: err.message });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRole = { roleId: 2, roleName: 'admin', studioId: 2 };
    mockRoleName = 'admin';
    studiosSelectResult = [];
  });

  test('blocks non-super-admin users from /api/superadmin/overview with 403', async () => {
    mockRoleName = 'admin';
    const res = await request(app).get('/api/superadmin/overview');
    expect(res.status).toBe(403);
  });

  test('allows super_admin access to /api/superadmin/overview', async () => {
    mockRole = { roleId: 1, roleName: 'super_admin', studioId: 1 };
    mockRoleName = 'super_admin';
    studiosSelectResult = [
      { id: 1, name: 'Founder', plan_id: 'pro_monthly', status: 'active', monthly_price: 9.9, created_at: new Date() },
      { id: 2, name: 'Studio B', plan_id: 'starter', status: 'active', monthly_price: 0, created_at: new Date() },
    ];

    const res = await request(app).get('/api/superadmin/overview');
    expect(res.status).toBe(200);
    expect(res.body.kpis.totalStudios).toBe(2);
    expect(res.body.kpis.proStudios).toBe(1);
    expect(res.body.kpis.starterStudios).toBe(1);
    expect(res.body.kpis.mrrEur).toBe(9.9);
  });

  test('PATCH /api/superadmin/studios/:id/status requires reason when suspending', async () => {
    mockRole = { roleId: 1, roleName: 'super_admin', studioId: 1 };
    mockRoleName = 'super_admin';
    const res = await request(app)
      .patch('/api/superadmin/studios/2/status')
      .send({ status: 'suspended', reason: '' });

    expect(res.status).toBe(400);
  });

  test('PATCH /api/superadmin/studios/:id/status suspends studio and logs status history', async () => {
    mockRole = { roleId: 1, roleName: 'super_admin', studioId: 1 };
    mockRoleName = 'super_admin';
    mockFirst
      .mockResolvedValueOnce({ id: 2, name: 'Studio B', status: 'active' })
      .mockResolvedValueOnce({ id: 2, name: 'Studio B', status: 'suspended', suspension_reason: 'Abus détecté' });

    const res = await request(app)
      .patch('/api/superadmin/studios/2/status')
      .send({ status: 'suspended', reason: 'Abus détecté' });

    expect(res.status).toBe(200);
    expect(res.body.studio.status).toBe('suspended');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        studio_id: 2,
        from_status: 'active',
        to_status: 'suspended',
        reason: 'Abus détecté',
      })
    );
  });

  test('GET /api/admin/settings/studio-profile returns studio profile for active studio', async () => {
    mockFirst.mockResolvedValueOnce({
      id: 2,
      name: 'Studio B',
      slug: 'studio-b',
      city: 'Paris',
      country: 'France',
      social_links: '{"instagram":"@studiob"}',
    });

    const res = await request(app).get('/api/admin/settings/studio-profile');
    expect(res.status).toBe(200);
    expect(res.body.profile.name).toBe('Studio B');
    expect(res.body.profile.social_links).toEqual({ instagram: '@studiob' });
  });
});
