import { Component, inject, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { SopModule } from '../../core/models/sop.models';
import { ViewStateService } from '../../core/services/view-state.service';
import { SopContentComponent } from '../content/content.component';

@Component({
  selector: 'app-module-item',
  standalone: true,
  imports: [MatExpansionModule, MatChipsModule, SopContentComponent],
  template: `
    <mat-expansion-panel
      [class.nested-panel]="nested()"
      [expanded]="viewState.isExpanded(module().id)"
      (opened)="viewState.setExpanded(module().id, true)"
      (closed)="viewState.setExpanded(module().id, false)"
    >
      <mat-expansion-panel-header>
        <mat-panel-title>{{ module().title }}</mat-panel-title>
        <mat-panel-description>
          <mat-chip [class]="'category-' + module().category">{{ module().category }}</mat-chip>
        </mat-panel-description>
      </mat-expansion-panel-header>

      <div class="module-content"><app-sop-content [segments]="module().content" /></div>

      @if (module().tags?.length) {
        <div class="tags">
          @for (tag of module().tags ?? []; track tag) {
            <mat-chip>{{ tag }}</mat-chip>
          }
        </div>
      }

      @if (module().children.length) {
        <div class="children">
          @for (child of module().children; track child.id) {
            <app-module-item [module]="child" [nested]="true" />
          }
        </div>
      }
    </mat-expansion-panel>
  `,
  styles: `
    .children {
      padding-left: 0.75rem;
      border-left: 2px solid var(--border-subtle);
      margin-top: 0.5rem;
    }

    mat-expansion-panel.nested-panel {
      margin-left: 1rem;
      border-left: 3px solid rgba(66, 165, 245, 0.7);
      box-shadow: none;
    }

    .tags {
      display: flex;
      gap: 0.4rem;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
    }

    .module-content {
      margin: 0.5rem 0 1rem;
    }
  `,
})
export class ModuleItemComponent {
  readonly module = input.required<SopModule>();
  readonly nested = input(false);

  readonly viewState = inject(ViewStateService);
}
