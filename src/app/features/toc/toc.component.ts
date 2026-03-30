import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ExportService } from '../../core/services/export.service';
import { SopModule } from '../../core/models/sop.models';
import { SopRepositoryService } from '../../core/services/sop-repository.service';
import { ViewStateService } from '../../core/services/view-state.service';
import { WorkspaceConfigService } from '../../core/services/workspace-config.service';
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
    MatSelectModule,
    MatProgressBarModule,
    MatIconModule,
    RouterLink,
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
              <button
                matSuffix
                mat-icon-button
                type="button"
                aria-label="Clear search"
                (click)="query = ''"
              >
                <mat-icon>close</mat-icon>
              </button>
            }
          </mat-form-field>
          <mat-form-field appearance="outline" class="config-select">
            <mat-label>Workspace config</mat-label>
            <mat-select [(ngModel)]="activeConfigId">
              <mat-option value="">Select config</mat-option>
              @for (config of workspaceConfigService.configs(); track config.id) {
                <mat-option [value]="config.id">{{ config.label }} ({{ config.source }})</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="config-name">
            <mat-label>Save selection as</mat-label>
            <input matInput [(ngModel)]="newConfigLabel" />
          </mat-form-field>
          <button mat-stroked-button type="button" (click)="saveCurrentSelection()">Save Config</button>
          <button mat-stroked-button type="button" [disabled]="!activeConfigId" (click)="loadConfig(activeConfigId)">
            Load Config
          </button>
          <button
            mat-stroked-button
            type="button"
            [disabled]="!canDeleteActiveConfig()"
            (click)="deleteActiveConfig()"
          >
            Delete Saved Config
          </button>
          <button mat-stroked-button (click)="clearWorkspace()">Clear Workspace</button>
          <a mat-stroked-button routerLink="/glossary">Glossary</a>
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
                        <mat-icon svgIcon="close" />
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
      @if (configMessage) {
        <p class="config-message">{{ configMessage }}</p>
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

    .config-select,
    .config-name {
      min-width: 220px;
    }

    .layout {
      display: grid;
      grid-template-columns: 320px minmax(0, 1fr);
      gap: 1rem;
      align-items: start;
    }

    .sidebar,
    .workspace {
      background: var(--surface-1);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 0.9rem;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
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
      border: 1px solid var(--border-subtle);
      background: var(--surface-2);
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
      color: var(--text-muted);
    }

    @media (max-width: 900px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }

    .error {
      color: #ffb4ab;
      font-weight: 600;
    }

    .config-message {
      margin-top: 0.75rem;
      color: var(--text-muted);
      font-size: 0.92rem;
    }
  `,
})
export class TocComponent {
  query = '';
  newConfigLabel = '';
  activeConfigId = '';
  configMessage = '';
  private lastLoadedQueryConfigId: string | null = null;
  readonly selectedModules = computed(() =>
    this.viewState
      .selectedModuleIds()
      .map((id) => this.repository.findModuleById(id))
      .filter((module): module is SopModule => module !== undefined),
  );

  readonly repository = inject(SopRepositoryService);
  readonly viewState = inject(ViewStateService);
  readonly exportService = inject(ExportService);
  readonly workspaceConfigService = inject(WorkspaceConfigService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly queryConfigId = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('config'))),
    { initialValue: null },
  );

  constructor() {
    effect(() => {
      const configId = this.queryConfigId();
      if (!configId || this.repository.loading()) {
        return;
      }
      if (configId === this.lastLoadedQueryConfigId) {
        return;
      }
      this.lastLoadedQueryConfigId = configId;
      this.loadConfig(configId, false);
    });
  }

  clearWorkspace(): void {
    this.viewState.clearSelections();
  }

  saveCurrentSelection(): void {
    const label = this.newConfigLabel.trim();
    const savedConfig = this.workspaceConfigService.saveConfig(label, this.viewState.selectedModuleIds());
    if (!savedConfig) {
      this.configMessage = 'Enter a name and select at least one module before saving.';
      return;
    }
    this.activeConfigId = savedConfig.id;
    this.newConfigLabel = '';
    this.configMessage = `Saved "${savedConfig.label}".`;
    void this.setConfigQueryParam(savedConfig.id);
  }

  loadConfig(configId: string, syncUrl = true): void {
    const moduleIds = this.workspaceConfigService.applyConfigById(configId);
    if (!moduleIds) {
      this.configMessage = `Could not find config "${configId}".`;
      return;
    }
    this.activeConfigId = configId;
    this.viewState.applySelection(moduleIds);
    const loadedConfig = this.workspaceConfigService.getConfigById(configId);
    this.configMessage = loadedConfig ? `Loaded "${loadedConfig.label}".` : 'Loaded selected config.';
    if (syncUrl) {
      void this.setConfigQueryParam(configId);
    }
  }

  canDeleteActiveConfig(): boolean {
    const config = this.workspaceConfigService.getConfigById(this.activeConfigId);
    return config?.source === 'saved';
  }

  deleteActiveConfig(): void {
    const config = this.workspaceConfigService.getConfigById(this.activeConfigId);
    if (!config || config.source !== 'saved') {
      return;
    }
    this.workspaceConfigService.deleteSavedConfig(config.id);
    this.configMessage = `Deleted "${config.label}".`;
    this.activeConfigId = '';
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { config: null },
      queryParamsHandling: 'merge',
    });
  }

  private setConfigQueryParam(configId: string): Promise<boolean> {
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { config: configId },
      queryParamsHandling: 'merge',
    });
  }
}
