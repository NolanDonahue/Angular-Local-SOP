import { Component, inject, input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ContentSegment } from '../../core/models/sop.models';
import { SopRepositoryService } from '../../core/services/sop-repository.service';

@Component({
  selector: 'app-sop-content',
  standalone: true,
  imports: [MatTooltipModule],
  template: `
    @for (segment of segments(); track $index) {
      @switch (segment.type) {
        @case ('text') {
          <span>{{ segment.value }}</span>
        }
        @case ('term') {
          <span class="glossary-term" [matTooltip]="definition(segment.termId)">
            {{ segment.display }}
          </span>
        }
        @case ('image') {
          <span class="image-wrapper">
            <img [src]="segment.src" [alt]="segment.alt" class="inline-sop-image" />
          </span>
        }
      }
    }
  `,
  styles: `
    .glossary-term {
      border-bottom: 1px dashed currentColor;
      cursor: help;
      font-weight: 600;
      color: var(--glossary-term-color);
    }

    .inline-sop-image {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
      display: block;
      margin: 1rem 0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  `,
})
export class SopContentComponent {
  readonly segments = input.required<ContentSegment[]>();

  readonly repository = inject(SopRepositoryService);

  definition(termId: string): string {
    return this.repository.getTermById(termId)?.definition ?? '';
  }
}
