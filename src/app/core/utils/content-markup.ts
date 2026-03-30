import { ContentSegment, GlossaryTerm } from '../models/sop.models';

const IMAGE_PREFIX = 'assets/images/';

export function segmentsToMarkup(segments: ContentSegment[]): string {
  return segments
    .map((s) => {
      if (s.type === 'text') {
        return s.value;
      }
      if (s.type === 'image') {
        const path = s.src.startsWith(IMAGE_PREFIX) ? s.src.slice(IMAGE_PREFIX.length) : s.src;
        const alt = s.alt.trim();
        if (alt) {
          return `[[img:${path}|${alt}]]`;
        }
        return `[[img:${path}]]`;
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
  const re = /\[\[img:([^|\]]+)(?:\|([^\]]+))?\]\]|\[\[([^\]]+)\]\]/g;
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

    if (m[1]) {
      segments.push({
        type: 'image',
        src: `${IMAGE_PREFIX}${m[1].trim()}`,
        alt: m[2] ? m[2].trim() : 'SOP Image',
      });
    } else if (m[3]) {
      const termId = m[3].trim().toLowerCase();
      const term = glossaryById.get(termId) ?? glossaryById.get(m[3].trim());
      if (term) {
        segments.push({ type: 'term', termId: term.id, display: term.term });
      } else {
        console.warn(`⚠️ Warning: Glossary term '[[${termId}]]' not found.`);
        segments.push({ type: 'term', termId, display: m[3].trim() });
      }
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
