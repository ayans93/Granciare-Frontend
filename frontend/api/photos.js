/**
 * GET /api/photos
 * Public list of photos managed in Admin > Photos, so the website can show
 * new uploads, hide deleted photos and lead each section with its featured photo.
 */
import { getServerClient } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const sb = getServerClient();
  if (!sb) return res.status(500).json({ error: 'Supabase not configured.' });

  const { data, error } = await sb
    .from('photos')
    .select('storage_path, public_url, category, alt_text, is_featured, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('photos fetch error:', error.message);
    return res.status(500).json({ error: 'Could not load photos.' });
  }

  const photos = (data || [])
    .filter(p => p.public_url)
    .map(p => ({ path: p.storage_path, url: p.public_url, category: p.category, alt: p.alt_text || '', featured: !!p.is_featured }));

  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
  return res.status(200).json({ photos });
}
