/**
 * POST /api/enquiry
 *
 * Receives a booking enquiry from the contact form.
 * 1. Validates required fields
 * 2. Appends a row to Google Sheets
 * 3. Sends an email notification to admin@dviu.in
 *
 * Environment variables required (set in Vercel dashboard):
 *   GOOGLE_CLIENT_EMAIL      — service account email
 *   GOOGLE_PRIVATE_KEY       — service account private key (include \n line breaks)
 *   GOOGLE_SHEET_ID          — the spreadsheet ID from the sheet URL
 *   GMAIL_USER               — sender Gmail address (admin@dviu.in)
 *   GMAIL_APP_PASSWORD        — 16-character Gmail App Password
 *   NOTIFY_EMAIL             — recipient email (admin@dviu.in)
 */

import { google } from 'googleapis';
import nodemailer from 'nodemailer';

// ── CORS helper ───────────────────────────────────────────────
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://granciare.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── Google Sheets: append one row ────────────────────────────
async function appendToSheet(data) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const row = [
    new Date().toLocaleString('en-GB', { timeZone: 'Europe/Rome' }), // Timestamp (Italy time)
    data.name,
    data.email,
    data.phone || '—',
    data.checkIn || '—',
    data.checkOut || '—',
    data.guests || '—',
    data.message || '—',
    data.source || 'granciare.com',
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Enquiries!A:I',
    valueInputOption: 'USER_ENTERED',
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
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4; color: #8a7f72; width: 140px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">Name</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4; font-weight: 600;">${data.name}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4; color: #8a7f72; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">Email</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4;"><a href="mailto:${data.email}" style="color: #c9a96e;">${data.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4; color: #8a7f72; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">Phone</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4;">${data.phone || '—'}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4; color: #8a7f72; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">Dates</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4;">${checkInOut}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4; color: #8a7f72; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">Guests</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4;">${data.guests || '—'}</td>
          </tr>
          ${data.message ? `
          <tr>
            <td style="padding: 12px 0; color: #8a7f72; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; vertical-align: top;">Message</td>
            <td style="padding: 12px 0; line-height: 1.7; color: #4a4540;">${data.message}</td>
          </tr>` : ''}
        </table>
      </div>

      <div style="padding: 20px 32px; background: #f0ebe3; border: 1px solid #e8e0d4; border-top: none;">
        <p style="margin: 0; font-size: 12px; color: #8a7f72; letter-spacing: 0.05em;">
          Received ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/Rome' })} (Italy time) · granciare.com
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Granciare Estate" <${process.env.GMAIL_USER}>`,
    to: process.env.NOTIFY_EMAIL,
    subject: `New enquiry from ${data.name} — Granciare Estate`,
    html,
  });
}

// ── Main handler ──────────────────────────────────────────────
export default async function handler(req, res) {
  setCors(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Validate required fields
  const { name, email, phone, checkIn, checkOut, guests, message, source } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const data = { name: name.trim(), email: email.trim(), phone, checkIn, checkOut, guests, message, source };

  try {
    // Run Sheets + email in parallel for speed
    await Promise.all([
      appendToSheet(data),
      sendNotificationEmail(data),
    ]);

    return res.status(200).json({ success: true, message: 'Enquiry received. We will be in touch shortly.' });
  } catch (err) {
    console.error('Enquiry handler error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try WhatsApp or email us directly.' });
  }
}
