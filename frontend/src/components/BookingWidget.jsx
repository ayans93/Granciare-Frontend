import { useState } from 'react';
import DateRangePicker from './DateRangePicker';
import PricingEstimator from './PricingEstimator';
import PhoneInput from './PhoneInput';
import { useTranslation } from '../i18n/LanguageContext';
import './BookingWidget.css';

export default function BookingWidget({ variant = 'light' }) {
  const { t } = useTranslation();
  const [dates, setDates] = useState({ checkIn: '', checkOut: '' });
  const [form, setForm] = useState({ adults: 2, children: 0, name: '', email: '', phone: '', notes: '' });
  const [guestRaw, setGuestRaw] = useState({ adults: '2', children: '0' });
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const MAX_GUESTS = 16;
  const guestTotal = form.adults + form.children;
  const guestOverLimit = guestTotal > MAX_GUESTS;

  const SUGGESTED_TAGS = [
    'Private Chef', 'Horse Riding', 'Cycling', 'Regular Cleaning',
    'Wine Tasting', 'Olive Oil Tour', 'Airport Transfer', 'Yoga Sessions',
  ];

  const addTag = (tag) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) setTags(prev => [...prev, trimmed]);
  };
  const removeTag = (tag) => setTags(prev => prev.filter(t => t !== tag));
  const handleTagInput = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); setTagInput(''); }
  };

  // +/− buttons: block going below min, allow going above MAX (error shows instead)
  const adjustGuests = (field, delta) => {
    setForm(prev => {
      const min = field === 'adults' ? 1 : 0;
      const proposed = Math.max(min, prev[field] + delta);
      setGuestRaw(r => ({ ...r, [field]: String(proposed) }));
      return { ...prev, [field]: proposed };
    });
  };

  // Free typing — update raw string and commit parsed value to form
  const handleGuestChange = (field, val) => {
    setGuestRaw(r => ({ ...r, [field]: val }));
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setForm(prev => ({ ...prev, [field]: parsed }));
    }
  };

  // On blur — normalise empty/invalid inputs to their minimum
  const handleGuestBlur = (field) => {
    const min = field === 'adults' ? 1 : 0;
    const parsed = parseInt(guestRaw[field], 10);
    const safe = isNaN(parsed) || parsed < min ? min : parsed;
    setForm(prev => ({ ...prev, [field]: safe }));
    setGuestRaw(r => ({ ...r, [field]: String(safe) }));
  };
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
          adults: form.adults,
          children: form.children,
          specialRequests: tags.length > 0 ? tags.join(', ') : '',
          message: form.notes || '',
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
              <span className="booking-confirm__value">{form.adults} adults{form.children > 0 ? `, ${form.children} children` : ''}</span>
            </div>
            {tags.length > 0 && (
              <div className="booking-confirm__row booking-confirm__row--extras">
                <span className="booking-confirm__label">{t('common.specialRequests')}</span>
                <span className="booking-confirm__value">{tags.join(' · ')}</span>
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
                setTags([]);
                setTagInput('');
                setDates({ checkIn: '', checkOut: '' });
                setForm({ adults: 2, children: 0, name: '', email: '', phone: '', notes: '' });
                setGuestRaw({ adults: '2', children: '0' });
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

        {/* Guests — Adults + Children counters */}
        <div className="form-group">
          <label>{t('common.guests')}</label>
          <p className="form-hint" style={{marginTop:0, marginBottom:'12px'}}>Property is best suited for larger groups of 8–16 guests</p>
          <div className={`guest-counters${guestOverLimit ? ' guest-counters--error' : ''}`}>
            <div className="guest-counter">
              <div className="guest-counter__label">
                <span>Adults</span>
              </div>
              <div className="guest-counter__control">
                <button type="button" className="guest-counter__btn" onClick={() => adjustGuests('adults', -1)} aria-label="Fewer adults">−</button>
                <input
                  type="number"
                  className="guest-counter__input"
                  value={guestRaw.adults}
                  min="1" max={MAX_GUESTS}
                  onChange={e => handleGuestChange('adults', e.target.value)}
                  onBlur={() => handleGuestBlur('adults')}
                />
                <button type="button" className="guest-counter__btn" onClick={() => adjustGuests('adults', 1)} aria-label="More adults">+</button>
              </div>
            </div>
            <div className="guest-counter">
              <div className="guest-counter__label">
                <span>Children</span>
                <span className="guest-counter__sub">Under 10</span>
              </div>
              <div className="guest-counter__control">
                <button type="button" className="guest-counter__btn" onClick={() => adjustGuests('children', -1)} aria-label="Fewer children">−</button>
                <input
                  type="number"
                  className="guest-counter__input"
                  value={guestRaw.children}
                  min="0" max={MAX_GUESTS}
                  onChange={e => handleGuestChange('children', e.target.value)}
                  onBlur={() => handleGuestBlur('children')}
                />
                <button type="button" className="guest-counter__btn" onClick={() => adjustGuests('children', 1)} aria-label="More children">+</button>
              </div>
            </div>
          </div>
          {guestOverLimit && (
            <p className="form-hint form-hint--error" style={{marginTop:'8px'}}>
              Maximum {MAX_GUESTS} guests total — please reduce adults or children.
            </p>
          )}
        </div>

        {/* Pricing Estimator — appears once dates are selected */}
        <PricingEstimator
          checkIn={dates.checkIn}
          checkOut={dates.checkOut}
          guests={form.adults + form.children}
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
          <PhoneInput
            value={form.phone}
            onChange={val => setForm(prev => ({ ...prev, phone: val }))}
          />
        </div>

        {/* Special Requests — tag system */}
        <div className="form-group">
          <label>{t('common.specialRequests')}</label>

          {/* Selected tags */}
          {tags.length > 0 && (
            <div className="tag-selected">
              {tags.map(tag => (
                <span key={tag} className="tag tag--selected">
                  {tag}
                  <button type="button" className="tag__remove" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>×</button>
                </span>
              ))}
            </div>
          )}

          {/* Text input */}
          <div className="tag-input-wrap">
            <input
              type="text"
              className="tag-input"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagInput}
              placeholder="Type a request and press Enter…"
            />
            {tagInput.trim() && (
              <button
                type="button"
                className="tag-input__add"
                onClick={() => { addTag(tagInput); setTagInput(''); }}
              >Add</button>
            )}
          </div>

          {/* Suggestions */}
          <div className="tag-suggestions">
            {SUGGESTED_TAGS.filter(s => !tags.includes(s)).map(s => (
              <button
                key={s}
                type="button"
                className="tag tag--suggestion"
                onClick={() => addTag(s)}
              >{s}</button>
            ))}
          </div>

          <textarea
            name="notes"
            value={form.notes}
            onChange={handle}
            placeholder="Any other notes, dietary needs, occasion…"
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

        <button type="submit" className="btn btn-primary booking-widget__submit" disabled={loading || guestOverLimit}>
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
