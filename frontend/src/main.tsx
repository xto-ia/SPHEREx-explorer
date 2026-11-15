import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/layout/ErrorBoundary';
import { APP_CONFIG } from './config/app.config';
import { applyAccentTheme } from './lib/theme';
import './index.css';

// Paint the configured accent into CSS variables before the first render so no
// component ever flashes the default palette.
applyAccentTheme(APP_CONFIG.theme.accentColor);

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container #root is missing from index.html');
}

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
