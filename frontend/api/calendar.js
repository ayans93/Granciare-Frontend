/**
 * GET /api/calendar.ics
 *
 * Serves a live iCal (.ics) feed of all confirmed Granciare stay bookings.
 * Subscribe to this URL in any calendar app (Google Calendar, Apple Calendar,
 * Airbnb, Booking.com, etc.) to keep blocked dates in sync automatically.
 *
 * Security: protected by a secret token passed as ?token=<ICAL_SECRET>
 * Set ICAL_SECRET in Vercel environment variables.
 *
 * Example subscription URL:
 *   https://granciare.com/api/calendar.ics?token=YOUR_SECRET
 */

import { getServerClient } from './_lib/supabase.js';

// ── Helpers ───────────────────────────────────────────────
function escapeIcal(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

/** Convert YYYY-MM-DD → iCal date string YYYYMMDD */
function toIcalDate(ymd) {
  if (!ymd) return '';
  return ymd.replace(/-/g, '');
}

/** Stable UID for a booking row */
function uid(row) {
  return `granciare-stay-${row.id}@granciare.com`;
}

/** Format Date → iCal UTC timestamp e.g. 20260601T120000Z */
function toIcalStamp(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function buildIcal(rows) {
  const now = toIcalStamp(new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Granciare Estate//Granciare Bookings//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Granciare Estate Bookings',
    'X-WR-TIMEZONE:Europe/Rome',
    'X-WR-CALDESC:Confirmed stay bookings at Granciare Estate, Allerona, Umbria',
  ];

  for (const row of rows) {
    const checkIn  = toIcalDate(row.check_in);
    const checkOut = toIcalDate(row.check_out);
    if (!checkIn || !checkOut) continue;

    // Shared with third-party calendars, so no guest names or requests
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid(row)}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${checkIn}`,
      `DTEND;VALUE=DATE:${checkOut}`,
      'SUMMARY:Booked — Granciare Estate',
      'DESCRIPTION:Confirmed stay at Granciare Estate',
      `LOCATION:Granciare Estate\\, Allerona\\, Umbria\\, Italy`,
      `STATUS:CONFIRMED`,
      `TRANSP:OPAQUE`,
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');

  // iCal spec requires CRLF line endings
  return lines.join('\r\n');
}

// ── Handler ───────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS — allow calendar clients
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  // Token gate
  const secret = process.env.ICAL_SECRET;
  if (secret) {
    const token = req.query.token;
    if (!token || token !== secret) {
      return res.status(401).json({ error: 'Unauthorized. Provide ?token=<ICAL_SECRET>' });
    }
  }

  // Fetch confirmed bookings from Supabase
  const sb = getServerClient();
  if (!sb) {
    return res.status(500).json({ error: 'Supabase not configured.' });
  }

  const { data, error } = await sb
    .from('stay_requests')
    .select('id, check_in, check_out')
    .eq('status', 'confirmed')
    .order('check_in', { ascending: true });

  if (error) {
    console.error('iCal fetch error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch bookings.' });
  }

  const ical = buildIcal(data || []);

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="granciare-bookings.ics"');
  // Short cache so confirmations reach other calendars within minutes
  res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=60');
  return res.status(200).send(ical);
}
