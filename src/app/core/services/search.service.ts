import { Injectable, computed, inject } from '@angular/core';
import Fuse from 'fuse.js';
import { GlossaryTerm, SopModule } from '../models/sop.models';
import { SopRepositoryService } from './sop-repository.service';

export type SearchResult =
  | { kind: 'module'; item: SopModule }
  | { kind: 'term'; item: GlossaryTerm };

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly moduleIndex = computed(
    () =>
      new Fuse(this.flatten(this.repository.modules()), {
        keys: ['title', 'tags', 'content.value', 'content.display'],
        threshold: 0.35,
      }),
  );

  private readonly glossaryIndex = computed(
    () =>
      new Fuse(this.repository.glossary(), {
        keys: ['term', 'definition'],
        threshold: 0.35,
      }),
  );

  private readonly repository = inject(SopRepositoryService);

  search(query: string): SearchResult[] {
    if (!query.trim()) {
      return [];
    }

    const moduleHits = this.moduleIndex()
      .search(query, { limit: 20 })
      .map((result) => ({ kind: 'module' as const, item: result.item }));
    const termHits = this.glossaryIndex()
      .search(query, { limit: 10 })
      .map((result) => ({ kind: 'term' as const, item: result.item }));

    return [...moduleHits, ...termHits];
  }

  private flatten(nodes: SopModule[]): SopModule[] {
    return nodes.flatMap((node) => [node, ...this.flatten(node.children)]);
  }
}
