import { ContentSegment, GlossaryTerm } from '../models/sop.models';

export function segmentsToMarkup(segments: ContentSegment[]): string {
  return segments
    .map((s) => {
      if (s.type === 'text') {
        return s.value;
      }
      return `[[${s.termId}]]`;
    })
    .join('');
}

export function markupToSegments(
  markup: string,
  glossaryById: Map<string, GlossaryTerm>,
): ContentSegment[] {
  const segments: ContentSegment[] = [];
  const re = /\[\[([a-z0-9-]+)\]\]/gi;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markup)) !== null) {
    const start = m.index;
    if (start > lastIndex) {
      const text = markup.slice(lastIndex, start);
      if (text) {
        pushText(segments, text);
      }
    }
    const termId = m[1].toLowerCase();
    const term = glossaryById.get(termId) ?? glossaryById.get(m[1]);
    if (term) {
      segments.push({ type: 'term', termId: term.id, display: term.term });
    } else {
      pushText(segments, m[0]);
    }
    lastIndex = re.lastIndex;
  }
  if (lastIndex < markup.length) {
    const text = markup.slice(lastIndex);
    if (text) {
      pushText(segments, text);
    }
  }
  return mergeAdjacentText(segments);
}

function pushText(segments: ContentSegment[], value: string): void {
  if (!value) {
    return;
  }
  segments.push({ type: 'text', value });
}

function mergeAdjacentText(segments: ContentSegment[]): ContentSegment[] {
  const out: ContentSegment[] = [];
  for (const seg of segments) {
    if (seg.type !== 'text') {
      out.push(seg);
      continue;
    }
    const prev = out[out.length - 1];
    if (prev?.type === 'text') {
      prev.value += seg.value;
    } else {
      out.push({ type: 'text', value: seg.value });
    }
  }
  return out;
}

export function glossaryToIdMap(terms: GlossaryTerm[]): Map<string, GlossaryTerm> {
  const map = new Map<string, GlossaryTerm>();
  for (const t of terms) {
    map.set(t.id, t);
    map.set(t.id.toLowerCase(), t);
  }
  return map;
}

export function slugifyFromLabel(label: string): string {
  const s = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return s || 'term';
}

export function uniqueId(base: string, existing: Set<string>): string {
  let id = base;
  let n = 2;
  while (existing.has(id)) {
    id = `${base}-${n++}`;
  }
  return id;
}
