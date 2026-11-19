const mockFirst = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockSum = jest.fn();
const mockCount = jest.fn();
const mockJoin = jest.fn();
const mockWhere = jest.fn();

function buildChain() {
  return {
    where: mockWhere,
    join: mockJoin,
    sum: mockSum,
    count: mockCount,
    first: mockFirst,
    insert: mockInsert,
    update: mockUpdate,
  };
}

mockWhere.mockImplementation(() => buildChain());
mockJoin.mockImplementation(() => buildChain());
mockSum.mockImplementation(() => buildChain());
mockCount.mockImplementation(() => buildChain());

const mockDb = jest.fn(() => buildChain());

jest.mock('../../src/database/db', () => ({
  db: mockDb,
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const quotaService = require('../../src/services/quotaService');
const commissionService = require('../../src/services/commissionService');

describe('Phase 4 & 5 Quotas and Affiliate Commissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Starter plan rejects creating a 4th photo gallery with 403', async () => {
    const now = new Date();
    mockFirst
      .mockResolvedValueOnce({ id: 10, plan_id: 'starter', video_playback_used_min: 0, video_playback_reset_at: now }) // ensureMonthlyPlaybackWindow
      .mockResolvedValueOnce({ count: 3 }) // galleries count
      .mockResolvedValueOnce({ totalBytes: 0 }) // photo bytes
      .mockResolvedValueOnce({ totalSec: 0 }); // video sec

    await expect(quotaService.assertCanCreatePhotoGallery(10)).rejects.toMatchObject({
      statusCode: 403,
      code: 'QUOTA_PHOTO_GALLERIES_EXCEEDED',
    });
  });

  test('Starter plan rejects video uploads with 403 QUOTA_VIDEO_NOT_INCLUDED', async () => {
    const now = new Date();
    mockFirst
      .mockResolvedValueOnce({ id: 10, plan_id: 'starter', video_playback_used_min: 0, video_playback_reset_at: now })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ totalBytes: 0 })
      .mockResolvedValueOnce({ totalSec: 0 });

    await expect(quotaService.assertCanUploadVideoMinutes(10, 5)).rejects.toMatchObject({
      statusCode: 403,
      code: 'QUOTA_VIDEO_NOT_INCLUDED',
    });
  });

  test('Pro plan blocks monthly video playback over 1000 minutes with 403', async () => {
    const now = new Date();
    mockFirst.mockResolvedValueOnce({
      id: 11,
      plan_id: 'pro_monthly',
      video_playback_used_min: 995,
      video_playback_reset_at: now,
    });

    await expect(quotaService.recordVideoPlaybackSeconds(11, 600)).rejects.toMatchObject({
      statusCode: 403,
      code: 'QUOTA_VIDEO_PLAYBACK_EXCEEDED',
    });
  });

  test('commissionService creates 20% commission (198 minor = 1.98 EUR) on first Pro monthly payment', async () => {
    mockFirst
      .mockResolvedValueOnce({ id: 22, referred_by_code: 'FD-PARTNER' }) // studios
      .mockResolvedValueOnce({ id: 5, referral_code: 'FD-PARTNER', is_active: true }) // affiliate_accounts
      .mockResolvedValueOnce(null) // no existing commission for studio 22
      .mockResolvedValueOnce({ id: 77, commission_minor: 198, commission_rate: 0.2, status: 'pending' }); // inserted row
    mockInsert.mockResolvedValueOnce([77]);

    const comm = await commissionService.processFirstProPaymentCommission({
      studioId: 22,
      subscriptionInvoiceId: 301,
      planId: 'pro_monthly',
      amountMinor: 990,
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        affiliate_account_id: 5,
        referred_studio_id: 22,
        subscription_invoice_id: 301,
        base_amount_minor: 990,
        commission_rate: 0.2,
        commission_minor: 198,
        status: 'pending',
      })
    );
    expect(comm.commission_minor).toBe(198);
  });

  test('commissionService skips renewals when a commission already exists for referred_studio_id', async () => {
    mockFirst
      .mockResolvedValueOnce({ id: 22, referred_by_code: 'FD-PARTNER' })
      .mockResolvedValueOnce({ id: 5, referral_code: 'FD-PARTNER', is_active: true })
      .mockResolvedValueOnce({ id: 77 }); // already commissioned!

    const comm = await commissionService.processFirstProPaymentCommission({
      studioId: 22,
      subscriptionInvoiceId: 302,
      planId: 'pro_monthly',
      amountMinor: 990,
    });

    expect(comm).toBeNull();
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

