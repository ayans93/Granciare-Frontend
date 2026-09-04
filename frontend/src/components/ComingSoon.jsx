import { useState } from 'react';

export default function ComingSoon() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = e => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1410',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Background image overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: "url('/images/landscape/cypress-trees-valley-view.jpeg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.18,
      }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(20,14,8,0.85) 100%)',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 640 }}>

        {/* Decorative line */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 40 }}>
          <div style={{ height: 1, width: 60, background: '#C9A96E', opacity: 0.6 }} />
          <span style={{ color: '#C9A96E', fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', opacity: 0.9 }}>
            Allerona · Umbria · Italy
          </span>
          <div style={{ height: 1, width: 60, background: '#C9A96E', opacity: 0.6 }} />
        </div>

        {/* Estate name */}
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(42px, 8vw, 80px)',
          fontWeight: 400,
          color: '#F7F3EC',
          lineHeight: 1.1,
          marginBottom: 8,
          letterSpacing: '-0.01em',
        }}>
          Granciare
        </h1>

        <p style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 'clamp(16px, 2.5vw, 22px)',
          color: '#C9A96E',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 48,
          fontWeight: 300,
        }}>
          Estate &amp; Agriturismo
        </p>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 48 }}>
          <div style={{ height: 1, flex: 1, background: 'linear-gradient(to right, transparent, #9B9188)' }} />
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="6.36" y="0" width="2" height="14" rx="1" fill="#C9A96E" transform="rotate(45 7 7)" opacity="0.7"/>
            <rect x="0" y="6.36" width="14" height="2" rx="1" fill="#C9A96E" transform="rotate(45 7 7)" opacity="0.7"/>
          </svg>
          <div style={{ height: 1, flex: 1, background: 'linear-gradient(to left, transparent, #9B9188)' }} />
        </div>

        {/* Message */}
        <p style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(20px, 3vw, 28px)',
          fontWeight: 400,
          fontStyle: 'italic',
          color: '#EDE6D8',
          marginBottom: 16,
          lineHeight: 1.4,
        }}>
          Something beautiful is coming.
        </p>

        <p style={{
          fontSize: 15,
          color: '#9B9188',
          lineHeight: 1.8,
          marginBottom: 52,
          maxWidth: 480,
          margin: '0 auto 52px',
        }}>
          We are putting the final touches on our website. In the meantime,
          leave your email and we'll reach out when we are ready to welcome you.
        </p>

        {/* Email form */}
        {!submitted ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 0, maxWidth: 420, margin: '0 auto 48px' }}>
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                flex: 1,
                padding: '14px 20px',
                background: 'rgba(247,243,236,0.07)',
                border: '1px solid rgba(201,169,110,0.35)',
                borderRight: 'none',
                borderRadius: '2px 0 0 2px',
                color: '#F7F3EC',
                fontSize: 14,
                outline: 'none',
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            />
            <button
              type="submit"
              style={{
                padding: '14px 24px',
                background: '#C9A96E',
                border: '1px solid #C9A96E',
                borderRadius: '0 2px 2px 0',
                color: '#1a1410',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: "'Inter', system-ui, sans-serif",
                transition: 'background 0.2s',
              }}
            >
              Notify Me
            </button>
          </form>
        ) : (
          <p style={{
            fontSize: 15,
            color: '#C9A96E',
            marginBottom: 48,
            fontFamily: "'Playfair Display', Georgia, serif",
            fontStyle: 'italic',
          }}>
            Thank you — we will be in touch soon.
          </p>
        )}

        {/* Contact line */}
        <p style={{ fontSize: 13, color: '#9B9188', letterSpacing: '0.05em' }}>
          For enquiries:{' '}
          <a
            href="mailto:info@granciare.com"
            style={{ color: '#C4BAB0', borderBottom: '1px solid rgba(196,186,176,0.3)', paddingBottom: 1 }}
          >
            info@granciare.com
          </a>
        </p>

        {/* Bottom decoration */}
        <div style={{ marginTop: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ height: 1, width: 40, background: '#9B9188', opacity: 0.4 }} />
          <span style={{ color: '#9B9188', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7 }}>
            Est. 2025
          </span>
          <div style={{ height: 1, width: 40, background: '#9B9188', opacity: 0.4 }} />
        </div>
      </div>
    </div>
  );
}
