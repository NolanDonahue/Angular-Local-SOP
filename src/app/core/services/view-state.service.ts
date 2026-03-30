import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ViewStateService {
  private readonly _expanded = signal(new Map<string, boolean>());
  private readonly _selectedModuleId = signal<string | null>(null);
  private readonly _selectedModuleIds = signal<string[]>([]);

  readonly expanded = this._expanded.asReadonly();
  readonly selectedModuleId = this._selectedModuleId.asReadonly();
  readonly selectedModuleIds = this._selectedModuleIds.asReadonly();

  isExpanded(id: string): boolean {
    return this._expanded().get(id) ?? false;
  }

  setExpanded(id: string, expanded: boolean): void {
    this._expanded.update((map) => {
      const next = new Map(map);
      next.set(id, expanded);
      return next;
    });
  }

  expandAll(ids: string[]): void {
    this._expanded.set(new Map(ids.map((id) => [id, true])));
  }

  collapseAll(): void {
    this._expanded.set(new Map());
  }

  setSelectedModuleId(id: string | null): void {
    this._selectedModuleId.set(id);
  }

  addSelection(id: string): void {
    this._selectedModuleIds.update((ids) => {
      if (ids.includes(id)) {
        return ids;
      }
      return [...ids, id];
    });
  }

  removeSelection(id: string): void {
    this._selectedModuleIds.update((ids) => ids.filter((existingId) => existingId !== id));
  }

  clearSelections(): void {
    this._selectedModuleIds.set([]);
  }
}
