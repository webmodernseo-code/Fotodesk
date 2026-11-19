/**
 * Admin calendar aggregate endpoint.
 *
 * One read returns four layers the frontend renders together on the
 * admin calendar surface (`/admin/clients/calendar`):
 *
 *   1. events       — galleries from the `events` table. Blue solid.
 *   2. hours        — customer_hour_entries. Green solid; greyed when
 *                     locked (entry's invoice is past send/draft state).
 *   3. quotes       — quotes that haven't been converted to an event yet,
 *                     `status IN ('sent','accepted')`. Amber dashed.
 *   4. contracts    — contracts that haven't been converted to an event
 *                     yet, `status IN ('signed_by_customer','fully_signed')`.
 *                     Purple dashed.
 *
 * Each item carries a `kind` discriminator so the frontend can union-type
 * the response.
 *
 * **Access**
 *
 * Behind the `calendar` master feature flag (admin can disable globally
 * via Settings → Features). Read permission is `customers.view` —
 * mirrors the existing hour-entry list permission, since the calendar's
 * primary mutation surface is hour entries and we want the same audience
 * for read.
 *
 * **Range guard**
 *
 * `from` / `to` are required ISO date strings. We cap `to-from` at
 * **90 days** so a misconfigured client (e.g. an infinite scroll that
 * keeps expanding the range) can't trigger a multi-year scan. FullCalendar
 * fetches month-by-month by default, so 90 days is a comfortable margin.
 *
 * **Drift guards**
 *
 * The `events.event_time_start / event_time_end / is_full_day` columns
 * (migration 137) are read through `hasColumnCached` so un-migrated
 * installs default to all-day rendering without 500-ing.
 *
 * **No mutations here**
 *
 * Hour-entry CRUD stays on the existing `/api/admin/customers/:id/
 * hour-entries` routes (migration 129 + B.6 permission split). The
 * calendar's drag-create / inline-edit modals call those directly.
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const { adminAuth } = require('../middleware/auth');
const { requirePermission, userHasAnyPermission } = require('../middleware/permissions');
const { scopeEventsListQuery } = require('../middleware/ownership');
const { isFeatureEnabled } = require('../middleware/requireFeatureFlag');
const { handleAsync, validateRequest, successResponse } = require('../utils/routeHelpers');
const { hasColumnCached } = require('../utils/schemaCache');
const { db } = require('../database/db');
const customerHoursService = require('../services/customerHoursService');

const router = express.Router();

// ----- feature flag gate (admin global) ----------------------------------
async function requireCalendarFlag(req, res, next) {
  try {
    const row = await db('feature_flags').where({ key: 'calendar' }).first();
    const enabled = row && (row.value === true || row.value === 1 || row.value === '1');
    if (!enabled) {
      return res.status(403).json({ error: 'Calendar feature is disabled', code: 'CALENDAR_DISABLED' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

router.use(adminAuth);
router.use(requireCalendarFlag);

const MAX_RANGE_DAYS = 90;
const PENDING_QUOTE_STATUSES = ['sent', 'accepted'];
const PENDING_CONTRACT_STATUSES = ['signed_by_customer', 'fully_signed'];
const APPOINTMENT_STATUSES = ['scheduled', 'completed', 'cancelled', 'archived'];

/**
 * Normalise a date column value to the `YYYY-MM-DD` string the
 * frontend mapper expects.
 *
 * Different drivers return the value differently:
 *   - SQLite (dev) returns a string like "2026-05-18" — slice it.
 *   - node-postgres (prod) returns a JS Date set to UTC midnight of
 *     the stored day — extract the UTC components.
 *
 * The previous shape kept the Date object as-is in the JSON response
 * ("2026-05-18T00:00:00.000Z"), which the frontend then concatenated
 * with the entry time as `${dateStr}T${time}` to feed FullCalendar.
 * The resulting `"2026-05-18T00:00:00.000ZT09:00"` was invalid ISO,
 * FC parsed it to NaN, and the entry silently failed to render —
 * making logged hours "disappear" on every hard refresh (entries
 * created in-session still appeared because the imperative addEvent
 * received a clean YYYY-MM-DD from the modal).
 */
