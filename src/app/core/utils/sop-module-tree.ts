import { SopModule } from '../models/sop.models';

export function flattenModules(nodes: SopModule[]): SopModule[] {
  return nodes.flatMap((node) => [node, ...flattenModules(node.children)]);
}

export function collectUniqueSortedTags(nodes: SopModule[]): string[] {
  const seen = new Set<string>();
  for (const mod of flattenModules(nodes)) {
    for (const t of mod.tags ?? []) {
      seen.add(t);
    }
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}

function moduleMatchesTags(node: SopModule, activeTags: ReadonlySet<string>): boolean {
  return (node.tags ?? []).some((t) => activeTags.has(t));
}

export function filterModuleTreeByTags(
  nodes: SopModule[],
  activeTags: ReadonlySet<string>,
): SopModule[] {
  if (activeTags.size === 0) {
    return nodes;
  }

  const out: SopModule[] = [];
  for (const node of nodes) {
    const filteredChildren = filterModuleTreeByTags(node.children, activeTags);
    const selfMatches = moduleMatchesTags(node, activeTags);
    if (!selfMatches && filteredChildren.length === 0) {
      continue;
    }

    const ch = node.children;
    const fc = filteredChildren;
    const childrenUnchanged = fc.length === ch.length && fc.every((c, i) => c === ch[i]);

    if (childrenUnchanged) {
      out.push(node);
    } else {
      out.push({ ...node, children: filteredChildren });
    }
  }
  return out;
}
