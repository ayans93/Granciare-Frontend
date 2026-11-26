import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { LanguageProvider } from './i18n/LanguageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Granciare from './pages/Granciare';
import OliveOil from './pages/OliveOil';
import Poderetto from './pages/Poderetto';
import OurStory from './pages/OurStory';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import { PrivacyPolicy, TermsConditions } from './pages/Legal';

// Scrolls to the top on page change, or to the #section in the URL
// (e.g. "Order Solivé" → /olive-oil#order), waiting for it to render.
function ScrollToTop() {
  const { pathname, hash, key } = useLocation();
  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return undefined; }
    const id = decodeURIComponent(hash.slice(1));
    let tries = 0;
    let timer;
    const attempt = () => {
      const el = document.getElementById(id);
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      if (tries++ < 40) timer = setTimeout(attempt, 50);
    };
    timer = setTimeout(attempt, 60);
    return () => clearTimeout(timer);
  }, [pathname, hash, key]);
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
          <Route path="/privacy"   element={<PrivacyPolicy />} />
          <Route path="/terms"     element={<TermsConditions />} />
          <Route path="*"          element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

// The website is public (the private-preview sign-in gate was removed at launch)
function PublicSite() {
  return (
    <LanguageProvider>
      <Layout />
    </LanguageProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Admin panel — no gate, no navbar/footer */}
        <Route path="/admin/*" element={<Admin />} />
        {/* Public site */}
        <Route path="*" element={<PublicSite />} />
      </Routes>
    </BrowserRouter>
  );
}
