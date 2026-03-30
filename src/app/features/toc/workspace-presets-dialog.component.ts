import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { ViewStateService } from '../../core/services/view-state.service';
import { WorkspaceConfigService } from '../../core/services/workspace-config.service';

export interface WorkspacePresetsDialogData {
  activeConfigId: string;
}

export interface WorkspacePresetsDialogResult {
  activeConfigId: string;
  configMessage: string;
}

@Component({
  selector: 'app-workspace-presets-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>Workspace presets</h2>
    <mat-dialog-content class="dialog-body">
      <div class="presets-row">
        <mat-form-field appearance="outline" class="config-select">
          <mat-label>Workspace config</mat-label>
          <mat-select [(ngModel)]="activeConfigId">
            <mat-option value="">Select config</mat-option>
            @for (config of workspaceConfigService.configs(); track config.id) {
              <mat-option [value]="config.id"
                >{{ config.label }} ({{ config.source }})</mat-option
              >
            }
          </mat-select>
        </mat-form-field>
        <button
          mat-stroked-button
          type="button"
          [disabled]="!activeConfigId"
          (click)="loadConfig(activeConfigId)"
        >
          Load Config
        </button>
      </div>
      <div class="presets-row">
        <mat-form-field appearance="outline" class="config-name">
          <mat-label>Save selection as</mat-label>
          <input matInput [(ngModel)]="newConfigLabel" />
        </mat-form-field>
        <button mat-stroked-button type="button" (click)="saveCurrentSelection()">
          Save Config
        </button>
        <button
          mat-stroked-button
          type="button"
          [disabled]="!canDeleteActiveConfig()"
          (click)="deleteActiveConfig()"
        >
          Delete Saved Config
        </button>
      </div>
      @if (configMessage) {
        <p class="config-message">{{ configMessage }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" type="button" (click)="done()">
        Close
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .dialog-body {
      padding-top: 0.5rem;
      min-width: min(520px, 86vw);
    }

    .presets-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
      margin-bottom: 1rem;
    }

    .config-select,
    .config-name {
      min-width: 220px;
      flex: 1 1 220px;
    }

    .config-message {
      margin: 0 0 0.5rem;
      color: var(--text-muted);
      font-size: 0.92rem;
    }
  `,
})
export class WorkspacePresetsDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<WorkspacePresetsDialogComponent, WorkspacePresetsDialogResult>,
  );
  private readonly data = inject<WorkspacePresetsDialogData>(MAT_DIALOG_DATA);
  readonly workspaceConfigService = inject(WorkspaceConfigService);
  private readonly viewState = inject(ViewStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  newConfigLabel = '';
  activeConfigId = this.data.activeConfigId;
  configMessage = '';

  done(): void {
    this.dialogRef.close({
      activeConfigId: this.activeConfigId,
      configMessage: this.configMessage,
    });
  }

  saveCurrentSelection(): void {
    const label = this.newConfigLabel.trim();
    const savedConfig = this.workspaceConfigService.saveConfig(
      label,
      this.viewState.selectedModuleIds(),
    );
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
    this.configMessage = loadedConfig
      ? `Loaded "${loadedConfig.label}".`
      : 'Loaded selected config.';
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
