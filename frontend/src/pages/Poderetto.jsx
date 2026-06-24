import { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import './Poderetto.css';

export default function Poderetto() {
  const { t, ta } = useTranslation();
  const features = ta('poderetto.features');
  const timeline = ta('poderetto.timeline');
  const [form, setForm] = useState({ name: '', email: '' });
  const [registered, setRegistered] = useState(false);

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = e => { e.preventDefault(); setRegistered(true); };

  return (
    <div className="poderetto">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="pod-hero">
        <div className="pod-hero__bg">
          <img
            src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1800&q=85"
            alt="Poderetto Estate"
          />
          <div className="pod-hero__overlay" />
        </div>
        <div className="pod-hero__content container">
          <div className="pod-hero__tag">
            <span className="pod-hero__dot" />
            {t('poderetto.openingSoon')}
          </div>
          <h1 className="pod-hero__title">Poderetto</h1>
          <p className="pod-hero__sub">{t('poderetto.heroSub')}</p>
          <a href="#register" className="btn btn-gold mt-32">{t('poderetto.registerInterest')}</a>
        </div>
        <div className="pod-hero__scroll-text">Poderetto · Opening Soon · Poderetto · Opening Soon · </div>
      </section>

      {/* ── TEASER ───────────────────────────────────────────── */}
      <section className="section pod-teaser">
        <div className="container">
          <div className="pod-teaser__grid">
            <div className="pod-teaser__images">
              <div className="pod-img pod-img--a">
                <img src="https://images.unsplash.com/photo-1615873968403-89e068629265?w=700&q=80" alt="Poderetto interior" />
              </div>
              <div className="pod-img pod-img--b">
                <img src="https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=500&q=80" alt="Poderetto exterior" />
              </div>
              <div className="pod-img pod-img--c">
                <img src="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=500&q=80" alt="Poderetto detail" />
              </div>
            </div>
            <div className="pod-teaser__content">
              <span className="section-label">{t('poderetto.teaserLabel')}</span>
              <h2 className="section-title">
                {t('poderetto.teaserTitle1')}<br />
                {t('poderetto.teaserTitle2')}<br />
                <em>{t('poderetto.teaserTitle3')}</em>
              </h2>
              <p className="pod-body">{t('poderetto.teaserPara1')}</p>
              <p className="pod-body mt-16">{t('poderetto.teaserPara2')}</p>
              <div className="pod-timeline mt-32">
                {timeline.map((item, i) => (
                  <div key={i} className={`pod-timeline__item ${i < 2 ? 'pod-timeline__item--done' : ''} ${i === 2 ? 'pod-timeline__item--active' : ''}`}>
                    <span className="pod-timeline__dot" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="section pod-features">
        <div className="container">
          <div className="text-center mb-48">
            <span className="section-label" style={{justifyContent:'center'}}>{t('poderetto.expectLabel')}</span>
            <h2 className="section-title">{t('poderetto.expectTitle')}</h2>
          </div>
          <div className="pod-features__grid">
            {features.map(f => (
              <div key={f.title} className="pod-feature">
                <span className="pod-feature__icon">{f.icon}</span>
                <h4 className="pod-feature__title">{f.title}</h4>
                <p className="pod-feature__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REGISTER ─────────────────────────────────────────── */}
      <section className="section pod-register" id="register">
        <div className="container">
          <div className="pod-register__inner">
            <div className="pod-register__text">
              <span className="section-label">{t('poderetto.beFirstLabel')}</span>
              <h2 className="section-title">
                {t('poderetto.registerTitle1')}<br />{t('poderetto.registerTitle2')}
              </h2>
              <p className="pod-body">{t('poderetto.registerPara1')}</p>
              <p className="pod-body mt-16">{t('poderetto.registerPara2')}</p>
            </div>

            <div className="pod-register__form-wrap">
              {registered ? (
                <div className="pod-registered">
                  <div className="pod-registered__icon">✓</div>
                  <h3>{t('poderetto.onList')}</h3>
                  <p>{t('poderetto.onListMsg')}</p>
                </div>
              ) : (
                <form className="pod-form" onSubmit={submit}>
                  <div className="form-group">
                    <label>{t('common.fullName')}</label>
                    <input type="text" name="name" value={form.name} onChange={handle} placeholder={t('common.yourName')} required />
                  </div>
                  <div className="form-group">
                    <label>{t('common.email')}</label>
                    <input type="email" name="email" value={form.email} onChange={handle} placeholder="your@email.com" required />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    {t('poderetto.registerBtn')}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </button>
                  <p className="pod-form__note">{t('poderetto.formNote')}</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── GRANCIARE BRIDGE ─────────────────────────────────── */}
      <section className="pod-bridge">
        <div className="container">
          <div className="pod-bridge__inner">
            <div>
              <h3 className="pod-bridge__title">{t('poderetto.bridgeTitle')}</h3>
              <p className="pod-bridge__desc">{t('poderetto.bridgeDesc')}</p>
            </div>
            <a href="/" className="btn btn-outline">{t('common.bookGranciare')}</a>
          </div>
        </div>
      </section>

    </div>
  );
}
