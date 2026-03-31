import { moveItemInArray } from '@angular/cdk/drag-drop';
import { SopModule } from '../models/sop.models';

export function collectModuleIds(nodes: SopModule[], out = new Set<string>()): Set<string> {
  for (const n of nodes) {
    out.add(n.id);
    collectModuleIds(n.children, out);
  }
  return out;
}

export function slugifyModuleId(title: string): string {
  const s = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return s || 'module';
}

export function uniqueModuleId(title: string, nodes: SopModule[]): string {
  const existing = collectModuleIds(nodes);
  const base = slugifyModuleId(title);
  let id = base;
  let n = 2;
  while (existing.has(id)) {
    id = `${base}-${n++}`;
  }
  return id;
}

export function newEmptyModule(title: string, id: string): SopModule {
  return {
    id,
    title,
    category: 'routine',
    content: [],
    children: [],
    version: '1.0',
    updatedAt: new Date().toISOString().slice(0, 10),
  };
}

export function addRootModule(nodes: SopModule[], child: SopModule): SopModule[] {
  return [...nodes, child];
}

export function addChildModule(
  nodes: SopModule[],
  parentId: string,
  child: SopModule,
): SopModule[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...node.children, child] };
    }
    if (node.children.length) {
      return { ...node, children: addChildModule(node.children, parentId, child) };
    }
    return node;
  });
}

export function updateModuleInTree(
  nodes: SopModule[],
  moduleId: string,
  updater: (m: SopModule) => SopModule,
): SopModule[] {
  return nodes.map((node) => {
    if (node.id === moduleId) {
      return updater(node);
    }
    if (node.children.length) {
      return { ...node, children: updateModuleInTree(node.children, moduleId, updater) };
    }
    return node;
  });
}

export function removeModuleFromTree(nodes: SopModule[], moduleId: string): SopModule[] {
  const filtered = nodes.filter((n) => n.id !== moduleId);
  return filtered.map((node) => ({
    ...node,
    children: removeModuleFromTree(node.children, moduleId),
  }));
}

export function reorderModuleChildren(
  nodes: SopModule[],
  parentId: string,
  previousIndex: number,
  currentIndex: number,
): SopModule[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      const children = [...node.children];
      if (
        previousIndex < 0 ||
        currentIndex < 0 ||
        previousIndex >= children.length ||
        currentIndex >= children.length
      ) {
        return node;
      }
      moveItemInArray(children, previousIndex, currentIndex);
      return { ...node, children };
    }
    if (node.children.length) {
      return {
        ...node,
        children: reorderModuleChildren(node.children, parentId, previousIndex, currentIndex),
      };
    }
    return node;
  });
}
