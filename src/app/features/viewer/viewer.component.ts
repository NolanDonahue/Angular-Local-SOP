import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { SopRepositoryService } from '../../core/services/sop-repository.service';
import { ViewStateService } from '../../core/services/view-state.service';
import { ModuleItemComponent } from '../module-item/module-item.component';

@Component({
  selector: 'app-viewer',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    ModuleItemComponent,
  ],
  template: `
    <main class="page">
      <a mat-stroked-button routerLink="/">Back to all SOPs</a>

      @if (repository.loading()) {
        <mat-progress-bar mode="indeterminate" />
      } @else if (module()) {
        <h1>{{ module()!.title }}</h1>
        <app-module-item [module]="module()!" />
      } @else {
        <section class="empty-state" aria-live="polite">
          <mat-icon>search_off</mat-icon>
          <p>SOP not found. Please select an item from the menu.</p>
        </section>
      }
    </main>
  `,
  styles: `
    .page {
      max-width: 1000px;
      margin: 0 auto;
      padding: 1rem;
      display: grid;
      gap: 1rem;
    }

    .empty-state {
      display: grid;
      justify-items: center;
      gap: 0.5rem;
      border: 1px dashed var(--border-subtle);
      border-radius: 12px;
      background: var(--surface-1);
      padding: 2rem 1rem;
      color: var(--text-muted);
      text-align: center;
    }

    .empty-state mat-icon {
      width: 36px;
      height: 36px;
      font-size: 36px;
    }

    .empty-state p {
      margin: 0;
    }
  `,
})
export class ViewerComponent {
  private readonly route = inject(ActivatedRoute);
  readonly repository = inject(SopRepositoryService);
  readonly viewState = inject(ViewStateService);

  private readonly moduleId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id'))),
    { initialValue: null },
  );

  readonly module = computed(() => {
    const id = this.moduleId();
    return id ? this.repository.findModuleById(id) : undefined;
  });

  constructor() {
    effect(() => {
      const id = this.moduleId();
      if (!id) {
        return;
      }
      this.viewState.setExpanded(id, true);
      this.viewState.setSelectedModuleId(id);
    });
  }
}
