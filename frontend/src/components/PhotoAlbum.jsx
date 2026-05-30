import { useState, useEffect, useCallback, useRef } from 'react';
import './PhotoAlbum.css';

/* ── All images organised by category ──────────────────────── */
const CATEGORIES = [
  {
    key: 'all',
    label: 'All Photos',
    images: [],   // filled below
  },
  {
    key: 'mansion',
    label: 'Mansion',
    images: [
      '/images/mansion/mansion-front-vine-arch.jpeg',
      '/images/mansion/mansion-front-stone-arch-ivy.jpeg',
      '/images/mansion/mansion-front-courtyard.jpeg',
      '/images/mansion/mansion-side-pool-lawn.jpeg',
      '/images/mansion/mansion-side-courtyard-stairs.jpeg',
      '/images/mansion/mansion-side-entrance.jpeg',
      '/images/mansion/mansion-from-garden.jpeg',
      '/images/mansion/mansion-lawn-cypress.jpeg',
      '/images/mansion/mansion-courtyard-hdr.jpeg',
      '/images/mansion/mansion-terrace-view.jpeg',
      '/images/mansion/mansion-rooftop-view-valley.jpeg',
      '/images/mansion/mansion-rooftop-flowers-valley.jpeg',
      '/images/mansion/mansion-stone-arch-entrance.jpeg',
      '/images/mansion/mansion-stone-facade-parking.jpeg',
      '/images/mansion/mansion-stone-wall-terracotta.jpeg',
      '/images/mansion/mansion-terrace-staircase.jpeg',
      '/images/mansion/mansion-pool-estate-aerial.jpeg',
      '/images/mansion/stone-building-exterior.jpeg',
    ],
  },
  {
    key: 'landscape',
    label: 'Landscape',
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
  },
  {
    key: 'pool',
    label: 'Pool',
    images: [
      '/images/pool/pool-valley-panorama.jpeg',
      '/images/pool/pool-sunloungers-valley.jpeg',
      '/images/pool/pool-aerial-estate.jpeg',
      '/images/pool/pool-blue-water-day.jpeg',
      '/images/pool/pool-close-up-calm.jpeg',
      '/images/pool/pool-loungers-rainy-valley.jpeg',
    ],
  },
  {
    key: 'dining',
    label: 'Dining',
    images: [
      '/images/pool/dining-room-fireplace.jpeg',
      '/images/pool/dining-room-tables-fireplace.jpeg',
      '/images/pool/outdoor-dining-stone-arch.jpeg',
    ],
  },
  {
    key: 'kitchen',
    label: 'Kitchen',
    images: [
      '/images/pool/kitchen-marble-island.jpeg',
      '/images/pool/kitchen-marble-diningtable.jpeg',
      '/images/pool/kitchen-stone-countertop.jpeg',
      '/images/pool/kitchen-wooden-cabinets.jpeg',
      '/images/pool/kitchen-rustic-terracotta.jpeg',
      '/images/pool/kitchen-overhead-view.jpeg',
    ],
  },
  {
    key: 'bedrooms',
    label: 'Bedrooms',
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
    ],
  },
  {
    key: 'living',
    label: 'Living Areas',
    images: [
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
    ],
  },
  {
    key: 'bathrooms',
    label: 'Bathrooms',
    images: [
      '/images/rooms/bathroom-bidet-blue-bottles.jpeg',
      '/images/rooms/bathroom-classic-fixtures.jpeg',
      '/images/rooms/bathroom-stone-sink.jpeg',
      '/images/rooms/bathroom-tiled.jpeg',
      '/images/rooms/bathroom-vessel-sink-wood.jpeg',
    ],
  },
  {
    key: 'lounge',
    label: 'Lounge & Bar',
    images: [
      '/images/rooms/bar-lounge-leather-chairs.jpeg',
      '/images/rooms/bar-lounge-mezzanine-view.jpeg',
      '/images/rooms/study-room-antique-desk.jpeg',
      '/images/rooms/study-room-angle-2.jpeg',
      '/images/rooms/reception-lounge-ring-lights.jpeg',
      '/images/rooms/reception-lounge-stone-wall.jpeg',
      '/images/rooms/reception-desk-orchid.jpeg',
      '/images/rooms/entrance-hall-round-arch.jpeg',
      '/images/rooms/hallway-mirror-sculptures.jpeg',
    ],
  },
  {
    key: 'farm',
    label: 'Olive Farm',
    images: [
      '/images/olive-oil/granciare-olive-oil-label.jpeg',
      '/images/olive-oil/granciare-olive-oil-brand-story.jpeg',
      '/images/olive-oil/solivé-bottle-product.jpeg',
      '/images/olive-oil/granciare-olive-oil-recipe-card.jpeg',
    ],
  },
];

// Build "All Photos" from every other category (preserving display order)
const allImages = CATEGORIES.slice(1).flatMap(c => c.images);
CATEGORIES[0].images = allImages;

/* ── Lightbox (single image full-screen) ───────────────────── */
function Lightbox({ images, index, onClose, onChange }) {
  useEffect(() => {
    const h = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onChange((index - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') onChange((index + 1) % images.length);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [images, index, onClose, onChange]);

  return (
    <div className="pa-lightbox" onClick={onClose}>
      <button className="pa-lightbox__close" onClick={onClose}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <button className="pa-lightbox__nav pa-lightbox__nav--prev"
        onClick={e => { e.stopPropagation(); onChange((index - 1 + images.length) % images.length); }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <div className="pa-lightbox__img-wrap" onClick={e => e.stopPropagation()}>
        <img key={index} src={images[index]} alt={`Photo ${index + 1}`} className="pa-lightbox__img" />
        <span className="pa-lightbox__counter">{index + 1} / {images.length}</span>
      </div>
      <button className="pa-lightbox__nav pa-lightbox__nav--next"
        onClick={e => { e.stopPropagation(); onChange((index + 1) % images.length); }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
  );
}

/* ── Main PhotoAlbum modal ─────────────────────────────────── */
export default function PhotoAlbum({ onClose, initialCategory = 'all' }) {
  const [activeCat, setActiveCat] = useState(initialCategory);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const tabsRef = useRef(null);

  const category = CATEGORIES.find(c => c.key === activeCat) || CATEGORIES[0];

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const h = e => { if (e.key === 'Escape' && lightboxIndex === null) onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, lightboxIndex]);

  const switchCat = useCallback(key => {
    setActiveCat(key);
    setLightboxIndex(null);
    // scroll active tab into view
    setTimeout(() => {
      const el = tabsRef.current?.querySelector('.pa-tab--active');
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, 50);
  }, []);

  return (
    <div className="photo-album">
      {/* Header */}
      <div className="pa-header">
        <div className="pa-header__left">
          <span className="pa-header__title">Photo Album</span>
          <span className="pa-header__count">{category.images.length} photos</span>
        </div>
        <button className="pa-header__close" onClick={onClose} aria-label="Close">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Category tabs */}
      <div className="pa-tabs" ref={tabsRef}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            className={`pa-tab ${activeCat === cat.key ? 'pa-tab--active' : ''}`}
            onClick={() => switchCat(cat.key)}
          >
            {cat.label}
            <span className="pa-tab__badge">{cat.images.length}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="pa-grid">
        {category.images.map((src, i) => (
          <div
            key={src}
            className="pa-grid__item"
            onClick={() => setLightboxIndex(i)}
          >
            <img src={src} alt={`${category.label} ${i + 1}`} loading="lazy" />
            <div className="pa-grid__overlay">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Full-image lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={category.images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChange={setLightboxIndex}
        />
      )}
    </div>
  );
}
