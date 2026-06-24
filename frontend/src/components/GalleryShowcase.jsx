import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import './GalleryShowcase.css';

const showcases = [
  {
    name: 'The Landscape',
    tag: 'Estate Grounds',
    desc: 'Ancient cypress alleys, cobblestone paths and valley panoramas stretching to the horizon. The land is as much a part of Granciare as the stone walls that frame it.',
    cover: '/images/landscape/cypress-trees-valley-view.jpeg',
    images: [
      '/images/landscape/cypress-trees-valley-view.jpeg',
      '/images/landscape/cobblestone-road-cypress-walls.jpeg',
      '/images/landscape/granciare-entrance-sign.jpeg',
      '/images/landscape/entrance-driveway.jpeg',
      '/images/landscape/lush-garden-valley-view.jpeg',
      '/images/landscape/estate-view-green-meadow.jpeg',
      '/images/landscape/estate-view-through-trees.jpeg',
      '/images/landscape/garden-view-hills.jpeg',
      '/images/landscape/driveway-cypress-trees.jpeg',
      '/images/landscape/cobblestone-path-estate.jpeg',
      '/images/landscape/estate-courtyard-terrace-view.jpeg',
      '/images/landscape/estate-driveway-gravel-path.jpeg',
      '/images/landscape/garden-cypress-seating-area.jpeg',
    ],
    captions: [
      'Cypress trees & valley view',
      'Cobblestone road with cypress walls',
      'Granciare entrance sign',
      'Estate entrance driveway',
      'Lush garden & valley',
      'Estate view — green meadow',
      'Estate through the trees',
      'Garden view with hills',
      'Driveway lined with cypress',
      'Cobblestone path through estate',
      'Estate courtyard & terrace',
      'Gravel driveway approach',
      'Garden seating under cypress',
    ],
  },
  {
    name: 'Pool & Amenities',
    tag: 'Estate Facilities',
    desc: 'A full-length pool with uninterrupted views of the Umbrian hills, a private kitchen, an intimate dining room with open fireplace, and every comfort arranged around you.',
    cover: '/images/pool/pool-valley-panorama.jpeg',
    images: [
      '/images/pool/pool-valley-panorama.jpeg',
      '/images/pool/pool-sunloungers-valley.jpeg',
      '/images/pool/pool-aerial-estate.jpeg',
      '/images/pool/pool-blue-water-day.jpeg',
      '/images/pool/pool-close-up-calm.jpeg',
      '/images/pool/pool-loungers-rainy-valley.jpeg',
      '/images/pool/kitchen-marble-island.jpeg',
      '/images/pool/kitchen-marble-diningtable.jpeg',
      '/images/pool/kitchen-stone-countertop.jpeg',
      '/images/pool/kitchen-wooden-cabinets.jpeg',
      '/images/pool/kitchen-rustic-terracotta.jpeg',
      '/images/pool/kitchen-overhead-view.jpeg',
      '/images/pool/dining-room-fireplace.jpeg',
      '/images/pool/dining-room-tables-fireplace.jpeg',
      '/images/pool/outdoor-dining-stone-arch.jpeg',
    ],
    captions: [
      'Pool with valley panorama',
      'Pool — sunloungers & valley',
      'Pool — aerial estate view',
      'Pool — blue water, sunny day',
      'Pool — calm close-up',
      'Pool — rainy valley atmosphere',
      'Kitchen — marble island',
      'Kitchen — marble with dining table',
      'Kitchen — stone countertop',
      'Kitchen — wooden cabinets',
      'Kitchen — rustic terracotta',
      'Kitchen — overhead view',
      'Dining room with fireplace',
      'Dining room — tables & fireplace',
      'Outdoor dining under stone arch',
    ],
  },
  {
    name: 'Rooms & Suites',
    tag: 'Accommodations',
    desc: 'Three distinctive rooms — each with antique furnishings, hand-hewn beamed ceilings and a character shaped by centuries of Italian country living.',
    cover: '/images/rooms/bedroom-beamed-ceiling-wooden-closets.jpeg',
    images: [
      '/images/rooms/bedroom-beamed-ceiling-wooden-closets.jpeg',
      '/images/rooms/bedroom-antique-carved-bed.jpeg',
      '/images/rooms/bedroom-iron-bed-classic.jpeg',
      '/images/rooms/bedroom-iron-bed-dresser.jpeg',
      '/images/rooms/bedroom-iron-bed-colourful-rug.jpeg',
      '/images/rooms/bedroom-floral-headboard.jpeg',
      '/images/rooms/bedroom-white-curtains.jpeg',
      '/images/rooms/bedroom-white-evening-light.jpeg',
      '/images/rooms/bedroom-wooden-doors-beamed-ceiling.jpeg',
      '/images/rooms/bedroom-dresser-mirror.jpeg',
      '/images/rooms/bedroom-painting-iron-bed.jpeg',
      '/images/rooms/bedroom-wardrobe-window.jpeg',
      '/images/rooms/living-room-stone-arch-brown-sofa.jpeg',
      '/images/rooms/living-room-sofas.jpeg',
      '/images/rooms/living-room-fireplace.jpeg',
      '/images/rooms/living-room-fireplace-tv.jpeg',
      '/images/rooms/living-room-yellow-sofas.jpeg',
      '/images/rooms/living-room-green-sofa-arch.jpeg',
      '/images/rooms/living-room-green-sofa-lattice.jpeg',
      '/images/rooms/living-room-grey-sofa-trunktable.jpeg',
      '/images/rooms/living-room-sofa-lattice-windows.jpeg',
      '/images/rooms/living-room-gold-armchairs.jpeg',
      '/images/rooms/bathroom-bidet-blue-bottles.jpeg',
      '/images/rooms/bathroom-classic-fixtures.jpeg',
      '/images/rooms/bathroom-stone-sink.jpeg',
      '/images/rooms/bathroom-tiled.jpeg',
      '/images/rooms/bathroom-vessel-sink-wood.jpeg',
      '/images/rooms/study-room-antique-desk.jpeg',
      '/images/rooms/study-room-angle-2.jpeg',
      '/images/rooms/bar-lounge-leather-chairs.jpeg',
      '/images/rooms/bar-lounge-mezzanine-view.jpeg',
      '/images/rooms/reception-lounge-ring-lights.jpeg',
      '/images/rooms/reception-lounge-stone-wall.jpeg',
      '/images/rooms/reception-desk-orchid.jpeg',
      '/images/rooms/entrance-hall-round-arch.jpeg',
      '/images/rooms/hallway-mirror-sculptures.jpeg',
      '/images/rooms/exterior-stone-window-decor.jpeg',
    ],
    captions: [
      'Suite — beamed ceiling & wooden closets',
      'Suite — antique carved bed',
      'Bedroom — classic iron bed',
      'Bedroom — iron bed & dresser',
      'Bedroom — iron bed & colourful rug',
      'Bedroom — floral headboard',
      'Bedroom — white curtains',
      'Bedroom — white linens, evening light',
      'Bedroom — wooden doors & beams',
      'Bedroom — dresser & mirror',
      'Bedroom — painting & iron bed',
      'Bedroom — wardrobe & window',
      'Living room — stone arch & sofa',
      'Living room — sofas',
      'Living room — fireplace',
      'Living room — fireplace & TV',
      'Living room — yellow sofas',
      'Living room — green sofa & arch',
      'Living room — green sofa & lattice windows',
      'Living room — grey sofa & trunk table',
      'Living room — sofa & lattice windows',
      'Living room — gold armchairs',
      'Bathroom — bidet & blue bottles',
      'Bathroom — classic fixtures',
      'Bathroom — stone sink',
      'Bathroom — tiled',
      'Bathroom — vessel sink & wood',
      'Study room — antique desk',
      'Study room — angle 2',
      'Bar lounge — leather chairs',
      'Bar lounge — mezzanine view',
      'Reception lounge — ring lights',
      'Reception lounge — stone wall',
      'Reception desk — orchid',
      'Entrance hall — round arch',
      'Hallway — mirror & sculptures',
      'Stone window exterior detail',
    ],
  },
];

