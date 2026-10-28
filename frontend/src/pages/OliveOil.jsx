import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import './OliveOil.css';

const QTY_TIERS = [
  { qty: 5,   label: '5 bottles',   perBottle: 32,    total: 160,  save: null },
  { qty: 12,  label: '12 bottles',  perBottle: 29.50, total: 354,  save: 'Save 8%' },
  { qty: 24,  label: '24 bottles',  perBottle: 28,    total: 672,  save: 'Save 13%' },
  { qty: 48,  label: '48 bottles',  perBottle: 26,    total: 1248, save: 'Save 19%' },
  { qty: 100, label: '100 bottles', perBottle: 24,    total: 2400, save: 'Save 25%' },
];

const GALLERY_IMGS = [
  { src: '/images/olive-oil/solivé-bottle-500ml.png',             alt: 'Solivé 500ml bottle' },
  { src: '/images/olive-oil/solivé-bottle-product.jpeg',           alt: 'Solivé bottle close-up' },
  { src: '/images/olive-oil/olive-harvest-branch-black-olives.jpeg', alt: 'Freshly harvested Moraiolo olives' },
  { src: '/images/olive-oil/olive-oil-extraction-closeup.jpeg',    alt: 'First cold-press extraction' },
  { src: '/images/olive-oil/granciare-olive-oil-label.jpeg',       alt: 'Solivé label detail' },
];

const CERT_LOGOS = [
  { src: '/images/olive-oil/solivé-dubaiooc-logo.png',            alt: 'Dubai International Olive Oil Competition' },
  { src: '/images/olive-oil/solivé-best-olive-oils-store-logo.png', alt: 'Best Olive Oils' },
  { src: '/images/olive-oil/solivé-best-olive-oils-italy-logo.png', alt: 'Best Olive Oils Italy' },
  { src: '/images/olive-oil/solivé-ultra-premium-evoo-logo.png',   alt: 'Ultra Premium EVOO' },
];

const PAIRINGS = [
  { emoji: '🍞', name: 'Bruschetta',   desc: 'Drizzle generously on grilled sourdough with sea salt and fresh tomato' },
  { emoji: '🐟', name: 'Grilled Fish', desc: 'Finish sea bass or turbot at the table — never in the pan' },
  { emoji: '🥗', name: 'Salads',       desc: 'Use as a dressing base; the bitterness naturally replaces vinegar' },
  { emoji: '🍝', name: 'Pasta',        desc: 'Finish aglio e olio or cacio e pepe — Solivé is the flavour, not just a fat' },
  { emoji: '🧀', name: 'Soft Cheese',  desc: 'Burrata, ricotta, fresh mozzarella — pair with sea salt and black pepper' },
];

const REVIEWS = [
  { initials: 'S', name: 'Sofia M.', location: 'London, UK', text: 'I have tried many Italian EVOOs but Solivé\'s polyphenol data genuinely shows in the taste — the pepper kick is remarkable. We ordered 12 bottles and they were gone within three months.', date: 'September 2025' },
  { initials: 'M', name: 'Marco T.', location: 'Dubai, UAE', text: 'Ordered 24 bottles as corporate gifts after seeing the Dubai competition win. Every recipient has asked where to buy more. The packaging is exceptional.', date: 'October 2025' },
  { initials: 'A', name: 'Anna K.', location: 'Berlin, Germany', text: 'The harvest year and chemistry details convinced me to order — I study food science and 487 mg/kg polyphenols is genuinely outstanding. Worth every euro.', date: 'November 2025' },
];

