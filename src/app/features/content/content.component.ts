import { Component, inject, Input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ContentSegment } from '../../core/models/sop.models';
import { SopRepositoryService } from '../../core/services/sop-repository.service';

@Component({
  selector: 'app-sop-content',
  standalone: true,
  imports: [MatTooltipModule],
  template: `
    @for (segment of segments; track $index) {
      @if (segment.type === 'text') {
        <span>{{ segment.value }}</span>
      } @else {
        <span class="glossary-term" [matTooltip]="definition(segment.termId)">
          {{ segment.display }}
        </span>
      }
    }
  `,
  styles: `
    .glossary-term {
      border-bottom: 1px dashed currentColor;
      cursor: help;
      font-weight: 600;
      color: #8ecbff;
    }
  `,
})
export class SopContentComponent {
  @Input({ required: true }) segments: ContentSegment[] = [];

  readonly repository = inject(SopRepositoryService);

  definition(termId: string): string {
    return this.repository.getTermById(termId)?.definition ?? '';
  }
}
