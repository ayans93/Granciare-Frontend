// Solivé order rules, shared by the website (src/lib/oilRules.js re-exports this) and the order API.
// 250 ml and 500 ml orders are capped at 3 L in total; 5 L bottles are sold up to 10 per order.
export const BOTTLE_SIZES = [
  { id: '250ml', label: '250 ml', ml: 250,  presets: [6, 12], maxQty: 12, priceKey: 'oil_price_250ml' },
  { id: '500ml', label: '500 ml', ml: 500,  presets: [6],     maxQty: 6,  priceKey: 'oil_price_500ml' },
  { id: '5l',    label: '5 L',    ml: 5000, presets: [],      maxQty: 10, priceKey: 'oil_price_5l', shippingNotice: true },
];
export const MAX_SMALL_VOLUME_ML = 3000;

export const sizeById = id => BOTTLE_SIZES.find(s => s.id === id) || null;

/** '' when the order is allowed, otherwise a reason code */
export function checkOrder(sizeId, qty) {
  const size = sizeById(sizeId);
  if (!size) return 'size';
  if (!Number.isInteger(qty) || qty < 1) return 'qty';
  if (qty > size.maxQty) return size.id === '5l' ? 'max5l' : 'maxVolume';
  return '';
}

export function formatVolume(ml) {
  return ml >= 1000 ? `${(ml / 1000).toLocaleString('en', { maximumFractionDigits: 2 })} L` : `${ml} ml`;
}