function toIsoDateString(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, '0');
    const d = String(value.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return null;
}

/**
 * GET /api/admin/calendar/items?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Returns `{ items: [...], range: { from, to } }`.
 *
 * Items are concatenated across the four layers. Order is NOT guaranteed —
 * FullCalendar sorts by start time client-side. Each item shape:
 *
 *   - { kind: 'event',    id, slug, eventName, eventDate, eventTimeStart, eventTimeEnd, isFullDay, customerName }
 *   - { kind: 'hours',    id, customerAccountId, entryDate, startTime, endTime, description, locked, invoiceId, invoiceStatus, customerName }
 *   - { kind: 'quote',    id, quoteNumber, eventName, eventDate, eventTimeStart, eventTimeEnd, status, customerName }
 *   - { kind: 'contract', id, contractNumber, eventName, eventDate, eventTimeStart, eventTimeEnd, status, customerName }
 */
router.get(
  '/items',
  requirePermission('customers.view'),
  [
    query('from').isISO8601().withMessage('from must be ISO date'),
    query('to').isISO8601().withMessage('to must be ISO date'),
  ],
  handleAsync(async (req, res) => {
    validateRequest(req);
    const from = String(req.query.from).slice(0, 10);
    const to = String(req.query.to).slice(0, 10);
    if (from > to) {
      return res.status(400).json({ error: 'from must be <= to', code: 'INVALID_RANGE' });
    }
    // Day-span guard. Date-string lex compare doesn't give a day count
    // directly; subtract via Date so DST + month boundaries are handled.
    const fromDate = new Date(from + 'T00:00:00Z');
    const toDate = new Date(to + 'T00:00:00Z');
    const daysSpan = Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000);
    if (daysSpan > MAX_RANGE_DAYS) {
      return res.status(400).json({
        error: `Range too wide (max ${MAX_RANGE_DAYS} days)`,
        code: 'RANGE_TOO_WIDE',
      });
    }

    const hasEventCalendarCols = await hasColumnCached('events', 'is_full_day');

    // -- 1. Events ---------------------------------------------------------
    // Same visibility as the events list: roles that do not see every
    // event get their own (and unowned) events only. Without this the
    // calendar handed a restricted role every studio event by name, date
    // and customer (security review 2026-09-29).
    const eventsQ = scopeEventsListQuery(
      db('events')
        .whereBetween('event_date', [from, to])
        .where('is_active', true)
        .where('is_archived', false)
        .orderBy('event_date', 'asc'),
      req.admin,
    );
    // Project columns. The new time columns are guarded so older installs
    // that ran the service before migration 137 still get sane defaults.
    const eventsRows = await eventsQ.select(
      'id', 'slug', 'event_name', 'event_date', 'customer_name',
      ...(hasEventCalendarCols
        ? ['event_time_start', 'event_time_end', 'is_full_day']
        : []),
    );
    const events = eventsRows.map((r) => ({
      kind: 'event',
      id: r.id,
      slug: r.slug,
      eventName: r.event_name,
      eventDate: toIsoDateString(r.event_date),
      eventTimeStart: r.event_time_start || null,
      eventTimeEnd: r.event_time_end || null,
      isFullDay: hasEventCalendarCols
        ? (r.is_full_day === true || r.is_full_day === 1 || r.is_full_day === '1')
        : true,
      customerName: r.customer_name || null,
    }));

    // The CRM sections follow the same gates as the pages they summarise:
    // the feature has to be on, and the role has to hold the domain's view
    // permission. `customers.view` alone opened all three before, so a role
    // without `contracts.view` still read every pending contract number.
    const [canSeeHours, canSeeQuotes, canSeeContracts] = await Promise.all([
      isFeatureEnabled('hoursLogging'),
      isFeatureEnabled('quotes').then((on) => on && userHasAnyPermission(req.admin.id, ['quotes.view'])),
      isFeatureEnabled('contracts').then((on) => on && userHasAnyPermission(req.admin.id, ['contracts.view'])),
    ]);

    // -- 2. Hour entries ---------------------------------------------------
    // LEFT JOIN invoices so isEntryLocked has the invoice context it needs.
    // We use the SAME predicate shape the service uses internally
    // (customerHoursService._internal.isEntryLocked at lines 84-91) so
    // the calendar's lock badge matches what the UI shows on the customer
    // detail page.
    const hoursRows = !canSeeHours ? [] : await db('customer_hour_entries as h')
      .leftJoin('invoices as i', 'i.id', 'h.invoice_id')
      .leftJoin('customer_accounts as c', 'c.id', 'h.customer_account_id')
      .whereBetween('h.entry_date', [from, to])
      .orderBy('h.entry_date', 'asc')
      .select(
        'h.id', 'h.customer_account_id', 'h.entry_date',
        'h.start_time', 'h.end_time', 'h.description',
        'h.invoice_id', 'h.invoice_line_item_id', 'h.status',
        'i.status as invoice_status',
        'i.is_monthly_draft as invoice_is_monthly_draft',
        'i.scheduled_send_at as invoice_scheduled_send_at',
        'c.display_name as customer_display_name',
        'c.first_name as customer_first_name',
        'c.last_name as customer_last_name',
        'c.company_name as customer_company_name',
        'c.email as customer_email',
      );
    const isEntryLocked = customerHoursService._internal.isEntryLocked;
    const hours = hoursRows.map((r) => {
      // Reconstruct the minimal entry + invoice shapes the locked
      // predicate expects.
      const entry = {
        id: r.id,
        invoice_id: r.invoice_id,
        status: r.status,
      };
      const invoice = r.invoice_id ? {
        id: r.invoice_id,
        status: r.invoice_status,
        is_monthly_draft: r.invoice_is_monthly_draft,
        scheduled_send_at: r.invoice_scheduled_send_at,
      } : null;
      const locked = isEntryLocked(entry, invoice);
      const customerName = r.customer_company_name
        || [r.customer_first_name, r.customer_last_name].filter(Boolean).join(' ')
        || r.customer_display_name
        || r.customer_email
        || null;
      return {
        kind: 'hours',
        id: r.id,
        customerAccountId: r.customer_account_id,
        entryDate: toIsoDateString(r.entry_date),
        startTime: r.start_time,
        endTime: r.end_time,
        description: r.description || null,
        status: r.status,
        invoiceId: r.invoice_id || null,
        invoiceStatus: r.invoice_status || null,
        locked,
        customerName,
      };
    });

    // -- 3. Pending quotes ------------------------------------------------
    // Only quotes with status IN ('sent','accepted') AND no converted
    // event yet. The frontend renders these dashed amber.
    const quotesRows = !canSeeQuotes ? [] : await db('quotes as q')
      .leftJoin('customer_accounts as c', 'c.id', 'q.customer_account_id')
      .whereIn('q.status', PENDING_QUOTE_STATUSES)
      .whereNull('q.converted_event_id')
      .whereNotNull('q.event_date')
      .whereBetween('q.event_date', [from, to])
      .orderBy('q.event_date', 'asc')
      .select(
        'q.id', 'q.quote_number', 'q.event_name', 'q.event_date',
        'q.event_time_start', 'q.event_time_end', 'q.status',
        'c.display_name as customer_display_name',
        'c.first_name as customer_first_name',
        'c.last_name as customer_last_name',
        'c.company_name as customer_company_name',
        'c.email as customer_email',
      );
    const quotes = quotesRows.map((r) => ({
      kind: 'quote',
      id: r.id,
      quoteNumber: r.quote_number,
      eventName: r.event_name || null,
      eventDate: toIsoDateString(r.event_date),
      eventTimeStart: r.event_time_start || null,
      eventTimeEnd: r.event_time_end || null,
      status: r.status,
      customerName: r.customer_company_name
        || [r.customer_first_name, r.customer_last_name].filter(Boolean).join(' ')
        || r.customer_display_name
        || r.customer_email
        || null,
    }));

    // -- 4. Pending contracts --------------------------------------------
    const contractsRows = !canSeeContracts ? [] : await db('contracts as c')
      .leftJoin('customer_accounts as ca', 'ca.id', 'c.customer_account_id')
      .whereIn('c.status', PENDING_CONTRACT_STATUSES)
      .whereNull('c.converted_event_id')
      .whereNotNull('c.event_date')
      .whereBetween('c.event_date', [from, to])
      .orderBy('c.event_date', 'asc')
      .select(
        'c.id', 'c.contract_number', 'c.event_name', 'c.event_date',
        'c.event_time_start', 'c.event_time_end', 'c.status',
        'ca.display_name as customer_display_name',
        'ca.first_name as customer_first_name',
        'ca.last_name as customer_last_name',
        'ca.company_name as customer_company_name',
        'ca.email as customer_email',
      );
    const contracts = contractsRows.map((r) => ({
      kind: 'contract',
      id: r.id,
      contractNumber: r.contract_number,
      eventName: r.event_name || null,
      eventDate: toIsoDateString(r.event_date),
      eventTimeStart: r.event_time_start || null,
      eventTimeEnd: r.event_time_end || null,
      status: r.status,
      customerName: r.customer_company_name
        || [r.customer_first_name, r.customer_last_name].filter(Boolean).join(' ')
        || r.customer_display_name
        || r.customer_email
        || null,
    }));

    const studioId = req.studioId || req.admin?.studioId || 1;
    const hasAppointments = await db.schema.hasTable('calendar_appointments');
    const appointmentRows = !hasAppointments ? [] : await db('calendar_appointments as a')
      .leftJoin('customer_accounts as ca', 'ca.id', 'a.customer_account_id')
      .leftJoin('projects as p', 'p.id', 'a.project_id')
      .where('a.studio_id', studioId)
      .whereBetween('a.appointment_date', [from, to])
      .whereNot('a.status', 'archived')
      .orderBy('a.appointment_date', 'asc')
      .select(
        'a.*',
        'ca.display_name as customer_display_name',
        'ca.first_name as customer_first_name',
        'ca.last_name as customer_last_name',
        'ca.company_name as customer_company_name',
        'p.name as project_name',
      );
    const appointments = appointmentRows.map((r) => ({
      kind: 'appointment',
      id: r.id,
      title: r.title,
      clientName: r.customer_company_name
        || [r.customer_first_name, r.customer_last_name].filter(Boolean).join(' ')
        || r.customer_display_name
        || r.client_name
        || null,
      customerAccountId: r.customer_account_id || null,
      projectId: r.project_id || null,
      projectName: r.project_name || null,
      category: r.category,
      date: toIsoDateString(r.appointment_date),
      startTime: r.start_time,
      endTime: r.end_time,
      location: r.location || null,
      notes: r.notes || null,
      status: r.status,
    }));

    const items = [...events, ...hours, ...quotes, ...contracts, ...appointments];
    return successResponse(res, { items, range: { from, to } });
  }),
);

