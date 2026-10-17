import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Automatically register and update PWA Service Worker (safely guarded for iframe preview)
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.self === window.top) {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        updateSW(true);
      },
    });
  }
} catch (swErr) {
  console.warn('PWA service worker registration bypassed in preview:', swErr);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
