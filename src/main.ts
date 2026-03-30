import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

if (window.location.protocol === 'file:') {
  const originalReplaceState = window.history.replaceState.bind(window.history);
  const originalPushState = window.history.pushState.bind(window.history);
  const fallbackToHash = (url?: string | URL | null): void => {
    const raw = typeof url === 'string' ? url : url ? url.toString() : '';
    const hashTarget = raw.includes('#') ? raw.slice(raw.indexOf('#')) : `#${raw || '/'}`;
    if (window.location.hash !== hashTarget) {
      window.location.hash = hashTarget;
    }
  };

  window.history.replaceState = (data: unknown, unused: string, url?: string | URL | null): void => {
    const urlString = typeof url === 'string' ? url : url ? url.toString() : '';
    if (urlString.startsWith('#')) {
      fallbackToHash(url);
      return;
    }
    try {
      originalReplaceState(data, unused, url);
    } catch (error: unknown) {
      void error;
      fallbackToHash(url);
    }
  };

  window.history.pushState = (data: unknown, unused: string, url?: string | URL | null): void => {
    const urlString = typeof url === 'string' ? url : url ? url.toString() : '';
    if (urlString.startsWith('#')) {
      fallbackToHash(url);
      return;
    }
    try {
      originalPushState(data, unused, url);
    } catch (error: unknown) {
      void error;
      fallbackToHash(url);
    }
  };
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
