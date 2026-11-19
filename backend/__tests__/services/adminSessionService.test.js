const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockFirst = jest.fn();
const mockSelect = jest.fn();
const mockOrderBy = jest.fn(() => ({ select: mockSelect }));
const mockWhere = jest.fn(() => ({
  update: mockUpdate,
  first: mockFirst,
  orderBy: mockOrderBy,
}));
const mockDb = jest.fn(() => ({
  insert: mockInsert,
  where: mockWhere,
}));

jest.mock('../../src/database/db', () => ({
  db: mockDb,
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const adminSessionService = require('../../src/services/adminSessionService');

describe('adminSessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('parseDeviceName detects browser and OS cleanly', () => {
    expect(
      adminSessionService.parseDeviceName(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
      )
    ).toBe('Google Chrome sur Windows');

    expect(
      adminSessionService.parseDeviceName(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15'
      )
    ).toBe('Safari sur macOS');
  });

  test('listSessionsForAdmin marks the current session using token_jti', async () => {
    mockSelect.mockResolvedValueOnce([
      {
        id: 10,
        device_name: 'Google Chrome sur Windows',
        browser_location: 'IP 127.0.0.1',
        ip_address: '127.0.0.1',
        token_jti: 'jti-current',
        last_active_at: '2026-11-19T15:00:00Z',
        created_at: '2026-11-19T14:00:00Z',
      },
      {
        id: 11,
        device_name: 'Safari sur iOS',
        browser_location: 'IP 10.0.0.2',
        ip_address: '10.0.0.2',
        token_jti: 'jti-other',
        last_active_at: '2026-11-18T12:00:00Z',
        created_at: '2026-11-18T11:00:00Z',
      },
    ]);

    const sessions = await adminSessionService.listSessionsForAdmin(1, 'jti-current');
    expect(sessions).toHaveLength(2);
    expect(sessions[0].isCurrent).toBe(true);
    expect(sessions[1].isCurrent).toBe(false);
  });

  test('revokeSessionById returns true when a session row is updated', async () => {
    mockUpdate.mockResolvedValueOnce(1);
    const result = await adminSessionService.revokeSessionById(1, 10);
    expect(result).toBe(true);
    expect(mockWhere).toHaveBeenCalledWith({ id: 10, admin_id: 1, is_revoked: false });
  });
});

