import { useState, useRef, useEffect } from 'react';
import './PhoneInput.css';

const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan',           dial: '+93',   flag: '🇦🇫' },
  { code: 'AL', name: 'Albania',               dial: '+355',  flag: '🇦🇱' },
  { code: 'DZ', name: 'Algeria',               dial: '+213',  flag: '🇩🇿' },
  { code: 'AR', name: 'Argentina',             dial: '+54',   flag: '🇦🇷' },
  { code: 'AU', name: 'Australia',             dial: '+61',   flag: '🇦🇺' },
  { code: 'AT', name: 'Austria',               dial: '+43',   flag: '🇦🇹' },
  { code: 'BE', name: 'Belgium',               dial: '+32',   flag: '🇧🇪' },
  { code: 'BR', name: 'Brazil',                dial: '+55',   flag: '🇧🇷' },
  { code: 'BG', name: 'Bulgaria',              dial: '+359',  flag: '🇧🇬' },
  { code: 'CA', name: 'Canada',                dial: '+1',    flag: '🇨🇦' },
  { code: 'CL', name: 'Chile',                 dial: '+56',   flag: '🇨🇱' },
  { code: 'CN', name: 'China',                 dial: '+86',   flag: '🇨🇳' },
  { code: 'CO', name: 'Colombia',              dial: '+57',   flag: '🇨🇴' },
  { code: 'HR', name: 'Croatia',               dial: '+385',  flag: '🇭🇷' },
  { code: 'CY', name: 'Cyprus',                dial: '+357',  flag: '🇨🇾' },
  { code: 'CZ', name: 'Czech Republic',        dial: '+420',  flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark',               dial: '+45',   flag: '🇩🇰' },
  { code: 'EG', name: 'Egypt',                 dial: '+20',   flag: '🇪🇬' },
  { code: 'EE', name: 'Estonia',               dial: '+372',  flag: '🇪🇪' },
  { code: 'FI', name: 'Finland',               dial: '+358',  flag: '🇫🇮' },
  { code: 'FR', name: 'France',                dial: '+33',   flag: '🇫🇷' },
  { code: 'DE', name: 'Germany',               dial: '+49',   flag: '🇩🇪' },
  { code: 'GR', name: 'Greece',                dial: '+30',   flag: '🇬🇷' },
  { code: 'HK', name: 'Hong Kong',             dial: '+852',  flag: '🇭🇰' },
  { code: 'HU', name: 'Hungary',               dial: '+36',   flag: '🇭🇺' },
  { code: 'IN', name: 'India',                 dial: '+91',   flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesia',             dial: '+62',   flag: '🇮🇩' },
  { code: 'IE', name: 'Ireland',               dial: '+353',  flag: '🇮🇪' },
  { code: 'IL', name: 'Israel',                dial: '+972',  flag: '🇮🇱' },
  { code: 'IT', name: 'Italy',                 dial: '+39',   flag: '🇮🇹' },
  { code: 'JP', name: 'Japan',                 dial: '+81',   flag: '🇯🇵' },
  { code: 'JO', name: 'Jordan',                dial: '+962',  flag: '🇯🇴' },
  { code: 'KE', name: 'Kenya',                 dial: '+254',  flag: '🇰🇪' },
  { code: 'KW', name: 'Kuwait',                dial: '+965',  flag: '🇰🇼' },
  { code: 'LV', name: 'Latvia',                dial: '+371',  flag: '🇱🇻' },
  { code: 'LB', name: 'Lebanon',               dial: '+961',  flag: '🇱🇧' },
  { code: 'LT', name: 'Lithuania',             dial: '+370',  flag: '🇱🇹' },
  { code: 'LU', name: 'Luxembourg',            dial: '+352',  flag: '🇱🇺' },
  { code: 'MY', name: 'Malaysia',              dial: '+60',   flag: '🇲🇾' },
  { code: 'MV', name: 'Maldives',              dial: '+960',  flag: '🇲🇻' },
  { code: 'MT', name: 'Malta',                 dial: '+356',  flag: '🇲🇹' },
  { code: 'MX', name: 'Mexico',                dial: '+52',   flag: '🇲🇽' },
  { code: 'MA', name: 'Morocco',               dial: '+212',  flag: '🇲🇦' },
  { code: 'NL', name: 'Netherlands',           dial: '+31',   flag: '🇳🇱' },
  { code: 'NZ', name: 'New Zealand',           dial: '+64',   flag: '🇳🇿' },
  { code: 'NG', name: 'Nigeria',               dial: '+234',  flag: '🇳🇬' },
  { code: 'NO', name: 'Norway',                dial: '+47',   flag: '🇳🇴' },
  { code: 'OM', name: 'Oman',                  dial: '+968',  flag: '🇴🇲' },
  { code: 'PK', name: 'Pakistan',              dial: '+92',   flag: '🇵🇰' },
  { code: 'PE', name: 'Peru',                  flag: '🇵🇪',   dial: '+51'  },
  { code: 'PH', name: 'Philippines',           dial: '+63',   flag: '🇵🇭' },
  { code: 'PL', name: 'Poland',                dial: '+48',   flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal',              dial: '+351',  flag: '🇵🇹' },
  { code: 'QA', name: 'Qatar',                 dial: '+974',  flag: '🇶🇦' },
  { code: 'RO', name: 'Romania',               dial: '+40',   flag: '🇷🇴' },
  { code: 'RU', name: 'Russia',                dial: '+7',    flag: '🇷🇺' },
  { code: 'SA', name: 'Saudi Arabia',          dial: '+966',  flag: '🇸🇦' },
  { code: 'RS', name: 'Serbia',                dial: '+381',  flag: '🇷🇸' },
  { code: 'SG', name: 'Singapore',             dial: '+65',   flag: '🇸🇬' },
  { code: 'SK', name: 'Slovakia',              dial: '+421',  flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia',              dial: '+386',  flag: '🇸🇮' },
  { code: 'ZA', name: 'South Africa',          dial: '+27',   flag: '🇿🇦' },
  { code: 'KR', name: 'South Korea',           dial: '+82',   flag: '🇰🇷' },
  { code: 'ES', name: 'Spain',                 dial: '+34',   flag: '🇪🇸' },
  { code: 'LK', name: 'Sri Lanka',             dial: '+94',   flag: '🇱🇰' },
  { code: 'SE', name: 'Sweden',                dial: '+46',   flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland',           dial: '+41',   flag: '🇨🇭' },
  { code: 'TW', name: 'Taiwan',                dial: '+886',  flag: '🇹🇼' },
  { code: 'TH', name: 'Thailand',              dial: '+66',   flag: '🇹🇭' },
  { code: 'TN', name: 'Tunisia',               dial: '+216',  flag: '🇹🇳' },
  { code: 'TR', name: 'Turkey',                dial: '+90',   flag: '🇹🇷' },
  { code: 'AE', name: 'United Arab Emirates',  dial: '+971',  flag: '🇦🇪' },
  { code: 'GB', name: 'United Kingdom',        dial: '+44',   flag: '🇬🇧' },
  { code: 'US', name: 'United States',         dial: '+1',    flag: '🇺🇸' },
  { code: 'UY', name: 'Uruguay',               dial: '+598',  flag: '🇺🇾' },
  { code: 'VN', name: 'Vietnam',               dial: '+84',   flag: '🇻🇳' },
];

// Default to Italy
const DEFAULT = COUNTRIES.find(c => c.code === 'IT');

export default function PhoneInput({ value, onChange }) {
  const [selected, setSelected] = useState(DEFAULT);
  const [number, setNumber] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Notify parent whenever either part changes
  useEffect(() => {
    onChange(number ? `${selected.dial} ${number}` : '');
  }, [selected, number]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  const filtered = COUNTRIES.filter(c => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.dial.includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  const selectCountry = (country) => {
    setSelected(country);
    setOpen(false);
    setSearch('');
  };

  return (
    <div className="phone-input">
      {/* Country code trigger */}
      <div className="phone-input__code-wrap" ref={dropdownRef}>
        <button
          type="button"
          className={`phone-input__trigger${open ? ' phone-input__trigger--open' : ''}`}
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-label="Select country code"
        >
          <span className="phone-input__flag">{selected.flag}</span>
          <span className="phone-input__dial">{selected.dial}</span>
          <svg className="phone-input__chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {open && (
          <div className="phone-input__dropdown">
            <div className="phone-input__search-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={searchRef}
                type="text"
                className="phone-input__search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search country or code…"
              />
              {search && (
                <button type="button" className="phone-input__search-clear" onClick={() => setSearch('')}>×</button>
              )}
            </div>

            <ul className="phone-input__list">
              {filtered.length === 0 ? (
                <li className="phone-input__empty">No countries found</li>
              ) : filtered.map(c => (
                <li key={c.code}>
                  <button
                    type="button"
                    className={`phone-input__option${selected.code === c.code ? ' phone-input__option--active' : ''}`}
                    onClick={() => selectCountry(c)}
                  >
                    <span className="phone-input__option-flag">{c.flag}</span>
                    <span className="phone-input__option-name">{c.name}</span>
                    <span className="phone-input__option-dial">{c.dial}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Mobile number */}
      <input
        type="tel"
        className="phone-input__number"
        value={number}
        onChange={e => setNumber(e.target.value)}
        placeholder="Mobile number"
      />
    </div>
  );
}
