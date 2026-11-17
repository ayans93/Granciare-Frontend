/**
 * GET /api/villa-pricing — nightly rates from Admin > Pricing, for the booking estimator.
 */
import { getServerClient } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const sb = getServerClient();
  if (!sb) return res.status(500).json({ error: 'Supabase not configured.' });
  const { data, error } = await sb.from('villa_pricing').select('label, date_from, date_to, price_per_night').order('date_from');
  if (error) {
    console.error('villa_pricing fetch error:', error.message);
    return res.status(500).json({ error: 'Could not load pricing.' });
  }
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  return res.status(200).json({ ranges: (data || []).filter(r => r.date_from && r.date_to && Number(r.price_per_night) > 0) });
}
