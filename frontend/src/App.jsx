import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LanguageProvider } from './i18n/LanguageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Granciare from './pages/Granciare';
import OliveOil from './pages/OliveOil';
import Poderetto from './pages/Poderetto';
import OurStory from './pages/OurStory';
import Admin from './pages/Admin';
import PasswordGate, { isAuthenticated } from './components/PasswordGate';

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

function ProtectedSite() {
  const [authed, setAuthed] = useState(isAuthenticated);

  if (!authed) {
    return <PasswordGate onAuth={() => setAuthed(true)} />;
  }

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
        {/* Public site — behind password gate */}
        <Route path="*" element={<ProtectedSite />} />
      </Routes>
    </BrowserRouter>
  );
}
