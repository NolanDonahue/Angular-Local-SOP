import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'sop-theme';
  private readonly _theme = signal<ThemeMode>('dark');
  readonly theme = this._theme.asReadonly();

  constructor() {
    const savedTheme = this.readStoredTheme();
    this.setTheme(savedTheme, false);
  }

  toggleTheme(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  setTheme(theme: ThemeMode, persist = true): void {
    this._theme.set(theme);
    this.document.documentElement.setAttribute('data-theme', theme);
    this.document.documentElement.style.colorScheme = theme;

    if (persist) {
      this.storeTheme(theme);
    }
  }

  private readStoredTheme(): ThemeMode {
    try {
      const stored = window.localStorage.getItem(this.storageKey);
      return stored === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  }

  private storeTheme(theme: ThemeMode): void {
    try {
      window.localStorage.setItem(this.storageKey, theme);
    } catch {
      // Ignore persistence issues (private mode / browser policy).
    }
  }
}
