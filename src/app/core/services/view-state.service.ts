import { moveItemInArray } from '@angular/cdk/drag-drop';
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ViewStateService {
  private readonly _expanded = signal(new Map<string, boolean>());
  private readonly _treeExpanded = signal(new Map<string, boolean>());
  private readonly _selectedModuleId = signal<string | null>(null);
  private readonly _selectedModuleIds = signal<string[]>([]);

  readonly expanded = this._expanded.asReadonly();
  readonly treeExpanded = this._treeExpanded.asReadonly();
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

  isTreeExpanded(id: string): boolean {
    return this._treeExpanded().get(id) ?? false;
  }

  setTreeExpanded(id: string, expanded: boolean): void {
    this._treeExpanded.update((map) => {
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

  reorderSelectedModules(previousIndex: number, currentIndex: number): void {
    if (previousIndex === currentIndex) {
      return;
    }
    this._selectedModuleIds.update((ids) => {
      if (
        previousIndex < 0 ||
        currentIndex < 0 ||
        previousIndex >= ids.length ||
        currentIndex >= ids.length
      ) {
        return ids;
      }
      const next = [...ids];
      moveItemInArray(next, previousIndex, currentIndex);
      return next;
    });
  }

  applySelection(ids: string[]): void {
    this._selectedModuleIds.set([...new Set(ids)]);
  }

  clearSelections(): void {
    this._selectedModuleIds.set([]);
  }
}
