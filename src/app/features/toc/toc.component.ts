import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ExportService } from '../../core/services/export.service';
import { SopModule } from '../../core/models/sop.models';
import { SopRepositoryService } from '../../core/services/sop-repository.service';
import { ViewStateService } from '../../core/services/view-state.service';
import { ModuleItemComponent } from '../module-item/module-item.component';
import { SidebarTreeComponent } from '../sidebar-tree/sidebar-tree.component';

@Component({
  selector: 'app-toc',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatIconModule,
    ModuleItemComponent,
    SidebarTreeComponent,
  ],
  template: `
    <main class="page">
      <header class="toolbar">
        <h1>Standard Operating Procedures</h1>
        <div class="actions">
          <mat-form-field appearance="outline" class="search">
            <mat-label>Search sidebar titles and glossary</mat-label>
            <input matInput [(ngModel)]="query" />
            @if (query) {
              <button matSuffix mat-icon-button type="button" aria-label="Clear search" (click)="query = ''">
                <mat-icon>close</mat-icon>
              </button>
            }
          </mat-form-field>
          <button mat-stroked-button (click)="clearWorkspace()">Clear Workspace</button>
          <button
            mat-flat-button
            color="primary"
            [disabled]="!selectedModules().length"
            (click)="exportService.exportToWord(selectedModules())"
          >
            Export Selected to Word
          </button>
        </div>
      </header>

      @if (repository.loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      @if (repository.error()) {
        <p class="error">{{ repository.error() }}</p>
      } @else {
        <section class="layout">
          <aside class="sidebar">
            <h2>Content Titles</h2>
            <app-sidebar-tree [modules]="repository.modules()" [query]="query" />
          </aside>

          <section class="workspace">
            <h2>Selected SOP Content</h2>

            @if (!selectedModules().length) {
              <p class="empty">Select titles from the sidebar to add content here.</p>
            } @else {
              <div class="workspace-list">
                @for (module of selectedModules(); track module.id) {
                  <article class="workspace-item">
                    <div class="workspace-item-header">
                      <h3>{{ module.title }}</h3>
                      <button
                        mat-icon-button
                        type="button"
                        aria-label="Remove from workspace"
                        (click)="viewState.removeSelection(module.id)"
                      >
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                    <app-module-item [module]="module" />
                  </article>
                }
              </div>
            }
          </section>
        </section>
      }
    </main>
  `,
  styles: `
    .page {
      max-width: 1100px;
      margin: 0 auto;
      padding: 1rem;
    }

    .toolbar {
      margin-bottom: 1rem;
    }

    .actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .search {
      min-width: 280px;
      flex: 1;
    }

    .layout {
      display: grid;
      grid-template-columns: 320px minmax(0, 1fr);
      gap: 1rem;
      align-items: start;
    }

    .sidebar,
    .workspace {
      background: #fff;
      border-radius: 12px;
      padding: 0.9rem;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
    }

    .sidebar h2,
    .workspace h2 {
      margin: 0 0 0.75rem;
      font-size: 1rem;
    }

    .workspace-list {
      display: grid;
      gap: 0.8rem;
    }

    .workspace-item {
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 10px;
      padding: 0.7rem;
    }

    .workspace-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }

    .workspace-item-header h3 {
      margin: 0;
      font-size: 1rem;
    }

    .empty {
      margin: 0;
      opacity: 0.75;
    }

    @media (max-width: 900px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }

    .error {
      color: #b3261e;
      font-weight: 600;
    }
  `,
})
export class TocComponent {
  query = '';
  readonly selectedModules = computed(() =>
    this.viewState
      .selectedModuleIds()
      .map((id) => this.repository.findModuleById(id))
      .filter((module): module is SopModule => module !== undefined),
  );

  readonly repository = inject(SopRepositoryService);
  readonly viewState = inject(ViewStateService);
  readonly exportService = inject(ExportService);

  clearWorkspace(): void {
    this.viewState.clearSelections();
  }
}
