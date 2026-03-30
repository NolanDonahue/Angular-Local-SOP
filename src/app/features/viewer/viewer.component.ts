import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
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
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressBarModule, ModuleItemComponent],
  template: `
    <main class="page">
      <a mat-stroked-button routerLink="/">Back to all SOPs</a>

      @if (repository.loading()) {
        <mat-progress-bar mode="indeterminate" />
      } @else if (module()) {
        <h1>{{ module()!.title }}</h1>
        <app-module-item [module]="module()!" />
      } @else {
        <p>Unable to find that SOP module.</p>
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
