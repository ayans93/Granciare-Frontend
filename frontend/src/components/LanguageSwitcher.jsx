import { useState, useRef, useEffect } from 'react';
import { LANGUAGES, useTranslation } from '../i18n/LanguageContext';
import './LanguageSwitcher.css';

export default function LanguageSwitcher() {
  const { lang, setLang } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (code) => {
    setLang(code);
    setOpen(false);
  };

  return (
    <div className="lang-sw" ref={ref}>
      <button
        className="lang-sw__trigger"
        onClick={() => setOpen(o => !o)}
        aria-label="Change language"
        aria-expanded={open}
      >
        <span className="lang-sw__flag">{current.flag}</span>
        <span className="lang-sw__code">{current.code.toUpperCase()}</span>
        <svg
          className={`lang-sw__chevron ${open ? 'lang-sw__chevron--open' : ''}`}
          width="10" height="10" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul className="lang-sw__dropdown" role="listbox">
          {LANGUAGES.map(l => (
            <li
              key={l.code}
              role="option"
              aria-selected={l.code === lang}
              className={`lang-sw__option ${l.code === lang ? 'lang-sw__option--active' : ''}`}
              onClick={() => select(l.code)}
            >
              <span className="lang-sw__flag">{l.flag}</span>
              <span className="lang-sw__name">{l.label}</span>
              {l.code === lang && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