router.post(
  '/appointments',
  requirePermission('customers.edit'),
  [
    body('title').isString().trim().isLength({ min: 1, max: 255 }),
    body('clientName').optional({ nullable: true }).isString().trim().isLength({ max: 255 }),
    body('customerAccountId').optional({ nullable: true }).isInt({ min: 1 }),
    body('projectId').optional({ nullable: true }).isInt({ min: 1 }),
    body('category').optional().isString().trim().isLength({ min: 1, max: 64 }),
    body('date').isISO8601({ strict: true }),
    body('startTime').matches(/^([01]\d|2[0-3]):[0-5]\d$/),
    body('endTime').matches(/^([01]\d|2[0-3]):[0-5]\d$/),
    body('location').optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
    body('notes').optional({ nullable: true }).isString().trim().isLength({ max: 5000 }),
  ],
  handleAsync(async (req, res) => {
    validateRequest(req);
    if (req.body.endTime <= req.body.startTime) {
      return res.status(400).json({ error: 'endTime must be after startTime', code: 'INVALID_TIME_RANGE' });
    }

    const customerId = req.body.customerAccountId || null;
    const projectId = req.body.projectId || null;
    if (customerId && !(await db('customer_accounts').where({ id: customerId }).first('id'))) {
      return res.status(400).json({ error: 'Unknown customer', code: 'INVALID_CUSTOMER' });
    }
    if (projectId) {
      const project = await db('projects').where({ id: projectId }).first('id', 'customer_account_id');
      if (!project) return res.status(400).json({ error: 'Unknown project', code: 'INVALID_PROJECT' });
      if (customerId && project.customer_account_id && Number(project.customer_account_id) !== Number(customerId)) {
        return res.status(400).json({ error: 'Project does not belong to customer', code: 'PROJECT_CUSTOMER_MISMATCH' });
      }
    }

    const studioId = req.studioId || req.admin?.studioId || 1;
    const inserted = await db('calendar_appointments').insert({
      studio_id: studioId,
      title: req.body.title,
      client_name: req.body.clientName || null,
      customer_account_id: customerId,
      project_id: projectId,
      category: req.body.category || 'other',
      appointment_date: String(req.body.date).slice(0, 10),
      start_time: req.body.startTime,
      end_time: req.body.endTime,
      location: req.body.location || null,
      notes: req.body.notes || null,
      status: 'scheduled',
      created_by: req.admin.id,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    }).returning('id');
    const id = (inserted[0] && typeof inserted[0] === 'object') ? inserted[0].id : inserted[0];
    return successResponse(res, { appointment: { id: Number(id) } }, 201, 'Appointment created');
  }),
);

