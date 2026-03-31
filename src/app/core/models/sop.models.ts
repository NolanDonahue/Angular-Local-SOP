export type SopCategory = 'routine' | 'pitfall' | 'one-off';

export interface TextSegment {
  type: 'text';
  value: string;
}

export interface TermSegment {
  type: 'term';
  termId: string;
  display: string;
}

export interface ImageSegment {
  type: 'image';
  src: string;
  alt: string;
}

export type ContentSegment = TextSegment | TermSegment | ImageSegment;

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
