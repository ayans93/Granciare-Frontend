/**
 * GET /api/check-access
 *
 * Returns { allowed: bool, ip: string } based on IP_WHITELIST env var.
 * Called by the inline script in index.html before the React app loads.
 *
 * - If IP_WHITELIST is empty/unset → allow everyone (safe default)
 * - If IP_WHITELIST has IPs → only those IPs are allowed
 */
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const ip =
    req.headers['x-vercel-ip-address'] ||
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    '';

  const whitelist = (process.env.IP_WHITELIST || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allowed = whitelist.length === 0 || whitelist.includes(ip);

  return res.status(200).json({ allowed, ip });
}
