const request = require('supertest');
const {
  bootCrmDb,
  seedMinimal,
  assignAdminRole,
  mintAdminToken,
  buildRouteApp,
} = require('./helpers/crmDb');

describe('FD-02 studio isolation (documents, transfers, media/exports)', () => {
  let db;
  let cleanup;
  let app;
  let ownerAToken;
  let ownerBToken;
  let studioAId;
  let studioBId;
  let customerAId;
  let eventAId;

  beforeAll(async () => {
    ({ db, cleanup } = await bootCrmDb());
    const { adminId, customerId } = await seedMinimal(db);
    customerAId = customerId;
    await assignAdminRole(db, adminId, 'admin');

    ({ id: studioAId } = await db('studios').orderBy('id', 'asc').first('id'));
    await db('studios').where({ id: studioAId }).update({ owner_admin_id: adminId });
    await db('studio_memberships').insert({ studio_id: studioAId, admin_id: adminId, role: 'owner' });
    await db('customer_accounts').where({ id: customerAId }).update({ studio_id: studioAId });
    ownerAToken = mintAdminToken(adminId);

    const [insertedB] = await db('admin_users').insert({
      username: 'fd02-owner-b',
      email: 'fd02-owner-b@example.test',
      password_hash: 'fixture',
      is_active: true,
      must_change_password: false,
      created_at: new Date(),
    }).returning('id');
    const ownerBId = insertedB?.id ?? insertedB;
    await assignAdminRole(db, ownerBId, 'admin');

    const [insertedStudioB] = await db('studios').insert({
      name: 'Studio B FD02',
      slug: 'studio-b-fd02',
      owner_admin_id: ownerBId,
    }).returning('id');
    studioBId = insertedStudioB?.id ?? insertedStudioB;
    await db('studio_memberships').insert({ studio_id: studioBId, admin_id: ownerBId, role: 'owner' });
    ownerBToken = mintAdminToken(ownerBId);

    await db('feature_flags').whereIn('key', ['documents', 'transfers', 'archives']).update({ value: true });

    const [insertedEventA] = await db('events').insert({
      slug: 'fd02-studio-a-event',
      event_name: 'Studio A Event',
      event_type: 'wedding',
      event_date: '2026-06-15',
      host_email: 'host-a@example.test',
      share_link: 'fd02-share-a',
      password_hash: 'fixture',
      studio_id: studioAId,
      created_by: adminId,
      created_at: new Date(),
    }).returning('id');
    eventAId = insertedEventA?.id ?? insertedEventA;

    app = buildRouteApp('/api/admin/customers', require('../../src/routes/adminCustomers'));
    app.use('/api/admin/transfers', require('../../src/routes/adminTransfers'));
    app.use('/api/admin/photos', require('../../src/routes/adminPhotoExport'));
    app.use('/api/admin/archives', require('../../src/routes/adminArchives'));
  }, 240000);

  afterAll(async () => {
    if (cleanup) await cleanup();
  });

  it('isolates customer documents and document requests across studios', async () => {
    const okList = await request(app)
      .get(`/api/admin/customers/${customerAId}/documents`)
      .set('Authorization', `Bearer ${ownerAToken}`);
    expect(okList.status).toBe(200);

    const crossList = await request(app)
      .get(`/api/admin/customers/${customerAId}/documents`)
      .set('Authorization', `Bearer ${ownerBToken}`);
    expect(crossList.status).toBe(404);

    const crossReqList = await request(app)
      .get(`/api/admin/customers/${customerAId}/document-requests`)
      .set('Authorization', `Bearer ${ownerBToken}`);
    expect(crossReqList.status).toBe(404);

    const crossReqCreate = await request(app)
      .post(`/api/admin/customers/${customerAId}/document-requests`)
      .set('Authorization', `Bearer ${ownerBToken}`)
      .send({ title: 'Cross-studio probe' });
    expect(crossReqCreate.status).toBe(404);
  });

  it('isolates transfers across studios', async () => {
    const transferService = require('../../src/services/transferService');
    const createdTransfer = await transferService.createTransfer(
      { title: 'Studio A Transfer', kind: 'request' },
      { id: 1, studioId: studioAId, roleName: 'admin' },
    );
    const transferId = createdTransfer.id;

    const row = await db('transfers').where({ id: transferId }).first('studio_id');
    expect(Number(row.studio_id)).toBe(studioAId);

    const listA = await request(app)
      .get('/api/admin/transfers')
      .set('Authorization', `Bearer ${ownerAToken}`);
    expect(listA.status).toBe(200);
    expect(listA.body.transfers.map((t) => t.id)).toContain(transferId);

    const listB = await request(app)
      .get('/api/admin/transfers')
      .set('Authorization', `Bearer ${ownerBToken}`);
    expect(listB.status).toBe(200);
    expect(listB.body.transfers).toEqual([]);

    const getB = await request(app)
      .get(`/api/admin/transfers/${transferId}`)
      .set('Authorization', `Bearer ${ownerBToken}`);
    expect(getB.status).toBe(404);

    const delB = await request(app)
      .delete(`/api/admin/transfers/${transferId}`)
      .set('Authorization', `Bearer ${ownerBToken}`);
    expect(delB.status).toBe(404);
  });

  it('isolates photo exports and archives across studios', async () => {
    const exportA = await request(app)
      .get(`/api/admin/photos/${eventAId}/filtered`)
      .set('Authorization', `Bearer ${ownerAToken}`);
    expect(exportA.status).toBe(200);

    const exportB = await request(app)
      .get(`/api/admin/photos/${eventAId}/filtered`)
      .set('Authorization', `Bearer ${ownerBToken}`);
    expect(exportB.status).toBe(403);

    const archiveB = await request(app)
      .get(`/api/admin/archives/${eventAId}`)
      .set('Authorization', `Bearer ${ownerBToken}`);
    expect(archiveB.status).toBe(403);
  });
});

