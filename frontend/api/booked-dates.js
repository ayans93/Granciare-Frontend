/**
 * GET /api/booked-dates
 *
 * Returns all booked date ranges from Google Sheet so the
 * frontend calendar can grey out unavailable dates.
 *
 * Response: { bookedRanges: [{ checkIn: "YYYY-MM-DD", checkOut: "YYYY-MM-DD" }, ...] }
 */

import { google } from 'googleapis';

// Dates blocked by the estate (not from Google Sheet)
const STATIC_BLOCKED = [
  { checkIn: '2026-10-01', checkOut: '2026-12-01' }, // Oct & Nov unavailable
];

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Bookings!E2:F', // columns E (Check-in) and F (Check-out), skip header
    });

    const rows = response.data.values || [];

    const bookedRanges = rows
      .filter(row => row[0] && row[1]) // must have both check-in and check-out
      .map(row => ({ checkIn: row[0], checkOut: row[1] }));

    return res.status(200).json({ bookedRanges: [...STATIC_BLOCKED, ...bookedRanges] });
  } catch (err) {
    console.error('Booked dates error:', err);
    return res.status(500).json({ error: 'Could not fetch availability.' });
  }
}
