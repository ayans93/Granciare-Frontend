import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/LanguageContext';
import './Legal.css';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <section className="legal-page legal-page--center">
      <div className="container">
        <span className="section-label" style={{ justifyContent: 'center' }}>404</span>
        <h1 className="section-title">{t('nf.title')}</h1>
        <p className="legal-lead">{t('nf.text')}</p>
        <Link to="/" className="btn btn-primary mt-32">{t('nf.home')}</Link>
      </div>
    </section>
  );
}
