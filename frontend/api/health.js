/**
 * GET /api/health
 * Simple health check — confirms the serverless API is running.
 * Use this to verify the backend deployed correctly on Vercel.
 */
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const ip =
    req.headers['x-vercel-ip-address'] ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    'unknown';
  res.status(200).json({
    status: 'ok',
    service: 'Granciare API',
    timestamp: new Date().toISOString(),
    your_ip: ip,
  });
}
