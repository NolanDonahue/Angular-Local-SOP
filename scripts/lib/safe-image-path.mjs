import { isAbsolute, relative, resolve } from 'node:path';

/**
 * @param {string} imagesRoot Absolute path to the images directory
 * @param {string} relativePart Path interpreted relative to imagesRoot
 * @returns {string | null} Absolute file path if contained under imagesRoot, else null
 */
export function resolveSafeImagePath(imagesRoot, relativePart) {
  if (typeof relativePart !== 'string' || relativePart.trim() === '') {
    return null;
  }
  if (relativePart.includes('\0')) {
    return null;
  }
  const trimmed = relativePart.trim();
  const candidate = resolve(imagesRoot, trimmed);
  const rel = relative(imagesRoot, candidate);
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) {
    return null;
  }
  return candidate;
}

/**
 * @param {string} imagesRoot
 * @param {string} absolutePath Must be under imagesRoot
 */
export function publicAssetsImageSrc(imagesRoot, absolutePath) {
  const rel = relative(imagesRoot, absolutePath).replace(/\\/g, '/');
  return `assets/images/${rel}`;
}
