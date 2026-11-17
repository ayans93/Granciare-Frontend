/**
 * POST /api/lead — "Register interest" (Poderetto) and harvest sign-up.
 * Emails the estate inbox, stores the lead in the `leads` table (if it exists)
 * and raises an admin notification. Succeeds if the lead was emailed or stored.
 */
import { getServerClient } from './_lib/supabase.js';
import { notify } from './_lib/notify.js';
import { sendToEstate, escapeHtml } from './_lib/mail.js';

const KINDS = { poderetto: 'Poderetto — registered interest', harvest: 'Solivé 2026 harvest sign-up' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { kind, name, email } = req.body || {};
  if (!KINDS[kind]) return res.status(400).json({ error: 'Unknown form.' });
  const cleanEmail = String(email || '').trim().slice(0, 200);
  if (!EMAIL_RE.test(cleanEmail)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  const cleanName = String(name || '').trim().slice(0, 200) || null;

  let stored = false;
  const sb = getServerClient();
  if (sb) {
    const { error } = await sb.from('leads').insert({ kind, name: cleanName, email: cleanEmail });
    if (error) console.error('leads insert error:', error.message);
    else stored = true;
    await notify(sb, { type: 'lead', title: `New lead: ${KINDS[kind]}`, body: `${cleanName ? cleanName + ' · ' : ''}${cleanEmail}` });
  }

  const emailed = await sendToEstate(
    `${KINDS[kind]}: ${cleanName || cleanEmail}`,
    `<div style="font-family:Arial,sans-serif;font-size:14px;color:#2c2825">
      <p><strong>${escapeHtml(KINDS[kind])}</strong></p>
      ${cleanName ? `<p>Name: ${escapeHtml(cleanName)}</p>` : ''}
      <p>Email: ${escapeHtml(cleanEmail)}</p>
      <p style="color:#8a7f72;font-size:12px">Sent from granciare.com</p>
    </div>`,
  );

  if (!stored && !emailed) return res.status(500).json({ error: 'Sorry, we could not save your details. Please try again.' });
  return res.status(200).json({ success: true });
}
