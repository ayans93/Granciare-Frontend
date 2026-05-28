import { useState } from 'react';
import './Poderetto.css';

const features = [
  { icon: '🏡', title: 'Private Estate', desc: 'An entirely separate property on the same grounds, designed for ultimate privacy.' },
  { icon: '🫒', title: 'Grove Access', desc: 'Exclusive access to the western olive grove — the oldest section of the estate.' },
  { icon: '🍽️', title: 'Shared Dining', desc: 'Optional shared tables with Granciare guests for those who want community.' },
  { icon: '♾️', title: 'Infinity Pool', desc: 'A dedicated pool with uninterrupted views across the valley to the south.' },
];

export default function Poderetto() {
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
            Opening Soon
          </div>
          <h1 className="pod-hero__title">
            Poderetto
          </h1>
          <p className="pod-hero__sub">
            The second chapter of the Granciare estate. A property with its own distinct soul — arriving soon.
          </p>
          <a href="#register" className="btn btn-gold mt-32">Register Your Interest</a>
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
              <span className="section-label">The Second Chapter</span>
              <h2 className="section-title">
                Same estate.<br />
                A different<br />
                <em>story.</em>
              </h2>
              <p className="pod-body">
                Poderetto sits at the northern edge of the estate — quieter, more private, with its own distinct architecture and character. Where Granciare draws from the warmth of central Italian farmhouse tradition, Poderetto has been designed with a lighter touch.
              </p>
              <p className="pod-body mt-16">
                We are not ready to open its doors yet. But for those who want to be first — we'll reach out before anyone else.
              </p>
              <div className="pod-timeline mt-32">
                <div className="pod-timeline__item pod-timeline__item--done">
                  <span className="pod-timeline__dot" />
                  <span>Design completed</span>
                </div>
                <div className="pod-timeline__item pod-timeline__item--done">
                  <span className="pod-timeline__dot" />
                  <span>Restoration underway</span>
                </div>
                <div className="pod-timeline__item pod-timeline__item--active">
                  <span className="pod-timeline__dot" />
                  <span>Finishing & furnishing</span>
                </div>
                <div className="pod-timeline__item">
                  <span className="pod-timeline__dot" />
                  <span>Soft opening to registered guests</span>
                </div>
                <div className="pod-timeline__item">
                  <span className="pod-timeline__dot" />
                  <span>Full public launch</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="section pod-features">
        <div className="container">
          <div className="text-center mb-48">
            <span className="section-label" style={{justifyContent:'center'}}>What to Expect</span>
            <h2 className="section-title">Designed for discernment</h2>
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
              <span className="section-label">Be First</span>
              <h2 className="section-title">
                Register your<br />interest
              </h2>
              <p className="pod-body">
                Poderetto will open its doors to a limited number of guests. Those on our list receive first access — before any public launch.
              </p>
              <p className="pod-body mt-16">
                No spam. One email when we're ready. That's the only promise we make.
              </p>
            </div>

            <div className="pod-register__form-wrap">
              {registered ? (
                <div className="pod-registered">
                  <div className="pod-registered__icon">✓</div>
                  <h3>You're on the list.</h3>
                  <p>We'll reach out personally when Poderetto is ready to welcome its first guests. Thank you for your interest.</p>
                </div>
              ) : (
                <form className="pod-form" onSubmit={submit}>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" name="name" value={form.name} onChange={handle} placeholder="Your name" required />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" name="email" value={form.email} onChange={handle} placeholder="your@email.com" required />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Register Interest
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </button>
                  <p className="pod-form__note">No spam, ever. Just one email when we open.</p>
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
              <h3 className="pod-bridge__title">Stay at Granciare in the meantime</h3>
              <p className="pod-bridge__desc">Granciare is open now. The olive oil experience, the pool, the chef — all waiting.</p>
            </div>
            <a href="/" className="btn btn-outline">Book Granciare</a>
          </div>
        </div>
      </section>

    </div>
  );
}
