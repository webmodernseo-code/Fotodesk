const express = require('express');
const jwt = require('jsonwebtoken');
const { db } = require('../database/db');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/public/calendar/google/callback
 * OAuth 2.0 callback for connecting a studio's Google Calendar account.
 */
router.get('/google/callback', async (req, res) => {
  const frontendUrl = process.env.APP_URL || 'http://localhost:5173';
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.redirect(`${frontendUrl}/admin/agenda?google=error`);
    }
    const decoded = jwt.verify(String(state), process.env.JWT_SECRET);
    const studioId = Number(decoded.studioId || 1);
    const backendBase = process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
    const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || `${backendBase}/api/public/calendar/google/callback`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) {
      return res.redirect(`${frontendUrl}/admin/agenda?google=error`);
    }
    const tokens = await tokenRes.json();

    let email = null;
    if (tokens.access_token) {
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (userRes.ok) {
        const userJson = await userRes.json();
        email = userJson.email || null;
      }
    }

    const key = `studio_${studioId}_google_tokens`;
    const serialized = JSON.stringify({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + (tokens.expires_in || 3600) * 1000,
      email,
    });
    const existing = await db('app_settings').where({ setting_key: key }).first('id');
    if (existing) {
      await db('app_settings').where({ setting_key: key }).update({ setting_value: serialized, updated_at: new Date() });
    } else {
      await db('app_settings').insert({
        setting_key: key,
        setting_value: serialized,
        setting_type: 'calendar',
        updated_at: new Date(),
      });
    }

    return res.redirect(`${frontendUrl}/admin/agenda?google=connected`);
  } catch (error) {
    logger.error('Google Calendar OAuth callback error:', error);
    return res.redirect(`${frontendUrl}/admin/agenda?google=error`);
  }
});

function escapeIcsText(val = '') {
  return String(val || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function toIcsDateTime(dateStr, timeStr) {
  const cleanDate = String(dateStr || '').slice(0, 10).replace(/-/g, '');
  if (!/^\d{8}$/.test(cleanDate)) return null;
  if (!timeStr || !/^\d{2}:\d{2}/.test(timeStr)) {
    return { value: cleanDate, isAllDay: true };
  }
  const cleanTime = timeStr.slice(0, 5).replace(':', '') + '00';
  return { value: `${cleanDate}T${cleanTime}`, isAllDay: false };
}

/**
 * GET /api/public/calendar/:token/feed.ics
 * Public secret-token iCalendar (RFC 5545) feed for Google Calendar / Apple Calendar / Outlook.
 */
router.get('/:token/feed.ics', async (req, res) => {
  try {
    const token = String(req.params.token || '').trim();
    if (!/^[a-f0-9]{16,64}$/i.test(token)) {
      return res.status(404).type('text/plain').send('Calendar feed not found');
    }

    const settingRow = await db('app_settings')
      .where('setting_key', 'like', 'studio_%_calendar_feed_token')
      .where('setting_value', token)
      .first();

    if (!settingRow) {
      return res.status(404).type('text/plain').send('Calendar feed not found');
    }

    const match = String(settingRow.setting_key).match(/^studio_(\d+)_calendar_feed_token$/);
    const studioId = match ? Number(match[1]) : null;
    if (!studioId) {
      return res.status(404).type('text/plain').send('Calendar feed not found');
    }

    const [studio, appointments, events] = await Promise.all([
      db('studios').where({ id: studioId }).first('name'),
      db('calendar_appointments')
        .where({ studio_id: studioId })
        .whereNot('status', 'archived')
        .select('id', 'title', 'appointment_date', 'start_time', 'end_time', 'location', 'notes', 'client_name')
        .catch(() => []),
      db('events')
        .where({ studio_id: studioId })
        .whereNotNull('event_date')
        .where('is_archived', false)
        .select('id', 'event_name', 'event_date', 'slug', 'customer_name')
        .catch(() => []),
    ]);

    const calName = escapeIcsText(studio?.name ? `${studio.name} — FotoDesk` : 'FotoDesk Agenda');
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//FotoDesk//Studio Calendar//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${calName}`,
    ];

    for (const appt of appointments) {
      const start = toIcsDateTime(appt.appointment_date, appt.start_time);
      if (!start) continue;
      const end = toIcsDateTime(appt.appointment_date, appt.end_time || appt.start_time);
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:fotodesk-appt-${appt.id}@fotodesk.io`);
      if (start.isAllDay) {
        lines.push(`DTSTART;VALUE=DATE:${start.value}`);
      } else {
        lines.push(`DTSTART:${start.value}`);
        if (end && !end.isAllDay) lines.push(`DTEND:${end.value}`);
      }
      lines.push(`SUMMARY:${escapeIcsText(appt.title)}`);
      if (appt.location) lines.push(`LOCATION:${escapeIcsText(appt.location)}`);
      const desc = [appt.client_name ? `Client : ${appt.client_name}` : '', appt.notes || '']
        .filter(Boolean)
        .join('\n');
      if (desc) lines.push(`DESCRIPTION:${escapeIcsText(desc)}`);
      lines.push('END:VEVENT');
    }

    for (const ev of events) {
      const start = toIcsDateTime(ev.event_date, null);
      if (!start) continue;
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:fotodesk-event-${ev.id}@fotodesk.io`);
      lines.push(`DTSTART;VALUE=DATE:${start.value}`);
      lines.push(`SUMMARY:${escapeIcsText(`Galerie : ${ev.event_name}`)}`);
      if (ev.customer_name) lines.push(`DESCRIPTION:${escapeIcsText(`Client : ${ev.customer_name}`)}`);
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');

    res.set('Content-Type', 'text/calendar; charset=utf-8');
    res.set('Content-Disposition', 'inline; filename="fotodesk-calendar.ics"');
    return res.send(lines.join('\r\n'));
  } catch (error) {
    logger.error('GET /api/public/calendar/:token/feed.ics error:', error);
    return res.status(500).type('text/plain').send('Calendar feed error');
  }
});

module.exports = router;

