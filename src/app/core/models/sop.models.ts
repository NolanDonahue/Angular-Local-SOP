export type SopCategory = 'routine' | 'pitfall' | 'one-off';

export type ContentSegment =
  | { type: 'text'; value: string }
  | { type: 'term'; termId: string; display: string };

export interface SopModule {
  id: string;
  title: string;
  category: SopCategory;
  content: ContentSegment[];
  children: SopModule[];
  tags?: string[];
  version?: string;
  updatedAt?: string;
  owner?: string;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
}

export interface SopContentPack {
  modules: SopModule[];
  glossary: GlossaryTerm[];
}
