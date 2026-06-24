import { useState } from 'react';
import DateRangePicker from './DateRangePicker';
import PricingEstimator from './PricingEstimator';
import { useTranslation } from '../i18n/LanguageContext';
import './BookingWidget.css';

export default function BookingWidget({ variant = 'light' }) {
  const { t } = useTranslation();
  const [dates, setDates] = useState({ checkIn: '', checkOut: '' });
  const [form, setForm] = useState({ guests: '2', name: '', email: '', phone: '', notes: '' });
  const [extras, setExtras] = useState({ privateCook: false, extraCleaning: false, horseRiding: false });

  const toggleExtra = (key) => setExtras(prev => ({ ...prev, [key]: !prev[key] }));
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');
  const [dateError, setDateError] = useState('');
  const [tcAccepted, setTcAccepted] = useState(false);
  const [tcError, setTcError] = useState(false);
  const [refNumber, setRefNumber] = useState('');

  const MIN_NIGHTS = 2;
  const MAX_NIGHTS = 30;

  const getNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    return Math.round((new Date(checkOut) - new Date(checkIn)) / 86_400_000);
  };

  const handleDates = (newDates) => {
    setDates(newDates);
    if (newDates.checkIn && newDates.checkOut) {
      const nights = getNights(newDates.checkIn, newDates.checkOut);
      if (nights < MIN_NIGHTS) {
        setDateError(t('booking.tooShort', { min: MIN_NIGHTS }));
      } else if (nights > MAX_NIGHTS) {
        setDateError(t('booking.tooLong', { max: MAX_NIGHTS }));
      } else {
        setDateError('');
      }
    } else {
      setDateError('');
    }
  };

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setError('');
    setTcError(false);

    if (!tcAccepted) {
      setTcError(true);
      return;
    }

    if (!dates.checkIn || !dates.checkOut) {
      setError(t('booking.noDates'));
      return;
    }

    const nights = getNights(dates.checkIn, dates.checkOut);
    if (nights < MIN_NIGHTS) {
      setError(t('booking.tooShort', { min: MIN_NIGHTS }));
      return;
    }
    if (nights > MAX_NIGHTS) {
      setError(t('booking.tooLong', { max: MAX_NIGHTS }));
      return;
    }

    setLoading(true);
    setLoadingMsg(t('common.sending'));

    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          checkIn: dates.checkIn,
          checkOut: dates.checkOut,
          guests: form.guests,
          message: [
            extras.privateCook   ? '• Private Chef / Cook requested' : '',
            extras.extraCleaning ? '• Extra Cleaning service requested' : '',
            extras.horseRiding   ? '• Horse Riding experience requested' : '',
            form.notes ? `\nAdditional notes:\n${form.notes}` : '',
          ].filter(Boolean).join('\n'),
          source: 'granciare.com — Booking Form',
        }),
      });

      // Try to parse JSON — non-JSON responses (e.g. Vite HTML 404
      // when the API server isn't running) should not crash the UI.
      let data = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      }

      if (!res.ok) {
        setError(
          data.error ||
          (res.status === 404
            ? 'API not reachable. Run `vercel dev` locally or deploy to Vercel.'
            : t('booking.networkError'))
        );
      } else {
        const ref = 'GRC-' + Date.now().toString(36).toUpperCase().slice(-6);
        setRefNumber(ref);
        setSubmitted(true);
      }
    } catch (err) {
      // True network failure (no server, CORS blocked, etc.)
      console.error('Booking submit error:', err);
      setError(t('booking.networkError'));
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (submitted) {
    const nights = getNights(dates.checkIn, dates.checkOut);
    const selectedExtras = [
      extras.privateCook   && t('booking.extraPrivateCook'),
      extras.extraCleaning && t('booking.extraCleaning'),
      extras.horseRiding   && t('booking.extraHorseRiding'),
    ].filter(Boolean);

    return (
      <div className={`booking-widget booking-widget--${variant} booking-widget--success`}>
        <div className="booking-confirm">
          <div className="booking-confirm__header">
            <div className="booking-confirm__icon">✓</div>
            <h3 className="booking-confirm__title">{t('booking.successTitle')}</h3>
            <p className="booking-confirm__sub">{t('booking.successMsg', { name: form.name })}</p>
            <div className="booking-confirm__ref">
              <span>{t('booking.refLabel')}</span>
              <strong>{refNumber}</strong>
            </div>
          </div>

          <div className="booking-confirm__details">
            <div className="booking-confirm__row">
              <span className="booking-confirm__label">{t('booking.confirmGuest')}</span>
              <span className="booking-confirm__value">{form.name}</span>
            </div>
            <div className="booking-confirm__row">
              <span className="booking-confirm__label">{t('booking.confirmEmail')}</span>
              <span className="booking-confirm__value">{form.email}</span>
            </div>
            <div className="booking-confirm__row">
              <span className="booking-confirm__label">{t('booking.confirmCheckin')}</span>
              <span className="booking-confirm__value">{formatDate(dates.checkIn)}</span>
            </div>
            <div className="booking-confirm__row">
              <span className="booking-confirm__label">{t('booking.confirmCheckout')}</span>
              <span className="booking-confirm__value">{formatDate(dates.checkOut)}</span>
            </div>
            <div className="booking-confirm__row">
              <span className="booking-confirm__label">{t('booking.confirmNights')}</span>
              <span className="booking-confirm__value">{nights} {nights === 1 ? t('booking.night') : t('booking.nights')}</span>
            </div>
            <div className="booking-confirm__row">
              <span className="booking-confirm__label">{t('common.guests')}</span>
              <span className="booking-confirm__value">{form.guests}</span>
            </div>
            {selectedExtras.length > 0 && (
              <div className="booking-confirm__row booking-confirm__row--extras">
                <span className="booking-confirm__label">{t('common.specialRequests')}</span>
                <span className="booking-confirm__value">{selectedExtras.join(' · ')}</span>
              </div>
            )}
          </div>

          <div className="booking-confirm__next">
            <h4>{t('booking.nextStepsTitle')}</h4>
            <ol>
              <li>{t('booking.nextStep1')}</li>
              <li>{t('booking.nextStep2')}</li>
              <li>{t('booking.nextStep3')}</li>
            </ol>
          </div>

          <div className="booking-confirm__actions">
            <button
              className="btn btn-outline"
              onClick={() => {
                setSubmitted(false);
                setError('');
                setTcAccepted(false);
                setExtras({ privateCook: false, extraCleaning: false, horseRiding: false });
                setDates({ checkIn: '', checkOut: '' });
                setForm({ guests: '2', name: '', email: '', phone: '', notes: '' });
              }}
            >{t('booking.newEnquiry')}</button>
            <a href="https://wa.me/39000000000" className="btn btn-primary" target="_blank" rel="noreferrer">{t('booking.whatsappUs')}</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`booking-widget booking-widget--${variant}`} id="book">
      <div className="booking-widget__header">
        <span className="section-label">{t('booking.sectionLabel')}</span>
        <h2 className="booking-widget__title">{t('booking.title')}</h2>
      </div>

      <form onSubmit={submit} className="booking-widget__form">

        {/* Date Range Picker */}
        <div className="form-group">
          <DateRangePicker
            checkIn={dates.checkIn}
            checkOut={dates.checkOut}
            onChange={handleDates}
          />
          {dateError ? (
            <p className="form-hint form-hint--error">{dateError}</p>
          ) : (
            <p className="form-hint">{t('booking.minMaxHint', { min: MIN_NIGHTS, max: MAX_NIGHTS })}</p>
          )}
        </div>

        {/* Guests */}
        <div className="form-group">
          <label>{t('common.guests')}</label>
          <select name="guests" value={form.guests} onChange={handle}>
            {[1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(n => (
              <option key={n} value={n}>{n} {n === 1 ? t('common.guest') : t('common.guests')}</option>
            ))}
          </select>
        </div>

        {/* Pricing Estimator — appears once dates are selected */}
        <PricingEstimator
          checkIn={dates.checkIn}
          checkOut={dates.checkOut}
          guests={form.guests}
        />

        <div className="booking-widget__row booking-widget__row--2">
          <div className="form-group">
            <label>{t('common.fullName')}</label>
            <input type="text" name="name" value={form.name} onChange={handle} placeholder={t('common.yourName')} required />
          </div>
          <div className="form-group">
            <label>{t('common.email')}</label>
            <input type="email" name="email" value={form.email} onChange={handle} placeholder="your@email.com" required />
          </div>
        </div>

        <div className="form-group">
          <label>{t('common.phone')}</label>
          <input type="tel" name="phone" value={form.phone} onChange={handle} placeholder="+1 234 567 8900" />
        </div>

        <div className="form-group">
          <label>{t('common.specialRequests')}</label>
          <div className="booking-extras">
            <label className="booking-extras__option">
              <input
                type="checkbox"
                checked={extras.privateCook}
                onChange={() => toggleExtra('privateCook')}
              />
              <span className="booking-extras__icon">👨‍🍳</span>
              <div className="booking-extras__text">
                <strong>{t('booking.extraPrivateCook')}</strong>
                <span>{t('booking.extraPrivateCookDesc')}</span>
              </div>
            </label>
            <label className="booking-extras__option">
              <input
                type="checkbox"
                checked={extras.extraCleaning}
                onChange={() => toggleExtra('extraCleaning')}
              />
              <span className="booking-extras__icon">✨</span>
              <div className="booking-extras__text">
                <strong>{t('booking.extraCleaning')}</strong>
                <span>{t('booking.extraCleaningDesc')}</span>
              </div>
            </label>
            <label className="booking-extras__option">
              <input
                type="checkbox"
                checked={extras.horseRiding}
                onChange={() => toggleExtra('horseRiding')}
              />
              <span className="booking-extras__icon">🐴</span>
              <div className="booking-extras__text">
                <strong>{t('booking.extraHorseRiding')}</strong>
                <span>{t('booking.extraHorseRidingDesc')}</span>
              </div>
            </label>
          </div>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handle}
            placeholder={t('booking.notesPlaceholder')}
            className="mt-12"
          />
        </div>

        {/* T&C acceptance */}
        <label className={`booking-tc${tcError ? ' booking-tc--error' : ''}`}>
          <input
            type="checkbox"
            checked={tcAccepted}
            onChange={e => { setTcAccepted(e.target.checked); if (e.target.checked) setTcError(false); }}
          />
          <span>
            {t('booking.tcAgree')}{' '}
            <a href="#terms" target="_blank" rel="noreferrer">{t('booking.tcLink')}</a>
            {' '}{t('booking.tcAnd')}{' '}
            <a href="#privacy" target="_blank" rel="noreferrer">{t('booking.privacyLink')}</a>
          </span>
        </label>
        {tcError && (
          <p className="booking-tc__msg">{t('booking.tcRequired')}</p>
        )}

        {error && (
          <div className="booking-widget__error">
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary booking-widget__submit" disabled={loading}>
          {loading ? loadingMsg : t('common.sendEnquiry')}
          {!loading && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          )}
        </button>

        <p className="booking-widget__note">
          {t('booking.orReachUs')}{' '}
          <a href="https://wa.me/39000000000" target="_blank" rel="noreferrer">WhatsApp</a>{' '}·{' '}
          <a href="tel:+390000000000">Call</a>{' '}·{' '}
          <a href="mailto:info@granciare.com">Email</a>
        </p>
      </form>
    </div>
  );
}
