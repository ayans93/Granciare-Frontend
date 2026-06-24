import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { LanguageProvider } from './i18n/LanguageContext';
import AdminGate from './components/AdminGate';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Granciare from './pages/Granciare';
import OliveOil from './pages/OliveOil';
import Poderetto from './pages/Poderetto';
import OurStory from './pages/OurStory';

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
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AdminGate>
          <ScrollToTop />
          <Layout />
        </AdminGate>
      </BrowserRouter>
    </LanguageProvider>
  );
}
