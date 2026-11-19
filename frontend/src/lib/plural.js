// "4 nights" with the right word form for each language.
// Russian: 1/21/31 ночь · 2-4/22-24 ночи · 5-20/25-30 ночей. Czech: 1 noc · 2-4 noci · 5+ nocí.
export function nightsLabel(n, t, lang) {
  const k = Math.abs(Number(n)) || 0;
  let key = k === 1 ? 'booking.night' : 'booking.nights';
  if (lang === 'ru') {
    const d = k % 10, h = k % 100;
    key = d === 1 && h !== 11 ? 'booking.night' : d >= 2 && d <= 4 && (h < 12 || h > 14) ? 'booking.nightsFew' : 'booking.nights';
  } else if (lang === 'cs') {
    key = k === 1 ? 'booking.night' : k >= 2 && k <= 4 ? 'booking.nightsFew' : 'booking.nights';
  }
  return `${n} ${t(key)}`;
}
