// What a guest can book. `max` is the group size each option is best suited for
// (shown as guidance; guests choose for themselves).
export const ACCOMMODATIONS = [
  { id: 'ground', short: 'G',          label: 'Ground floor', max: 6 },
  { id: 'first',  short: '1F',         label: 'First floor',  max: 10 },
  { id: 'entire', short: 'Full villa', label: 'Entire villa', max: 16 },
];
export const ACCOMMODATION_IDS = ACCOMMODATIONS.map(a => a.id);
export const accommodationById = id => ACCOMMODATIONS.find(a => a.id === id) || ACCOMMODATIONS[2];

// Older rows: no value means the whole villa; 'floor' was the earlier single-floor option.
export const accommodationOf = row => row?.accommodation || row?.booking_type || 'entire';

// Two confirmed stays on the same nights clash unless they are on different floors.
export function accommodationsClash(a, b) {
  if (a === 'entire' || b === 'entire' || a === 'floor' || b === 'floor') return true;
  return a === b;
}
