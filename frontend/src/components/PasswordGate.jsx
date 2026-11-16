import { useState } from 'react';
import './PasswordGate.css';

// ── Allowed credentials (case-insensitive email) ───────────
const CREDENTIALS = [
  { email: 'info@granciare.com',                 password: 'Granciare@2026' },
  { email: 'info@agriturismocolleverde.net',      password: 'Granciare@2026' },
  { email: 'gaurav@drishyamfilms.com',            password: 'Granciare@2026' },
  { email: 'ayan@dviu.in',                        password: 'Granciare@2026' },
  { email: 'mmundra@gmail.com',                   password: 'Granciare@2026' },
  { email: 'mundradisha13@gmail.com',             password: 'Granciare@2026' },
  { email: 'armoryan@gmail.com',                  password: 'Granciare@2026' },
];

const SESSION_KEY = '_gc_auth';

export function isAuthenticated() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export default function PasswordGate({ onAuth }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const submit = e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // small artificial delay so the button feedback feels intentional
    setTimeout(() => {
      const normalised = email.trim().toLowerCase();
      const match = CREDENTIALS.find(c => c.email.toLowerCase() === normalised);

      if (!match) {
        setError('No account found for that email address.');
        setLoading(false);
        return;
      }
      if (match.password !== password) {
        setError('Incorrect password. Please try again.');
        setLoading(false);
        return;
      }

      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch {}
      setLoading(false);
      onAuth();
    }, 400);
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
