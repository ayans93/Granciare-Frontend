/**
 * POST /api/enquiry
 *
 * Receives a booking enquiry from the contact form.
 * 1. Validates required fields
 * 2. Appends a row to the 'Bookings' tab in Google Sheets
 * 3. Sends an email notification to admin@dviu.in
 *
 * Bookings sheet columns (A–J):
 *   A: Timestamp (in Italian time)
 *   B: Name
 *   C: Email
 *   D: Phone           → "+91-8777076950" format
 *   E: Check-in Date
 *   F: Check-out Date
 *   G: Guests          → "12 (9A, 3C)" format
 *   H: Special Requests
 *   I: Message
 *   J: Source
 *
 * Environment variables required (set in Vercel dashboard):
 *   GOOGLE_CLIENT_EMAIL      — service account email
 *   GOOGLE_PRIVATE_KEY       — service account private key (include \n line breaks)
 *   GOOGLE_SHEET_ID          — the spreadsheet ID from the sheet URL
 *   GMAIL_USER               — sender Gmail address (admin@dviu.in)
 *   GMAIL_APP_PASSWORD       — 16-character Gmail App Password
 *   NOTIFY_EMAIL             — recipient email (admin@dviu.in)
 */

import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import { getServerClient, hasServiceKey } from './_lib/supabase.js';
import { notify } from './_lib/notify.js';
import { escapeHtml as esc, sendMail } from './_lib/mail.js';
import { BOOKINGS_OPEN_FROM } from './_lib/bookingWindow.js';

// ── CORS helper ───────────────────────────────────────────────
function setCors(req, res) {
  const origin = req.headers.origin || '';
  const allowed =
    origin === 'https://granciare.com' ||
    origin.startsWith('http://localhost') ||
    origin.includes('.vercel.app');

  res.setHeader('Access-Control-Allow-Origin', allowed ? origin : 'https://granciare.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

// ── Format: Italian timestamp (always padded, consistent) ─────
function italianTimestamp() {
  const now = new Date();
  // Format in Italian timezone with zero-padded hours
  return now.toLocaleString('en-GB', {
    timeZone: 'Europe/Rome',
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }); // → "01/06/2026, 09:25:14"
}

// ── Format: phone → "+91-8777076950" ─────────────────────────
// PhoneInput sends "+91 8777076950" (dial code + space + number).
// Column is plain-text in Sheets; we use RAW input to avoid formula
// interpretation (prevents leading-dash artefact).
function formatPhone(raw) {
  if (!raw) return '—';
  const trimmed = raw.trim();
  if (!trimmed) return '—';
  // Replace the space between dial code and number with a dash
  // "+91 9822367690" → "+91-9822367690"
  const formatted = trimmed.replace(/^(\+\d{1,4})\s+/, '$1-');
  return formatted;
}

// ── Format: guests → "12 (9A, 3C)" ──────────────────────────
// Handles both new format (adults/children as numbers) and old
// format (guests as "9 adults, 3 children" string).
function formatGuests(adults, children, guestsStr, infants) {
  // New format: separate adult + kid counts; infants (up to 3) are listed on top
  const a = parseInt(adults,   10);
  const c = parseInt(children, 10);
  const i = parseInt(infants,  10) || 0;
  if (!isNaN(a) && a >= 0) {
    const safeC = isNaN(c) ? 0 : c;
    const total = a + safeC;
    if (total === 0) return '—';
    return `${total} (${a} adults, ${safeC} kids)${i ? ` + ${i} infant${i === 1 ? '' : 's'}` : ''}`;
  }
  // Old format fallback: "9 adults, 3 children"
  if (guestsStr) {
    const am = guestsStr.match(/(\d+)\s*adult/i);
    const cm = guestsStr.match(/(\d+)\s*child/i);
    const a2 = am ? parseInt(am[1], 10) : 0;
    const c2 = cm ? parseInt(cm[1], 10) : 0;
    const total2 = a2 + c2;
    if (total2 === 0) return guestsStr; // unknown format — keep raw
    return `${total2} (${a2}A, ${c2}C)`;
  }
  return '—';
}

// ── Parse special requests + message ─────────────────────────
// Handles both new format (separate fields) and old format where
// special requests were embedded in the message string.
function parseRequests(message, specialRequests) {
  // New format: both fields provided separately
  if (specialRequests !== undefined && specialRequests !== null) {
    return {
      specialRequests: specialRequests || '—',
      message:         message         || '—',
    };
  }
  // Old format: "Special requests: X\n\nAdditional notes:\nY"
  const srMatch   = (message || '').match(/Special requests:\s*([^\n]+)/i);
  const noteMatch = (message || '').match(/Additional notes:\s*([\s\S]*)/i);
  if (srMatch) {
    return {
      specialRequests: srMatch[1].trim()               || '—',
      message:         noteMatch ? noteMatch[1].trim() || '—' : '—',
    };
  }
  return {
    specialRequests: '—',
    message:         message || '—',
  };
}

// ── Google Sheets: append one row to 'Bookings' ──────────────
async function appendToSheet(data) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key:  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const { specialRequests, message } = parseRequests(data.message, data.specialRequests);

  const row = [
    italianTimestamp(),                                            // A: Timestamp (in Italian time)
    data.name,                                                     // B: Name
    data.email,                                                    // C: Email
    formatPhone(data.phone),                                       // D: Phone
    data.checkIn  || '—',                                          // E: Check-in Date
    data.checkOut || '—',                                          // F: Check-out Date
    formatGuests(data.adults, data.children, data.guests, data.infants),         // G: Guests
    [data.stayType === 'floor' ? 'Booking: One floor' : '', specialRequests === '—' ? '' : specialRequests].filter(Boolean).join(' · ') || '—', // H: Special Requests (+ booking type)
    message,                                                       // I: Message
    `${data.source || 'granciare.com'}${data.ref ? ' · ' + data.ref : ''}`, // J: Source + reference
  ];

  // RAW mode: values stored as literal strings — prevents Sheets from
  // interpreting phone numbers like "+91-9822367690" as formulas.
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Bookings!A:J',
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  });
}

