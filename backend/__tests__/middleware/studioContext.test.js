const mockFirst = jest.fn();
const mockWhere = jest.fn(() => ({ first: mockFirst }));
const mockDb = jest.fn(() => ({ where: mockWhere }));

jest.mock('../../src/database/db', () => ({
  db: mockDb,
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const { attachStudioContext } = require('../../src/middleware/studioContext');

function createRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

describe('studioContext middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('attaches req.studio and req.studioId for an active studio', async () => {
    const studioRow = { id: 2, name: 'Studio Northlight', status: 'active' };
    mockFirst.mockResolvedValueOnce(studioRow);

    const req = { admin: { id: 4, roleId: 2, roleName: 'admin', studioId: 2 }, studioId: 2 };
    const res = createRes();
    const next = jest.fn();

    await attachStudioContext(req, res, next);

    expect(mockDb).toHaveBeenCalledWith('studios');
    expect(mockWhere).toHaveBeenCalledWith({ id: 2 });
    expect(req.studio).toEqual(studioRow);
    expect(req.studioId).toBe(2);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('blocks a suspended studio with 403 for non-super-admin accounts', async () => {
    mockFirst.mockResolvedValueOnce({
      id: 3,
      name: 'Suspended Studio',
      status: 'suspended',
      suspension_reason: 'Facture impayée',
    });

    const req = { admin: { id: 7, roleId: 2, roleName: 'admin', studioId: 3 }, studioId: 3 };
    const res = createRes();
    const next = jest.fn();

    await attachStudioContext(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({
      error: 'Ce studio est actuellement suspendu.',
      code: 'STUDIO_SUSPENDED',
      reason: 'Facture impayée',
    });
  });

  test('allows super_admin access even when studio status is suspended', async () => {
    const studioRow = { id: 3, name: 'Suspended Studio', status: 'suspended' };
    mockFirst.mockResolvedValueOnce(studioRow);

    const req = { admin: { id: 1, roleId: 1, roleName: 'super_admin', studioId: 3 }, studioId: 3 };
    const res = createRes();
    const next = jest.fn();

    await attachStudioContext(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.studio).toEqual(studioRow);
  });

  test('returns 404 when the studio does not exist', async () => {
    mockFirst.mockResolvedValueOnce(null);

    const req = { admin: { id: 9, roleId: 2, roleName: 'admin', studioId: 999 }, studioId: 999 };
    const res = createRes();
    const next = jest.fn();

    await attachStudioContext(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      error: 'Studio introuvable.',
      code: 'STUDIO_NOT_FOUND',
    });
  });
});

