import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { supabase } from '../lib/supabase';
import { submitLead } from '../lib/leads';
import { isValidPhone } from '../lib/validation';
import { BOTTLE_SIZES, sizeById, checkOrder, formatVolume } from '../lib/oilRules';
import { COUNTRY_CODES, guessCountry, countryName, FIVE_L_SERVICEABLE } from '../lib/countries';
import './OliveOil.css';
import { anyInView } from '../lib/inView';

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

export default function OliveOil() {
  const { t, ta, lang } = useTranslation();
  const steps     = ta('oliveOil.steps');
  const pairings  = ta('olv.pairings');
  const storageTips = ta('olv.storage');
  const facts     = ta('oliveOil.facts');
  const takeaways = ta('oliveOil.takeaways');

  // Order form
  const [form, setForm]           = useState({ name: '', phone: '', email: '', address: '', country: '', message: '' });
  // Country: guessed from the delivery address until the customer picks one themselves
  const [countryTouched, setCountryTouched] = useState(false);
  const [countryGuessed, setCountryGuessed] = useState(false);
  const onAddressChange = e => {
    const address = e.target.value;
    setForm(f => {
      if (countryTouched) return { ...f, address };
      const guess = guessCountry(address);
      setCountryGuessed(Boolean(guess));
      return { ...f, address, country: guess || (countryGuessed ? '' : f.country) };
    });
  };
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const submittingRef = useRef(false);
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  // Bottle size + quantity, shared by the selector above and the order form below.
  // 250 ml / 500 ml: 3 L per order at most. 5 L: custom quantity, up to 10.
  const [sizePrices, setSizePrices] = useState({});
  useEffect(() => {
    Promise.all([
      supabase.from('site_config').select('key,value').in('key', BOTTLE_SIZES.map(z => z.priceKey)),
      supabase.from('oil_pricing').select('quantity,price_per_bottle').eq('quantity', 5),
    ]).then(([cfg, legacy]) => {
      const map = {};
      (cfg.data || []).forEach(r => { const v = parseFloat(r.value); if (v > 0) map[r.key] = v; });
      // Until 500 ml has its own price, use the old 5-bottle price
      if (!map.oil_price_500ml && legacy.data?.[0]?.price_per_bottle > 0) map.oil_price_500ml = Number(legacy.data[0].price_per_bottle);
      setSizePrices(map);
    });
  }, []);

  const [bottleSize, setBottleSize] = useState('500ml');
  const size = sizeById(bottleSize);
  const [selection, setSelection] = useState(6);   // a preset quantity, or 'custom'
  const [customQty, setCustomQty] = useState('');
  const [showFiveLNotice, setShowFiveLNotice] = useState(false);
  const isCustom = selection === 'custom' || size.presets.length === 0;

  const chooseSize = id => {
    const next = sizeById(id);
    setBottleSize(id);
    setError('');
    if (!next.presets.length) setSelection('custom');
    else if (selection !== 'custom' && !next.presets.includes(selection)) setSelection(next.presets[0]);
    if (next.shippingNotice) setShowFiveLNotice(true);
  };
  const chooseQty = v => { setSelection(v === 'custom' ? 'custom' : Number(v)); setError(''); };

  const customNum = Number(customQty);
  const rawQty = isCustom ? (customQty === '' ? null : customNum) : selection;
  const qtyIssue = rawQty == null ? '' : checkOrder(bottleSize, rawQty);
  const selectedQty = rawQty != null && !qtyIssue ? rawQty : null;
  const qtyErrorText = qtyIssue === 'maxVolume' ? t('olv.errMaxVolume', { max: size.maxQty })
    : qtyIssue === 'max5l' ? t('olv.errMax5l', { max: size.maxQty })
    : qtyIssue ? t('olv.customError', { min: 1, max: size.maxQty }) : '';

  const perBottle = sizePrices[size.priceKey] || null;
  const price = selectedQty && perBottle ? { perBottle, total: Math.round(selectedQty * perBottle * 100) / 100 } : null;
  // 5 L bottles ship only to Europe and the USA
  const [countryAttempted, setCountryAttempted] = useState(false);
  const countryMissing = countryAttempted && !form.country;
  const notServiceable = Boolean(size.shippingNotice && form.country && !FIVE_L_SERVICEABLE(form.country));
  const countryOptions = COUNTRY_CODES.map(code => ({ code, name: countryName(code, lang) })).sort((a, b) => a.name.localeCompare(b.name, lang));

  const knownPrices = BOTTLE_SIZES.map(z => sizePrices[z.priceKey]).filter(Boolean);
  const minPrice = knownPrices.length ? Math.min(...knownPrices) : null;

  // Product interactions
  const [galleryIdx, setGalleryIdx]         = useState(0);

  // Harvest signup
  const [harvestEmail, setHarvestEmail]         = useState('');
  const [harvestDone, setHarvestDone]           = useState(false);
  const [harvestSending, setHarvestSending]     = useState(false);
  const [harvestError, setHarvestError]         = useState('');
  const submitHarvest = async e => {
    e.preventDefault();
    if (harvestSending) return;
    setHarvestSending(true); setHarvestError('');
    try {
      await submitLead('harvest', { email: harvestEmail });
      setHarvestDone(true);
    } catch (err) {
      setHarvestError(err.message);
    } finally {
      setHarvestSending(false);
    }
  };

  // Site config: Solivé stats
  const [soliveStats, setSoliveStats] = useState({
    solive_acidity: '< 0.2%', solive_polyphenols: '487',
    solive_harvest_year: '2026-2027', solive_cultivar: 'Moraiolo',
  });
  useEffect(() => {
    const keys = ['solive_acidity','solive_polyphenols','solive_harvest_year','solive_cultivar'];
    supabase.from('site_config').select('key,value').in('key', keys).then(({ data }) => {
      if (data && data.length) {
        const merged = {};
        data.forEach(r => { merged[r.key] = r.value; });
        setSoliveStats(s => ({ ...s, ...merged }));
      }
    });
  }, []);

  // Harvest season, e.g. "2026-2027" (a single year like "2026" also works)
  const harvestYear = String(soliveStats.solive_harvest_year || '').trim() || '2026-2027';
  const nextHarvest = (() => {
    const m = harvestYear.match(/^(\d{4})\s*[-–]\s*(\d{4})$/);
    if (m) return `${Number(m[1]) + 1}-${Number(m[2]) + 1}`;
    return /^\d{4}$/.test(harvestYear) ? Number(harvestYear) + 1 : '';
  })();

  // Sticky CTA
  const [showSticky, setShowSticky] = useState(false);
  const heroRef = useRef(null);
  useEffect(() => {
    // Hidden while the form it points to (or the footer) is on screen, so it never covers them
    const onScroll = () => setShowSticky(window.scrollY > 700 && !anyInView(['#order', '#enquire', 'footer']));
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // WhatsApp widget
  const [waOpen, setWaOpen] = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (submittingRef.current) return;           // ignore double clicks
    setError('');
    setCountryAttempted(true);
    if (!selectedQty) {
      setError(qtyErrorText || t('olv.customError', { min: 1, max: size.maxQty }));
      return;
    }
    if (!form.name.trim()) { setError(t('bk.errName')); return; }
    if (!isValidPhone(form.phone)) { setError(t('bk.errPhone')); return; }
    if (!form.country) { return; }               // shown under the Country field
    if (notServiceable) { setError(t('olv.notServiceable')); return; }
    submittingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch('/api/oil-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, quantity: selectedQty, bottleSize }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || t('booking.networkError'));
      setSubmitted(true);
    } catch (err) {
      setError(err.message || t('booking.networkError'));
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="olive-page">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="olive-hero" ref={heroRef}>
        <div className="olive-hero__bg">
          <img src="/images/olive-oil/olive-grove-autumn.jpeg" alt="Olive grove at Granciare estate, Umbria" />
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
              <a href="/images/olive-oil/solivé-dubai-gold-award-certificate.png" target="_blank" rel="noreferrer" className="trust-pill trust-pill--link">{t('olv.certificate')}</a>
            </div>
          </div>
          <a href="#order" className="btn btn-gold mt-32">{t('oliveOil.heroBtn')}</a>
        </div>
      </section>

      {/* ── CERT / AWARD LOGOS STRIP ─────────────────────── */}
      <section className="olive-cert-strip">
        <div className="container">
          <span className="cert-strip-label">{t('olv.awardsLabel')}</span>
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
              <span className="section-label">{t('olv.productLabel')}</span>
              <h2 className="section-title" style={{ fontSize: '32px' }}>{t('olv.harvestTitle', { year: harvestYear })}</h2>
              {/* Chemistry panel */}
              <div className="chem-panel">
                <div className="chem-stat">
                  <span className="chem-val">{soliveStats.solive_acidity}</span>
                  <span className="chem-key">{t('olv.acidity')}</span>
                </div>
                <div className="chem-divider" />
                <div className="chem-stat">
                  <span className="chem-val">{soliveStats.solive_polyphenols}</span>
                  <span className="chem-key">{t('olv.polyphenols')}</span>
                </div>
                <div className="chem-divider" />
                <div className="chem-stat">
                  <span className="chem-val" style={harvestYear.length > 4 ? { fontSize: '15px', paddingTop: '4px' } : undefined}>{harvestYear}</span>
                  <span className="chem-key">{t('olv.harvestYear')}</span>
                </div>
                <div className="chem-divider" />
                <div className="chem-stat">
                  <span className="chem-val" style={{ fontSize: '14px', paddingTop: '4px' }}>{soliveStats.solive_cultivar}</span>
                  <span className="chem-key">{t('olv.cultivar')}</span>
                </div>
              </div>

              {/* Tasting notes compact */}
              <div className="tasting-compact">
                <span className="tasting-compact__label">{t('olv.tastingLabel')}</span>
                <p className="tasting-compact__text">{t('olv.tastingText')}</p>
                <div className="intensity-row">
                  <span className="intensity-label-sm">{t('olv.delicate')}</span>
                  <div className="intensity-track-sm">
                    <div className="intensity-fill-sm" />
                    <div className="intensity-dot-sm" />
                  </div>
                  <span className="intensity-label-sm" style={{ color: 'var(--gold-lt)' }}>{t('olv.robust')}</span>
                </div>
              </div>

              {/* Bottle size */}
              <div className="qty-selector">
                <span className="qty-selector__label">{t('olv.bottleSize')}</span>
                <div className="qty-presets">
                  {BOTTLE_SIZES.map(z => (
                    <button
                      type="button"
                      key={z.id}
                      className={`qty-btn qty-btn--size${bottleSize === z.id ? ' qty-btn--active' : ''}`}
                      onClick={() => chooseSize(z.id)}
                      aria-pressed={bottleSize === z.id}
                    >
                      <span className="qty-btn__num">{z.label}</span>
                    </button>
                  ))}
                </div>
                {size.shippingNotice && <p className="qty-size-note">{t('olv.fiveLNotice')}</p>}
              </div>

              {/* Quantity */}
              <div className="qty-selector">
                <span className="qty-selector__label">{t('olv.selectQty')}</span>
                <div className="qty-presets">
                  {size.presets.map(n => (
                    <button
                      type="button"
                      key={n}
                      className={`qty-btn${!isCustom && selection === n ? ' qty-btn--active' : ''}`}
                      onClick={() => chooseQty(n)}
                    >
                      <span className="qty-btn__num">{n}</span>
                      <span className="qty-btn__unit">{t('olv.btls')}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`qty-btn${isCustom ? ' qty-btn--active' : ''}`}
                    onClick={() => chooseQty('custom')}
                  >
                    <span className="qty-btn__num" style={{ fontSize: '0.75rem', letterSpacing: '0.03em' }}>{t('olv.custom')}</span>
                    <span className="qty-btn__unit">{t('olv.btls')}</span>
                  </button>
                </div>
                {isCustom && (
                  <input
                    type="number"
                    min="1"
                    max={size.maxQty}
                    step="1"
                    className="qty-custom-input"
                    placeholder={t('olv.customPhMax', { max: size.maxQty })}
                    value={customQty}
                    onChange={e => { setCustomQty(e.target.value); setError(''); }}
                  />
                )}
                {qtyErrorText && <p className="qty-custom-error" role="alert">{qtyErrorText}</p>}
                <div className="qty-price">
                  {price ? (
                    <>
                      <span className="qty-total">€{price.total.toLocaleString()}</span>
                      <span className="qty-per-bottle">€{price.perBottle.toFixed(2)} {t('olv.perBottle')}</span>
                    </>
                  ) : selectedQty ? (
                    <span className="qty-per-bottle">{t('bk.priceOnRequest')}</span>
                  ) : null}
                  {selectedQty && <span className="qty-volume">{t('olv.totalVolume', { v: formatVolume(selectedQty * size.ml, lang) })}</span>}
                </div>
              </div>

              {/* Order limits */}
              <div className="moq-note">
                <span className="moq-note__icon">🫒</span>
                <p>
                  <strong>{t('olv.limitTitle')}.</strong> {t('olv.limitText')}
                </p>
              </div>

              <a href="#enquire" className="btn btn-primary btn-full">{t('olv.enquire')}</a>
              <a
                href="https://wa.me/393520730769"
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline btn-full"
              >
                {t('olv.orderWhatsapp')}
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
            <span className="section-label" style={{ justifyContent: 'center' }}>{t('olv.servingLabel')}</span>
            <h2 className="section-title">{t('olv.servingTitle')}</h2>
          </div>
          <div className="pairing-row">
            {pairings.map(p => (
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
              <span className="section-label">{t('olv.shipLabel')}</span>
              <h3 className="logistics-h3">{t('olv.shipTitle')}</h3>
              <div className="ship-cards">
                <div className="ship-card">
                  <span className="ship-region">🇮🇹 {t('olv.shipEU')}</span>
                  <div className="ship-rows">
                    <div className="ship-row"><span>{t('olv.delivery')}</span><span>{t('olv.days', { n: '3–5' })}</span></div>
                    <div className="ship-row"><span>{t('olv.standard')}</span><span>{t('olv.freeOver')}</span></div>
                  </div>
                </div>
                <div className="ship-card">
                  <span className="ship-region">🇬🇧 {t('olv.shipUK')}</span>
                  <div className="ship-rows">
                    <div className="ship-row"><span>{t('olv.delivery')}</span><span>{t('olv.days', { n: '5–7' })}</span></div>
                    <div className="ship-row"><span>DHL</span><span>{t('olv.from', { n: 18 })}</span></div>
                  </div>
                </div>
                <div className="ship-card">
                  <span className="ship-region">🌍 {t('olv.shipWorld')}</span>
                  <div className="ship-rows">
                    <div className="ship-row"><span>{t('olv.delivery')}</span><span>{t('olv.days', { n: '7–10' })}</span></div>
                    <div className="ship-row"><span>DHL Express</span><span>{t('olv.from', { n: 28 })}</span></div>
                  </div>
                </div>
              </div>
              <p className="logistics-note">{t('olv.shipNote')}</p>
            </div>

            {/* Storage */}
            <div className="logistics-col">
              <span className="section-label">{t('olv.storeLabel')}</span>
              <h3 className="logistics-h3">{t('olv.storeTitle')}</h3>
              <div className="storage-tiles">
                {storageTips.map(tip => (
                  <div key={tip.ico} className="storage-tile">
                    <span className="storage-ico">{tip.ico}</span>
                    <div>
                      <span className="storage-title">{tip.title}</span>
                      <span className="storage-sub">{tip.sub}</span>
                    </div>
                  </div>
                ))}
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

      {/* ── HARVEST SIGNUP ───────────────────────────────── */}
      <section className="olive-harvest-signup">
        <div className="olive-harvest-signup__bg">
          <img src="/images/olive-oil/olive-harvest-nets.jpeg" alt="Olive harvest nets" />
          <div className="olive-harvest-signup__overlay" />
        </div>
        <div className="container olive-harvest-signup__content">
          <div className="harvest-ornament">🫒</div>
          <h2 className="harvest-title">{t('olv.harvestTitle1')}<br /><em>{t('olv.harvestTitle2', { year: nextHarvest })}</em></h2>
          <p className="harvest-sub">{t('olv.harvestSub')}</p>
          {harvestDone ? (
            <p className="harvest-done">{t('olv.harvestDone')}</p>
          ) : (
            <form className="harvest-form" onSubmit={submitHarvest}>
              <input
                type="email"
                className="harvest-input"
                placeholder="your@email.com"
                value={harvestEmail}
                onChange={e => setHarvestEmail(e.target.value)}
                required
              />
              <button type="submit" className="harvest-btn" disabled={harvestSending}>{harvestSending ? t('common.sending') : t('olv.notifyMe')}</button>
            </form>
          )}
          {harvestError && !harvestDone && (
            <p className="harvest-error" role="alert">{harvestError}</p>
          )}
          <p className="harvest-note">{t('olv.harvestNote')}</p>
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
                    <input type="text" name="name" value={form.name} onChange={handle} placeholder={t('common.fullName')} maxLength={100} required />
                  </div>
                  <div className="form-group">
                    <label>{t('oliveOil.phoneNumber')}</label>
                    <input type="tel" name="phone" value={form.phone} onChange={handle} placeholder="+1 234 567 8900" required />
                  </div>
                </div>
                <div className="olive-form__row">
                  <div className="form-group">
                    <label>{t('common.email')}</label>
                    <input type="email" name="email" value={form.email} onChange={handle} placeholder="your@email.com" required />
                  </div>
                  <div className="form-group">
                    <label>{t('olv.bottleSize')}</label>
                    <select name="bottleSize" value={bottleSize} onChange={e => chooseSize(e.target.value)}>
                      {BOTTLE_SIZES.map(z => <option key={z.id} value={z.id}>{z.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="olive-form__row">
                  <div className="form-group">
                    <label>{t('oliveOil.numberOfBottles')}</label>
                    <select name="bottles" value={isCustom ? 'custom' : String(selection)} onChange={e => chooseQty(e.target.value)}>
                      {size.presets.map(n => <option key={n} value={n}>{t('olv.bottlesOpt', { n })}</option>)}
                      <option value="custom">{t('olv.customOpt')}</option>
                    </select>
                    {isCustom && (
                      <input
                        type="number"
                        min="1"
                        max={size.maxQty}
                        step="1"
                        value={customQty}
                        onChange={e => { setCustomQty(e.target.value); setError(''); }}
                        placeholder={t('olv.customPhMax', { max: size.maxQty })}
                        required
                        style={{ marginTop: '10px' }}
                      />
                    )}
                    {qtyErrorText && <p className="form-hint form-hint--error" style={{ marginTop: '8px' }}>{qtyErrorText}</p>}
                    {price && (
                      <p className="form-hint" style={{ marginTop: '8px' }}>
                        {t('olv.summarySize', { n: selectedQty, size: size.label, per: price.perBottle.toFixed(2), total: price.total.toLocaleString() })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="olive-form__row olive-form__row--address">
                  <div className="form-group">
                    <label>{t('oliveOil.deliveryAddress')}</label>
                    <input type="text" name="address" value={form.address} onChange={onAddressChange} placeholder={t('olv.addressPhNoCountry')} autoComplete="street-address" required />
                  </div>
                  <div className="form-group">
                    <label>{t('olv.country')}</label>
                    <select
                      name="country"
                      value={form.country}
                      onChange={e => {
                        const country = e.target.value;
                        // Picking a country keeps it; clearing it lets the address guess again
                        setCountryTouched(Boolean(country)); setCountryGuessed(false);
                        setForm(f => ({ ...f, country: country || guessCountry(f.address) }));
                        if (!country) setCountryGuessed(Boolean(guessCountry(form.address)));
                        setError('');
                      }}
                      className={notServiceable || countryMissing ? 'input--error' : undefined}
                      autoComplete="country"
                      aria-required="true"
                      aria-invalid={countryMissing || notServiceable}
                    >
                      <option value="">{t('olv.selectCountry')}</option>
                      {countryOptions.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                    {countryGuessed && !countryTouched && form.country && !notServiceable && (
                      <p className="form-hint" style={{ marginTop: '6px' }}>{t('olv.countryDetected')}</p>
                    )}
                    {notServiceable && <p className="form-hint form-hint--error" role="alert" style={{ marginTop: '6px' }}>{t('olv.notServiceable')}</p>}
                    {countryMissing && <p className="form-hint form-hint--error" role="alert" style={{ marginTop: '6px' }}>{t('olv.errCountry')}</p>}
                  </div>
                </div>
                <div className="form-group">
                  <label>{t('common.message')}</label>
                  <textarea name="message" value={form.message} onChange={handle} placeholder={t('olv.messagePh')} rows={3} />
                </div>
                {error && (
                  <div className="booking-widget__error" style={{ marginBottom:'12px', padding:'12px 16px', background:'#fff3f3', border:'1px solid #f5c2c2', color:'#c0392b', fontSize:'14px' }}>
                    {error}
                  </div>
                )}
                <button type="submit" className="btn btn-primary" disabled={loading || !selectedQty || notServiceable}>
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
            <span className="sticky-order__name">{t('olv.stickyNameNoSize', { year: harvestYear })}</span>
            {minPrice != null && <span className="sticky-order__price">{t('olv.stickyFrom', { price: minPrice % 1 ? minPrice.toFixed(2) : minPrice })}</span>}
          </div>
          <a href="#order" className="btn btn-gold sticky-order__btn">{t('olv.orderNow')}</a>
        </div>
      </div>

      {/* ── 5 L SHIPPING NOTICE ──────────────────────────── */}
      {showFiveLNotice && (
        <div className="oil-notice" role="dialog" aria-modal="true" aria-labelledby="oil-notice-text" onClick={() => setShowFiveLNotice(false)}>
          <div className="oil-notice__card" onClick={e => e.stopPropagation()}>
            <span className="oil-notice__icon">🚚</span>
            <p id="oil-notice-text" className="oil-notice__text">{t('olv.fiveLNotice')}</p>
            <button type="button" className="btn btn-primary" autoFocus onClick={() => setShowFiveLNotice(false)}>{t('olv.iUnderstand')}</button>
          </div>
        </div>
      )}

      {/* ── WHATSAPP FLOAT ───────────────────────────────── */}
      <div className="wa-float">
        {waOpen && (
          <div className="wa-card">
            <button className="wa-card__close" onClick={() => setWaOpen(false)}>✕</button>
            <div className="wa-card__title">{t('olv.waTitle')}</div>
            <div className="wa-card__num">+39 352 0730769</div>
            <div className="wa-card__note">{t('olv.waNote')}</div>
            <a
              href="https://wa.me/393520730769"
              target="_blank"
              rel="noreferrer"
              className="wa-card__btn"
            >
              {t('olv.waStart')}
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
