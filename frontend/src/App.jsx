import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { LanguageProvider } from './i18n/LanguageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Granciare from './pages/Granciare';
import OliveOil from './pages/OliveOil';
import Poderetto from './pages/Poderetto';
import OurStory from './pages/OurStory';
import ComingSoon from './components/ComingSoon';

const COMING_SOON = import.meta.env.VITE_COMING_SOON === 'true';

// Preview bypass — visiting /?preview=granciarevip2026 unlocks the full site for this browser
const PREVIEW_TOKEN = 'granciarevip2026';
function isPreviewUnlocked() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('preview') === PREVIEW_TOKEN) {
      localStorage.setItem('_gp', '1');
      return true;
    }
    return localStorage.getItem('_gp') === '1';
  } catch {
    return false;
  }
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Layout() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/"          element={<Granciare />} />
          <Route path="/olive-oil" element={<OliveOil />} />
          <Route path="/poderetto" element={<Poderetto />} />
          <Route path="/our-story" element={<OurStory />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  if (COMING_SOON && !isPreviewUnlocked()) return <ComingSoon />;

  return (
    <LanguageProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Layout />
      </BrowserRouter>
    </LanguageProvider>
  );
}
