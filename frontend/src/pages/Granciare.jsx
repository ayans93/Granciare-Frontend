import BookingWidget from '../components/BookingWidget';
import './Granciare.css';

const amenities = [
  { icon: '🏊', label: 'Private Pool', desc: 'Heated infinity pool overlooking the Umbrian hills' },
  { icon: '🫒', label: 'Olive Groves', desc: '400-year-old trees surrounding the estate' },
  { icon: '🍷', label: 'Wine Cellar', desc: 'Curated regional wines for private tastings' },
  { icon: '🍽️', label: 'Private Chef', desc: 'Farm-to-table Umbrian cuisine on request' },
  { icon: '🚗', label: 'Transfers', desc: 'Airport & city transfers arranged' },
  { icon: '🧖', label: 'Wellness', desc: 'In-villa massage and wellness treatments' },
  { icon: '🌿', label: 'Organic Garden', desc: 'Seasonal produce grown on the estate' },
  { icon: '🔥', label: 'Fireplace', desc: 'Stone fireplaces in each living space' },
];

const rooms = [
  {
    name: 'The Master Suite',
    size: '65 m²',
    beds: 'King bed',
    desc: 'The crown jewel of Granciare. Floor-to-ceiling windows frame the valley, while original stone walls and a private terrace complete the picture.',
    img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
  },
  {
    name: 'Garden Room',
    size: '45 m²',
    beds: 'Queen bed',
    desc: 'Step directly into the olive grove from your private garden door. Rustic beamed ceilings meet carefully curated Italian linens.',
    img: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&q=80',
  },
  {
    name: 'The Loft',
    size: '55 m²',
    beds: 'Twin or King',
    desc: 'A characterful upper-floor retreat with mezzanine reading nook, exposed timber beams and views across the valley.',
    img: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=800&q=80',
  },
];

const gallery = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=80',
  'https://images.unsplash.com/photo-1519974719765-e6559eac2575?w=900&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&q=80',
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=900&q=80',
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
  return (
    <div className="granciare">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero__bg">
          <img
            src="https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1800&q=85"
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
                <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=700&q=80" alt="Villa exterior" />
              </div>
              <div className="intro-img intro-img--accent">
                <img src="https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80" alt="Olive grove" />
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
              <div key={a.label} className="amenity-card">
                <span className="amenity-card__icon">{a.icon}</span>
                <h4 className="amenity-card__label">{a.label}</h4>
                <p className="amenity-card__desc">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROOMS ────────────────────────────────────────────── */}
      <section className="section granciare__rooms">
        <div className="container">
          <span className="section-label">Accommodations</span>
          <h2 className="section-title">Suites & Rooms</h2>
          <p className="section-subtitle mb-48">
            Three distinctive spaces, each with its own character and soul.
          </p>
          <div className="rooms__grid">
            {rooms.map(r => (
              <div key={r.name} className="room-card">
                <div className="room-card__image">
                  <img src={r.img} alt={r.name} />
                  <div className="room-card__badge">
                    <span>{r.beds}</span>
                    <span>{r.size}</span>
                  </div>
                </div>
                <div className="room-card__body">
                  <h3 className="room-card__name">{r.name}</h3>
                  <p className="room-card__desc">{r.desc}</p>
                  <a href="#book" className="btn btn-outline mt-16">Enquire</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY ──────────────────────────────────────────── */}
      <section className="granciare__gallery">
        <div className="container mb-32">
          <span className="section-label">The Estate in Images</span>
          <h2 className="section-title">A visual journey</h2>
        </div>
        <div className="gallery__grid">
          {gallery.map((src, i) => (
            <div key={i} className={`gallery__item gallery__item--${i + 1}`}>
              <img src={src} alt={`Gallery ${i + 1}`} />
            </div>
          ))}
        </div>
      </section>

      {/* ── OLIVE OIL TEASER ─────────────────────────────────── */}
      <section className="section granciare__olive-teaser">
        <div className="container">
          <div className="olive-teaser">
            <div className="olive-teaser__img">
              <img src="https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=700&q=80" alt="Olive grove" />
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
      <section className="section granciare__booking">
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
