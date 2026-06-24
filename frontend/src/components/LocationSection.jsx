/**
 * LocationSection
 * Map embed + nearby places for the Granciare page.
 * To update the pin: replace the `q` value in MAP_URL with the real address or coordinates.
 */

import { useTranslation } from '../i18n/LanguageContext';
import './LocationSection.css';

const MAP_URL =
  'https://maps.google.com/maps?width=100%25&height=100%25&hl=en&q=Todi,+Umbria,+Italy&t=&z=10&ie=UTF8&iwloc=B&output=embed';

// ── Category icons (inline SVG) ────────────────────────────────
const icons = {
  'Historic Towns': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21V7l9-4 9 4v14"/><path d="M9 21v-6h6v6"/><path d="M3 7h18"/>
    </svg>
  ),
  'Wine & Dining': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 22h8"/><path d="M12 11v11"/><path d="M7 2l1 8a4 4 0 0 0 8 0l1-8"/>
    </svg>
  ),
  'Getting Here': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2A1 1 0 0 0 4 6l3.2 3.2-2.6 2.6a1 1 0 0 0 0 1.4l1.2 1.2a1 1 0 0 0 1.4 0l2.6-2.6L13 15l3.2 3.2a1 1 0 0 0 1-.8z"/>
    </svg>
  ),
};

export default function LocationSection() {
  const { t, ta, lang } = useTranslation();

  // ta() resolves the `category` string but `places` array passes through as raw —
  // we manually pick the right language for each place's detail below.
  const categories = ta('location.categories');

  // Map translated category names to their icon keys (English key used for lookup)
  const ICON_KEYS = ['Historic Towns', 'Wine & Dining', 'Getting Here'];

  return (
    <section className="location" id="location">
      {/* Header */}
      <div className="location__header">
        <span className="section-label">{t('location.label')}</span>
        <h2 className="location__title">{t('location.title')}</h2>
        <p className="location__subtitle">{t('location.subtitle')}</p>
      </div>

      {/* Map + places */}
      <div className="location__body">
        {/* Google Maps embed */}
        <div className="location__map">
          <iframe
            title="Granciare Estate location"
            src={MAP_URL}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* Nearby places */}
        <div className="location__places">
          {categories.map(({ category, places }, idx) => (
            <div key={idx} className="location__category">
              <div className="location__cat-header">
                <span className="location__cat-icon">{icons[ICON_KEYS[idx]]}</span>
                <h3 className="location__cat-title">{category}</h3>
              </div>
              <ul className="location__list">
                {places.map(({ name, detail }) => (
                  <li key={name} className="location__item">
                    <span className="location__item-name">{name}</span>
                    <span className="location__item-detail">{detail[lang] ?? detail['en']}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
