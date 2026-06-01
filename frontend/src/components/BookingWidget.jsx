import { useState } from 'react';
import DateRangePicker from './DateRangePicker';
import './BookingWidget.css';

export default function BookingWidget({ variant = 'light' }) {
  const [dates, setDates] = useState({ checkIn: '', checkOut: '' });
  const [form, setForm] = useState({ guests: '2', name: '', email: '', phone: '', notes: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setError('');

    if (!dates.checkIn || !dates.checkOut) {
      setError('Please select your check-in and check-out dates.');
      return;
    }

    setLoading(true);
    setLoadingMsg('Sending enquiry…');

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
          message: form.notes,
          source: 'granciare.com — Booking Form',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  if (submitted) {
    return (
      <div className={`booking-widget booking-widget--${variant} booking-widget--success`}>
        <div className="booking-success">
          <div className="booking-success__icon">✓</div>
          <h3>Enquiry Received</h3>
          <p>Thank you, {form.name}. We'll get back to you within 24 hours to confirm your stay at Granciare.</p>
          <button className="btn btn-outline mt-24" onClick={() => { setSubmitted(false); setError(''); setDates({ checkIn: '', checkOut: '' }); }}>New Enquiry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`booking-widget booking-widget--${variant}`} id="book">
      <div className="booking-widget__header">
        <span className="section-label">Reserve Your Stay</span>
        <h2 className="booking-widget__title">Check Availability</h2>
      </div>

      <form onSubmit={submit} className="booking-widget__form">

        {/* Date Range Picker */}
        <div className="form-group">
          <DateRangePicker
            checkIn={dates.checkIn}
            checkOut={dates.checkOut}
            onChange={setDates}
          />
        </div>

        {/* Guests */}
        <div className="form-group">
          <label>Guests</label>
          <select name="guests" value={form.guests} onChange={handle}>
            {[1,2,3,4,5,6,7,8].map(n => (
              <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
            ))}
          </select>
        </div>

        <div className="booking-widget__row booking-widget__row--2">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="name" value={form.name} onChange={handle} placeholder="Your name" required />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" name="email" value={form.email} onChange={handle} placeholder="your@email.com" required />
          </div>
        </div>

        <div className="form-group">
          <label>Phone / WhatsApp</label>
          <input type="tel" name="phone" value={form.phone} onChange={handle} placeholder="+1 234 567 8900" />
        </div>

        <div className="form-group">
          <label>Special Requests</label>
          <textarea name="notes" value={form.notes} onChange={handle} placeholder="Any special requirements, dietary needs, occasion…" />
        </div>

        {error && (
          <div className="booking-widget__error">
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary booking-widget__submit" disabled={loading}>
          {loading ? loadingMsg : 'Send Enquiry'}
          {!loading && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          )}
        </button>

        <p className="booking-widget__note">
          Or reach us directly via{' '}
          <a href="https://wa.me/39000000000" target="_blank" rel="noreferrer">WhatsApp</a>{' '}·{' '}
          <a href="tel:+390000000000">Call</a>{' '}·{' '}
          <a href="mailto:info@granciare.com">Email</a>
        </p>
      </form>
    </div>
  );
}
