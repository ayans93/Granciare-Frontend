/**
 * AdminGate
 * Client-side access gate. Shows the maintenance page with a login modal
 * until the user authenticates. Session is persisted in localStorage.
 *
 * This approach avoids all Vercel CDN/edge-middleware caching issues by
 * running entirely inside the React bundle after the page loads.
 */

import { useState, useEffect, useRef } from 'react';
import './AdminGate.css';

const STORAGE_KEY = 'granciare_admin_v1';

export default function AdminGate({ children }) {
  const [authed, setAuthed]   = useState(false);
  const [ready, setReady]     = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setAuthed(stored === 'granted');
    setReady(true);
  }, []);

  // Avoid flash of maintenance page on authenticated visits
  if (!ready) return null;
  if (authed)  return children;

  return <MaintenancePage onLogin={() => setAuthed(true)} />;
}

// ── Maintenance page with embedded login modal ───────────────────
function MaintenancePage({ onLogin }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const emailRef = useRef(null);

  const openModal = () => {
    setModalOpen(true);
    setTimeout(() => emailRef.current?.focus(), 60);
  };

  const closeModal = () => {
    setModalOpen(false);
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Enter' && modalOpen) handleLogin();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setError('Server error — please try again.');
        setLoading(false);
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok === true) {
        localStorage.setItem(STORAGE_KEY, 'granted');
        onLogin();
      } else {
        setError(data.error || 'Invalid email or password.');
        setPassword('');
        setLoading(false);
      }
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="gate" onKeyDown={handleKeyDown}>

      {/* Admin login button — top right */}
      <button className="gate__admin-btn" onClick={openModal}>
        Admin Login
      </button>

      {/* Login modal */}
      {modalOpen && (
        <div className="gate__overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="gate__modal" role="dialog" aria-modal="true">
            <button className="gate__close" onClick={closeModal} aria-label="Close">×</button>

            <p className="gate__modal-eyebrow">Granciare Estate</p>
            <h2 className="gate__modal-title">Admin Access</h2>

            <div className="gate__field">
              <label htmlFor="gate-email">Email Address</label>
              <input
                id="gate-email"
                ref={emailRef}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
              />
            </div>
            <div className="gate__field">
              <label htmlFor="gate-password">Password</label>
              <input
                id="gate-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              className="gate__submit"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? 'Verifying…' : 'Enter Estate'}
            </button>

            {error && <p className="gate__error">{error}</p>}
          </div>
        </div>
      )}

      {/* Main maintenance content */}
      <p className="gate__eyebrow">Umbria, Italy · Luxury Estate</p>
      <h1 className="gate__title">Granciare</h1>
      <p className="gate__subtitle">Estate &amp; Agri-Tourism</p>
      <div className="gate__divider" />
      <p className="gate__message">
        We are putting the finishing touches on something beautiful.<br />
        The estate will be ready to welcome you very soon.
      </p>
      <footer className="gate__footer">granciare.com · 2026</footer>
    </div>
  );
}
