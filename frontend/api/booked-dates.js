/**
 * GET /api/booked-dates
 *
 * Returns the date ranges the public calendar must grey out:
 *   - stays marked "confirmed" in the admin panel (Supabase stay_requests)
 *   - periods blocked by the estate (STATIC_BLOCKED)
 *
 * Enquiries that have not been confirmed do NOT block dates.
 *
 * Response: { bookedRanges: [{ checkIn: "YYYY-MM-DD", checkOut: "YYYY-MM-DD" }, ...] }
 */

import { getServerClient } from './_lib/supabase.js';
import { BOOKINGS_OPEN_FROM } from './_lib/bookingWindow.js';

// Dates blocked by the estate itself
// Everything before BOOKINGS_OPEN_FROM is closed (check-out on that day is not needed:
// the first possible check-in is BOOKINGS_OPEN_FROM itself).
const STATIC_BLOCKED = [
  { checkIn: '2026-10-01', checkOut: BOOKINGS_OPEN_FROM },
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

  const sb = getServerClient();
  if (!sb) return res.status(500).json({ error: 'Could not fetch availability.' });

  const { data, error } = await sb
    .from('stay_requests')
    .select('*')
    .eq('status', 'confirmed');

  if (error) {
    console.error('Booked dates error:', error.message);
    return res.status(500).json({ error: 'Could not fetch availability.' });
  }

  const bookedRanges = (data || [])
    .filter(r => r.check_in && r.check_out)
    .map(r => ({ checkIn: r.check_in, checkOut: r.check_out, accommodation: r.booking_type || 'entire' }));

  // Always fresh: a confirmation in admin should show on the next page load
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ bookedRanges: [...STATIC_BLOCKED, ...bookedRanges] });
}
