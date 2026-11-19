const express = require('express');
const request = require('supertest');

// Mock auth & permissions to inject req.admin + req.studioId + req.studio
let mockStudioId = 2;
jest.mock('../../src/middleware/auth', () => ({
  adminAuth: (req, _res, next) => {
    req.admin = { id: 2, username: 'user_b', roleId: 2, roleName: 'admin', studioId: mockStudioId, studioRole: 'owner' };
    req.studioId = mockStudioId;
    req.studio = {
      id: mockStudioId,
      name: 'Studio B',
      slug: 'studio-b',
      plan_id: 'starter',
      status: 'active',
      storage_limit_gb: 3,
      video_storage_limit_min: 0,
      video_playback_used_min: 0,
      video_playback_limit_min: 0,
    };
    next();
  },
}));

jest.mock('../../src/middleware/studioContext', () => ({
  attachStudioContext: (_req, _res, next) => next(),
}));

jest.mock('../../src/middleware/modulePermissions', () => ({
  requireModulePermission: () => (_req, _res, next) => next(),
}));

jest.mock('../../src/middleware/permissions', () => ({
  requirePermission: () => (_req, _res, next) => next(),
}));

const mockInvoiceGetById = jest.fn();
jest.mock('../../src/services/invoiceService', () => ({
  getInvoiceById: (...args) => mockInvoiceGetById(...args),
}));

jest.mock('../../src/database/crmAccess', () => {
  const actual = jest.requireActual('../../src/database/crmAccess');
  return {
    ...actual,
    requireCrmDocument: () => (_req, _res, next) => next(),
  };
});

const mockDbChain = {
  where: jest.fn(() => mockDbChain),
  join: jest.fn(() => mockDbChain),
  orderBy: jest.fn(() => mockDbChain),
  limit: jest.fn(() => mockDbChain),
  count: jest.fn(() => mockDbChain),
  sum: jest.fn(() => mockDbChain),
  first: jest.fn(async () => ({ count: 4, totalBytes: 1024, value: 1 })),
  select: jest.fn(async () => []),
  update: jest.fn(async () => 1),
  columnInfo: jest.fn(async () => ({ id: {}, invoice_number: {} })),
};
const mockDb = jest.fn(() => mockDbChain);

jest.mock('../../src/database/db', () => ({
  db: mockDb,
  logActivity: jest.fn(async () => {}),
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const dashboardRouter = require('../../src/routes/adminDashboard');
const invoicesRouter = require('../../src/routes/adminInvoices');
const publicInvoicesRouter = require('../../src/routes/publicInvoices');

describe('Phase 3 Studio APIs', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/admin/dashboard', dashboardRouter);
  app.use('/api/admin/invoices', invoicesRouter);
  app.use('/api/public/invoices', publicInvoicesRouter);

  beforeEach(() => {
    jest.clearAllMocks();
    mockStudioId = 2;
  });

  test('GET /api/admin/dashboard/overview returns studio-scoped KPIs and storage', async () => {
    const res = await request(app).get('/api/admin/dashboard/overview');
    expect(res.status).toBe(200);
    expect(res.body.studio).toEqual({
      id: 2,
      name: 'Studio B',
      slug: 'studio-b',
      planId: 'starter',
      status: 'active',
    });
    expect(res.body.kpis.customersCount).toBe(4);
    expect(res.body.storage.photoUsedBytes).toBe(1024);
    expect(res.body.storage.photoLimitGb).toBe(3);
  });

  test('PATCH /api/admin/invoices/:id/status blocks cross-studio invoice access with 404', async () => {
    mockInvoiceGetById.mockResolvedValueOnce({
      invoice: { id: 99, studio_id: 1, status: 'sent', total_minor: 5000 },
      items: [],
      payments: [],
    });

    const res = await request(app)
      .patch('/api/admin/invoices/99/status')
      .send({ status: 'paid' });

    expect(res.status).toBe(404);
  });

  test('PATCH /api/admin/invoices/:id/status updates same-studio invoice to paid', async () => {
    mockInvoiceGetById
      .mockResolvedValueOnce({
        invoice: { id: 55, studio_id: 2, status: 'sent', total_minor: 12000, paid_at: null },
        items: [],
        payments: [],
      })
      .mockResolvedValueOnce({
        invoice: { id: 55, studio_id: 2, status: 'paid', total_minor: 12000, paid_amount_minor: 12000 },
        items: [],
        payments: [],
      });

    const res = await request(app)
      .patch('/api/admin/invoices/55/status')
      .send({ status: 'paid' });

    expect(res.status).toBe(200);
    expect(res.body.invoice.status).toBe('paid');
    expect(mockDbChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'paid', paid_amount_minor: 12000 })
    );
  });

  test('GET /api/public/invoices/:token returns 404 when invoice is missing', async () => {
    mockDbChain.first.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/public/invoices/INV-MISSING');
    expect(res.status).toBe(404);
  });
});

