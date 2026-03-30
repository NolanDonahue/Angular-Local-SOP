import { inject, Injectable } from '@angular/core';
import {
  Document,
  FileChild,
  HeadingLevel,
  Packer,
  Paragraph,
  TableOfContents,
  TextRun,
} from 'docx';
import { saveAs } from 'file-saver';
import { ContentSegment, GlossaryTerm, SopModule } from '../models/sop.models';
import { SopRepositoryService } from './sop-repository.service';

@Injectable({ providedIn: 'root' })
export class ExportService {
  readonly repository = inject(SopRepositoryService);

  async exportToWord(modules: SopModule[]): Promise<void> {
    const moduleParagraphs = this.modulesToParagraphs(modules, 1);
    const children: FileChild[] = [
      new Paragraph({ text: 'Standard Operating Procedures', heading: HeadingLevel.TITLE }),
      new Paragraph({ text: '' }),
      new Paragraph({
        text: 'Table of Contents',
        heading: HeadingLevel.HEADING_1,
      }),
      new TableOfContents('', {
        hyperlink: true,
      }),
      ...moduleParagraphs,
      new Paragraph({ text: '' }),
      new Paragraph({ text: 'Glossary', heading: HeadingLevel.HEADING_1 }),
      ...this.glossaryToParagraphs(this.repository.glossary()),
    ];

    const doc = new Document({
      sections: [{ children }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'SOP-Export.docx');
  }

  private modulesToParagraphs(modules: SopModule[], depth: number): Paragraph[] {
    const heading = this.getHeadingLevel(depth);
    return modules.flatMap((module) => [
      new Paragraph({ text: module.title, heading }),
      new Paragraph({ children: this.segmentsToRuns(module.content) }),
      ...this.modulesToParagraphs(module.children, depth + 1),
    ]);
  }

  private getHeadingLevel(depth: number): (typeof HeadingLevel)[keyof typeof HeadingLevel] {
    switch (depth) {
      case 1:
        return HeadingLevel.HEADING_1;
      case 2:
        return HeadingLevel.HEADING_2;
      case 3:
        return HeadingLevel.HEADING_3;
      case 4:
        return HeadingLevel.HEADING_4;
      default:
        return HeadingLevel.HEADING_5;
    }
  }

  private segmentsToRuns(segments: ContentSegment[]): TextRun[] {
    const runs: TextRun[] = [];
    for (const segment of segments) {
      if (segment.type === 'text') {
        runs.push(new TextRun(segment.value));
        continue;
      }

      if (segment.type === 'image') {
        const fileName = this.imageFileNameFromSrc(segment.src);
        runs.push(
          new TextRun(`[Insert image from assets/images: ${fileName}]`),
        );
        continue;
      }

      const term = this.repository.getTermById(segment.termId);
      const definition = term ? ` (${term.definition})` : '';
      runs.push(new TextRun({ text: `${segment.display}${definition}`, bold: true }));
    }

    return runs;
  }

  private imageFileNameFromSrc(src: string): string {
    const trimmed = src.trim();
    const parts = trimmed.split('/');
    const fileName = parts[parts.length - 1];
    return fileName || trimmed;
  }

  private glossaryToParagraphs(terms: GlossaryTerm[]): Paragraph[] {
    return terms.map(
      (term) =>
        new Paragraph({
          children: [
            new TextRun({ text: `${term.term}: `, bold: true }),
            new TextRun(term.definition),
          ],
        }),
    );
  }
}
