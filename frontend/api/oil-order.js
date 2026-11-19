/**
 * POST /api/oil-order — Solivé order enquiry.
 * Validates bottle size and quantity on the server (3 L cap for 250/500 ml, max 10 × 5 L),
 * stores it in oil_requests and raises an admin notification.
 */
import { getServerClient } from './_lib/supabase.js';
import { notify } from './_lib/notify.js';
import { sizeById, checkOrder } from './_lib/oilRules.js';
import { COUNTRY_CODES, FIVE_L_SERVICEABLE, countryName } from './_lib/countries.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { name, email, phone, address, message, quantity, bottleSize, country } = req.body || {};

  const size = sizeById(bottleSize || '500ml');
  const qty = Number(quantity);
  const issue = checkOrder(size?.id, qty);
  if (issue === 'size') return res.status(400).json({ error: 'Please choose a bottle size.' });
  if (issue === 'maxVolume') return res.status(400).json({ error: `250 ml and 500 ml orders are limited to 3 L in total (up to ${size.maxQty} bottles).` });
  if (issue === 'max5l') return res.status(400).json({ error: `5 L bottles are limited to ${size.maxQty} per order.` });
  if (issue) return res.status(400).json({ error: `Please enter a whole number of bottles from 1 to ${size.maxQty}.` });
  if (!String(name || '').trim()) return res.status(400).json({ error: 'Please enter your name.' });
  if (!EMAIL_RE.test(String(email || '').trim())) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!String(address || '').trim()) return res.status(400).json({ error: 'Please enter a delivery address.' });
  const cc = String(country || '').toUpperCase();
  if (!COUNTRY_CODES.includes(cc)) return res.status(400).json({ error: 'Please choose your country.' });
  if (size.shippingNotice && !FIVE_L_SERVICEABLE(cc)) {
    return res.status(400).json({ error: 'This address is not serviceable for 5 L bottles. 5 L bottles ship only to Europe and the USA.' });
  }

  const sb = getServerClient();
  if (!sb) return res.status(500).json({ error: 'Ordering is temporarily unavailable. Please try WhatsApp.' });

  const cleanName = String(name).trim().slice(0, 120);
  const note = String(message || '').trim().slice(0, 3000);
  const base = {
    name: cleanName,
    email: String(email).trim().slice(0, 200),
    phone: String(phone || '').trim().slice(0, 50) || null,
    quantity: qty,
    status: 'enquiry',
  };
  const msg = `Delivery address: ${String(address).trim().slice(0, 500)}\nCountry: ${countryName(cc, 'en')}${note ? '\n\n' + note : ''}`;

  // Bottle size goes in its own column; if that column doesn't exist yet, it is written into the message
  let { data, error } = await sb.from('oil_requests').insert({ ...base, bottle_size: size.id, message: msg }).select('id').single();
  if (error && /bottle_size/i.test(error.message || '')) {
    ({ data, error } = await sb.from('oil_requests').insert({ ...base, message: `Bottle size: ${size.label}\n${msg}` }).select('id').single());
  }
  if (error) {
    console.error('oil_requests insert error:', error.message);
    return res.status(500).json({ error: 'We could not record your order. Please try again or contact us on WhatsApp.' });
  }

  await notify(sb, { type: 'oil_request', title: 'New oil order', body: `${cleanName} · ${qty} × ${size.label}`, related_id: data?.id });
  return res.status(200).json({ success: true });
}