// ── Email: send notification ──────────────────────────────────
async function sendNotificationEmail(data) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const checkInOut = data.checkIn && data.checkOut
    ? `${data.checkIn} → ${data.checkOut}`
    : 'Not specified';

  const guestDisplay = formatGuests(data.adults, data.children, undefined, data.infants);

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1e1c1a;">
      <div style="background: #1e1c1a; padding: 28px 32px;">
        <h1 style="color: #c9a96e; font-size: 22px; margin: 0; letter-spacing: 0.05em;">
          Granciare Estate
        </h1>
        <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 6px 0 0; letter-spacing: 0.1em; text-transform: uppercase;">
          New Booking Enquiry${data.ref ? ` · ${esc(data.ref)}` : ''}
        </p>
      </div>

      <div style="padding: 32px; background: #faf9f7; border: 1px solid #e8e0d4;">
        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4; color: #8a7f72; width: 160px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">Name</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4; font-weight: 600;">${esc(data.name)}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4; color: #8a7f72; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">Email</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4;"><a href="mailto:${esc(data.email)}" style="color: #c9a96e;">${esc(data.email)}</a></td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4; color: #8a7f72; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">Phone</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4;">${esc(formatPhone(data.phone))}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4; color: #8a7f72; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">Dates</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4;">${esc(checkInOut)}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4; color: #8a7f72; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">Guests</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4;">${guestDisplay}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4; color: #8a7f72; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">Booking</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4; font-weight: 600;">${esc(data.stayTypeLabel)}</td>
          </tr>
          ${data.specialRequests ? `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4; color: #8a7f72; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; vertical-align: top;">Special Requests</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4; line-height: 1.7; color: #4a4540;">${esc(data.specialRequests)}</td>
          </tr>` : ''}
          ${data.message ? `
          <tr>
            <td style="padding: 12px 0; color: #8a7f72; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; vertical-align: top;">Message</td>
            <td style="padding: 12px 0; line-height: 1.7; color: #4a4540; white-space: pre-wrap;">${esc(data.message)}</td>
          </tr>` : ''}
        </table>
      </div>

      <div style="padding: 20px 32px; background: #f0ebe3; border: 1px solid #e8e0d4; border-top: none;">
        <p style="margin: 0; font-size: 12px; color: #8a7f72; letter-spacing: 0.05em;">
          Received ${italianTimestamp()} (Italian time) · granciare.com
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from:    `"Granciare Estate" <${process.env.GMAIL_USER}>`,
    to:      process.env.NOTIFY_EMAIL,
    subject: `New enquiry from ${data.name}${data.ref ? ` (${data.ref})` : ''} | Granciare Estate`,
    html,
  });
}