router.patch(
  '/appointments/:id',
  requirePermission('customers.edit'),
  [
    param('id').isInt({ min: 1 }),
    body('status').isIn(APPOINTMENT_STATUSES),
  ],
  handleAsync(async (req, res) => {
    validateRequest(req);
    const studioId = req.studioId || req.admin?.studioId || 1;
    const updated = await db('calendar_appointments')
      .where({ id: Number(req.params.id), studio_id: studioId })
      .update({ status: req.body.status, updated_at: db.fn.now() });
    if (!updated) return res.status(404).json({ error: 'Appointment not found' });
    return successResponse(res, { id: Number(req.params.id), status: req.body.status });
  }),
);

router.put(
  '/appointments/:id',
  requirePermission('customers.edit'),
  [
    param('id').isInt({ min: 1 }),
    body('title').isString().trim().isLength({ min: 1, max: 255 }),
    body('clientName').optional({ nullable: true }).isString().trim().isLength({ max: 255 }),
    body('customerAccountId').optional({ nullable: true }).isInt({ min: 1 }),
    body('projectId').optional({ nullable: true }).isInt({ min: 1 }),
    body('category').isString().trim().isLength({ min: 1, max: 64 }),
    body('date').isISO8601({ strict: true }),
    body('startTime').matches(/^([01]\d|2[0-3]):[0-5]\d$/),
    body('endTime').matches(/^([01]\d|2[0-3]):[0-5]\d$/),
    body('location').optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
    body('notes').optional({ nullable: true }).isString().trim().isLength({ max: 5000 }),
    body('status').isIn(APPOINTMENT_STATUSES),
  ],
  handleAsync(async (req, res) => {
    validateRequest(req);
    const id = Number(req.params.id);
    const studioId = req.studioId || req.admin?.studioId || 1;
    if (!(await db('calendar_appointments').where({ id, studio_id: studioId }).first('id'))) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    if (req.body.endTime <= req.body.startTime) {
      return res.status(400).json({ error: 'endTime must be after startTime', code: 'INVALID_TIME_RANGE' });
    }
    const customerId = req.body.customerAccountId || null;
    const projectId = req.body.projectId || null;
    if (customerId && !(await db('customer_accounts').where({ id: customerId }).first('id'))) {
      return res.status(400).json({ error: 'Unknown customer', code: 'INVALID_CUSTOMER' });
    }
    if (projectId) {
      const project = await db('projects').where({ id: projectId }).first('id', 'customer_account_id');
      if (!project) return res.status(400).json({ error: 'Unknown project', code: 'INVALID_PROJECT' });
      if (customerId && project.customer_account_id && Number(project.customer_account_id) !== Number(customerId)) {
        return res.status(400).json({ error: 'Project does not belong to customer', code: 'PROJECT_CUSTOMER_MISMATCH' });
      }
    }
    await db('calendar_appointments').where({ id }).update({
      title: req.body.title,
      client_name: req.body.clientName || null,
      customer_account_id: customerId,
      project_id: projectId,
      category: req.body.category,
      appointment_date: String(req.body.date).slice(0, 10),
      start_time: req.body.startTime,
      end_time: req.body.endTime,
      location: req.body.location || null,
      notes: req.body.notes || null,
      status: req.body.status,
      updated_at: db.fn.now(),
    });
    return successResponse(res, { id }, 200, 'Appointment updated');
  }),
);

