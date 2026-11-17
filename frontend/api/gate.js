/**
 * POST /api/gate — checks private-preview credentials on the server,
 * so the allowed emails and password are no longer shipped in the website's JavaScript.
 * Optional override: GATE_USERS="email1:password1,email2:password2".
 */
const DEFAULT_PASSWORD = 'Granciare@2026';
const DEFAULT_USERS = [
  'info@granciare.com',
  'info@agriturismocolleverde.net',
  'gaurav@drishyamfilms.com',
  'ayan@dviu.in',
  'mmundra@gmail.com',
  'mundradisha13@gmail.com',
  'armoryan@gmail.com',
].map(email => ({ email, password: DEFAULT_PASSWORD }));

function users() {
  const raw = process.env.GATE_USERS;
  if (!raw) return DEFAULT_USERS;
  return raw.split(',').map(p => {
    const i = p.indexOf(':');
    return { email: p.slice(0, i).trim(), password: p.slice(i + 1) };
  }).filter(u => u.email && u.password);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, password } = req.body || {};
  const normalised = String(email || '').trim().toLowerCase();
  const match = users().find(u => u.email.toLowerCase() === normalised);
  // small fixed delay slows down guessing
  await new Promise(r => setTimeout(r, 400));
  if (!match) return res.status(401).json({ error: 'No account found for that email address.' });
  if (match.password !== String(password || '')) return res.status(401).json({ error: 'Incorrect password. Please try again.' });
  return res.status(200).json({ ok: true });
}
