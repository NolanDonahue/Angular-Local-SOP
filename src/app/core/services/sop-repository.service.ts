import { Injectable, computed, inject, signal } from '@angular/core';
import { GlossaryTerm, SopCategory, SopModule } from '../models/sop.models';
import { CmsApiService } from './cms-api.service';

@Injectable({ providedIn: 'root' })
export class SopRepositoryService {
  private readonly cms = inject(CmsApiService);

  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private hasLoaded = false;

  readonly modules = computed(() => this.cms.sopTree());
  readonly glossary = computed(() => this.cms.glossary());
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  async loadContent(): Promise<void> {
    if (this.hasLoaded || this._loading()) {
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      await this.cms.initialize();

      const modules = this.cms.sopTree();
      const glossary = this.cms.glossary();

      if (!Array.isArray(modules) || !modules.every((module) => this.isSopModule(module))) {
        throw new Error('Invalid SOP module content format.');
      }

      if (!Array.isArray(glossary) || !glossary.every((term) => this.isGlossaryTerm(term))) {
        throw new Error('Invalid glossary content format.');
      }

      this.hasLoaded = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load SOP content files.';
      this._error.set(message);
    } finally {
      this._loading.set(false);
    }
  }

  getTermById(id: string): GlossaryTerm | undefined {
    return this.cms.glossary().find((term) => term.id === id);
  }

  findModuleById(id: string): SopModule | undefined {
    return this.findNestedModule(id, this.cms.sopTree());
  }

  private findNestedModule(id: string, nodes: SopModule[]): SopModule | undefined {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      const found = this.findNestedModule(id, node.children);
      if (found) {
        return found;
      }
    }
    return undefined;
  }

  private isSopCategory(value: unknown): value is SopCategory {
    return value === 'routine' || value === 'pitfall' || value === 'one-off';
  }

  private isContentSegment(value: unknown): value is SopModule['content'][number] {
    if (!value || typeof value !== 'object') {
      return false;
    }
    const segment = value as Partial<SopModule['content'][number]>;
    if (segment.type === 'text') {
      return typeof segment.value === 'string';
    }
    if (segment.type === 'term') {
      return typeof segment.termId === 'string' && typeof segment.display === 'string';
    }
    return false;
  }

  private isSopModule(value: unknown): value is SopModule {
    if (!value || typeof value !== 'object') {
      return false;
    }
    const module = value as Partial<SopModule>;
    return (
      typeof module.id === 'string' &&
      typeof module.title === 'string' &&
      this.isSopCategory(module.category) &&
      Array.isArray(module.content) &&
      module.content.every((segment) => this.isContentSegment(segment)) &&
      Array.isArray(module.children) &&
      module.children.every((child) => this.isSopModule(child))
    );
  }

  private isGlossaryTerm(value: unknown): value is GlossaryTerm {
    if (!value || typeof value !== 'object') {
      return false;
    }
    const term = value as Partial<GlossaryTerm>;
    return (
      typeof term.id === 'string' &&
      typeof term.term === 'string' &&
      typeof term.definition === 'string'
    );
  }
}
