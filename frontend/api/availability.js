/**
 * GET /api/availability?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
 *
 * Reads all bookings from Google Sheet and checks if the requested
 * dates conflict with any existing confirmed booking.
 *
 * Two date ranges overlap if: requestedCheckIn < existingCheckOut
 *                         AND existingCheckIn < requestedCheckOut
 */

import { google } from 'googleapis';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function getBookings() {
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
    range: 'Enquiries!A2:I',   // skip header row, read all data rows
  });

  return response.data.values || [];
}

function datesOverlap(reqIn, reqOut, existIn, existOut) {
  // Both ranges must be valid dates
  if (!reqIn || !reqOut || !existIn || !existOut) return false;
  const rIn  = new Date(reqIn);
  const rOut = new Date(reqOut);
  const eIn  = new Date(existIn);
  const eOut = new Date(existOut);
  if (isNaN(rIn) || isNaN(rOut) || isNaN(eIn) || isNaN(eOut)) return false;
  // Overlap condition
  return rIn < eOut && eIn < rOut;
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { checkIn, checkOut } = req.query;

  if (!checkIn || !checkOut) {
    return res.status(400).json({ error: 'checkIn and checkOut are required.' });
  }

  if (new Date(checkIn) >= new Date(checkOut)) {
    return res.status(400).json({ error: 'Check-out must be after check-in.' });
  }

  try {
    const rows = await getBookings();

    // Sheet columns: [0]Timestamp [1]Name [2]Email [3]Phone [4]CheckIn [5]CheckOut [6]Guests [7]Message [8]Source
    const conflict = rows.find(row => {
      const existIn  = row[4]; // e.g. "2026-06-04"
      const existOut = row[5]; // e.g. "2026-06-16"
      return datesOverlap(checkIn, checkOut, existIn, existOut);
    });

    if (conflict) {
      return res.status(200).json({
        available: false,
        message: 'Sorry, the estate is already booked for those dates. Please choose different dates.',
      });
    }

    return res.status(200).json({
      available: true,
      message: 'Those dates are available.',
    });

  } catch (err) {
    console.error('Availability check error:', err);
    return res.status(500).json({ error: 'Could not check availability. Please contact us directly.' });
  }
}
