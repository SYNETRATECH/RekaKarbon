import { useEffect } from 'react';

/**
 * ServiceWorkerRegister
 * Registers the root service worker (/sw.js) when running in browser environments.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register after page load for performance
      const handleLoad = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            if (import.meta.env.DEV) {
              console.log('[RekaKarbon PWA] Service Worker registered scope:', registration.scope);
            }
          })
          .catch((error) => {
            console.error('[RekaKarbon PWA] Service Worker registration failed:', error);
          });
      };

      if (document.readyState === 'complete') {
        handleLoad();
      } else {
        window.addEventListener('load', handleLoad);
        return () => window.removeEventListener('load', handleLoad);
      }
    }
  }, []);

  return null;
}

export default ServiceWorkerRegister;
