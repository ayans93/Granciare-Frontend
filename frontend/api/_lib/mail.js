import nodemailer from 'nodemailer';

export function escapeHtml(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Sends an email from the estate Gmail account. Returns true on success. */
export async function sendMail(to, subject, html, replyTo) {
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !to) {
    console.error('email skipped: GMAIL_USER / GMAIL_APP_PASSWORD or recipient missing');
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD } });
    await transporter.sendMail({ from: `"Granciare Estate" <${GMAIL_USER}>`, to, subject, html, ...(replyTo ? { replyTo } : {}) });
    return true;
  } catch (e) {
    console.error('email send failed:', e.message);
    return false;
  }
}

/** Sends an email to the estate inbox (NOTIFY_EMAIL). */
export function sendToEstate(subject, html) {
  return sendMail(process.env.NOTIFY_EMAIL, subject, html);
}
