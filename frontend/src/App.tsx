import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import StarfieldBackground from './components/layout/StarfieldBackground';
import HomePage from './pages/HomePage';
import WorkspacePage from './pages/WorkspacePage';
import DocsPage from './pages/DocsPage';
import NotFoundPage from './pages/NotFoundPage';

/** Restores the top of the page on navigation, matching native page loads. */
function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Deep links such as /docs#intake must land on their section, not the top.
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return null;
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="relative flex min-h-screen flex-col">
          <StarfieldBackground />
          <Navbar />
          <main className="relative z-10 flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/workspace" element={<WorkspacePage />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </LanguageProvider>
  );
}