// ── Email: acknowledgement to the guest ───────────────────────
async function sendGuestAcknowledgement(data) {
  const nights = Math.round((Date.parse(data.checkOut) - Date.parse(data.checkIn)) / 86400000);
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1e1c1a;">
      <div style="background: #1e1c1a; padding: 28px 32px;">
        <h1 style="color: #c9a96e; font-size: 22px; margin: 0; letter-spacing: 0.05em;">Granciare Estate</h1>
      </div>
      <div style="padding: 32px; background: #faf9f7; border: 1px solid #e8e0d4; font-size: 15px; line-height: 1.7;">
        <p>Dear ${esc(data.name)},</p>
        <p>Thank you for your enquiry. We have received your request and will reply personally within 24 hours to confirm availability and the next steps.</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 20px 0;">
          ${data.ref ? `<tr><td style="padding: 8px 0; color: #8a7f72; width: 140px;">Reference</td><td style="padding: 8px 0; font-weight: 600;">${esc(data.ref)}</td></tr>` : ''}
          <tr><td style="padding: 8px 0; color: #8a7f72;">Dates</td><td style="padding: 8px 0;">${esc(data.checkIn)} → ${esc(data.checkOut)} (${nights} nights)</td></tr>
          <tr><td style="padding: 8px 0; color: #8a7f72;">Guests</td><td style="padding: 8px 0;">${esc(formatGuests(data.adults, data.children, undefined, data.infants))}</td></tr>
          <tr><td style="padding: 8px 0; color: #8a7f72;">Booking</td><td style="padding: 8px 0;">${esc(data.stayTypeLabel)}</td></tr>
          ${data.specialRequests ? `<tr><td style="padding: 8px 0; color: #8a7f72;">Requests</td><td style="padding: 8px 0;">${esc(data.specialRequests)}</td></tr>` : ''}
        </table>
        <p>This is not yet a confirmed booking. If you have any questions, reply to this email or message us on WhatsApp: +39 352 0730769.</p>
        <p>Warm regards,<br/>The Granciare team</p>
      </div>
    </div>`;
  return sendMail(data.email, `We've received your enquiry${data.ref ? ` (${data.ref})` : ''} | Granciare Estate`, html);
}

