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
function formatGuests(adults, children, guestsStr) {
  // New format: separate adult + child counts
  const a = parseInt(adults,   10);
  const c = parseInt(children, 10);
  if (!isNaN(a) && a >= 0) {
    const safeC = isNaN(c) ? 0 : c;
    const total = a + safeC;
    if (total === 0) return '—';
    return `${total} (${a}A, ${safeC}C)`;
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
    formatGuests(data.adults, data.children, data.guests),         // G: Guests
    specialRequests,                                               // H: Special Requests
    message,                                                       // I: Message
    data.source   || 'granciare.com',                              // J: Source
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

  const guestDisplay = formatGuests(data.adults, data.children);

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1e1c1a;">
      <div style="background: #1e1c1a; padding: 28px 32px;">
        <h1 style="color: #c9a96e; font-size: 22px; margin: 0; letter-spacing: 0.05em;">
          Granciare Estate
        </h1>
        <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 6px 0 0; letter-spacing: 0.1em; text-transform: uppercase;">
          New Booking Enquiry
        </p>
      </div>

      <div style="padding: 32px; background: #faf9f7; border: 1px solid #e8e0d4;">
        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4; color: #8a7f72; width: 160px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">Name</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4; font-weight: 600;">${data.name}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4; color: #8a7f72; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">Email</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4;"><a href="mailto:${data.email}" style="color: #c9a96e;">${data.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4; color: #8a7f72; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">Phone</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4;">${formatPhone(data.phone)}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4; color: #8a7f72; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">Dates</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4;">${checkInOut}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4; color: #8a7f72; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">Guests</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4;">${guestDisplay}</td>
          </tr>
          ${data.specialRequests ? `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4; color: #8a7f72; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; vertical-align: top;">Special Requests</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4; line-height: 1.7; color: #4a4540;">${data.specialRequests}</td>
          </tr>` : ''}
          ${data.message ? `
          <tr>
            <td style="padding: 12px 0; color: #8a7f72; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; vertical-align: top;">Message</td>
            <td style="padding: 12px 0; line-height: 1.7; color: #4a4540;">${data.message}</td>
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
    subject: `New enquiry from ${data.name} — Granciare Estate`,
    html,
  });
}

// ── Main handler ──────────────────────────────────────────────
export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, phone, checkIn, checkOut, adults, children, guests, specialRequests, message, source } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const requiredEnv = ['GOOGLE_CLIENT_EMAIL', 'GOOGLE_PRIVATE_KEY', 'GOOGLE_SHEET_ID', 'GMAIL_USER', 'GMAIL_APP_PASSWORD', 'NOTIFY_EMAIL'];
  const missingEnv  = requiredEnv.filter(k => !process.env[k]);
  if (missingEnv.length > 0) {
    console.error('Missing env vars:', missingEnv.join(', '));
    return res.status(500).json({ error: `Server misconfiguration. Missing: ${missingEnv.join(', ')}` });
  }

  const data = {
    name:            name.trim(),
    email:           email.trim(),
    phone,
    checkIn,
    checkOut,
    adults,          // number (new format) or undefined (old format)
    children,        // number (new format) or undefined (old format)
    guests,          // string (old format) or undefined (new format)
    specialRequests, // string (new format) or undefined (old format)
    message:         message || '',
    source:          source  || 'granciare.com',
  };

  try {
    await Promise.all([
      appendToSheet(data),
      sendNotificationEmail(data),
    ]);
    return res.status(200).json({ success: true, message: 'Enquiry received. We will be in touch shortly.' });
  } catch (err) {
    console.error('Enquiry handler error:', err);
    return res.status(500).json({ error: `Internal error: ${err.message}` });
  }
}
