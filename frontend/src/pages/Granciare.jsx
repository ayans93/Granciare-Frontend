import { useState } from 'react';
import BookingWidget from '../components/BookingWidget';
import GalleryShowcase from '../components/GalleryShowcase';
import PhotoAlbum from '../components/PhotoAlbum';
import './Granciare.css';

/* ── SVG Icons for amenities ─────────────────────────────── */
const IconPool = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="34" cy="10" r="4"/>
    <path d="M26 18l8-4-4 12-8 4"/>
    <path d="M6 36c3 0 5-2 8-2s5 2 8 2 5-2 8-2 5 2 8 2"/>
    <path d="M6 42c3 0 5-2 8-2s5 2 8 2 5-2 8-2 5 2 8 2"/>
    <path d="M18 30l-6-12 8-4"/>
  </svg>
);
const IconOlive = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M24 44V20"/>
    <ellipse cx="16" cy="14" rx="8" ry="12" transform="rotate(-20 16 14)"/>
    <ellipse cx="32" cy="14" rx="8" ry="12" transform="rotate(20 32 14)"/>
    <path d="M14 22c2 4 6 6 10 6"/>
    <path d="M34 22c-2 4-6 6-10 6"/>
  </svg>
);
const IconWine = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 6h20l-4 18a6 6 0 01-12 0L14 6z"/>
    <line x1="24" y1="30" x2="24" y2="42"/>
    <line x1="16" y1="42" x2="32" y2="42"/>
    <path d="M14 16h20"/>
  </svg>
);
const IconChef = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 20a10 10 0 0120 0"/>
    <rect x="10" y="20" width="28" height="6" rx="1"/>
    <rect x="14" y="26" width="20" height="16" rx="2"/>
    <line x1="20" y1="34" x2="20" y2="38"/>
    <line x1="28" y1="34" x2="28" y2="38"/>
    <line x1="24" y1="26" x2="24" y2="42"/>
  </svg>
);
const IconCar = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 24l4-10h24l4 10"/>
    <rect x="4" y="24" width="40" height="12" rx="3"/>
    <circle cx="14" cy="38" r="4"/>
    <circle cx="34" cy="38" r="4"/>
    <line x1="18" y1="38" x2="30" y2="38"/>
    <line x1="4" y1="30" x2="44" y2="30"/>
    <line x1="14" y1="24" x2="16" y2="18"/>
    <line x1="34" y1="24" x2="32" y2="18"/>
  </svg>
);
const IconSpa = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M24 8C14 8 8 16 8 24c0 6 4 10 8 12"/>
    <path d="M24 8C34 8 40 16 40 24c0 6-4 10-8 12"/>
    <path d="M16 36c2 2 5 4 8 4s6-2 8-4"/>
    <path d="M24 8v32"/>
    <ellipse cx="24" cy="20" rx="6" ry="10"/>
  </svg>
);
const IconGarden = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M24 40V20"/>
    <path d="M24 20C24 20 16 16 12 8c6 0 12 4 12 12z"/>
    <path d="M24 26C24 26 32 22 36 14c-6 0-12 4-12 12z"/>
    <path d="M24 32C24 32 16 28 12 20c6 0 12 4 12 12z"/>
    <line x1="14" y1="40" x2="34" y2="40"/>
  </svg>
);
const IconFire = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M24 6c0 0-12 10-12 22a12 12 0 0024 0C36 16 24 6 24 6z"/>
    <path d="M24 28c0 0-6 4-6 8a6 6 0 0012 0c0-4-6-8-6-8z"/>
  </svg>
);

const amenities = [
  { Icon: IconPool,   label: 'Private Pool',    desc: 'Full-length pool overlooking the Umbrian hills', color: 'warm' },
  { Icon: IconOlive,  label: 'Olive Groves',    desc: '400-year-old trees surrounding the estate',     color: 'grey' },
  { Icon: IconWine,   label: 'Wine Cellar',     desc: 'Curated regional wines for private tastings',   color: 'warm' },
  { Icon: IconChef,   label: 'Private Chef',    desc: 'Farm-to-table Umbrian cuisine on request',      color: 'grey' },
  { Icon: IconCar,    label: 'Transfers',       desc: 'Airport & city transfers arranged',             color: 'warm' },
  { Icon: IconSpa,    label: 'Wellness',        desc: 'In-villa massage and wellness treatments',      color: 'grey' },
  { Icon: IconGarden, label: 'Organic Garden',  desc: 'Seasonal produce grown on the estate',         color: 'warm' },
  { Icon: IconFire,   label: 'Fireplace',       desc: 'Stone fireplaces in each living space',        color: 'grey' },
];

