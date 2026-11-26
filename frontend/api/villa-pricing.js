/**
 * GET /api/villa-pricing: nightly rates per accommodation type from Admin > Pricing, for the booking estimator.
 */
import { getServerClient } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const sb = getServerClient();
  if (!sb) return res.status(500).json({ error: 'Supabase not configured.' });
  const { data, error } = await sb.from('villa_pricing').select('*').order('date_from');
  if (error) {
    console.error('villa_pricing fetch error:', error.message);
    return res.status(500).json({ error: 'Could not load pricing.' });
  }
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  // Each range is for one accommodation type (ground / first / entire); rows without one are the entire villa
  const ranges = (data || [])
    .filter(r => r.date_from && r.date_to && Number(r.price_per_night) > 0)
    .map(r => ({ label: r.label, date_from: r.date_from, date_to: r.date_to, price_per_night: r.price_per_night, accommodation: r.accommodation || 'entire' }));
  return res.status(200).json({ ranges });
}
