import nodemailer from 'nodemailer';

export function escapeHtml(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Sends an email to the estate inbox (NOTIFY_EMAIL). Returns true on success. */
export async function sendToEstate(subject, html) {
  const { GMAIL_USER, GMAIL_APP_PASSWORD, NOTIFY_EMAIL } = process.env;
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !NOTIFY_EMAIL) {
    console.error('email skipped: GMAIL_USER / GMAIL_APP_PASSWORD / NOTIFY_EMAIL not set');
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD } });
    await transporter.sendMail({ from: `"Granciare Estate" <${GMAIL_USER}>`, to: NOTIFY_EMAIL, subject, html });
    return true;
  } catch (e) {
    console.error('email send failed:', e.message);
    return false;
  }
}
