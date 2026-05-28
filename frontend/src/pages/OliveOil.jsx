import { useState } from 'react';
import './OliveOil.css';

const steps = [
  {
    num: '01',
    title: 'The Grove Walk',
    desc: 'Begin at dawn among 400-year-old olive trees. Your guide explains the varieties, the harvest cycle, and the micro-climate that makes Umbrian oil singular.',
    img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=700&q=80',
  },
  {
    num: '02',
    title: 'The Harvest',
    desc: 'Depending on season, you may participate in the harvest itself — hand-picking olives as generations before you have done. A deeply physical, deeply meditative experience.',
    img: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=700&q=80',
  },
  {
    num: '03',
    title: 'The Cold Press',
    desc: 'Inside the mill, watch the olives transformed within hours of picking. The cold-press process extracts oil at its most vibrant — you smell the difference immediately.',
    img: 'https://images.unsplash.com/photo-1515023115689-589c33041d3c?w=700&q=80',
  },
  {
    num: '04',
    title: 'The Bottling Plant',
    desc: 'Our working industrial bottling facility is unlike anything open to guests anywhere in Italy. A behind-the-scenes look at how artisan oil meets modern precision.',
    img: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=700&q=80',
  },
  {
    num: '05',
    title: 'The Tasting',
    desc: 'A guided tasting of three vintages — each poured over warm Umbrian bread. Understand acidity, bitterness, pungency. Leave with a bottle of your own.',
    img: 'https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?w=700&q=80',
  },
];

const facts = [
  { number: '400+', label: 'Olive Trees on the Estate' },
  { number: '5hrs', label: 'Immersive Experience' },
  { number: '3', label: 'Oil Varieties Produced' },
  { number: '1', label: 'Bottling Plant in Italy Open to Guests' },
];

export default function OliveOil() {
  const [form, setForm] = useState({ name: '', email: '', date: '', guests: '2', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = e => { e.preventDefault(); setSubmitted(true); };

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
          <span className="olive-hero__badge">Agri-Tourism Experience</span>
          <h1 className="olive-hero__title">
            From Grove<br />
            <em>to Bottle</em>
          </h1>
          <p className="olive-hero__sub">
            The only guest-accessible industrial olive oil bottling experience in Italy. A journey through 400 years of craft.
          </p>
          <a href="#enquire" className="btn btn-gold mt-32">Book the Experience</a>
        </div>
      </section>

      {/* ── INTRO ────────────────────────────────────────────── */}
      <section className="section olive-intro">
        <div className="container">
          <div className="olive-intro__grid">
            <div>
              <span className="section-label">What Makes This Unique</span>
              <h2 className="section-title">
                No other property<br />offers this
              </h2>
            </div>
            <div>
              <p className="olive-body">
                Every luxury estate in Tuscany and Umbria has an olive grove. Many produce oil. Some offer tastings. But not one — not a single property open to guests — has an operational industrial bottling plant that visitors can walk through.
              </p>
              <p className="olive-body mt-16">
                Ours does. And it changes the nature of the experience entirely. This isn't countryside tourism. It's an education in provenance, in craft, in what separates a €6 supermarket olive oil from a €45 estate bottle.
              </p>
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
            <span className="section-label" style={{justifyContent:'center'}}>The Journey</span>
            <h2 className="section-title">Five acts, one story</h2>
            <p className="section-subtitle" style={{margin:'0 auto'}}>
              A half-day experience designed to be educational, sensory, and utterly unforgettable.
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
          <blockquote className="olive-banner__quote">
            "The bottling plant visit was unlike anything I've done in twenty years of travelling Italy. You simply cannot replicate this experience anywhere else."
          </blockquote>
          <cite className="olive-banner__cite">— Carlo R., Milan, Italy</cite>
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
              <span className="section-label">What You Leave With</span>
              <h2 className="section-title">More than a memory</h2>
              <ul className="olive-takeaway__list">
                {[
                  'A 500ml bottle of estate-pressed extra virgin olive oil',
                  'A certificate of your participation in the harvest',
                  'A tasting journal to record your sensory notes',
                  'Access to order directly from the estate at home',
                  'Knowledge that changes how you cook forever',
                ].map(item => (
                  <li key={item}>
                    <span className="olive-check">✓</span>
                    {item}
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
              <span className="section-label" style={{justifyContent:'center'}}>Book Your Experience</span>
              <h2 className="section-title">Reserve the Olive Oil Journey</h2>
              <p className="section-subtitle" style={{margin:'0 auto'}}>
                The experience runs by appointment for villa guests and select day visitors. Spaces are strictly limited.
              </p>
            </div>

            {submitted ? (
              <div className="olive-success">
                <div className="olive-success__icon">✓</div>
                <h3>Enquiry Sent</h3>
                <p>We'll be in touch within 24 hours to confirm your olive oil experience.</p>
              </div>
            ) : (
              <form className="olive-form" onSubmit={submit}>
                <div className="olive-form__row">
                  <div className="form-group">
                    <label>Your Name</label>
                    <input type="text" name="name" value={form.name} onChange={handle} placeholder="Full name" required />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" name="email" value={form.email} onChange={handle} placeholder="your@email.com" required />
                  </div>
                </div>
                <div className="olive-form__row">
                  <div className="form-group">
                    <label>Preferred Date</label>
                    <input type="date" name="date" value={form.date} onChange={handle} min={new Date().toISOString().split('T')[0]} required />
                  </div>
                  <div className="form-group">
                    <label>Number of Guests</label>
                    <select name="guests" value={form.guests} onChange={handle}>
                      {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n===1?'Person':'People'}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Message (optional)</label>
                  <textarea name="message" value={form.message} onChange={handle} placeholder="Any dietary requirements, accessibility needs, or questions…" />
                </div>
                <button type="submit" className="btn btn-primary">
                  Send Enquiry
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
