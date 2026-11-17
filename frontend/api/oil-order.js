/**
 * POST /api/oil-order — Solivé order enquiry.
 * Validates on the server, stores it in oil_requests and raises an admin notification.
 */
import { getServerClient } from './_lib/supabase.js';
import { notify } from './_lib/notify.js';

const MIN_BOTTLES = 5;
const MAX_BOTTLES = 9999;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { name, email, phone, address, message, quantity } = req.body || {};

  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < MIN_BOTTLES || qty > MAX_BOTTLES) {
    return res.status(400).json({ error: `Please order between ${MIN_BOTTLES} and ${MAX_BOTTLES} bottles.` });
  }
  if (!String(name || '').trim()) return res.status(400).json({ error: 'Please enter your name.' });
  if (!EMAIL_RE.test(String(email || '').trim())) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!String(address || '').trim()) return res.status(400).json({ error: 'Please enter a delivery address.' });

  const sb = getServerClient();
  if (!sb) return res.status(500).json({ error: 'Ordering is temporarily unavailable. Please try WhatsApp.' });

  const cleanName = String(name).trim().slice(0, 200);
  const note = String(message || '').trim().slice(0, 3000);
  const { data, error } = await sb.from('oil_requests').insert({
    name: cleanName,
    email: String(email).trim().slice(0, 200),
    phone: String(phone || '').trim().slice(0, 50) || null,
    quantity: qty,
    message: `Delivery address: ${String(address).trim().slice(0, 500)}${note ? '\n\n' + note : ''}`,
    status: 'enquiry',
  }).select('id').single();

  if (error) {
    console.error('oil_requests insert error:', error.message);
    return res.status(500).json({ error: 'We could not record your order. Please try again or contact us on WhatsApp.' });
  }

  await notify(sb, { type: 'oil_request', title: 'New oil order', body: `${cleanName} — ${qty} bottles`, related_id: data?.id });
  return res.status(200).json({ success: true });
}
