/**
 * PricingEstimator
 *
 * Displays an indicative price range based on:
 *   - Check-in / check-out dates (season detection, multi-season handling)
 *   - Number of guests (scales estimate within the seasonal range)
 *
 * Seasons:
 *   High     : June, July, August           → €8,000–€9,500 / week
 *   Moderate : April, May, September, Oct   → €6,000–€7,000 / week
 *   Festive  : Dec 20 – Jan 5               → €6,500–€8,000 / week
 *   Low      : All other months             → €5,000–€6,000 / week
 */

import './PricingEstimator.css';

// ── Season rates (per week) ────────────────────────────────────
const RATES = {
  high:     { min: 8000, max: 9500,  label: 'High Season'     },
  moderate: { min: 6000, max: 7000,  label: 'Moderate Season' },
  festive:  { min: 6500, max: 8000,  label: 'Festive Period'  },
  low:      { min: 5000, max: 6000,  label: 'Low Season'      },
};

function getSeason(date) {
  const m = date.getMonth() + 1; // 1-12
  const d = date.getDate();
  if ((m === 12 && d >= 20) || (m === 1 && d <= 5)) return 'festive';
  if (m === 6 || m === 7 || m === 8)                  return 'high';
  if (m === 4 || m === 5 || m === 9 || m === 10)       return 'moderate';
  return 'low';
}

function fmt(n) {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(n);
}

function calculateEstimate(checkIn, checkOut, guests) {
  const inDate  = new Date(checkIn);
  const outDate = new Date(checkOut);
  const nights  = Math.round((outDate - inDate) / 86_400_000);
  if (nights <= 0) return null;

  // Walk day-by-day to handle multi-season stays correctly
  let totalMin = 0;
  let totalMax = 0;
  const seasonNights = {};

  const cursor = new Date(inDate);
  for (let i = 0; i < nights; i++) {
    const s = getSeason(cursor);
    totalMin += RATES[s].min / 7;
    totalMax += RATES[s].max / 7;
    seasonNights[s] = (seasonNights[s] || 0) + 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  // Scale estimate within range based on guest count (1–14)
  const guestPct = Math.min(Math.max((guests - 1) / 13, 0), 1);
  const estimate = Math.round(totalMin + (totalMax - totalMin) * guestPct);

  // Dominant season label (most nights)
  const dominantSeason = Object.entries(seasonNights)
    .sort((a, b) => b[1] - a[1])[0][0];

  const weeks = (nights / 7).toFixed(1).replace(/\.0$/, '');

  return {
    nights,
    weeks,
    totalMin: Math.round(totalMin),
    totalMax: Math.round(totalMax),
    estimate,
    seasonNights,
    dominantSeason,
    isMultiSeason: Object.keys(seasonNights).length > 1,
  };
}

export default function PricingEstimator({ checkIn, checkOut, guests = 2 }) {
  if (!checkIn || !checkOut) return null;

  const result = calculateEstimate(checkIn, checkOut, Number(guests));
  if (!result) return null;

  const { nights, weeks, totalMin, totalMax, estimate, seasonNights, dominantSeason, isMultiSeason } = result;

  return (
    <div className="pe">
      <div className="pe__header">
        <span className="pe__label">Estimated Stay Cost</span>
        {isMultiSeason && (
          <span className="pe__badge">Multi-season</span>
        )}
      </div>

      {/* Price range */}
      <div className="pe__range">
        <div className="pe__range-row">
          <span className="pe__range-label">Price per night</span>
          <span className="pe__range-value">{fmt(Math.round(totalMin / nights))} – {fmt(Math.round(totalMax / nights))}</span>
        </div>
        <div className="pe__range-row pe__range-row--estimate">
          <span className="pe__range-label">Estimated for {guests} {Number(guests) === 1 ? 'guest' : 'guests'}</span>
          <span className="pe__range-value pe__range-value--highlight">{fmt(estimate)}</span>
        </div>
      </div>

      <p className="pe__disclaimer">
        Indicative pricing only · Exclusive use of the full estate · Final rates confirmed on enquiry
      </p>
    </div>
  );
}
