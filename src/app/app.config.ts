import {
  APP_INITIALIZER,
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withHashLocation } from '@angular/router';
import { MatIconRegistry } from '@angular/material/icon';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation()),
    provideAnimationsAsync(),
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [MatIconRegistry, DomSanitizer],
      useFactory: (iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) => () => {
        const isFileProtocol = window.location.protocol === 'file:';
        const iconPaths = {
          downArrow: 'assets/icons/down-arrow.svg',
          rightArrow: 'assets/icons/right-arrow.svg',
          close: 'assets/icons/close.svg',
          moon: 'assets/icons/moon.svg',
          sun: 'assets/icons/sun.svg',
        };
        const iconLiterals = {
          downArrow:
            '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="512" viewBox="0 0 320 512"><title>Angle-down SVG Icon</title><path fill="currentColor" d="M143 352.3L7 216.3c-9.4-9.4-9.4-24.6 0-33.9l22.6-22.6c9.4-9.4 24.6-9.4 33.9 0l96.4 96.4l96.4-96.4c9.4-9.4 24.6-9.4 33.9 0l22.6 22.6c9.4 9.4 9.4 24.6 0 33.9l-136 136c-9.2 9.4-24.4 9.4-33.8 0"/></svg>',
          rightArrow:
            '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="512" viewBox="0 0 256 512"><title>Angle-right SVG Icon</title><path fill="currentColor" d="m224.3 273l-136 136c-9.4 9.4-24.6 9.4-33.9 0l-22.6-22.6c-9.4-9.4-9.4-24.6 0-33.9l96.4-96.4l-96.4-96.4c-9.4-9.4-9.4-24.6 0-33.9L54.3 103c9.4-9.4 24.6-9.4 33.9 0l136 136c9.5 9.4 9.5 24.6.1 34"/></svg>',
          close:
            '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="512" viewBox="0 0 640 512"><title>Backspace SVG Icon</title><path fill="currentColor" d="M576 64H205.26A63.97 63.97 0 0 0 160 82.75L9.37 233.37c-12.5 12.5-12.5 32.76 0 45.25L160 429.25c12 12 28.28 18.75 45.25 18.75H576c35.35 0 64-28.65 64-64V128c0-35.35-28.65-64-64-64m-84.69 254.06c6.25 6.25 6.25 16.38 0 22.63l-22.62 22.62c-6.25 6.25-16.38 6.25-22.63 0L384 301.25l-62.06 62.06c-6.25 6.25-16.38 6.25-22.63 0l-22.62-22.62c-6.25-6.25-6.25-16.38 0-22.63L338.75 256l-62.06-62.06c-6.25-6.25-6.25-16.38 0-22.63l22.62-22.62c6.25-6.25 16.38-6.25 22.63 0L384 210.75l62.06-62.06c6.25-6.25 16.38-6.25 22.63 0l22.62 22.62c6.25 6.25 6.25 16.38 0 22.63L429.25 256z"/></svg>',
          moon: '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><title>Moon SVG Icon</title><path fill="currentColor" d="M283.211 512c78.962 0 151.079-35.925 198.857-94.792c7.068-8.708-.639-21.43-11.562-19.35c-124.203 23.654-238.262-71.576-238.262-196.954c0-72.222 38.662-138.635 101.498-174.394c9.686-5.512 7.25-20.197-3.756-22.23A258.156 258.156 0 0 0 283.211 0c-141.309 0-256 114.511-256 256c0 141.309 114.511 256 256 256"/></svg>',
          sun: '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><title>Sun SVG Icon</title><path fill="currentColor" d="M256 160c-52.9 0-96 43.1-96 96s43.1 96 96 96s96-43.1 96-96s-43.1-96-96-96m246.4 80.5l-94.7-47.3l33.5-100.4c4.5-13.6-8.4-26.5-21.9-21.9l-100.4 33.5l-47.4-94.8c-6.4-12.8-24.6-12.8-31 0l-47.3 94.7L92.7 70.8c-13.6-4.5-26.5 8.4-21.9 21.9l33.5 100.4l-94.7 47.4c-12.8 6.4-12.8 24.6 0 31l94.7 47.3l-33.5 100.5c-4.5 13.6 8.4 26.5 21.9 21.9l100.4-33.5l47.3 94.7c6.4 12.8 24.6 12.8 31 0l47.3-94.7l100.4 33.5c13.6 4.5 26.5-8.4 21.9-21.9l-33.5-100.4l94.7-47.3c13-6.5 13-24.7.2-31.1m-155.9 106c-49.9 49.9-131.1 49.9-181 0c-49.9-49.9-49.9-131.1 0-181c49.9-49.9 131.1-49.9 181 0c49.9 49.9 49.9 131.1 0 181"/></svg>',
        };

        if (isFileProtocol) {
          iconRegistry.addSvgIconLiteral(
            'down-arrow',
            sanitizer.bypassSecurityTrustHtml(iconLiterals.downArrow),
          );
          iconRegistry.addSvgIconLiteral(
            'right-arrow',
            sanitizer.bypassSecurityTrustHtml(iconLiterals.rightArrow),
          );
          iconRegistry.addSvgIconLiteral(
            'close',
            sanitizer.bypassSecurityTrustHtml(iconLiterals.close),
          );
          iconRegistry.addSvgIconLiteral(
            'moon',
            sanitizer.bypassSecurityTrustHtml(iconLiterals.moon),
          );
          iconRegistry.addSvgIconLiteral(
            'sun',
            sanitizer.bypassSecurityTrustHtml(iconLiterals.sun),
          );
          return;
        }

        iconRegistry.addSvgIcon(
          'down-arrow',
          sanitizer.bypassSecurityTrustResourceUrl(iconPaths.downArrow),
        );
        iconRegistry.addSvgIcon(
          'right-arrow',
          sanitizer.bypassSecurityTrustResourceUrl(iconPaths.rightArrow),
        );
        iconRegistry.addSvgIcon('close', sanitizer.bypassSecurityTrustResourceUrl(iconPaths.close));
        iconRegistry.addSvgIcon('moon', sanitizer.bypassSecurityTrustResourceUrl(iconPaths.moon));
        iconRegistry.addSvgIcon('sun', sanitizer.bypassSecurityTrustResourceUrl(iconPaths.sun));
      },
    },
  ],
};
