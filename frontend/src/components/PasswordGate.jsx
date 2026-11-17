import { useState } from 'react';
import './PasswordGate.css';

// Credentials are checked on the server (/api/gate); none are stored in this file.

const SESSION_KEY = '_gc_auth';

const SESSION_DAYS = 7;

// Sign-in is remembered in this browser (all tabs) for SESSION_DAYS
export function isAuthenticated() {
  try {
    if (sessionStorage.getItem(SESSION_KEY) === '1') return true;
    const until = Number(localStorage.getItem(SESSION_KEY) || 0);
    return until > Date.now();
  } catch {
    return false;
  }
}

export default function PasswordGate({ onAuth }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Could not sign in. Please try again.');
        setLoading(false);
        return;
      }
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
        localStorage.setItem(SESSION_KEY, String(Date.now() + SESSION_DAYS * 86400000));
      } catch {}
      setLoading(false);
      onAuth();
    } catch {
      setError('Could not reach the server. Please check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="gate">
      <div className="gate__card">
        {/* Logo */}
        <div className="gate__logo">
          <span className="gate__logo-main">Granciare</span>
          <span className="gate__logo-sub">Estate · Umbria</span>
        </div>

        <p className="gate__invite">
          This site is currently in private preview.<br />
          Please sign in to continue.
        </p>

        <form className="gate__form" onSubmit={submit} noValidate>
          <div className="gate__field">
            <label className="gate__label" htmlFor="gate-email">Email Address</label>
            <input
              id="gate-email"
              className="gate__input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="gate__field">
            <label className="gate__label" htmlFor="gate-password">Password</label>
            <input
              id="gate-password"
              className="gate__input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••••••"
              required
            />
          </div>

          {error && (
            <p className="gate__error" role="alert">{error}</p>
          )}

          <button className="gate__btn" type="submit" disabled={loading || !email || !password}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="gate__footer">
          Need access? Contact&nbsp;
          <a href="mailto:info@granciare.com">info@granciare.com</a>
        </p>
      </div>
    </div>
  );
}
