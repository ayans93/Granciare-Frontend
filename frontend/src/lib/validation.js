// Shared form checks used by the booking and Solivé forms.

/** Accepts +, spaces, dashes, dots and brackets; needs 6–15 digits and no letters. */
export function isValidPhone(value) {
  const v = String(value || '').trim();
  if (!v || /[^\d+\s().-]/.test(v)) return false;
  const digits = v.replace(/\D/g, '');
  return digits.length >= 6 && digits.length <= 15;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
