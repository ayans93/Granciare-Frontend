import { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import './OliveOil.css';

export default function OliveOil() {
  const { t, ta } = useTranslation();
  const steps = ta('oliveOil.steps');
  const facts = ta('oliveOil.facts');
  const takeaways = ta('oliveOil.takeaways');

  const [form, setForm] = useState({ name: '', email: '', date: '', guests: '2', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: '',
          checkIn: form.date,
          checkOut: form.date,
          guests: form.guests,
          message: `[Olive Oil Experience Enquiry]\nPreferred date: ${form.date}\n\n${form.message}`,
          source: 'granciare.com — Olive Oil Experience Form',
        }),
      });
      let data = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      }
      if (!res.ok) {
        setError(data.error || t('booking.networkError'));
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      console.error('Olive oil enquiry error:', err);
      setError(t('booking.networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="olive-page">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="olive-hero">
        <div className="olive-hero__bg">
          <img
            src="https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=1800&q=85"
            alt="Olive groves at Granciare"
          />
          <div className="olive-hero__overlay" />
        </div>
        <div className="olive-hero__content container">
          <span className="olive-hero__badge">{t('oliveOil.heroBadge')}</span>
          <h1 className="olive-hero__title">
            {t('oliveOil.heroTitle1')}<br />
            <em>{t('oliveOil.heroTitle2')}</em>
          </h1>
          <p className="olive-hero__sub">{t('oliveOil.heroSub')}</p>
          <a href="#enquire" className="btn btn-gold mt-32">{t('oliveOil.heroBtn')}</a>
        </div>
      </section>

      {/* ── INTRO ────────────────────────────────────────────── */}
      <section className="section olive-intro">
        <div className="container">
          <div className="olive-intro__grid">
            <div>
              <span className="section-label">{t('oliveOil.uniqueLabel')}</span>
              <h2 className="section-title">{t('oliveOil.uniqueTitle')}</h2>
            </div>
            <div>
              <p className="olive-body">{t('oliveOil.uniquePara1')}</p>
              <p className="olive-body mt-16">{t('oliveOil.uniquePara2')}</p>
            </div>
          </div>

          {/* Facts */}
          <div className="olive-facts">
            {facts.map(f => (
              <div key={f.label} className="olive-fact">
                <span className="olive-fact__number">{f.number}</span>
                <span className="olive-fact__label">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXPERIENCE STEPS ─────────────────────────────────── */}
      <section className="section olive-steps">
        <div className="container">
          <div className="text-center mb-48">
            <span className="section-label" style={{justifyContent:'center'}}>{t('oliveOil.journeyLabel')}</span>
            <h2 className="section-title">{t('oliveOil.journeyTitle')}</h2>
            <p className="section-subtitle" style={{margin:'0 auto'}}>
              {t('oliveOil.stepsSub')}
            </p>
          </div>

          <div className="steps__list">
            {steps.map((step, i) => (
              <div key={step.num} className={`step-item ${i % 2 === 1 ? 'step-item--reverse' : ''}`}>
                <div className="step-item__image">
                  <img src={step.img} alt={step.title} />
                  <div className="step-item__num">{step.num}</div>
                </div>
                <div className="step-item__content">
                  <h3 className="step-item__title">{step.title}</h3>
                  <p className="olive-body">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IMMERSIVE BANNER ─────────────────────────────────── */}
      <section className="olive-banner">
        <div className="olive-banner__bg">
          <img src="https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=1800&q=80" alt="Bottling plant" />
          <div className="olive-banner__overlay" />
        </div>
        <div className="container olive-banner__content">
          <blockquote className="olive-banner__quote">{t('oliveOil.bannerQuote')}</blockquote>
          <cite className="olive-banner__cite">{t('oliveOil.bannerCite')}</cite>
        </div>
      </section>

      {/* ── WHAT YOU TAKE HOME ───────────────────────────────── */}
      <section className="section olive-takeaway">
        <div className="container">
          <div className="olive-takeaway__grid">
            <div className="olive-takeaway__img">
              <img src="https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?w=700&q=80" alt="Olive oil tasting" />
            </div>
            <div>
              <span className="section-label">{t('oliveOil.takeawayLabel')}</span>
              <h2 className="section-title">{t('oliveOil.takeawayTitle')}</h2>
              <ul className="olive-takeaway__list">
                {takeaways.map((item, i) => (
                  <li key={i}>
                    <span className="olive-check">✓</span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── ENQUIRY ──────────────────────────────────────────── */}
      <section className="section olive-enquiry" id="enquire">
        <div className="container">
          <div className="olive-enquiry__inner">
            <div className="text-center mb-48">
              <span className="section-label" style={{justifyContent:'center'}}>{t('oliveOil.enquiryLabel')}</span>
              <h2 className="section-title">{t('oliveOil.enquiryTitle')}</h2>
              <p className="section-subtitle" style={{margin:'0 auto'}}>
                {t('oliveOil.enquirySub')}
              </p>
            </div>

            {submitted ? (
              <div className="olive-success">
                <div className="olive-success__icon">✓</div>
                <h3>{t('oliveOil.successTitle')}</h3>
                <p>{t('oliveOil.successMsg')}</p>
              </div>
            ) : (
              <form className="olive-form" onSubmit={submit}>
                <div className="olive-form__row">
                  <div className="form-group">
                    <label>{t('common.yourName')}</label>
                    <input type="text" name="name" value={form.name} onChange={handle} placeholder={t('common.fullName')} required />
                  </div>
                  <div className="form-group">
                    <label>{t('common.email')}</label>
                    <input type="email" name="email" value={form.email} onChange={handle} placeholder="your@email.com" required />
                  </div>
                </div>
                <div className="olive-form__row">
                  <div className="form-group">
                    <label>{t('oliveOil.preferredDate')}</label>
                    <input type="date" name="date" value={form.date} onChange={handle} min={new Date().toISOString().split('T')[0]} required />
                  </div>
                  <div className="form-group">
                    <label>{t('oliveOil.numberOfGuests')}</label>
                    <select name="guests" value={form.guests} onChange={handle}>
                      {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n===1?t('oliveOil.person'):t('oliveOil.people')}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>{t('common.message')}</label>
                  <textarea name="message" value={form.message} onChange={handle} placeholder="Any dietary requirements, accessibility needs, or questions…" />
                </div>
                {error && (
                  <div className="booking-widget__error" style={{marginBottom:'12px',padding:'12px 16px',background:'#fff3f3',border:'1px solid #f5c2c2',color:'#c0392b',fontSize:'14px'}}>
                    {error}
                  </div>
                )}
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? t('common.sending') : t('common.sendEnquiry')}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