function Lightbox({ showcase, startIndex, onClose }) {
  const [current, setCurrent] = useState(startIndex);
  const total = showcase.images.length;

  const prev = useCallback(() => setCurrent(c => (c - 1 + total) % total), [total]);
  const next = useCallback(() => setCurrent(c => (c + 1) % total), [total]);

  useEffect(() => {
    const handler = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose, prev, next]);

  return (
    <div className="lightbox" onClick={onClose}>
      <div className="lightbox__header" onClick={e => e.stopPropagation()}>
        <span className="lightbox__title">{showcase.name}</span>
        <span className="lightbox__counter">{current + 1} / {total}</span>
        <button className="lightbox__close" onClick={onClose} aria-label="Close">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div className="lightbox__stage" onClick={e => e.stopPropagation()}>
        <button className="lightbox__nav lightbox__nav--prev" onClick={prev} aria-label="Previous">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <div className="lightbox__img-wrap">
          <img
            key={current}
            src={showcase.images[current]}
            alt={showcase.captions[current]}
            className="lightbox__img"
          />
          <p className="lightbox__caption">{showcase.captions[current]}</p>
        </div>

        <button className="lightbox__nav lightbox__nav--next" onClick={next} aria-label="Next">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      <div className="lightbox__thumbs" onClick={e => e.stopPropagation()}>
        {showcase.images.map((src, i) => (
          <button
            key={i}
            className={`lightbox__thumb ${i === current ? 'lightbox__thumb--active' : ''}`}
            onClick={() => setCurrent(i)}
            title={showcase.captions[i]}
          >
            <img src={src} alt={showcase.captions[i]} loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ShowcaseCard({ showcase, t }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxStart, setLightboxStart] = useState(0);

  const openLightbox = (index = 0) => {
    setLightboxStart(index);
    setLightboxOpen(true);
  };

  // show cover + 3 thumb previews
  const thumbs = showcase.images.slice(1, 4);
  const remaining = showcase.images.length - 4;

  return (
    <>
      <div className="showcase-card">
        {/* Main cover image */}
        <div className="showcase-card__main" onClick={() => openLightbox(0)}>
          <img src={showcase.cover} alt={showcase.name} />
          <div className="showcase-card__main-overlay">
            <span className="showcase-card__view-all">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              {t('granciare.showcaseViewAll', { n: showcase.images.length })}
            </span>
          </div>
          <div className="showcase-card__badge"><span>{showcase.tag}</span></div>
        </div>

        {/* 3 thumbnails with "+N more" on last */}
        <div className="showcase-card__thumbs">
          {thumbs.map((src, i) => (
            <div
              key={i}
              className="showcase-card__thumb"
              onClick={() => openLightbox(i + 1)}
            >
              <img src={src} alt={`${showcase.name} ${i + 2}`} loading="lazy" />
              {i === 2 && remaining > 0 && (
                <div className="showcase-card__thumb-more">
                  <span>{t('granciare.showcaseMore', { n: remaining })}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Text */}
        <div className="showcase-card__body">
          <h3 className="showcase-card__name">{showcase.name}</h3>
          <p className="showcase-card__desc">{showcase.desc}</p>
        </div>
      </div>

      {lightboxOpen && (
        <Lightbox
          showcase={showcase}
          startIndex={lightboxStart}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

export default function GalleryShowcase() {
  const { t, ta } = useTranslation();
  // Get translated card texts and merge with the static image data
  const showcaseTexts = ta('granciare.showcase');
  const mergedShowcases = showcases.map((s, i) => ({
    ...s,
    name: showcaseTexts[i]?.name ?? s.name,
    tag:  showcaseTexts[i]?.tag  ?? s.tag,
    desc: showcaseTexts[i]?.desc ?? s.desc,
  }));

  return (
    <section className="section granciare__showcase-section">
      <div className="container">
        <span className="section-label">{t('granciare.showcaseLabel')}</span>
        <h2 className="section-title">{t('granciare.showcaseTitle')}</h2>
        <p className="section-subtitle mb-48">{t('granciare.showcaseSub')}</p>
        <div className="showcase__grid">
          {mergedShowcases.map(s => (
            <ShowcaseCard key={s.name} showcase={s} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
