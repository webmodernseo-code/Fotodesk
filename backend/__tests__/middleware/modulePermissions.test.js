const mockWhere = jest.fn();
const mockDb = jest.fn(() => ({ where: mockWhere }));

jest.mock('../../src/database/db', () => ({
  db: mockDb,
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const {
  STUDIO_MODULES,
  requireModulePermission,
  getModulePermissionsForAdmin,
} = require('../../src/middleware/modulePermissions');

function createRes() {
  return {
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
}

describe('modulePermissions middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('grants full matrix to studio owner without querying member_module_permissions', async () => {
    const matrix = await getModulePermissionsForAdmin(2, 5, {
      roleName: 'admin',
      studioRole: 'owner',
    });

    expect(Object.keys(matrix)).toEqual(STUDIO_MODULES);
    expect(matrix.invoices).toEqual({ view: true, create: true, edit: true, delete: true });
    expect(mockDb).not.toHaveBeenCalled();
  });

  test('blocks a team member lacking the required module action with 403', async () => {
    mockWhere.mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce([
        {
          module_id: 'clients',
          can_view: true,
          can_create: false,
          can_edit: false,
          can_delete: false,
        },
      ]),
    });

    const middleware = requireModulePermission('clients', 'create');
    const req = { admin: { id: 12, roleId: 2, roleName: 'admin', studioRole: 'member', studioId: 5 }, studioId: 5 };
    const res = createRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({
      error: 'Accès refusé pour ce module.',
      code: 'MODULE_PERMISSION_DENIED',
      module: 'clients',
      action: 'create',
    });
  });

  test('allows a team member who has the requested module permission', async () => {
    mockWhere.mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce([
        {
          module_id: 'clients',
          can_view: true,
          can_create: true,
          can_edit: false,
          can_delete: false,
        },
      ]),
    });

    const middleware = requireModulePermission('clients', 'create');
    const req = { admin: { id: 12, roleId: 2, roleName: 'admin', studioRole: 'member', studioId: 5 }, studioId: 5 };
    const res = createRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
  });
});