export default function OliveOil() {
  const { t, ta } = useTranslation();
  const steps     = ta('oliveOil.steps');
  const facts     = ta('oliveOil.facts');
  const takeaways = ta('oliveOil.takeaways');

  // Enquiry form
  const [form, setForm]           = useState({ name: '', email: '', date: '', guests: '2', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  // Product interactions
  const [selectedQtyIdx, setSelectedQtyIdx] = useState(0);
  const [galleryIdx, setGalleryIdx]         = useState(0);

  // Harvest signup
  const [harvestEmail, setHarvestEmail]         = useState('');
  const [harvestDone, setHarvestDone]           = useState(false);

  // Sticky CTA
  const [showSticky, setShowSticky] = useState(false);
  const heroRef = useRef(null);
  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // WhatsApp widget
  const [waOpen, setWaOpen] = useState(false);

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
      if ((res.headers.get('content-type') || '').includes('application/json')) data = await res.json();
      if (!res.ok) setError(data.error || t('booking.networkError'));
      else setSubmitted(true);
    } catch {
      setError(t('booking.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const tier = QTY_TIERS[selectedQtyIdx];

  return (
    <div className="olive-page">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="olive-hero" ref={heroRef}>
        <div className="olive-hero__bg">
          <img src="/images/olive-oil/olive-grove-autumn.jpeg" alt="Granciare olive groves in autumn" />
          <div className="olive-hero__overlay" />
        </div>
        <div className="olive-hero__content container">
          <span className="olive-hero__badge">{t('oliveOil.heroBadge')}</span>
          <h1 className="olive-hero__title">
            {t('oliveOil.heroTitle1')}<br />
            <em>{t('oliveOil.heroTitle2')}</em>
          </h1>
          <p className="olive-hero__sub">{t('oliveOil.heroSub')}</p>
          <div className="hero-trust-row">
            <img
              src="/images/olive-oil/solivé-gold-award-2026.png"
              alt="Dubai IOOC Gold 2026"
              className="hero-award-badge"
            />
            <div className="hero-trust-pills">
              <span className="trust-pill">🏆 Dubai IOOC Gold 2026</span>
              <span className="trust-pill">🌿 PDO Umbria</span>
              <a href="/images/olive-oil/solivé-dubai-gold-award-certificate.png" target="_blank" rel="noreferrer" className="trust-pill trust-pill--link">⬇ Certificate</a>
            </div>
          </div>
          <a href="#order" className="btn btn-gold mt-32">{t('oliveOil.heroBtn')}</a>
        </div>
      </section>

      {/* ── CERT / AWARD LOGOS STRIP ─────────────────────── */}
      <section className="olive-cert-strip">
        <div className="container">
          <span className="cert-strip-label">Awards &amp; Certifications</span>
          <div className="cert-logos-row">
            {CERT_LOGOS.map(l => (
              <div key={l.alt} className="cert-logo-wrap">
                <img src={l.src} alt={l.alt} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCT SECTION ──────────────────────────────── */}
      <section className="section olive-product" id="order">
        <div className="container">
          <div className="product-layout">

            {/* Gallery */}
            <div className="product-gallery">
              <div className="product-gallery__main">
                <img
                  src={GALLERY_IMGS[galleryIdx].src}
                  alt={GALLERY_IMGS[galleryIdx].alt}
                  className="product-gallery__main-img"
                />
              </div>
              <div className="product-gallery__thumbs">
                {GALLERY_IMGS.map((img, i) => (
                  <button
                    key={i}
                    className={`product-gallery__thumb${i === galleryIdx ? ' active' : ''}`}
                    onClick={() => setGalleryIdx(i)}
                    aria-label={img.alt}
                  >
                    <img src={img.src} alt={img.alt} />
                  </button>
                ))}
              </div>
            </div>

            {/* Product info + ordering */}
            <div className="product-info">
              <span className="section-label">Solivé Extra Virgin Olive Oil</span>
              <h2 className="section-title" style={{ fontSize: '32px' }}>The 2025 Harvest</h2>
              <div className="product-stars">
                <span className="stars">★★★★★</span>
                <span className="review-count">47 reviews</span>
              </div>

              {/* Chemistry panel */}
              <div className="chem-panel">
                <div className="chem-stat">
                  <span className="chem-val">&lt;&nbsp;0.2%</span>
                  <span className="chem-key">Acidity</span>
                </div>
                <div className="chem-divider" />
                <div className="chem-stat">
                  <span className="chem-val">487</span>
                  <span className="chem-key">Polyphenols mg/kg</span>
                </div>
                <div className="chem-divider" />
                <div className="chem-stat">
                  <span className="chem-val">2025</span>
                  <span className="chem-key">Harvest Year</span>
                </div>
                <div className="chem-divider" />
                <div className="chem-stat">
                  <span className="chem-val" style={{ fontSize: '14px', paddingTop: '4px' }}>Moraiolo</span>
                  <span className="chem-key">Cultivar</span>
                </div>
              </div>

              {/* Tasting notes compact */}
              <div className="tasting-compact">
                <span className="tasting-compact__label">Tasting notes</span>
                <p className="tasting-compact__text">
                  Fresh-cut grass and artichoke on the nose · Intensely fruity with a clean bitterness · Long, peppery finish with dried herbs and warm almond
                </p>
                <div className="intensity-row">
                  <span className="intensity-label-sm">Delicate</span>
                  <div className="intensity-track-sm">
                    <div className="intensity-fill-sm" />
                    <div className="intensity-dot-sm" />
                  </div>
                  <span className="intensity-label-sm" style={{ color: 'var(--gold-lt)' }}>Robust</span>
                </div>
              </div>

              {/* Qty selector */}
              <div className="qty-selector">
                <span className="qty-selector__label">Select quantity</span>
                <div className="qty-presets">
                  {QTY_TIERS.map((tier, i) => (
                    <button
                      key={tier.qty}
                      className={`qty-btn${i === selectedQtyIdx ? ' qty-btn--active' : ''}`}
                      onClick={() => setSelectedQtyIdx(i)}
                    >
                      <span className="qty-btn__num">{tier.qty}</span>
                      <span className="qty-btn__unit">btls</span>
                    </button>
                  ))}
                </div>
                <div className="qty-price">
                  <span className="qty-total">€{tier.total.toLocaleString()}</span>
                  <span className="qty-per-bottle">€{tier.perBottle.toFixed(2)} / bottle</span>
                  {tier.save && <span className="qty-saving">{tier.save}</span>}
                </div>
              </div>

              {/* MOQ explainer */}
              <div className="moq-note">
                <span className="moq-note__icon">🫒</span>
                <p>
                  <strong>Why a minimum of 5 bottles?</strong> The thermal mass protects your oil during shipping, and a full case gives 3–4 months of Solivé at typical household use — ensuring every drop arrives in peak condition.
                </p>
              </div>

              <a href="#enquire" className="btn btn-primary btn-full">Enquire to Order</a>
              <a
                href="https://wa.me/393520730769"
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline btn-full"
              >
                Order via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTRO ────────────────────────────────────────── */}
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

      {/* ── FOOD PAIRING ─────────────────────────────────── */}
      <section className="section olive-pairing">
        <div className="container">
          <div className="text-center mb-48">
            <span className="section-label" style={{ justifyContent: 'center' }}>Serving Ideas</span>
            <h2 className="section-title">How to use Solivé</h2>
          </div>
          <div className="pairing-row">
            {PAIRINGS.map(p => (
              <div key={p.name} className="pairing-tile">
                <span className="pairing-emoji">{p.emoji}</span>
                <span className="pairing-name">{p.name}</span>
                <span className="pairing-desc">{p.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STEPS ────────────────────────────────────────── */}
      <section className="section olive-steps">
        <div className="container">
          <div className="text-center mb-48">
            <span className="section-label" style={{ justifyContent: 'center' }}>{t('oliveOil.journeyLabel')}</span>
            <h2 className="section-title">{t('oliveOil.journeyTitle')}</h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>{t('oliveOil.stepsSub')}</p>
          </div>
          <div className="steps__list">
            {steps.map((step, i) => (
              <div key={step.num} className={`step-item${i % 2 === 1 ? ' step-item--reverse' : ''}`}>
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

      {/* ── SHIPPING + STORAGE ───────────────────────────── */}
      <section className="section olive-logistics">
        <div className="container">
          <div className="logistics-grid">
            {/* Shipping */}
            <div className="logistics-col">
              <span className="section-label">Shipping &amp; Delivery</span>
              <h3 className="logistics-h3">We ship worldwide</h3>
              <div className="ship-cards">
                <div className="ship-card">
                  <span className="ship-region">🇮🇹 Italy &amp; EU</span>
                  <div className="ship-rows">
                    <div className="ship-row"><span>Delivery</span><span>3–5 working days</span></div>
                    <div className="ship-row"><span>Standard</span><span>€8 · Free over 12 btls</span></div>
                  </div>
                </div>
                <div className="ship-card">
                  <span className="ship-region">🇬🇧 UK &amp; Switzerland</span>
                  <div className="ship-rows">
                    <div className="ship-row"><span>Delivery</span><span>5–7 working days</span></div>
                    <div className="ship-row"><span>DHL</span><span>from €18</span></div>
                  </div>
                </div>
                <div className="ship-card">
                  <span className="ship-region">🌍 US · UAE · Worldwide</span>
                  <div className="ship-rows">
                    <div className="ship-row"><span>Delivery</span><span>7–10 working days</span></div>
                    <div className="ship-row"><span>DHL Express</span><span>from €28</span></div>
                  </div>
                </div>
              </div>
              <p className="logistics-note">All orders tracked and insured · Temperature-protected packaging</p>
            </div>

            {/* Storage */}
            <div className="logistics-col">
              <span className="section-label">Storage &amp; Care</span>
              <h3 className="logistics-h3">How to store Solivé</h3>
              <div className="storage-tiles">
                <div className="storage-tile">
                  <span className="storage-ico">🌑</span>
                  <div>
                    <span className="storage-title">Away from light</span>
                    <span className="storage-sub">UV degrades polyphenols — store in a dark cupboard or pantry</span>
                  </div>
                </div>
                <div className="storage-tile">
                  <span className="storage-ico">🌡</span>
                  <div>
                    <span className="storage-title">10–18°C ideal</span>
                    <span className="storage-sub">Room temperature is fine; avoid refrigeration</span>
                  </div>
                </div>
                <div className="storage-tile">
                  <span className="storage-ico">⏰</span>
                  <div>
                    <span className="storage-title">Best within 12 months</span>
                    <span className="storage-sub">Consume within 12 months of the harvest date for full benefit</span>
                  </div>
                </div>
                <div className="storage-tile">
                  <span className="storage-ico">🍶</span>
                  <div>
                    <span className="storage-title">Seal after use</span>
                    <span className="storage-sub">Replace the cap tightly after each pour to minimise oxidation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── IMMERSIVE BANNER ─────────────────────────────── */}
      <section className="olive-banner">
        <div className="olive-banner__bg">
          <img src="/images/olive-oil/olive-oil-bottling-cases.jpeg" alt="Solivé bottling" />
          <div className="olive-banner__overlay" />
        </div>
        <div className="container olive-banner__content">
          <blockquote className="olive-banner__quote">{t('oliveOil.bannerQuote')}</blockquote>
          <cite className="olive-banner__cite">{t('oliveOil.bannerCite')}</cite>
        </div>
      </section>

      {/* ── CUSTOMER REVIEWS ─────────────────────────────── */}
      <section className="section olive-reviews">
        <div className="container">
          <div className="reviews-header">
            <div>
              <span className="section-label">Customer Reviews</span>
              <h2 className="section-title">What our customers say</h2>
            </div>
            <div className="reviews-aggregate">
              <span className="agg-stars">★★★★★</span>
              <span className="agg-score">4.9</span>
              <span className="agg-count">47 reviews</span>
            </div>
          </div>
          <div className="reviews-grid">
            {REVIEWS.map(r => (
              <div key={r.name} className="review-card">
                <div className="review-top">
                  <div className="review-avatar">{r.initials}</div>
                  <div>
                    <div className="review-name">{r.name}</div>
                    <div className="review-location">{r.location}</div>
                  </div>
                </div>
                <div className="review-stars">★★★★★</div>
                <p className="review-text">"{r.text}"</p>
                <span className="review-verified">✓ Verified purchase · {r.date}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HARVEST SIGNUP ───────────────────────────────── */}
      <section className="olive-harvest-signup">
        <div className="olive-harvest-signup__bg">
          <img src="/images/olive-oil/olive-harvest-nets.jpeg" alt="Olive harvest nets" />
          <div className="olive-harvest-signup__overlay" />
        </div>
        <div className="container olive-harvest-signup__content">
          <div className="harvest-ornament">— 🫒 —</div>
          <h2 className="harvest-title">Be the first to taste<br /><em>the 2026 harvest</em></h2>
          <p className="harvest-sub">We press in late October. Be notified the moment the new harvest ships — before we open to the public.</p>
          {harvestDone ? (
            <p className="harvest-done">✓ You're on the list. We'll be in touch come harvest time.</p>
          ) : (
            <form className="harvest-form" onSubmit={e => { e.preventDefault(); setHarvestDone(true); }}>
              <input
                type="email"
                className="harvest-input"
                placeholder="your@email.com"
                value={harvestEmail}
                onChange={e => setHarvestEmail(e.target.value)}
                required
              />
              <button type="submit" className="harvest-btn">Notify Me</button>
            </form>
          )}
          <p className="harvest-note">Join 1,200+ subscribers · Unsubscribe anytime · Harvest news only</p>
        </div>
      </section>

      {/* ── WHAT YOU TAKE HOME ───────────────────────────── */}
      <section className="section olive-takeaway">
        <div className="container">
          <div className="olive-takeaway__grid">
            <div className="olive-takeaway__img">
              <img src="/images/olive-oil/solivé-best-olive-oils-store-display.png" alt="Solivé award display" />
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

      {/* ── ENQUIRY ──────────────────────────────────────── */}
      <section className="section olive-enquiry" id="enquire">
        <div className="container">
          <div className="olive-enquiry__inner">
            <div className="text-center mb-48">
              <span className="section-label" style={{ justifyContent: 'center' }}>{t('oliveOil.enquiryLabel')}</span>
              <h2 className="section-title">{t('oliveOil.enquiryTitle')}</h2>
              <p className="section-subtitle" style={{ margin: '0 auto' }}>{t('oliveOil.enquirySub')}</p>
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
                  <div className="booking-widget__error" style={{ marginBottom:'12px', padding:'12px 16px', background:'#fff3f3', border:'1px solid #f5c2c2', color:'#c0392b', fontSize:'14px' }}>
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

      {/* ── STICKY ORDER CTA ─────────────────────────────── */}
      <div className={`sticky-order${showSticky ? ' sticky-order--visible' : ''}`}>
        <div className="sticky-order__inner">
          <div className="sticky-order__info">
            <span className="sticky-order__name">Solivé 500ml · 2025 Harvest</span>
            <span className="sticky-order__price">from €32 / bottle · 5-bottle minimum</span>
          </div>
          <a href="#order" className="btn btn-gold sticky-order__btn">Order Now →</a>
        </div>
      </div>

      {/* ── WHATSAPP FLOAT ───────────────────────────────── */}
      <div className="wa-float">
        {waOpen && (
          <div className="wa-card">
            <button className="wa-card__close" onClick={() => setWaOpen(false)}>✕</button>
            <div className="wa-card__title">Chat with Granciare</div>
            <div className="wa-card__num">+39 352 0730769</div>
            <div className="wa-card__note">Typically replies within 2 hours · Mon–Sat 9:00–18:00 CET</div>
            <a
              href="https://wa.me/393520730769"
              target="_blank"
              rel="noreferrer"
              className="wa-card__btn"
            >
              Start Chat
            </a>
          </div>
        )}
        <button className="wa-float__btn" onClick={() => setWaOpen(!waOpen)} aria-label="Chat on WhatsApp">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </button>
      </div>

    </div>
  );
}
