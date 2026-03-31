import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SopModule } from '../../core/models/sop.models';
import { SearchResult } from '../../core/services/search.service';
import { ViewStateService } from '../../core/services/view-state.service';

@Component({
  selector: 'app-sidebar-tree',
  standalone: true,
  imports: [NgTemplateOutlet, MatButtonModule, MatIconModule],
  template: `
    @if (searchResults !== null) {
      <section class="search-results">
        @for (result of searchResults; track result.item.id) {
          @if (result.kind === 'module') {
            <button type="button" class="result module" (click)="addToWorkspace(result.item.id)">
              {{ result.item.title }}
            </button>
          } @else {
            <p class="result term">
              <strong>{{ result.item.term }}:</strong> {{ result.item.definition }}
            </p>
          }
        } @empty {
          <p class="empty">No matches for "{{ searchQueryDisplay }}".</p>
        }
      </section>
    } @else {
      <ng-container *ngTemplateOutlet="treeTemplate; context: { $implicit: modules, depth: 0 }" />
    }

    <ng-template #treeTemplate let-nodes let-depth="depth">
      <ul class="tree-list">
        @for (node of nodes; track node.id) {
          <li>
            <div class="node-row" [style.paddingLeft.px]="depth * 12">
              @if (node.children.length) {
                <button
                  mat-icon-button
                  type="button"
                  class="toggle"
                  (click)="toggleNode(node.id)"
                  [attr.aria-label]="'Toggle ' + node.title"
                >
                  <mat-icon
                    [svgIcon]="viewState.isTreeExpanded(node.id) ? 'down-arrow' : 'right-arrow'"
                  />
                </button>
              } @else {
                <span class="toggle-spacer"></span>
              }

              <button
                type="button"
                class="node-button"
                [class.selected]="isSelected(node.id)"
                (click)="addToWorkspace(node.id)"
              >
                {{ node.title }}
              </button>
            </div>

            @if (node.children.length && viewState.isTreeExpanded(node.id)) {
              <ng-container
                *ngTemplateOutlet="
                  treeTemplate;
                  context: { $implicit: node.children, depth: depth + 1 }
                "
              />
            }
          </li>
        }
      </ul>
    </ng-template>
  `,
  styles: `
    .tree-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.2rem;
    }

    .node-row {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .toggle {
      width: 28px;
      height: 28px;
      padding: 0;
    }

    .toggle-spacer {
      width: 28px;
      height: 28px;
      display: inline-block;
    }

    .node-button {
      border: 0;
      background: transparent;
      text-align: left;
      padding: 0.3rem 0.4rem;
      cursor: pointer;
      border-radius: 6px;
      width: 100%;
    }

    .node-button:hover {
      background: var(--azure-hover);
    }

    .node-button.selected {
      background: var(--azure-selected);
      font-weight: 600;
    }

    .search-results {
      display: grid;
      gap: 0.5rem;
    }

    .result.module {
      border: 1px solid var(--border-subtle);
      background: var(--surface-2);
      border-radius: 6px;
      text-align: left;
      padding: 0.5rem;
      cursor: pointer;
    }

    .result.module:hover {
      background: var(--azure-hover);
    }

    .result.term {
      margin: 0;
      font-size: 0.92rem;
    }

    .empty {
      margin: 0;
      color: var(--text-muted);
    }
  `,
})
export class SidebarTreeComponent {
  @Input({ required: true }) modules: SopModule[] = [];
  /** `null` when the sidebar should show the tree; otherwise Fuse results for the current query. */
  @Input() searchResults: SearchResult[] | null = null;
  @Input() searchQueryDisplay = '';
  readonly viewState = inject(ViewStateService);

  toggleNode(id: string): void {
    this.viewState.setTreeExpanded(id, !this.viewState.isTreeExpanded(id));
  }

  addToWorkspace(id: string): void {
    this.viewState.addSelection(id);
  }

  isSelected(id: string): boolean {
    return this.viewState.selectedModuleIds().includes(id);
  }
}