router.delete(
  '/appointments/:id',
  requirePermission('customers.edit'),
  [param('id').isInt({ min: 1 })],
  handleAsync(async (req, res) => {
    validateRequest(req);
    const studioId = req.studioId || req.admin?.studioId || 1;
    const deleted = await db('calendar_appointments').where({ id: Number(req.params.id), studio_id: studioId }).del();
    if (!deleted) return res.status(404).json({ error: 'Appointment not found' });
    return successResponse(res, { id: Number(req.params.id) }, 200, 'Appointment deleted');
  }),
);

// Studio-scoped /events listing for calendar_appointments (Dev_backend 3.4)
router.get(
  '/events',
  requirePermission('customers.view'),
  handleAsync(async (req, res) => {
    const studioId = req.studioId || req.admin?.studioId || 1;
    const q = db('calendar_appointments').where({ studio_id: studioId }).orderBy('appointment_date', 'asc');
    if (req.query.from && req.query.to) {
      q.whereBetween('appointment_date', [String(req.query.from).slice(0, 10), String(req.query.to).slice(0, 10)]);
    }
    const events = await q.select('*');
    return successResponse(res, { events });
  }),
);

async function getOrCreateCalendarFeedToken(studioId, forceRotate = false) {
  const crypto = require('crypto');
  const key = `studio_${studioId}_calendar_feed_token`;
  const existing = await db('app_settings').where({ setting_key: key }).first();
  if (existing && existing.setting_value && !forceRotate) {
    return existing.setting_value;
  }
  const token = crypto.randomBytes(24).toString('hex');
  if (existing) {
    await db('app_settings').where({ setting_key: key }).update({
      setting_value: token,
      updated_at: new Date(),
    });
  } else {
    await db('app_settings').insert({
      setting_key: key,
      setting_value: token,
      setting_type: 'calendar',
      updated_at: new Date(),
    });
  }
  return token;
}

