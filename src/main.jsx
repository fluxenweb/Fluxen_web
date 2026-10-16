import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/space-grotesk';
import '@fontsource/geist-mono/latin-400.css';
import '@fontsource/geist-mono/latin-500.css';
import '@fontsource/geist-mono/cyrillic-400.css';
import '@fontsource/geist-mono/cyrillic-500.css';
import './styles/fonts.css';
import './styles/globals.css';
import './styles/animations.css';
import App from './App';
import LocaleProvider from './i18n/LocaleProvider';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </StrictMode>,
);
