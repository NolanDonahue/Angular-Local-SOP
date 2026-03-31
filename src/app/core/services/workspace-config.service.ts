import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { WORKSPACE_CONFIG_PRESETS_DATA } from '../data/workspace-config-presets.data';
import { SopRepositoryService } from './sop-repository.service';
import { WorkspaceConfig, WorkspaceConfigPreset } from '../models/workspace-config.models';

const STORAGE_KEY = 'workspace.savedConfigs';

@Injectable({ providedIn: 'root' })
export class WorkspaceConfigService {
  private readonly repository = inject(SopRepositoryService);
  private readonly _presetConfigs = signal<WorkspaceConfig[]>(this.loadPresetConfigs());
  private readonly _savedConfigs = signal<WorkspaceConfig[]>(this.loadSavedConfigs());

  readonly presetConfigs = this._presetConfigs.asReadonly();
  readonly savedConfigs = this._savedConfigs.asReadonly();
  readonly configs = computed(() => {
    const presets = this._presetConfigs();
    const saved = this._savedConfigs().filter(
      (savedConfig) => !presets.some((preset) => preset.id === savedConfig.id),
    );
    return [...presets, ...saved];
  });

  constructor() {
    effect(() => {
      if (!this.repository.initialLoadSucceeded()) {
        return;
      }
      this.repository.modules();
      const configs = this._savedConfigs();
      let changed = false;
      const next = configs.map((config) => {
        const nextIds = this.validateModuleIds(config.moduleIds);
        const same =
          nextIds.length === config.moduleIds.length &&
          nextIds.every((id, index) => id === config.moduleIds[index]);
        if (!same) {
          changed = true;
          return { ...config, moduleIds: nextIds };
        }
        return config;
      });
      if (changed) {
        this._savedConfigs.set(next);
        this.persistSavedConfigs();
      }
    });
  }

  getConfigById(id: string): WorkspaceConfig | undefined {
    return this.configs().find((config) => config.id === id);
  }

  applyConfigById(id: string): string[] | null {
    const config = this.getConfigById(id);
    if (!config) {
      return null;
    }
    return this.validateModuleIds(config.moduleIds);
  }

  saveConfig(label: string, moduleIds: string[]): WorkspaceConfig | null {
    const validatedModuleIds = this.validateModuleIds(moduleIds);
    const cleanLabel = label.trim();
    if (!cleanLabel || !validatedModuleIds.length) {
      return null;
    }

    const baseId = this.toSlug(cleanLabel);
    const nextId = this.nextAvailableId(baseId, this.savedConfigs().map((config) => config.id));
    const config: WorkspaceConfig = {
      id: nextId,
      label: cleanLabel,
      moduleIds: validatedModuleIds,
      source: 'saved',
    };
    this._savedConfigs.update((configs) => [...configs, config]);
    this.persistSavedConfigs();
    return config;
  }

  deleteSavedConfig(id: string): void {
    this._savedConfigs.update((configs) => configs.filter((config) => config.id !== id));
    this.persistSavedConfigs();
  }

  private validateModuleIds(moduleIds: string[]): string[] {
    const uniqueIds = [...new Set(moduleIds)];
    if (!this.repository.initialLoadSucceeded()) {
      return uniqueIds;
    }
    const modules = this.repository.modules();
    if (!modules.length) {
      return [];
    }
    return uniqueIds.filter((id) => this.repository.findModuleById(id) !== undefined);
  }

  private loadPresetConfigs(): WorkspaceConfig[] {
    if (!Array.isArray(WORKSPACE_CONFIG_PRESETS_DATA)) {
      return [];
    }
    const presets: WorkspaceConfig[] = [];
    for (const raw of WORKSPACE_CONFIG_PRESETS_DATA) {
      if (!this.isWorkspaceConfigPreset(raw)) {
        continue;
      }
      presets.push({
        id: raw.id,
        label: raw.label,
        moduleIds: raw.moduleIds,
        source: 'preset',
      });
    }
    return presets;
  }

  private loadSavedConfigs(): WorkspaceConfig[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .filter((value): value is WorkspaceConfigPreset => this.isWorkspaceConfigPreset(value))
        .map((config) => ({
          id: config.id,
          label: config.label,
          moduleIds: this.validateModuleIds(config.moduleIds),
          source: 'saved',
        }));
    } catch {
      return [];
    }
  }

  private persistSavedConfigs(): void {
    const serializable = this._savedConfigs().map(({ id, label, moduleIds }) => ({
      id,
      label,
      moduleIds,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  }

  private nextAvailableId(baseId: string, existingIds: string[]): string {
    const fallbackBase = baseId || 'saved-config';
    if (!existingIds.includes(fallbackBase)) {
      return fallbackBase;
    }
    let index = 2;
    while (existingIds.includes(`${fallbackBase}-${index}`)) {
      index += 1;
    }
    return `${fallbackBase}-${index}`;
  }

  private toSlug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private isWorkspaceConfigPreset(value: unknown): value is WorkspaceConfigPreset {
    if (!value || typeof value !== 'object') {
      return false;
    }
    const config = value as Partial<WorkspaceConfigPreset>;
    return (
      typeof config.id === 'string' &&
      typeof config.label === 'string' &&
      Array.isArray(config.moduleIds) &&
      config.moduleIds.every((id) => typeof id === 'string')
    );
  }
}