router.get(
  '/feed-url',
  requirePermission('customers.view'),
  handleAsync(async (req, res) => {
    const studioId = req.studioId || req.admin?.studioId || 1;
    const token = await getOrCreateCalendarFeedToken(studioId, false);
    return successResponse(res, {
      token,
      feedPath: `/api/public/calendar/${token}/feed.ics`,
    });
  }),
);

router.post(
  '/feed-url/regenerate',
  requirePermission('customers.edit'),
  handleAsync(async (req, res) => {
    const studioId = req.studioId || req.admin?.studioId || 1;
    const token = await getOrCreateCalendarFeedToken(studioId, true);
    return successResponse(res, {
      token,
      feedPath: `/api/public/calendar/${token}/feed.ics`,
    });
  }),
);

async function saveStudioSetting(key, value, type = 'calendar') {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  const existing = await db('app_settings').where({ setting_key: key }).first('id');
  if (existing) {
    await db('app_settings').where({ setting_key: key }).update({
      setting_value: serialized,
      updated_at: new Date(),
    });
  } else {
    await db('app_settings').insert({
      setting_key: key,
      setting_value: serialized,
      setting_type: type,
      updated_at: new Date(),
    });
  }
}

function parseIcsEvents(icsText, fromIso, toIso) {
  const blocks = String(icsText || '').split('BEGIN:VEVENT').slice(1);
  const items = [];
  for (const block of blocks) {
    const body = block.split('END:VEVENT')[0] || '';
    const unfolded = body.replace(/\r?\n[ \t]/g, '');
    const getField = (name) => {
      const m = unfolded.match(new RegExp(`^${name}(?:;[^:]*)?:(.*)$`, 'm'));
      return m ? m[1].trim().replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';') : '';
    };
    const uid = getField('UID') || String(Math.random());
    const summary = getField('SUMMARY') || 'Événement Google Agenda';
    const dtStartRaw = getField('DTSTART');
    const dtEndRaw = getField('DTEND');
    const location = getField('LOCATION');
    const mDate = dtStartRaw.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/);
    if (!mDate) continue;
    const date = `${mDate[1]}-${mDate[2]}-${mDate[3]}`;
    if (fromIso && date < fromIso) continue;
    if (toIso && date > toIso) continue;
    const startTime = mDate[4] && mDate[5] ? `${mDate[4]}:${mDate[5]}:00` : null;
    const mEnd = dtEndRaw.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/);
    const endTime = mEnd && mEnd[4] && mEnd[5] ? `${mEnd[4]}:${mEnd[5]}:00` : null;
    items.push({
      id: uid,
      title: summary,
      date,
      startTime,
      endTime,
      isAllDay: !startTime,
      location: location || null,
      source: 'google',
    });
  }
  return items;
}

