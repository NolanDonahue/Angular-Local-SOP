import { NestedTreeControl } from '@angular/cdk/tree';
import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { RouterLink } from '@angular/router';
import { take } from 'rxjs';
import { CmsApiService } from '../../core/services/cms-api.service';
import { ViewStateService } from '../../core/services/view-state.service';
import { GlossaryTerm, SopModule } from '../../core/models/sop.models';
import { slugifyFromLabel, uniqueId } from '../../core/utils/content-markup';
import {
  addChildModule,
  addRootModule,
  collectModuleIds,
  newEmptyModule,
  removeModuleFromTree,
  uniqueModuleId,
  updateModuleInTree,
} from '../../core/utils/sop-tree-utils';
import { ModuleEditDialogComponent, ModuleEditDialogResult } from './module-edit-dialog.component';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatTabsModule,
    MatButtonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatTreeModule,
    MatDialogModule,
  ],
  template: `
    <main class="page">
      <header class="toolbar">
        <a mat-stroked-button routerLink="/">Back to all SOPs</a>
        <h1>Content editor</h1>
      </header>

      @if (saveError()) {
        <p class="error" role="alert">{{ saveError() }}</p>
      }

      <mat-tab-group>
        <mat-tab label="SOPs">
          <div class="tab-pad">
            <div class="actions wrap">
              <button
                mat-flat-button
                color="primary"
                type="button"
                (click)="saveSops()"
                [disabled]="saving() || !cms.canPersist()"
              >
                Save All SOPs
              </button>
              <button mat-stroked-button type="button" (click)="addRootModule()">
                Add root module
              </button>
              @if (!cms.canPersist()) {
                <span class="hint">Saving requires dev server and API (npm start).</span>
              }
            </div>

            <mat-tree [dataSource]="dataSource" [treeControl]="treeControl" class="sop-tree">
              <mat-nested-tree-node *matTreeNodeDef="let node">
                <li class="tree-node">
                  <div class="tree-line">
                    @if (node.children.length) {
                      <button
                        mat-icon-button
                        matTreeNodeToggle
                        type="button"
                        [attr.aria-label]="'toggle ' + node.title"
                        class="tree-toggle"
                      >
                        <span class="tree-chevron" aria-hidden="true">{{
                          treeControl.isExpanded(node) ? '▾' : '▸'
                        }}</span>
                      </button>
                    } @else {
                      <span class="tree-toggle-spacer" aria-hidden="true"></span>
                    }
                    <span class="node-title">{{ node.title }}</span>
                    <button mat-stroked-button type="button" (click)="editModule(node)">
                      Edit
                    </button>
                    <button mat-stroked-button type="button" (click)="addChildModule(node)">
                      Add child
                    </button>
                  </div>
                  <ul class="nested" [class.nested-collapsed]="!treeControl.isExpanded(node)">
                    <ng-container matTreeNodeOutlet></ng-container>
                  </ul>
                </li>
              </mat-nested-tree-node>
            </mat-tree>
          </div>
        </mat-tab>

        <mat-tab label="Glossary">
          <div class="tab-pad">
            <div class="actions">
              <button
                mat-flat-button
                color="primary"
                type="button"
                (click)="saveGlossary()"
                [disabled]="saving() || !cms.canPersist()"
              >
                Save Glossary
              </button>
              @if (!cms.canPersist()) {
                <span class="hint">Saving requires dev server and API (npm start).</span>
              }
            </div>

            <table mat-table [dataSource]="glossaryRows()" class="glossary-table">
              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef>ID</th>
                <td mat-cell *matCellDef="let row">{{ row.id }}</td>
              </ng-container>
              <ng-container matColumnDef="term">
                <th mat-header-cell *matHeaderCellDef>Term</th>
                <td mat-cell *matCellDef="let row">{{ row.term }}</td>
              </ng-container>
              <ng-container matColumnDef="definition">
                <th mat-header-cell *matHeaderCellDef>Definition</th>
                <td mat-cell *matCellDef="let row">{{ row.definition }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row">
                  <button mat-button type="button" (click)="removeGlossaryTerm(row.id)">
                    Remove
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="glossaryColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: glossaryColumns"></tr>
            </table>

            <h3>Add term</h3>
            <div class="add-form">
              <mat-form-field appearance="outline">
                <mat-label>Term</mat-label>
                <input matInput [(ngModel)]="newTermLabel" name="newTermLabel" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="grow">
                <mat-label>Definition</mat-label>
                <input matInput [(ngModel)]="newDefinition" name="newDefinition" />
              </mat-form-field>
              <button mat-stroked-button type="button" (click)="addGlossaryTerm()">Add</button>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </main>
  `,
  styles: `
    .page {
      max-width: 960px;
      margin: 0 auto;
      padding: 1rem;
      display: grid;
      gap: 1rem;
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .toolbar h1 {
      margin: 0;
    }

    .tab-pad {
      padding: 1rem 0;
      display: grid;
      gap: 1rem;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .hint {
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .error {
      color: var(--mat-sys-error, #c62828);
      margin: 0;
    }

    .glossary-table {
      width: 100%;
    }

    .add-form {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: flex-start;
    }

    .grow {
      flex: 1;
      min-width: 220px;
    }

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

    .nested-collapsed {
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
  `,
})
export class EditorComponent {
  readonly cms = inject(CmsApiService);
  private readonly viewState = inject(ViewStateService);
  private readonly dialog = inject(MatDialog);

