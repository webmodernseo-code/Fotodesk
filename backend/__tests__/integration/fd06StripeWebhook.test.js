const crypto = require('crypto');
const express = require('express');
const request = require('supertest');
const { bootCrmDb, seedMinimal } = require('./helpers/crmDb');

function signStripePayload(payloadStr, secret, timestamp = Math.floor(Date.now() / 1000)) {
  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payloadStr}`, 'utf8')
    .digest('hex');
  return `t=${timestamp},v1=${sig}`;
}

describe('FD-06 Stripe webhook & affiliate commission lifecycle', () => {
  let db;
  let cleanup;
  let app;
  let studioId;
  const WEBHOOK_SECRET = 'whsec_test_fotodesk_fd06';

  beforeAll(async () => {
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
    ({ db, cleanup } = await bootCrmDb());
    await seedMinimal(db);

    await db('affiliate_accounts').insert({
      email: 'partner@example.test',
      password_hash: 'fixture',
      display_name: 'Partner Studio',
      referral_code: 'FD-PARTNER1',
      is_active: true,
      created_at: new Date(),
    });

    const firstStudio = await db('studios').orderBy('id', 'asc').first('id');
    studioId = firstStudio.id;
    await db('studios').where({ id: studioId }).update({
      plan_id: 'starter',
      referred_by_code: 'FD-PARTNER1',
    });

    app = express();
    app.post(
      '/api/webhooks/stripe',
      express.raw({ type: 'application/json' }),
      require('../../src/routes/stripeWebhook'),
    );
  }, 240000);

  afterAll(async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    if (cleanup) await cleanup();
  });

  async function postStripeEvent(event) {
    const raw = JSON.stringify(event);
    const sig = signStripePayload(raw, WEBHOOK_SECRET);
    return request(app)
      .post('/api/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('Stripe-Signature', sig)
      .send(raw);
  }

  it('rejects invalid Stripe signature with 400', async () => {
    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('Stripe-Signature', 't=123,v1=deadbeef')
      .send(JSON.stringify({ id: 'evt_bad', type: 'checkout.session.completed' }));
    expect(res.status).toBe(400);
  });

  it('activates Pro, records invoice & first-payment commission idempotently, handles renewal, refund and cancellation', async () => {
    // 1. Failed payment does not upgrade starter studio
    const failedRes = await postStripeEvent({
      id: 'evt_fail_1',
      type: 'invoice.payment_failed',
      data: { object: { id: 'in_fail_1', metadata: { studioId: String(studioId), planId: 'pro_monthly' } } },
    });
    expect(failedRes.status).toBe(200);
    expect((await db('studios').where({ id: studioId }).first('plan_id')).plan_id).toBe('starter');

    // 2. First confirmed checkout payment
    const checkoutEvent = {
      id: 'evt_chk_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_1',
          invoice: 'in_first_1',
          amount_total: 699,
          currency: 'eur',
          metadata: { studioId: String(studioId), planId: 'pro_monthly' },
        },
      },
    };
    const res1 = await postStripeEvent(checkoutEvent);
    expect(res1.status).toBe(200);
    expect(res1.body.duplicate).toBe(false);

    const studioAfter = await db('studios').where({ id: studioId }).first('plan_id');
    expect(studioAfter.plan_id).toBe('pro_monthly');

    const invoices1 = await db('subscription_invoices').where({ studio_id: studioId });
    expect(invoices1).toHaveLength(1);
    expect(invoices1[0].amount_minor).toBe(699);

    const commissions1 = await db('affiliate_commissions').where({ referred_studio_id: studioId });
    expect(commissions1).toHaveLength(1);
    expect(commissions1[0].commission_minor).toBe(140); // 20% of 699 rounded
    expect(commissions1[0].status).toBe('pending');

    // 3. Replay same event -> idempotent, no duplicate invoice or commission
    const replay = await postStripeEvent(checkoutEvent);
    expect(replay.status).toBe(200);
    expect(replay.body.duplicate).toBe(true);
    expect(await db('subscription_invoices').where({ studio_id: studioId })).toHaveLength(1);
    expect(await db('affiliate_commissions').where({ referred_studio_id: studioId })).toHaveLength(1);

    // 4. Renewal -> 2nd invoice, still only 1 commission (first-payment rule)
    const renewal = await postStripeEvent({
      id: 'evt_ren_1',
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          id: 'in_renewal_2',
          amount_paid: 699,
          currency: 'eur',
          metadata: { studioId: String(studioId), planId: 'pro_monthly' },
        },
      },
    });
    expect(renewal.status).toBe(200);
    expect(renewal.body.duplicate).toBe(false);
    expect(await db('subscription_invoices').where({ studio_id: studioId })).toHaveLength(2);
    expect(await db('affiliate_commissions').where({ referred_studio_id: studioId })).toHaveLength(1);

    // 5. Refund on first invoice -> invoice marked refunded & pending commission cancelled
    const refund = await postStripeEvent({
      id: 'evt_ref_1',
      type: 'charge.refunded',
      data: { object: { id: 'ch_1', invoice: 'in_first_1' } },
    });
    expect(refund.status).toBe(200);
    const invFirst = await db('subscription_invoices').where({ invoice_number: 'STRIPE-in_first_1' }).first('status');
    expect(invFirst.status).toBe('refunded');
    const commAfterRefund = await db('affiliate_commissions').where({ referred_studio_id: studioId }).first('status');
    expect(commAfterRefund.status).toBe('cancelled');

    // 6. Subscription deleted -> downgrade back to starter
    const deleted = await postStripeEvent({
      id: 'evt_del_1',
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_1', metadata: { studioId: String(studioId) } } },
    });
    expect(deleted.status).toBe(200);
    expect((await db('studios').where({ id: studioId }).first('plan_id')).plan_id).toBe('starter');
  });
});

