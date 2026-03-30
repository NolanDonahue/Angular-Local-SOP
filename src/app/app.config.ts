import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withHashLocation } from '@angular/router';
import { MatIconRegistry } from '@angular/material/icon';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation()),
    provideAnimationsAsync(),
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [MatIconRegistry, DomSanitizer],
      useFactory: (iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) => () => {
        iconRegistry.addSvgIcon(
          'down-arrow',
          sanitizer.bypassSecurityTrustResourceUrl('assets/icons/down-arrow.svg'),
        );
        iconRegistry.addSvgIcon(
          'right-arrow',
          sanitizer.bypassSecurityTrustResourceUrl('assets/icons/right-arrow.svg'),
        );
        iconRegistry.addSvgIcon('close', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/close.svg'));
        iconRegistry.addSvgIcon('moon', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/moon.svg'));
        iconRegistry.addSvgIcon('sun', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/sun.svg'));
      },
    },
  ]
};
