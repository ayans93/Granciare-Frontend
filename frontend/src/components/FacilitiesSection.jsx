/**
 * Facilities & Amenities — everything the villa offers, grouped and
 * filterable by the kind of guest it suits.
 */
import { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import './FacilitiesSection.css';

const I = ({ children }) => (
  <svg width="30" height="30" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const ICONS = {
  gym:      <I><path d="M8 18v12M14 14v20M34 14v20M40 18v12M14 24h20"/></I>,
  billiard: <I><circle cx="24" cy="24" r="14"/><circle cx="24" cy="24" r="6"/><path d="M24 21v6"/></I>,
  bbq:      <I><path d="M10 20h28a14 14 0 01-28 0z"/><path d="M18 34l-4 8M30 34l4 8M24 34v8"/><path d="M18 8c0 3 3 3 3 6M26 8c0 3 3 3 3 6"/></I>,
  kids:     <I><circle cx="24" cy="12" r="5"/><path d="M24 17v13M16 23l8 3 8-3M18 42l6-12 6 12"/></I>,
  kitchen:  <I><path d="M14 20a10 10 0 0120 0"/><rect x="10" y="20" width="28" height="6" rx="1"/><rect x="14" y="26" width="20" height="16" rx="2"/></I>,
  ac:       <I><path d="M24 6v36M8 15l32 18M8 33l32-18"/><path d="M20 8l4 4 4-4M20 40l4-4 4 4"/></I>,
  wifi:     <I><path d="M6 18a26 26 0 0136 0M12 25a17 17 0 0124 0M18 32a8 8 0 0112 0"/><circle cx="24" cy="38" r="1.5" fill="currentColor"/></I>,
  laundry:  <I><rect x="9" y="6" width="30" height="36" rx="3"/><circle cx="24" cy="26" r="9"/><path d="M15 12h4M33 12h.01"/></I>,
  truffle:  <I><path d="M12 30c0-10 5-18 12-18s12 8 12 18c0 6-5 10-12 10s-12-4-12-10z"/><path d="M19 24h.01M27 20h.01M29 30h.01M21 33h.01"/></I>,
  pool:     <I><path d="M6 34c3 0 5-2 8-2s5 2 8 2 5-2 8-2 5 2 8 2"/><path d="M6 41c3 0 5-2 8-2s5 2 8 2 5-2 8-2 5 2 8 2"/><path d="M16 28V12a4 4 0 018 0M28 28V12a4 4 0 018 0M16 18h12M16 24h12"/></I>,
  swing:    <I><path d="M8 8h32M16 8v24M32 8v24"/><path d="M12 32h24"/><path d="M8 8l-2 34M40 8l2 34"/></I>,
  sauna:    <I><path d="M8 36h32M10 42h28"/><path d="M16 28c-2-4 2-6 0-10M24 28c-2-4 2-6 0-10M32 28c-2-4 2-6 0-10"/></I>,
  tasting:  <I><path d="M14 6h20l-4 18a6 6 0 01-12 0L14 6z"/><path d="M24 30v12M16 42h16M14 16h20"/></I>,
};

// Which kinds of guest each item suits
const FACILITIES = [
  { key: 'gym',      tags: ['wellness', 'groups'] },
  { key: 'billiard', tags: ['groups', 'families'] },
  { key: 'bbq',      tags: ['groups', 'families', 'food'] },
  { key: 'kids',     tags: ['families'] },
  { key: 'kitchen',  tags: ['food', 'families', 'groups'] },
];
const AMENITIES = [
  { key: 'pool',     tags: ['families', 'groups', 'wellness'] },
  { key: 'sauna',    tags: ['wellness'] },
  { key: 'tasting',  tags: ['food', 'groups'] },
  { key: 'truffle',  tags: ['food', 'groups'] },
  { key: 'swing',    tags: ['families'] },
  { key: 'ac',       tags: ['families', 'groups', 'wellness', 'food'] },
  { key: 'wifi',     tags: ['families', 'groups', 'wellness', 'food'] },
  { key: 'laundry',  tags: ['families', 'groups'], extraCost: true },
];
const FILTERS = ['everyone', 'families', 'groups', 'wellness', 'food'];

function Tile({ item, active, t }) {
  const dim = active !== 'everyone' && !item.tags.includes(active);
  return (
    <div className={`fac-tile${dim ? ' fac-tile--dim' : ''}`}>
      <span className="fac-tile__icon">{ICONS[item.key]}</span>
      <div>
        <h4 className="fac-tile__name">
          {t(`fac.items.${item.key}.name`)}
          {item.extraCost && <span className="fac-tile__badge">{t('fac.extraCost')}</span>}
        </h4>
        <p className="fac-tile__desc">{t(`fac.items.${item.key}.desc`)}</p>
      </div>
    </div>
  );
}

export default function FacilitiesSection() {
  const { t } = useTranslation();
  const [active, setActive] = useState('everyone');

  return (
    <section className="section fac-section" id="facilities">
      <div className="container">
        <div className="text-center mb-48">
          <span className="section-label" style={{ justifyContent: 'center' }}>{t('fac.label')}</span>
          <h2 className="section-title">{t('fac.title')}</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>{t('fac.sub')}</p>
        </div>

        <div className="fac-filters" role="group" aria-label={t('fac.idealFor')}>
          <span className="fac-filters__label">{t('fac.idealFor')}</span>
          {FILTERS.map(f => (
            <button
              key={f}
              type="button"
              className={`fac-chip${active === f ? ' fac-chip--active' : ''}`}
              aria-pressed={active === f}
              onClick={() => setActive(f)}
            >
              {t(`fac.${f}`)}
            </button>
          ))}
        </div>

        <div className="fac-groups">
          <div className="fac-group">
            <h3 className="fac-group__title">{t('fac.facilities')}</h3>
            <div className="fac-grid">
              {FACILITIES.map(item => <Tile key={item.key} item={item} active={active} t={t} />)}
            </div>
          </div>
          <div className="fac-group">
            <h3 className="fac-group__title">{t('fac.amenities')}</h3>
            <div className="fac-grid">
              {AMENITIES.map(item => <Tile key={item.key} item={item} active={active} t={t} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
