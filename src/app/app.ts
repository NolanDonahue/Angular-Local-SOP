import { Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterOutlet } from '@angular/router';
import { SopRepositoryService } from './core/services/sop-repository.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatIconModule, MatSlideToggleModule],
  template: `
    <header class="app-toolbar">
      <div class="theme-toggle">
        <mat-icon svgIcon="sun" aria-hidden="true" />
        <mat-slide-toggle
          aria-label="Toggle dark mode"
          [checked]="theme.theme() === 'dark'"
          (change)="theme.setTheme($event.checked ? 'dark' : 'light')"
        />
        <mat-icon svgIcon="moon" aria-hidden="true" />
      </div>
    </header>
    <router-outlet />
  `,
  styles: `
    .app-toolbar {
      display: flex;
      justify-content: flex-end;
      padding: 0.75rem 1rem 0;
      margin-right: 1rem;
    }

    .theme-toggle {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      border: 1px solid var(--border-subtle);
      border-radius: 999px;
      padding: 0.15rem 0.35rem;
      background: var(--surface-1);
    }

    .theme-toggle mat-icon {
      width: 18px;
      height: 18px;
      color: var(--text-muted);
    }
  `,
  styleUrl: './app.scss',
})
export class App implements OnInit {
  readonly repository = inject(SopRepositoryService);
  readonly theme = inject(ThemeService);

  ngOnInit(): void {
    void this.repository.loadContent();
  }
}
