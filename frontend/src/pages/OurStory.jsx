import './OurStory.css';

const milestones = [
  { year: '1600s', event: 'The olive groves are first planted on the hillside above Umbria.' },
  { year: '1980', event: 'The estate comes into the family. A decision to preserve, not develop.' },
  { year: '2010', event: 'The bottling plant is built — an industrial scale operation, ahead of its time.' },
  { year: '2022', event: 'The idea of Granciare begins. Not a hotel. A home that shares its story.' },
  { year: '2024', event: 'Granciare opens. The first guests arrive. The estate finds its voice.' },
  { year: 'Soon', event: 'Poderetto opens. The second chapter of the same story, told differently.' },
];

export default function OurStory() {
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
          <span className="story-hero__eyebrow">Our Story</span>
          <h1 className="story-hero__title">
            Built on<br />
            <em>600 years</em><br />
            of roots
          </h1>
        </div>
      </section>

      {/* ── OPENING ──────────────────────────────────────────── */}
      <section className="section story-opening">
        <div className="container">
          <div className="story-opening__inner">
            <p className="story-pull">
              "We didn't set out to build a luxury property. We set out to share something that had been quietly extraordinary for generations — and to invite people in."
            </p>
            <div className="story-opening__divider" />
            <p className="story-body">
              The estate has been in the family since the early 1980s. For most of that time, it was simply home — a working olive farm in the hills between Umbria and Tuscany, producing oil that found its way into fine restaurants across northern Italy.
            </p>
            <p className="story-body mt-16">
              The idea of opening Granciare came slowly. A weekend guest would ask to see the olive press. A friend would stay for a harvest and leave changed. Someone from Milan would suggest, half-joking, that the bottling plant would make an extraordinary tour.
            </p>
            <p className="story-body mt-16">
              Eventually, we listened.
            </p>
          </div>
        </div>
      </section>

      {/* ── IMAGE SPLIT ──────────────────────────────────────── */}
      <section className="story-split">
        <div className="story-split__img">
          <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80" alt="Table at Granciare" />
        </div>
        <div className="story-split__content">
          <span className="section-label">What We Believe</span>
          <h2 className="section-title">
            Luxury is a<br />
            byproduct of care
          </h2>
          <p className="story-body">
            We don't think about luxury as a category. We think about care — for the land, for the guests, for the craft of what we produce. When you care at that level, luxury follows naturally.
          </p>
          <p className="story-body mt-16">
            Our olive oil is pressed within hours of picking. The chef sources from the estate garden and the local market that has served this valley for three hundred years. The linen is chosen for how it feels on a warm Italian morning, not how it photographs.
          </p>
          <p className="story-body mt-16">
            This is the ethos of Granciare. It is not complicated. It is just rare.
          </p>
        </div>
      </section>

      {/* ── TIMELINE ─────────────────────────────────────────── */}
      <section className="section story-timeline">
        <div className="container">
          <div className="text-center mb-48">
            <span className="section-label" style={{justifyContent:'center'}}>The Journey</span>
            <h2 className="section-title">Six hundred years, a few key moments</h2>
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

      {/* ── THE LAND ─────────────────────────────────────────── */}
      <section className="section story-land">
        <div className="container">
          <div className="story-land__grid">
            <div>
              <span className="section-label">The Land</span>
              <h2 className="section-title">
                This soil<br />is the story
              </h2>
              <p className="story-body">
                The Umbria–Tuscany border is not a line on a map. It is a shift in light — the point where the hills begin to soften, where the olive trees grow older and more gnarled, where the quality of silence changes.
              </p>
              <p className="story-body mt-16">
                Our estate sits precisely on that line. In the morning, you can see both regions from the terrace. In the evening, both disappear into the same dusk.
              </p>
              <p className="story-body mt-16">
                We think that's fitting. Granciare has never belonged entirely to one tradition. It belongs to the land — and the land has its own story.
              </p>
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

      {/* ── CLOSING CTA ──────────────────────────────────────── */}
      <section className="story-cta">
        <div className="story-cta__bg">
          <img src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1800&q=85" alt="Granciare at sunset" />
          <div className="story-cta__overlay" />
        </div>
        <div className="container story-cta__content">
          <h2 className="story-cta__title">
            The story is best<br />
            <em>experienced in person</em>
          </h2>
          <p className="story-cta__sub">
            We'd love to welcome you to the estate.
          </p>
          <div className="story-cta__actions">
            <a href="/" className="btn btn-primary">Book Granciare</a>
            <a href="/olive-oil" className="btn btn-outline-light">Explore the Olive Oil Experience</a>
          </div>
        </div>
      </section>

    </div>
  );
}