router.get(
  '/google/status',
  requirePermission('customers.view'),
  handleAsync(async (req, res) => {
    const studioId = req.studioId || req.admin?.studioId || 1;
    const oauthConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    const [tokenRow, icalRow] = await Promise.all([
      db('app_settings').where({ setting_key: `studio_${studioId}_google_tokens` }).first(),
      db('app_settings').where({ setting_key: `studio_${studioId}_google_ical_url` }).first(),
    ]);
    let tokenData = null;
    if (tokenRow?.setting_value) {
      try { tokenData = JSON.parse(tokenRow.setting_value); } catch {}
    }
    return successResponse(res, {
      oauthConfigured,
      connected: Boolean(tokenData?.access_token || icalRow?.setting_value),
      mode: tokenData?.access_token ? 'oauth' : icalRow?.setting_value ? 'ical' : null,
      email: tokenData?.email || null,
      hasIcalUrl: Boolean(icalRow?.setting_value),
    });
  }),
);

router.get(
  '/google/auth-url',
  requirePermission('customers.edit'),
  handleAsync(async (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(400).json({
        error: 'Google OAuth non configuré sur le serveur (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET manquants). Utilisez le lien iCal privé Google Agenda.',
        code: 'GOOGLE_OAUTH_NOT_CONFIGURED',
      });
    }
    const jwt = require('jsonwebtoken');
    const studioId = req.studioId || req.admin?.studioId || 1;
    const state = jwt.sign({ studioId, adminId: req.admin.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const backendBase = process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
    const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || `${backendBase}/api/public/calendar/google/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email',
      state,
    });
    return successResponse(res, { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  }),
);

router.post(
  '/google/ical-url',
  requirePermission('customers.edit'),
  [body('icalUrl').isURL({ protocols: ['https', 'http'], require_protocol: true })],
  handleAsync(async (req, res) => {
    validateRequest(req);
    const studioId = req.studioId || req.admin?.studioId || 1;
    await saveStudioSetting(`studio_${studioId}_google_ical_url`, String(req.body.icalUrl).trim(), 'calendar');
    return successResponse(res, { connected: true, mode: 'ical' });
  }),
);

router.post(
  '/google/disconnect',
  requirePermission('customers.edit'),
  handleAsync(async (req, res) => {
    const studioId = req.studioId || req.admin?.studioId || 1;
    await db('app_settings')
      .whereIn('setting_key', [`studio_${studioId}_google_tokens`, `studio_${studioId}_google_ical_url`])
      .del();
    return successResponse(res, { connected: false });
  }),
);

router.get(
  '/google/events',
  requirePermission('customers.view'),
  handleAsync(async (req, res) => {
    const studioId = req.studioId || req.admin?.studioId || 1;
    const fromIso = req.query.from ? String(req.query.from).slice(0, 10) : null;
    const toIso = req.query.to ? String(req.query.to).slice(0, 10) : null;

    const tokenRow = await db('app_settings').where({ setting_key: `studio_${studioId}_google_tokens` }).first();
    if (tokenRow?.setting_value) {
      let tokens = JSON.parse(tokenRow.setting_value);
      if (tokens.refresh_token && tokens.expires_at && Date.now() > tokens.expires_at - 60_000 && process.env.GOOGLE_CLIENT_ID) {
        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
            refresh_token: tokens.refresh_token,
            grant_type: 'refresh_token',
          }),
        });
        if (refreshRes.ok) {
          const refreshed = await refreshRes.json();
          tokens = {
            ...tokens,
            access_token: refreshed.access_token,
            expires_at: Date.now() + (refreshed.expires_in || 3600) * 1000,
          };
          await saveStudioSetting(`studio_${studioId}_google_tokens`, tokens, 'calendar');
        }
      }

      const calParams = new URLSearchParams({ singleEvents: 'true', orderBy: 'startTime', maxResults: '250' });
      if (fromIso) calParams.set('timeMin', `${fromIso}T00:00:00Z`);
      if (toIso) calParams.set('timeMax', `${toIso}T23:59:59Z`);

      const gRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${calParams.toString()}`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (gRes.ok) {
        const payload = await gRes.json();
        const events = (payload.items || []).map((ev) => {
          const startRaw = ev.start?.dateTime || ev.start?.date || '';
          const endRaw = ev.end?.dateTime || ev.end?.date || '';
          const isAllDay = Boolean(ev.start?.date && !ev.start?.dateTime);
          return {
            id: ev.id,
            title: ev.summary || 'Événement Google',
            date: startRaw.slice(0, 10),
            startTime: isAllDay ? null : startRaw.slice(11, 19),
            endTime: isAllDay ? null : endRaw.slice(11, 19),
            isAllDay,
            location: ev.location || null,
            htmlLink: ev.htmlLink || null,
            source: 'google',
          };
        });
        return successResponse(res, { events, mode: 'oauth' });
      }
    }

    const icalRow = await db('app_settings').where({ setting_key: `studio_${studioId}_google_ical_url` }).first();
    if (icalRow?.setting_value) {
      const icalRes = await fetch(icalRow.setting_value);
      if (icalRes.ok) {
        const text = await icalRes.text();
        return successResponse(res, { events: parseIcsEvents(text, fromIso, toIso), mode: 'ical' });
      }
    }

    return successResponse(res, { events: [], mode: null });
  }),
);

module.exports = router;
