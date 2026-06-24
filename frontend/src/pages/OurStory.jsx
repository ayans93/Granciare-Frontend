import { useTranslation } from '../i18n/LanguageContext';
import './OurStory.css';

export default function OurStory() {
  const { t, ta } = useTranslation();
  const milestones = ta('ourStory.milestones');

  return (
    <div className="story-page">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="story-hero">
        <div className="story-hero__bg">
          <img
            src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1800&q=85"
            alt="The estate at dusk"
          />
          <div className="story-hero__overlay" />
        </div>
        <div className="story-hero__content container">
          <span className="story-hero__eyebrow">{t('ourStory.heroEyebrow')}</span>
          <h1 className="story-hero__title">
            {t('ourStory.heroLine1')}<br />
            {t('ourStory.heroLine2')}<br />
            <em>{t('ourStory.heroLine3')}</em>
          </h1>
        </div>
      </section>

      {/* ── OPENING ──────────────────────────────────────────── */}
      <section className="section story-opening">
        <div className="container">
          <div className="story-opening__inner">
            <p className="story-pull">{t('ourStory.openingPull')}</p>
            <div className="story-opening__divider" />
            <p className="story-body">{t('ourStory.openingPara1')}</p>
            <p className="story-body mt-16">{t('ourStory.openingPara2')}</p>
            <p className="story-body mt-16">{t('ourStory.openingPara3')}</p>
            <p className="story-body mt-16">{t('ourStory.openingPara4')}</p>
            <p className="story-body mt-16">{t('ourStory.openingPara5')}</p>
          </div>
        </div>
      </section>

      {/* ── IMAGE SPLIT ──────────────────────────────────────── */}
      <section className="story-split">
        <div className="story-split__img">
          <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80" alt="Table at Granciare" />
        </div>
        <div className="story-split__content">
          <span className="section-label">{t('ourStory.beliefLabel')}</span>
          <h2 className="section-title">{t('ourStory.beliefTitle')}</h2>
          <p className="story-body">{t('ourStory.beliefPara1')}</p>
          <p className="story-body mt-16">{t('ourStory.beliefPara2')}</p>
        </div>
      </section>

      {/* ── THE NAME ─────────────────────────────────────────── */}
      <section className="section story-name">
        <div className="container">
          <div className="story-name__inner">
            <span className="section-label">{t('ourStory.nameLabel')}</span>
            <h2 className="section-title">{t('ourStory.nameTitle')}</h2>
            <p className="story-body">{t('ourStory.namePara')}</p>
          </div>
        </div>
      </section>

      {/* ── TIMELINE ─────────────────────────────────────────── */}
      <section className="section story-timeline">
        <div className="container">
          <div className="text-center mb-48">
            <span className="section-label" style={{justifyContent:'center'}}>{t('ourStory.timelineLabel')}</span>
            <h2 className="section-title">{t('ourStory.timelineTitle')}</h2>
          </div>
          <div className="timeline">
            {milestones.map((m, i) => (
              <div key={i} className={`timeline__item ${i % 2 === 0 ? 'timeline__item--left' : 'timeline__item--right'}`}>
                <div className="timeline__year">{m.year}</div>
                <div className="timeline__connector">
                  <div className="timeline__dot" />
                </div>
                <div className="timeline__event">{m.event}</div>
              </div>
            ))}
            <div className="timeline__line" />
          </div>
        </div>
      </section>

      {/* ── THE ESTATE ───────────────────────────────────────── */}
      <section className="section story-land">
        <div className="container">
          <div className="story-land__grid">
            <div>
              <span className="section-label">{t('ourStory.estateLabel')}</span>
              <h2 className="section-title">{t('ourStory.estateTitle')}</h2>
              <p className="story-body">{t('ourStory.estatePara1')}</p>
              <p className="story-body mt-16">{t('ourStory.estatePara2')}</p>
            </div>
            <div className="story-land__images">
              <div className="story-land__img-main">
                <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=700&q=80" alt="Umbrian hills" />
              </div>
              <div className="story-land__img-accent">
                <img src="https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=400&q=80" alt="Estate in afternoon" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOLIVÉ ───────────────────────────────────────────── */}
      <section className="section story-olive">
        <div className="container">
          <div className="story-olive__inner">
            <span className="section-label">{t('ourStory.oilLabel')}</span>
            <h2 className="section-title">{t('ourStory.oilTitle')}</h2>
            <p className="story-body">{t('ourStory.oilPara1')}</p>
            <p className="story-body mt-16">{t('ourStory.oilPara2')}</p>
            <a href="/olive-oil" className="btn btn-primary mt-32">{t('ourStory.exploreOlive')}</a>
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ──────────────────────────────────────── */}
      <section className="story-cta">
        <div className="story-cta__bg">
          <img src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1800&q=85" alt="Granciare at sunset" />
          <div className="story-cta__overlay" />
        </div>
        <div className="container story-cta__content">
          <h2 className="story-cta__title">
            {t('ourStory.ctaTitle1')}<br />
            <em>{t('ourStory.ctaTitle2')}</em>
          </h2>
          <p className="story-cta__sub">{t('ourStory.ctaSub')}</p>
          <div className="story-cta__actions">
            <a href="/" className="btn btn-primary">{t('common.bookGranciare')}</a>
            <a href="/olive-oil" className="btn btn-outline-light">{t('ourStory.exploreOlive')}</a>
          </div>
        </div>
      </section>

    </div>
  );
}
