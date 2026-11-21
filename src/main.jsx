import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import './style.css';

window.__KC_REACT_RENDERER__ = true;
document.addEventListener('click', (event) => {
  const anchor = event.target.closest?.('a[href]');
  if (!anchor) return;
  const href = anchor.getAttribute('href');
  const legacyPage = href.match(/^(?:\.\/)?(index|login|consumer|farmer|admin|kyc|payment|tracking)\.html(\?.*)?$/i);
  if (legacyPage) {
    event.preventDefault();
    const page = legacyPage[1].toLowerCase();
    window.location.hash = `#/${page === 'index' ? '' : page}${legacyPage[2] || ''}`;
    return;
  }
  if (!href.startsWith('#')) return;
  if (href === '#') {
    event.preventDefault();
  } else if (href && !href.startsWith('#/')) {
    event.preventDefault();
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }
});
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