const gallery = [
  '/images/landscape/gallery-1.jpeg',
  '/images/mansion/gallery-2.jpeg',
  '/images/pool/gallery-3.jpeg',
  '/images/rooms/gallery-4.jpeg',
  '/images/pool/gallery-5.jpeg',
  '/images/pool/gallery-6.jpeg',
];

const testimonials = [
  {
    quote: "Granciare is unlike anything I've experienced. The olive oil tour alone was worth the journey from New York.",
    name: 'Sarah M.',
    origin: 'New York, USA',
  },
  {
    quote: "Waking up to the Umbrian hills with a private chef preparing breakfast — this is what luxury travel should feel like.",
    name: 'James & Ellie T.',
    origin: 'London, UK',
  },
  {
    quote: "The attention to detail is extraordinary. Every moment felt curated, yet completely authentic.",
    name: 'Marco F.',
    origin: 'Milan, Italy',
  },
];

export default function Granciare() {
  const [albumOpen, setAlbumOpen] = useState(false);

  return (
    <div className="granciare">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero__bg">
          <img
            src="/images/mansion/hero.jpeg"
            alt="Granciare Estate, Umbria"
          />
          <div className="hero__overlay" />
        </div>
        <div className="hero__content container">
          <div className="hero__badge">Granciare · Umbria, Italy</div>
          <h1 className="hero__title">
            An Estate Born<br />
            <em>from the Land</em>
          </h1>
          <p className="hero__sub">
            Luxury villa stays amid 400-year-old olive groves. An experience as rare as the oil they produce.
          </p>
          <div className="hero__actions">
            <a href="#book" className="btn btn-primary">Reserve Your Stay</a>
            <a href="#story" className="btn btn-outline-light">Discover the Estate</a>
          </div>
        </div>
        <div className="hero__scroll">
          <span>Scroll</span>
          <div className="hero__scroll-line" />
        </div>
      </section>

      {/* ── INTRO ────────────────────────────────────────────── */}
      <section className="section granciare__intro" id="story">
        <div className="container">
          <div className="granciare__intro-grid">
            <div className="granciare__intro-text">
              <span className="section-label">The Estate</span>
              <h2 className="section-title">
                Where ancient stone<br />meets modern luxury
              </h2>
              <p className="granciare__body">
                Granciare is not a hotel. It is a private Italian estate — a place where time slows, where the landscape becomes part of your daily rhythm, and where every detail has been chosen with intention.
              </p>
              <p className="granciare__body mt-16">
                Nestled on the Umbria–Tuscany border, the estate sits within a working olive farm that has been producing extra virgin olive oil for generations. Guests don't simply visit — they immerse themselves in the life of the land.
              </p>
              <div className="granciare__stats">
                <div className="stat">
                  <span className="stat__number">400+</span>
                  <span className="stat__label">Years of Olive Farming</span>
                </div>
                <div className="stat">
                  <span className="stat__number">8</span>
                  <span className="stat__label">Guests Maximum</span>
                </div>
                <div className="stat">
                  <span className="stat__number">3</span>
                  <span className="stat__label">Exclusive Suites</span>
                </div>
              </div>
            </div>
            <div className="granciare__intro-images">
              <div className="intro-img intro-img--main">
                <img src="/images/mansion/intro-main.jpeg" alt="Villa exterior" />
              </div>
              <div className="intro-img intro-img--accent">
                <img src="/images/landscape/intro-accent.jpeg" alt="Estate driveway" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AMENITIES ────────────────────────────────────────── */}
      <section className="section granciare__amenities">
        <div className="container">
          <div className="text-center mb-48">
            <span className="section-label" style={{justifyContent:'center'}}>What Awaits You</span>
            <h2 className="section-title">Every comfort, curated</h2>
            <p className="section-subtitle" style={{margin:'0 auto'}}>
              Granciare is designed to make you forget the world outside.
            </p>
          </div>
          <div className="amenities__grid">
            {amenities.map(a => (
              <div key={a.label} className={`amenity-card amenity-card--${a.color}`}>
                <div className="amenity-card__icon-wrap">
                  <a.Icon />
                </div>
                <div className="amenity-card__text">
                  <h4 className="amenity-card__label">{a.label}</h4>
                  <p className="amenity-card__desc">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY SHOWCASE ─────────────────────────────────── */}
      <GalleryShowcase />

      {/* ── GALLERY ──────────────────────────────────────────── */}
      <section className="granciare__gallery">
        <div className="gallery__header container">
          <div className="gallery__header-text">
            <span className="section-label">The Estate in Images</span>
            <h2 className="section-title">A visual journey</h2>
          </div>
          <button className="gallery__open-btn" onClick={() => setAlbumOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Browse full photo album
          </button>
        </div>
        <div className="gallery__grid">
          {gallery.map((src, i) => (
            <div
              key={i}
              className={`gallery__item gallery__item--${i + 1}`}
              onClick={() => setAlbumOpen(true)}
              title="Click to open full photo album"
            >
              <img src={src} alt={`Gallery ${i + 1}`} />
              <div className="gallery__item-overlay">
                <span>View all photos</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {albumOpen && <PhotoAlbum onClose={() => setAlbumOpen(false)} />}

      {/* ── OLIVE OIL TEASER ─────────────────────────────────── */}
      <section className="section granciare__olive-teaser">
        <div className="container">
          <div className="olive-teaser">
            <div className="olive-teaser__img">
              <img src="/images/olive-oil/teaser.jpeg" alt="Granciare Olive Oil" />
            </div>
            <div className="olive-teaser__content">
              <span className="section-label">Included Experience</span>
              <h2 className="section-title">
                The Olive Oil<br />
                <em>Journey</em>
              </h2>
              <p className="granciare__body">
                Walk the groves that surround your villa. Witness the harvest. Step inside our working bottling plant for an experience no other luxury property in Italy can offer.
              </p>
              <p className="granciare__body mt-16">
                This is not a tour. It's an education in where exceptional olive oil comes from — told from the inside.
              </p>
              <a href="/olive-oil" className="btn btn-primary mt-32">Explore the Experience</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="section granciare__testimonials">
        <div className="container">
          <div className="text-center mb-48">
            <span className="section-label" style={{justifyContent:'center'}}>Guest Stories</span>
            <h2 className="section-title">Those who've stayed</h2>
          </div>
          <div className="testimonials__grid">
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card">
                <div className="testimonial-card__stars">★★★★★</div>
                <blockquote className="testimonial-card__quote">"{t.quote}"</blockquote>
                <div className="testimonial-card__author">
                  <span className="testimonial-card__name">{t.name}</span>
                  <span className="testimonial-card__origin">{t.origin}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOOKING ──────────────────────────────────────────── */}
      <section className="section granciare__booking" id="book">
        <div className="container">
          <div className="granciare__booking-grid">
            <div className="granciare__booking-info">
              <span className="section-label">Direct Booking</span>
              <h2 className="section-title">
                Reserve<br />Granciare
              </h2>
              <p className="granciare__body">
                All bookings are handled personally by our team. No third-party platforms. No hidden fees. A direct line to the people who care for the estate.
              </p>
              <div className="contact-options mt-32">
                <a href="https://wa.me/39000000000" target="_blank" rel="noreferrer" className="contact-option">
                  <span className="contact-option__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.121 1.532 5.849L.057 23.5l5.797-1.522A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.001-1.366l-.36-.213-3.44.903.918-3.355-.234-.374A9.817 9.817 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z"/>
                    </svg>
                  </span>
                  <div>
                    <span className="contact-option__label">WhatsApp</span>
                    <span className="contact-option__value">Fastest response</span>
                  </div>
                </a>
                <a href="mailto:info@granciare.com" className="contact-option">
                  <span className="contact-option__icon">✉</span>
                  <div>
                    <span className="contact-option__label">Email</span>
                    <span className="contact-option__value">info@granciare.com</span>
                  </div>
                </a>
                <a href="tel:+390000000000" className="contact-option">
                  <span className="contact-option__icon">☎</span>
                  <div>
                    <span className="contact-option__label">Phone</span>
                    <span className="contact-option__value">+39 000 000 0000</span>
                  </div>
                </a>
              </div>
            </div>
            <BookingWidget variant="light" />
          </div>
        </div>
      </section>

    </div>
  );
}