// ── Main handler ──────────────────────────────────────────────
export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, phone, checkIn, checkOut, adults, children, infants, guests, specialRequests, message, source, bookingType } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (!String(name).trim()) {
    return res.status(400).json({ error: 'Please enter your name.' });
  }
  const phoneStr = String(phone || '').trim();
  const phoneDigits = phoneStr.replace(/\D/g, '');
  if (!phoneStr || /[^\d+\s().-]/.test(phoneStr) || phoneDigits.length < 6 || phoneDigits.length > 15) {
    return res.status(400).json({ error: 'Please enter a valid phone number.' });
  }
  const YMD = /^\d{4}-\d{2}-\d{2}$/;
  if (!YMD.test(checkIn || '') || !YMD.test(checkOut || '')) {
    return res.status(400).json({ error: 'Please select your check-in and check-out dates.' });
  }
  if (checkIn < BOOKINGS_OPEN_FROM) {
    return res.status(400).json({ error: 'Bookings are open from 1 April 2027. Please choose later dates.' });
  }
  const stayNights = Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / 86400000);
  if (!(stayNights >= 2 && stayNights <= 30)) {
    return res.status(400).json({ error: 'Stays must be between 2 and 30 nights.' });
  }
  // Adults and kids count towards capacity; infants (up to 3 years) do not
  const totalGuests = (parseInt(adults, 10) || 0) + (parseInt(children, 10) || 0);
  if ((parseInt(adults, 10) || 0) < 1 || totalGuests > 16) {
    return res.status(400).json({ error: 'Please choose between 1 and 16 guests, with at least one adult.' });
  }
  const infantCount = infants === undefined || infants === '' ? 0 : Number(infants);
  if (!Number.isInteger(infantCount) || infantCount < 0 || infantCount > 10) {
    return res.status(400).json({ error: 'Please choose between 0 and 10 infants.' });
  }

  // Partial ("one floor") bookings: only when switched on in Admin > Granciare Details,
  // and up to FLOOR_MAX adults + kids (infants not counted)
  const FLOOR_MAX = 6;
  let stayType = 'entire';
  if (bookingType === 'floor') {
    const sbCfg = getServerClient();
    const { data: cfgRow } = sbCfg
      ? await sbCfg.from('site_config').select('value').eq('key', 'allow_partial_bookings').maybeSingle()
      : { data: null };
    if (String(cfgRow?.value || '').toLowerCase() === 'yes') {
      if (totalGuests > FLOOR_MAX) {
        return res.status(400).json({ error: `Partial bookings can only accommodate up to ${FLOOR_MAX} adults and kids (infants not counted).` });
      }
      stayType = 'floor';
    }
  }
  const stayTypeLabel = stayType === 'floor' ? 'One floor' : 'Entire villa';

  const requiredEnv = ['GOOGLE_CLIENT_EMAIL', 'GOOGLE_PRIVATE_KEY', 'GOOGLE_SHEET_ID', 'GMAIL_USER', 'GMAIL_APP_PASSWORD', 'NOTIFY_EMAIL'];
  const missingEnv  = requiredEnv.filter(k => !process.env[k]);
  if (missingEnv.length > 0) {
    console.error('Missing env vars:', missingEnv.join(', '));
    return res.status(500).json({ error: `Server misconfiguration. Missing: ${missingEnv.join(', ')}` });
  }

  const data = {
    name:            String(name).trim().slice(0, 120),
    email:           String(email).trim().slice(0, 200),
    phone,
    checkIn,
    checkOut,
    adults,          // number (new format) or undefined (old format)
    children,        // number (new format) or undefined (old format)
    infants:         infantCount,
    guests,          // string (old format) or undefined (new format)
    specialRequests, // string (new format) or undefined (old format)
    message:         String(message || '').slice(0, 3000),
    source:          source  || 'granciare.com',
    stayType,
    stayTypeLabel,
  };

  // ── Write to Supabase stay_requests (what the admin panel reads) ──
  async function saveToSupabase() {
    const sb = getServerClient();
    if (!sb) {
      console.error('stay_requests insert skipped: Supabase env vars not set');
      return null;
    }
    const base = {
      name:             data.name,
      email:            data.email,
      phone:            data.phone || null,
      check_in:         data.checkIn  || null,
      check_out:        data.checkOut || null,
      adults:           parseInt(data.adults, 10) || 0,
      children:         parseInt(data.children, 10) || 0,
      infants:          data.infants || 0,
      special_requests: data.specialRequests || null,
      status:           'enquiry',
    };
    // Booking type goes in its own column; if that column doesn't exist yet, it is noted in special requests
    const withType = { ...base, booking_type: data.stayType };
    const typeInRequests = { ...base, special_requests: [data.stayType === 'floor' ? 'Booking: One floor' : '', data.specialRequests].filter(Boolean).join(' · ') || null };
    // If the infants column doesn't exist yet, the count is noted in special requests instead
    const tryInsert = async (row, noteCol) => {
      let res = await sb.from('stay_requests').insert({ ...row, [noteCol]: data.message || null }).select('id').single();
      if (res.error && /infants/i.test(res.error.message || '')) {
        const { infants: _i, ...rest } = row;
        const note = data.infants ? `Infants: ${data.infants}` : '';
        res = await sb.from('stay_requests').insert({ ...rest, special_requests: [note, rest.special_requests].filter(Boolean).join(' · ') || null, [noteCol]: data.message || null }).select('id').single();
      }
      return res;
    };
    // The guest's free-text note lives in `message` (older schema: `notes`).
    let { data: row, error: sbErr } = await tryInsert(withType, 'message');
    if (sbErr && /booking_type/i.test(sbErr.message || '')) ({ data: row, error: sbErr } = await tryInsert(typeInRequests, 'message'));
    if (sbErr && /message/i.test(sbErr.message || '')) {
      ({ data: row, error: sbErr } = await tryInsert(withType, 'notes'));
      if (sbErr && /booking_type/i.test(sbErr.message || '')) ({ data: row, error: sbErr } = await tryInsert(typeInRequests, 'notes'));
    }
    if (sbErr) {
      console.error('stay_requests insert error:', sbErr.message, hasServiceKey ? '' : '(no service key set — insert ran with the anon key)');
      return null;
    }
    // Reference shown to the guest and in admin — derived from the row id
    data.ref = 'GRC-' + String(row.id).replace(/-/g, '').slice(0, 6).toUpperCase();
    await notify(sb, {
      type: 'stay_request', title: 'New stay enquiry',
      body: `${data.ref} · ${data.name} · ${data.checkIn || '—'} → ${data.checkOut || '—'} · ${data.stayTypeLabel}`,
      related_id: row.id,
    });
    return data.ref;
  }

  try {
    // Store first so the reference can go into the emails and the sheet
    const ref = await saveToSupabase();
    const [, , guestEmailed] = await Promise.all([
      appendToSheet(data),
      sendNotificationEmail(data),
      sendGuestAcknowledgement(data).catch(e => { console.error('guest email failed:', e.message); return false; }),
    ]);
    return res.status(200).json({ success: true, stored: Boolean(ref), ref: ref || null, guestEmailed: Boolean(guestEmailed), message: 'Enquiry received. We will be in touch shortly.' });
  } catch (err) {
    console.error('Enquiry handler error:', err);
    return res.status(500).json({ error: `Internal error: ${err.message}` });
  }
}
