import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GLOSSARY_DATA } from '../data/glossary.data';
import { SOP_DATA } from '../data/sop.data';
import { GlossaryTerm, SopModule } from '../models/sop.models';

export interface UploadedImageRef {
  src: string;
  alt: string;
  fileName?: string;
}

function deepClone<T>(value: T): T {
  return structuredClone(value);
}

@Injectable({ providedIn: 'root' })
export class CmsApiService {
  private readonly http = inject(HttpClient);

  private readonly _sopTree = signal<SopModule[]>([]);
  private readonly _glossary = signal<GlossaryTerm[]>([]);

  readonly sopTree = this._sopTree.asReadonly();
  readonly glossary = this._glossary.asReadonly();

  canPersist(): boolean {
    return !!environment.cmsApiBaseUrl;
  }

  async initialize(): Promise<void> {
    const base = environment.cmsApiBaseUrl?.replace(/\/$/, '');
    if (base) {
      try {
        const [modules, glossary] = await Promise.all([
          firstValueFrom(this.http.get<unknown>(`${base}/sops`)),
          firstValueFrom(this.http.get<unknown>(`${base}/glossary`)),
        ]);
        this._sopTree.set(deepClone(modules) as SopModule[]);
        this._glossary.set(deepClone(glossary) as GlossaryTerm[]);
        return;
      } catch {
        // If local API is unavailable, fall back to bundled content.
      }
    } else {
      // No local CMS URL configured, use bundled content.
    }
    this._sopTree.set(deepClone(SOP_DATA) as SopModule[]);
    this._glossary.set(deepClone(GLOSSARY_DATA) as GlossaryTerm[]);
  }

  replaceSopTree(modules: SopModule[]): void {
    this._sopTree.set(deepClone(modules));
  }

  replaceGlossary(terms: GlossaryTerm[]): void {
    this._glossary.set(deepClone(terms));
  }

  updateSopTree(updater: (current: SopModule[]) => SopModule[]): void {
    this._sopTree.update((current) => deepClone(updater(deepClone(current))));
  }

  updateGlossary(updater: (current: GlossaryTerm[]) => GlossaryTerm[]): void {
    this._glossary.update((current) => deepClone(updater(deepClone(current))));
  }

  async saveSops(): Promise<void> {
    const base = environment.cmsApiBaseUrl?.replace(/\/$/, '');
    if (!base) {
      throw new Error('CMS API URL is not configured.');
    }
    await firstValueFrom(
      this.http.post<{ success: boolean }>(`${base}/sops`, this._sopTree()),
    );
  }

  async saveGlossary(): Promise<void> {
    const base = environment.cmsApiBaseUrl?.replace(/\/$/, '');
    if (!base) {
      throw new Error('CMS API URL is not configured.');
    }
    await firstValueFrom(
      this.http.post<{ success: boolean }>(`${base}/glossary`, this._glossary()),
    );
  }

  async uploadImage(file: File): Promise<UploadedImageRef> {
    const base = environment.cmsApiBaseUrl?.replace(/\/$/, '');
    if (!base) {
      throw new Error('CMS API URL is not configured.');
    }
    const form = new FormData();
    form.append('image', file);
    return firstValueFrom(
      this.http.post<UploadedImageRef>(`${base}/assets/images`, form),
    );
  }
}
