/**
 * POST /api/admin-login
 * Validates admin email + password and sets a session cookie.
 */

const ALLOWED_EMAILS = [
  'ayan@dviu.in',
  'gaurav@drishyamfilms.com',
  'info@agriturismocolleverde.net',
  'apurva@drishyamfilms.com',
  'mmundra@gmail.com',
  'mundradisha13@gmail.com',
];

const ADMIN_PASSWORD = 'Granciare@2026';

// Shared session token — must match the value checked in middleware.js
export const SESSION_TOKEN = 'grc-adm-2026-x7k9m4p2';

// 30 days
const MAX_AGE = 60 * 60 * 24 * 30;

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email = '', password = '' } = req.body || {};

  const emailNorm = email.toLowerCase().trim();
  const isAllowed = ALLOWED_EMAILS.map(e => e.toLowerCase()).includes(emailNorm);
  const isCorrect = password === ADMIN_PASSWORD;

  if (!isAllowed || !isCorrect) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.setHeader(
    'Set-Cookie',
    `granciare_admin=${SESSION_TOKEN}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}`
  );
  return res.status(200).json({ ok: true });
}
