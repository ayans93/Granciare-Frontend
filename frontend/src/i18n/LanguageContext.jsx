import { createContext, useContext, useState, useCallback } from 'react';
import translations from './translations';

export const LANGUAGES = [
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'it', label: 'Italiano',   flag: '🇮🇹' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'pt', label: 'Português',  flag: '🇵🇹' },
  { code: 'cs', label: 'Čeština',    flag: '🇨🇿' },
];

const LanguageContext = createContext(null);

/**
 * Reads the saved language from localStorage, falling back to 'en'.
 * Only accepts known language codes to prevent tampering.
 */
function getSavedLang() {
  try {
    const saved = localStorage.getItem('granciare_lang');
    if (saved && LANGUAGES.some(l => l.code === saved)) return saved;
  } catch {}
  return 'en';
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getSavedLang);

  const setLang = useCallback((code) => {
    if (LANGUAGES.some(l => l.code === code)) {
      setLangState(code);
      try { localStorage.setItem('granciare_lang', code); } catch {}
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * useTranslation — returns a `t` function for the current language.
 *
 * Usage:
 *   const { t } = useTranslation();
 *   t('nav.bookStay')               → "Book a Stay"
 *   t('booking.tooShort', { min: 2 }) → "Minimum stay is 2 nights…"
 */
export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be used inside <LanguageProvider>');

  const { lang, setLang } = ctx;

  const t = useCallback((key, vars = {}) => {
    const parts = key.split('.');
    let node = translations;
    for (const part of parts) {
      if (node && typeof node === 'object') node = node[part];
      else { node = undefined; break; }
    }
    if (!node || typeof node !== 'object') return key; // fallback to key

    // Pick the correct language, falling back to English
    let str = node[lang] ?? node['en'] ?? key;

    // Replace {var} placeholders
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{${k}}`, v);
    }
    return str;
  }, [lang]);

  /**
   * ta(key) — resolves an array from translations, mapping each item's
   * language-keyed string properties to the current language.
   * Non-language-keyed properties (like `color`, `num`, `img`, `icon`) pass through.
   *
   * Usage:
   *   const amenities = ta('granciare.amenities');
   *   // → [{ label: 'Private Pool', desc: '...', color: 'warm' }, ...]
   */
  const ta = useCallback((key) => {
    const parts = key.split('.');
    let node = translations;
    for (const part of parts) {
      if (node && typeof node === 'object') node = node[part];
      else return [];
    }
    if (!Array.isArray(node)) return [];

    return node.map(item => {
      const resolved = {};
      for (const [k, v] of Object.entries(item)) {
        if (v && typeof v === 'object' && !Array.isArray(v) && ('en' in v)) {
          // Language-keyed object — resolve to current lang with English fallback
          resolved[k] = v[lang] ?? v['en'] ?? '';
        } else {
          resolved[k] = v;
        }
      }
      return resolved;
    });
  }, [lang]);

  return { t, ta, lang, setLang };
}

export default LanguageContext;
