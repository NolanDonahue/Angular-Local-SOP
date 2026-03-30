import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterLink } from '@angular/router';
import { GlossaryTerm } from '../../core/models/sop.models';
import { SopRepositoryService } from '../../core/services/sop-repository.service';

@Component({
  selector: 'app-glossary',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatExpansionModule],
  template: `
    <main class="page">
      <header class="toolbar">
        <a mat-stroked-button routerLink="/">Back to all SOPs</a>
        <h1>Glossary</h1>
      </header>

      <mat-accordion class="glossary-list">
        @for (term of glossaryTerms(); track term.id) {
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>{{ term.term }}</mat-panel-title>
            </mat-expansion-panel-header>
            <p>{{ term.definition }}</p>
          </mat-expansion-panel>
        }
      </mat-accordion>
    </main>
  `,
  styles: `
    .page {
      max-width: 80%;
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

    .glossary-list {
      display: grid;
      gap: 0.6rem;
    }
  `,
})
export class GlossaryComponent {
  readonly repository = inject(SopRepositoryService);

  readonly glossaryTerms = computed<GlossaryTerm[]>(() =>
    [...this.repository.glossary()].sort((a, b) => a.term.localeCompare(b.term)),
  );
}
