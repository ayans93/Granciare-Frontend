import { useState, useRef, useEffect } from 'react';
import DateRangePicker from './DateRangePicker';
import PricingEstimator from './PricingEstimator';
import PhoneInput from './PhoneInput';
import { useTranslation } from '../i18n/LanguageContext';
import { supabase } from '../lib/supabase';
import { isValidPhone } from '../lib/validation';
import { nightsLabel } from '../lib/plural';
import { tagLabel, canonicalTag } from '../lib/tagNames';

const LOCALES = { en: 'en-GB', it: 'it-IT', es: 'es-ES', fr: 'fr-FR', pt: 'pt-PT', cs: 'cs-CZ', ru: 'ru-RU' };
const DEFAULT_TAGS = [
  'Private Chef', 'Truffle Hunting', 'Regular Cleaning',
  'Wine Tasting', 'Olive Oil Tour', 'Airport Transfer', 'Yoga Sessions',
];
const DEFAULT_SELECTED = ['Olive Oil Tour'];

function parseList(v) {
  try { const a = JSON.parse(v); return Array.isArray(a) ? a.map(x => String(x).trim()).filter(Boolean) : null; } catch { return null; }
}
import './BookingWidget.css';
import { ACCOMMODATIONS } from '../lib/accommodation';

export default function BookingWidget({ variant = 'light' }) {
  const { t, lang } = useTranslation();
  const [dates, setDates] = useState({ checkIn: '', checkOut: '' });
  const [form, setForm] = useState({ infants: 0, name: '', email: '', phone: '', notes: '' });
  const [guestRaw, setGuestRaw] = useState({ infants: '0' });
  const [suggestedTags, setSuggestedTags] = useState(DEFAULT_TAGS);
  const [defaultTags, setDefaultTags] = useState(DEFAULT_SELECTED);
  const [tags, setTags] = useState(DEFAULT_SELECTED);
  // Tag list and pre-selected tags are managed in Admin > Granciare Details
  useEffect(() => {
    supabase.from('site_config').select('key,value').in('key', ['booking_tags', 'booking_default_tags', 'allow_partial_bookings']).then(({ data }) => {
      const cfg = Object.fromEntries((data || []).map(r => [r.key, r.value]));
      setPartialAllowed(String(cfg.allow_partial_bookings || '').toLowerCase() === 'yes');
      const list = parseList(cfg.booking_tags);
      const defs = parseList(cfg.booking_default_tags);
      if (list && list.length) setSuggestedTags(list);
      if (defs) { setDefaultTags(defs); setTags(defs); }
    });
  }, []);
  const [tagInput, setTagInput] = useState('');

  const MAX_INFANTS = 10;

  // Accommodation: ground floor (best for up to 6), first floor (up to 10) or entire villa (up to 16).
  // The floors are offered only when Admin > Granciare Details allows partial bookings.
  const [partialAllowed, setPartialAllowed] = useState(false);
  const [bookingType, setBookingType] = useState('entire');   // 'ground' | 'first' | 'entire'
  const accommodation = partialAllowed ? bookingType : 'entire';
  const isFloor = accommodation !== 'entire';
  const accTitle = { ground: t('bk.groundFloor'), first: t('bk.firstFloor'), entire: t('bk.bookEntire') };



  const addTag = (tag) => {
    // A known tag typed in any language is stored under its English name, so it can't be added twice
    const trimmed = canonicalTag(tag.trim().slice(0, 60));
    if (trimmed && !tags.some(x => canonicalTag(x).toLowerCase() === trimmed.toLowerCase())) setTags(prev => [...prev, trimmed]);
  };
  const removeTag = (tag) => setTags(prev => prev.filter(t => t !== tag));
  const handleTagInput = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); setTagInput(''); }
  };

  // +/− buttons: block going below min, allow going above MAX (error shows instead)
  const adjustGuests = (field, delta) => {
    setForm(prev => {
      const min = 0;
      let proposed = Math.max(min, prev[field] + delta);
      if (field === 'infants') proposed = Math.min(proposed, MAX_INFANTS);
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
    const min = 0;
    const parsed = parseInt(guestRaw[field], 10);
    let safe = isNaN(parsed) || parsed < min ? min : parsed;
    if (field === 'infants') safe = Math.min(safe, MAX_INFANTS);
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
  const submittingRef = useRef(false);

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
    if (submittingRef.current) return;           // ignore double clicks
    setError('');
    setTcError(false);

    if (!form.name.trim()) {
      setError(t('bk.errName'));
      return;
    }
    if (!isValidPhone(form.phone)) {
      setError(t('bk.errPhone'));
      return;
    }
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

    submittingRef.current = true;
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
          infants: form.infants,
          specialRequests: tags.length > 0 ? tags.join(', ') : '',
          message: form.notes || '',
          source: 'granciare.com · Booking Form',
          bookingType: accommodation,
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
        setRefNumber(data.ref || '');
        setSubmitted(true);
      }
    } catch (err) {
      // True network failure (no server, CORS blocked, etc.)
      console.error('Booking submit error:', err);
      setError(t('booking.networkError'));
    } finally {
      submittingRef.current = false;
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(LOCALES[lang] || 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
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
            {refNumber && (
            <div className="booking-confirm__ref">
                <span>{t('booking.refLabel')}</span>
                <strong>{refNumber}</strong>
              </div>
            )}
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
              <span className="booking-confirm__value">{nightsLabel(nights, t, lang)}</span>
            </div>
            <div className="booking-confirm__row">
              <span className="booking-confirm__label">{t('bk.accommodation')}</span>
              <span className="booking-confirm__value">{accTitle[accommodation]}</span>
            </div>
            {form.infants > 0 && (
              <div className="booking-confirm__row">
                <span className="booking-confirm__label">{t('bk.infants')}</span>
                <span className="booking-confirm__value">{form.infants === 1 ? t('bk.infant1') : t('bk.infantN', { n: form.infants })}</span>
              </div>
            )}
            {tags.length > 0 && (
              <div className="booking-confirm__row booking-confirm__row--extras">
                <span className="booking-confirm__label">{t('common.specialRequests')}</span>
                <span className="booking-confirm__value">{tags.map(x => tagLabel(x, lang)).join(' · ')}</span>
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
                setTags(defaultTags);
                setTagInput('');
                setDates({ checkIn: '', checkOut: '' });
                setForm({ infants: 0, name: '', email: '', phone: '', notes: '' });
                setGuestRaw({ infants: '0' });
                setBookingType('entire');
              }}
            >{t('booking.newEnquiry')}</button>
            <a href="https://wa.me/393520730769" className="btn btn-primary" target="_blank" rel="noreferrer">{t('booking.whatsappUs')}</a>
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
            accommodation={accommodation}
            onChange={handleDates}
          />
          {dateError ? (
            <p className="form-hint form-hint--error">{dateError}</p>
          ) : (
            <p className="form-hint">{isFloor ? t('bk.minMaxShort', { min: MIN_NIGHTS, max: MAX_NIGHTS }) : t('booking.minMaxHint', { min: MIN_NIGHTS, max: MAX_NIGHTS })}</p>
          )}
        </div>

        {/* Accommodation — ground floor / first floor / entire villa, with the group size each suits */}
        <div className="form-group">
          <label>{t('bk.accommodation')}</label>
          {partialAllowed ? (
            <>
              <p className="form-hint" style={{ marginTop: 0, marginBottom: '12px' }}>{t('bk.chooseAccommodation')}</p>
              <div className="booking-type booking-type--3" role="radiogroup" aria-label={t('bk.accommodation')}>
                {ACCOMMODATIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={bookingType === opt.id}
                    className={`booking-type__opt${bookingType === opt.id ? ' booking-type__opt--active' : ''}`}
                    onClick={() => { setBookingType(opt.id); setError(''); }}
                  >
                    <span className="booking-type__title">{accTitle[opt.id]}</span>
                    <span className="booking-type__sub">{t('bk.bestFor', { n: opt.max })}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="form-hint" style={{ marginTop: 0 }}>{t('bk.bookEntire')} · {t('bk.bestFor', { n: 16 })}</p>
          )}
        </div>

        {/* Infants (up to 3 years) */}
        <div className="form-group">
          <div className="guest-counters">
            <div className="guest-counter">
              <div className="guest-counter__label">
                <span>{t('bk.infants')}</span>
                <span className="guest-counter__sub">{t('bk.ageInfant')}</span>
              </div>
              <div className="guest-counter__control">
                <button type="button" className="guest-counter__btn" onClick={() => adjustGuests('infants', -1)} aria-label="Fewer infants">−</button>
                <input
                  type="number"
                  className="guest-counter__input"
                  value={guestRaw.infants}
                  min="0" max={MAX_INFANTS}
                  onChange={e => handleGuestChange('infants', e.target.value)}
                  onBlur={() => handleGuestBlur('infants')}
                />
                <button type="button" className="guest-counter__btn" onClick={() => adjustGuests('infants', 1)} aria-label="More infants" disabled={form.infants >= MAX_INFANTS}>+</button>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing estimate for the chosen accommodation — appears once dates are selected */}
        <PricingEstimator
          accommodation={accommodation}
          checkIn={dates.checkIn}
          checkOut={dates.checkOut}
        />

        <div className="booking-widget__row booking-widget__row--2">
          <div className="form-group">
            <label>{t('common.fullName')}</label>
            <input type="text" name="name" value={form.name} onChange={handle} placeholder={t('common.yourName')} maxLength={100} required />
          </div>
          <div className="form-group">
            <label>{t('common.email')}</label>
            <input type="email" name="email" value={form.email} onChange={handle} placeholder="your@email.com" required />
          </div>
        </div>

        <div className="form-group">
          <label>{t('common.phone')} *</label>
          <PhoneInput
            placeholder={t('bk.mobilePh')}
            searchPlaceholder={t('bk.countrySearch')}
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
                  {tagLabel(tag, lang)}
                  <button type="button" className="tag__remove" onClick={() => removeTag(tag)} aria-label={`Remove ${tagLabel(tag, lang)}`}>×</button>
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
              placeholder={t('bk.tagPh')}
            />
            {tagInput.trim() && (
              <button
                type="button"
                className="tag-input__add"
                onClick={() => { addTag(tagInput); setTagInput(''); }}
              >{t('bk.add')}</button>
            )}
          </div>

          {/* Suggestions */}
          <div className="tag-suggestions">
            {suggestedTags.filter(s => !tags.some(x => canonicalTag(x).toLowerCase() === canonicalTag(s).toLowerCase())).map(s => (
              <button
                key={s}
                type="button"
                className="tag tag--suggestion"
                onClick={() => addTag(s)}
              >{tagLabel(s, lang)}</button>
            ))}
          </div>

          <textarea
            name="notes"
            value={form.notes}
            onChange={handle}
            placeholder={t('bk.notesPh')}
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
            <a href="/terms" target="_blank" rel="noreferrer">{t('booking.tcLink')}</a>
            {' '}{t('booking.tcAnd')}{' '}
            <a href="/privacy" target="_blank" rel="noreferrer">{t('booking.privacyLink')}</a>
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
          <a href="https://wa.me/393520730769" target="_blank" rel="noreferrer">WhatsApp</a>{' '}·{' '}
          <a href="tel:+390763630996">Call</a>{' '}·{' '}
          <a href="mailto:info@granciare.com">Email</a>
        </p>
      </form>
    </div>
  );
}