  readonly treeControl = new NestedTreeControl<SopModule>((n) => n.children);
  readonly dataSource = new MatTreeNestedDataSource<SopModule>();

  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  readonly glossaryColumns = ['id', 'term', 'definition', 'actions'] as const;

  readonly glossaryRows = computed(() =>
    [...this.cms.glossary()].sort((a, b) => a.term.localeCompare(b.term)),
  );

  newTermLabel = '';
  newDefinition = '';

  /** Set before `updateSopTree` in `addChildModule`; applied when the tree effect runs. */
  private pendingAutoExpandModuleId: string | null = null;

  constructor() {
    effect(() => {
      const expandedIds = this.collectExpandedModuleIds(this.dataSource.data ?? []);
      this.dataSource.data = this.cms.sopTree();
      this.expandNodesById(this.dataSource.data ?? [], expandedIds);
      const pendingId = this.pendingAutoExpandModuleId;
      if (pendingId) {
        const node = this.findModuleById(this.dataSource.data ?? [], pendingId);
        if (node) {
          this.treeControl.expand(node);
        }
        this.pendingAutoExpandModuleId = null;
      }
    });
  }

  private collectExpandedModuleIds(nodes: SopModule[]): Set<string> {
    const ids = new Set<string>();
    const walk = (list: SopModule[]): void => {
      for (const n of list) {
        if (this.treeControl.isExpanded(n)) {
          ids.add(n.id);
        }
        if (n.children.length) {
          walk(n.children);
        }
      }
    };
    walk(nodes);
    return ids;
  }

  private expandNodesById(nodes: SopModule[], ids: Set<string>): void {
    const walk = (list: SopModule[]): void => {
      for (const n of list) {
        if (ids.has(n.id)) {
          this.treeControl.expand(n);
        }
        if (n.children.length) {
          walk(n.children);
        }
      }
    };
    walk(nodes);
  }

  private findModuleById(nodes: SopModule[], id: string): SopModule | null {
    for (const n of nodes) {
      if (n.id === id) {
        return n;
      }
      const found = this.findModuleById(n.children, id);
      if (found) {
        return found;
      }
    }
    return null;
  }

  addGlossaryTerm(): void {
    const term = this.newTermLabel.trim();
    const definition = this.newDefinition.trim();
    if (!term || !definition) {
      return;
    }
    this.cms.updateGlossary((g) => {
      const ids = new Set(g.map((x) => x.id));
      const base = slugifyFromLabel(term);
      const id = uniqueId(base, ids);
      const row: GlossaryTerm = { id, term, definition };
      return [...g, row];
    });
    this.newTermLabel = '';
    this.newDefinition = '';
  }

  removeGlossaryTerm(id: string): void {
    this.cms.updateGlossary((g) => g.filter((t) => t.id !== id));
  }

  async saveGlossary(): Promise<void> {
    this.saveError.set(null);
    this.saving.set(true);
    try {
      await this.cms.saveGlossary();
    } catch (e) {
      this.saveError.set(e instanceof Error ? e.message : 'Save failed');
    } finally {
      this.saving.set(false);
    }
  }

  addRootModule(): void {
    const title = 'New module';
    this.cms.updateSopTree((nodes) => {
      const id = uniqueModuleId(title, nodes);
      return addRootModule(nodes, newEmptyModule(title, id));
    });
  }

  addChildModule(parent: SopModule): void {
    const title = 'New child';
    const tree = this.cms.sopTree();
    const id = uniqueModuleId(title, tree);
    this.pendingAutoExpandModuleId = id;
    this.cms.updateSopTree((nodes) => addChildModule(nodes, parent.id, newEmptyModule(title, id)));
  }

  editModule(node: SopModule): void {
    const shallow = JSON.parse(JSON.stringify(node)) as SopModule;
    this.dialog
      .open(ModuleEditDialogComponent, {
        data: { module: shallow },
        width: '640px',
        maxWidth: '95vw',
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((r: ModuleEditDialogResult | undefined) => {
        if (!r) {
          return;
        }
        if (r.action === 'delete') {
          const ids = collectModuleIds([node]);
          for (const id of ids) {
            this.viewState.removeSelection(id);
          }
          this.cms.updateSopTree((tree) => removeModuleFromTree(tree, node.id));
          return;
        }
        this.cms.updateSopTree((tree) =>
          updateModuleInTree(tree, node.id, (m) => ({
            ...m,
            title: r.title,
            category: r.category,
            content: r.content,
            updatedAt: new Date().toISOString().slice(0, 10),
          })),
        );
      });
  }

  async saveSops(): Promise<void> {
    this.saveError.set(null);
    this.saving.set(true);
    try {
      await this.cms.saveSops();
    } catch (e) {
      this.saveError.set(e instanceof Error ? e.message : 'Save failed');
    } finally {
      this.saving.set(false);
    }
  }
}
