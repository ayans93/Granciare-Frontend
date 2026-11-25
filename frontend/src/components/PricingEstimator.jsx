/**
 * PricingEstimator
 *
 * Indicative price for the selected dates, using the nightly rates set in
 * Admin > Pricing > Villa Pricing (exclusive use of the whole estate, so the
 * guest count does not change the price). Nights with no published rate are
 * quoted on enquiry.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { nightsLabel } from '../lib/plural';
import './PricingEstimator.css';

let cache;
let pending;
function loadRanges() {
  if (cache !== undefined) return Promise.resolve(cache);
  if (!pending) {
    pending = fetch('/api/villa-pricing')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { cache = Array.isArray(d?.ranges) ? d.ranges : []; return cache; })
      .catch(() => { cache = []; return cache; });
  }
  return pending;
}

function fmt(n) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

// Every night of the stay as YYYY-MM-DD (check-out day excluded), built in UTC to avoid DST shifts
function nightsBetween(checkIn, checkOut) {
  const [y1, m1, d1] = checkIn.split('-').map(Number);
  const [y2, m2, d2] = checkOut.split('-').map(Number);
  const start = Date.UTC(y1, m1 - 1, d1);
  const end = Date.UTC(y2, m2 - 1, d2);
  const out = [];
  for (let t = start; t < end; t += 86_400_000) out.push(new Date(t).toISOString().slice(0, 10));
  return out;
}

export function estimateStay(checkIn, checkOut, ranges) {
  const nights = nightsBetween(checkIn, checkOut);
  if (!nights.length) return null;
  const perNight = nights.map(day => {
    const r = ranges.find(x => x.date_from <= day && day <= x.date_to);
    return r ? { day, price: Number(r.price_per_night), label: r.label } : { day, price: null };
  });
  const missing = perNight.filter(n => n.price == null).length;
  const prices = perNight.filter(n => n.price != null).map(n => n.price);
  const labels = [...new Set(perNight.filter(n => n.label).map(n => n.label))];
  return {
    nights: nights.length,
    complete: missing === 0,
    total: prices.reduce((a, b) => a + b, 0),
    min: prices.length ? Math.min(...prices) : null,
    max: prices.length ? Math.max(...prices) : null,
    labels,
  };
}

export default function PricingEstimator({ checkIn, checkOut, floor = false }) {
  const { t, lang } = useTranslation();
  const [ranges, setRanges] = useState(cache ?? null);
  useEffect(() => {
    let alive = true;
    loadRanges().then(r => { if (alive) setRanges(r); });
    return () => { alive = false; };
  }, []);

  if (!checkIn || !checkOut || !ranges) return null;
  const est = estimateStay(checkIn, checkOut, ranges);
  if (!est) return null;

  const { nights, complete, labels } = est;
  // Admin rates are for the whole villa; a single floor is half the villa rate
  const share = floor ? 0.5 : 1;
  const total = Math.round(est.total * share);
  const min = Math.round(est.min * share);
  const max = Math.round(est.max * share);
  const nightLabel = nightsLabel(nights, t, lang);

  return (
    <div className="pe">
      <div className="pe__header">
        <span className="pe__label">{t('pricing.title')}</span>
        {complete && labels.length > 1 && <span className="pe__badge">{t('pricing.multiSeason')}</span>}
      </div>

      {complete ? (
        <div className="pe__range">
          <div className="pe__range-row">
            <span className="pe__range-label">{t('pricing.perNight')}{floor ? ` · ${t('bk.bookFloor')}` : ''}{labels.length ? ` · ${labels.join(' / ')}` : ''}</span>
            <span className="pe__range-value">{min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`}</span>
          </div>
          <div className="pe__range-row pe__range-row--estimate">
            <span className="pe__range-label">{t('bk.estTotal', { nights: nightLabel })}</span>
            <span className="pe__range-value pe__range-value--highlight">{fmt(total)}</span>
          </div>
        </div>
      ) : (
        <div className="pe__range">
          <div className="pe__range-row">
            <span className="pe__range-label">{t('bk.onEnquiry')}</span>
            <span className="pe__range-value">{t('bk.priceOnRequest')}</span>
          </div>
        </div>
      )}

      <p className="pe__disclaimer">
        {t('bk.inclTax')} · {floor ? t('bk.disclaimerFloor') : t('pricing.disclaimer')}
      </p>
    </div>
  );
}
