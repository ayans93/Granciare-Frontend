/**
 * POST /api/oil-order — Solivé order enquiry.
 * Validates bottle size and quantity on the server (3 L cap for 250/500 ml, max 10 × 5 L),
 * stores it in oil_requests, raises an admin notification, emails the estate inbox
 * and sends the customer an acknowledgement.
 */
import { getServerClient } from './_lib/supabase.js';
import { notify } from './_lib/notify.js';
import { sizeById, checkOrder, formatVolume } from './_lib/oilRules.js';
import { escapeHtml as esc, sendMail, sendToEstate, ESTATE_EMAIL } from './_lib/mail.js';
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

  // Emails: estate inbox + customer acknowledgement (an email failure never fails the order)
  const ref = data?.id ? 'SOL-' + String(data.id).replace(/-/g, '').slice(0, 6).toUpperCase() : '';
  const order = {
    ref, name: cleanName, email: base.email, phone: base.phone || '',
    size: size.label, qty, volume: formatVolume(qty * size.ml),
    address: String(address).trim().slice(0, 500), country: countryName(cc, 'en'), note,
  };
  const [estateEmailed, customerEmailed] = await Promise.all([
    sendToEstate(`New Solivé order from ${order.name}${ref ? ` (${ref})` : ''} | ${qty} × ${size.label}`, estateHtml(order), order.email).catch(() => false),
    sendMail(order.email, `We've received your Solivé order${ref ? ` (${ref})` : ''} | Granciare Estate`, customerHtml(order), ESTATE_EMAIL).catch(() => false),
  ]);
  return res.status(200).json({ success: true, ref: ref || null, estateEmailed, customerEmailed });
}

const row = (k, v) => v ? `<tr><td style="padding: 8px 0; color: #8a7f72; width: 150px; vertical-align: top;">${k}</td><td style="padding: 8px 0;">${esc(v).replace(/\n/g, '<br/>')}</td></tr>` : '';

function frame(inner) {
  return `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1e1c1a;">
      <div style="background: #1e1c1a; padding: 28px 32px;">
        <h1 style="color: #c9a96e; font-size: 22px; margin: 0; letter-spacing: 0.05em;">Granciare Estate · Solivé</h1>
      </div>
      <div style="padding: 32px; background: #faf9f7; border: 1px solid #e8e0d4; font-size: 15px; line-height: 1.7;">${inner}</div>
    </div>`;
}

function estateHtml(o) {
  return frame(`
    <p style="margin-top: 0;">A new Solivé order enquiry has arrived. It is in Admin &gt; Oil Requests.</p>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      ${row('Reference', o.ref)}${row('Name', o.name)}${row('Email', o.email)}${row('Phone', o.phone)}
      ${row('Order', `${o.qty} × ${o.size} (${o.volume})`)}${row('Delivery address', o.address)}${row('Country', o.country)}${row('Message', o.note)}
    </table>`);
}

function customerHtml(o) {
  return frame(`
    <p style="margin-top: 0;">Dear ${esc(o.name)},</p>
    <p>Thank you for your Solivé order. We have received it and will confirm the price, shipping and payment details personally within 24 hours.</p>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 20px 0;">
      ${row('Reference', o.ref)}${row('Order', `${o.qty} × ${o.size} (${o.volume})`)}${row('Delivery address', o.address)}${row('Country', o.country)}
    </table>
    <p>This is not yet a confirmed order. If you have any questions, reply to this email or message us on WhatsApp: +39 352 0730769.</p>
    <p>Warm regards,<br/>The Granciare team</p>`);
}
