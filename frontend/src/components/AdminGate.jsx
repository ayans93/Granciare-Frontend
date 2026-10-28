/**
 * AdminGate — React-based access gate
 * Gate runs client-side after React hydration, avoiding Vercel CDN caching issues.
 * Session is persisted in localStorage.
 */

import { useState, useEffect, useRef } from 'react';
import './AdminGate.css';

const STORAGE_KEY = 'granciare_admin_v1';

export default function AdminGate({ children }) {
  const [authed, setAuthed] = useState(false);
  const [ready,  setReady]  = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'granted') setAuthed(true);
    setReady(true);
  }, []);

  if (!ready)  return null;
  if (authed)  return <>{children}</>;
  return <MaintenancePage onLogin={() => setAuthed(true)} />;
}

/* ─────────────────────────────────────────────────────────────── */

function MaintenancePage({ onLogin }) {
  const [showModal, setShowModal] = useState(false);
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const emailRef = useRef(null);

  const openModal = () => {
    setShowModal(true);
    setTimeout(() => emailRef.current?.focus(), 80);
  };

  const closeModal = () => {
    setShowModal(false);
    setError('');
    setEmail('');
    setPassword('');
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin-login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), password }),
      });
      const ct   = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json() : {};
      if (res.ok && data.ok) {
        localStorage.setItem(STORAGE_KEY, 'granted');
        onLogin();
      } else {
        setError(data.error || 'Invalid email or password.');
        setPassword('');
        emailRef.current?.focus();
      }
    } catch {
      setError('Connection error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Enter')  handleLogin();
  };

  return (
    <div className="gate">
      {/* ── Main content ── */}
      <div className="gate__content">
        <p className="gate__eyebrow">Umbria, Italy · Luxury Estate</p>
        <h1 className="gate__title">Granciare</h1>
        <p className="gate__subtitle">Estate &amp; Agri-Tourism</p>
        <div className="gate__rule" />
        <p className="gate__message">
          We are putting the finishing touches on something beautiful.
          <br />
          The estate will be ready to welcome you very soon.
        </p>

        {/* Admin login — visibly placed inside the content block */}
        <button className="gate__login-link" onClick={openModal}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Admin Login
        </button>
      </div>

      <p className="gate__footer">granciare.com · 2026</p>

      {/* ── Login modal ── */}
      {showModal && (
        <div className="gate__overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="gate__modal" onKeyDown={onKey}>
            <button className="gate__close" onClick={closeModal} aria-label="Close">×</button>
            <p className="gate__modal-eye">Granciare Estate</p>
            <h2 className="gate__modal-title">Admin Access</h2>

            <div className="gate__field">
              <label htmlFor="g-email">Email Address</label>
              <input
                id="g-email"
                ref={emailRef}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
              />
            </div>

            <div className="gate__field">
              <label htmlFor="g-pass">Password</label>
              <input
                id="g-pass"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
              />
            </div>

            <button className="gate__submit" onClick={handleLogin} disabled={loading}>
              {loading ? 'Verifying…' : 'Enter Estate'}
            </button>

            {error && <p className="gate__error">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
