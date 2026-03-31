import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, forwardRef, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SopModule } from '../../core/models/sop.models';
import { CmsApiService } from '../../core/services/cms-api.service';
import { reorderModuleChildren } from '../../core/utils/sop-tree-utils';

@Component({
  selector: 'app-editor-sop-tree',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatButtonModule,
    MatIconModule,
    forwardRef(() => EditorSopTreeComponent),
  ],
  template: `
    @if (parentId() === undefined) {
      <ul class="sop-tree">
        @for (node of modules(); track node.id) {
          <li class="tree-node">
            <div class="tree-line">
              @if (node.children.length) {
                <button
                  mat-icon-button
                  type="button"
                  class="tree-toggle"
                  [attr.aria-label]="'toggle ' + node.title"
                  (click)="expandToggled.emit(node.id)"
                >
                  <span class="tree-chevron" aria-hidden="true">{{
                    expandedIds().has(node.id) ? '▾' : '▸'
                  }}</span>
                </button>
              } @else {
                <span class="tree-toggle-spacer" aria-hidden="true"></span>
              }
              <span class="node-title">{{ node.title }}</span>
              <button mat-stroked-button type="button" (click)="editRequested.emit(node)">
                Edit
              </button>
              <button mat-stroked-button type="button" (click)="addChildRequested.emit(node)">
                Add child
              </button>
            </div>
            @if (node.children.length) {
              <div
                class="nested nested-wrap"
                [class.nested-collapsed]="!expandedIds().has(node.id)"
              >
                <app-editor-sop-tree
                  [modules]="node.children"
                  [parentId]="node.id"
                  [expandedIds]="expandedIds()"
                  (expandToggled)="expandToggled.emit($event)"
                  (editRequested)="editRequested.emit($event)"
                  (addChildRequested)="addChildRequested.emit($event)"
                />
              </div>
            }
          </li>
        }
      </ul>
    } @else {
      <ul
        class="nested drag-list"
        cdkDropList
        (cdkDropListDropped)="onDropped($event)"
      >
        @for (node of modules(); track node.id) {
          <li class="tree-node" cdkDrag>
            <div class="tree-line">
              <button
                mat-icon-button
                type="button"
                class="drag-handle"
                cdkDragHandle
                aria-label="Drag to reorder"
              >
                <mat-icon svgIcon="grip-lines" />
              </button>
              @if (node.children.length) {
                <button
                  mat-icon-button
                  type="button"
                  class="tree-toggle"
                  [attr.aria-label]="'toggle ' + node.title"
                  (click)="expandToggled.emit(node.id)"
                >
                  <span class="tree-chevron" aria-hidden="true">{{
                    expandedIds().has(node.id) ? '▾' : '▸'
                  }}</span>
                </button>
              } @else {
                <span class="tree-toggle-spacer" aria-hidden="true"></span>
              }
              <span class="node-title">{{ node.title }}</span>
              <button mat-stroked-button type="button" (click)="editRequested.emit(node)">
                Edit
              </button>
              <button mat-stroked-button type="button" (click)="addChildRequested.emit(node)">
                Add child
              </button>
            </div>
            @if (node.children.length) {
              <div
                class="nested nested-wrap"
                [class.nested-collapsed]="!expandedIds().has(node.id)"
              >
                <app-editor-sop-tree
                  [modules]="node.children"
                  [parentId]="node.id"
                  [expandedIds]="expandedIds()"
                  (expandToggled)="expandToggled.emit($event)"
                  (editRequested)="editRequested.emit($event)"
                  (addChildRequested)="addChildRequested.emit($event)"
                />
              </div>
            }
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .sop-tree {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .tree-node {
      list-style: none;
    }

    .tree-line {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      flex-wrap: wrap;
      padding: 0.2rem 0;
    }

    .node-title {
      flex: 1;
      min-width: 120px;
    }

    .nested {
      margin: 0;
      padding-left: 1.5rem;
      border-left: 2px solid var(--border-subtle);
    }

    .nested-wrap.nested-collapsed {
      display: none;
    }

    .tree-chevron {
      font-size: 1rem;
      line-height: 1;
    }

    .tree-toggle-spacer {
      display: inline-block;
      width: 40px;
      flex-shrink: 0;
    }

    .drag-handle {
      flex-shrink: 0;
      cursor: grab;
      color: var(--text-muted);
    }

    .drag-handle:active {
      cursor: grabbing;
    }

    .drag-list .cdk-drag-placeholder {
      opacity: 0.45;
      border: 1px dashed var(--border-subtle);
      border-radius: 6px;
      min-height: 2.5rem;
      list-style: none;
      background: var(--surface-2, rgba(0, 0, 0, 0.04));
    }

    .drag-list .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
    }
  `,
})
export class EditorSopTreeComponent {
  readonly modules = input.required<SopModule[]>();
  /** When unset, this layer lists root modules (no drag). Otherwise lists that parent's children (draggable). */
  readonly parentId = input<string | undefined>(undefined);
  readonly expandedIds = input.required<ReadonlySet<string>>();

  readonly expandToggled = output<string>();
  readonly editRequested = output<SopModule>();
  readonly addChildRequested = output<SopModule>();

  private readonly cms = inject(CmsApiService);

  onDropped(event: CdkDragDrop<unknown>): void {
    const pid = this.parentId();
    if (pid === undefined || event.previousIndex === event.currentIndex) {
      return;
    }
    this.cms.updateSopTree((tree) =>
      reorderModuleChildren(tree, pid, event.previousIndex, event.currentIndex),
    );
  }
}
