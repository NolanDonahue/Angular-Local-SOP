import { build } from 'esbuild';
import { readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const browserDir = path.resolve('dist/sop-viewer/browser');
const indexPath = path.join(browserDir, 'index.html');
const standalonePath = path.join(browserDir, 'sop-viewer-standalone.html');

/** @param {string} html */
function extractStylesheetHref(html) {
  const re = /<link\s+[^>]*href="(\.\/styles[^"]+\.css)"[^>]*>/gi;
  const m = re.exec(html);
  return m ? m[1] : null;
}

/** @param {string} css */
function escapeClosingStyleTag(css) {
  return css.replace(/<\/style>/gi, '<\\/style>');
}

/** @param {string} js */
function escapeClosingScriptTag(js) {
  return js.replace(/<\/script>/gi, '<\\/script>');
}

let indexHtml = await readFile(indexPath, 'utf8');

const mainMatch = indexHtml.match(/<script\s+src="(\.\/main[^"]+\.js)"\s+type="module"><\/script>/);
if (!mainMatch) {
  throw new Error(
    'Could not find module main script in built index.html. Run `ng build` first (fresh output, not a prior inlined HTML).',
  );
}

const mainRel = mainMatch[1];
const mainAbs = path.join(browserDir, mainRel.replace(/^\.\//, ''));

const esbuildResult = await build({
  entryPoints: [mainAbs],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2018'],
  sourcemap: false,
  minify: true,
  write: false,
});

const outFile = esbuildResult.outputFiles[0];
if (!outFile) {
  throw new Error('esbuild produced no output file.');
}

const jsContent = escapeClosingScriptTag(outFile.text);

const stylesHref = extractStylesheetHref(indexHtml);
let extraStyles = '';
if (stylesHref) {
  const cssAbs = path.join(browserDir, stylesHref.replace(/^\.\//, ''));
  const cssRaw = await readFile(cssAbs, 'utf8');
  extraStyles = `<style>${escapeClosingStyleTag(cssRaw)}</style>`;
}

indexHtml = indexHtml.replace(/<link\s+rel="modulepreload"\s+href="[^"]+">/g, '');
indexHtml = indexHtml.replace(/<script\s+src="\.\/main[^"]+\.js"\s+type="module"><\/script>/, '');
indexHtml = indexHtml.replace(/<link\s+[^>]*rel="stylesheet"[^>]*>/gi, '');
indexHtml = indexHtml.replace(/<noscript>\s*<link\s+[^>]*rel="stylesheet"[^>]*>\s*<\/noscript>/gi, '');

if (extraStyles) {
  // Replacer function: CSS may contain `$&`, `$1`, etc.; string replacements interpret `$` specially.
  indexHtml = indexHtml.replace('</head>', () => `${extraStyles}</head>`);
}

// Replacer function: minified JS contains `$&`, `$'`, etc.; string replace would splice `</body>` into the bundle.
indexHtml = indexHtml.replace('</body>', () => `<script>${jsContent}</script></body>`);

await writeFile(standalonePath, indexHtml, 'utf8');
await writeFile(indexPath, indexHtml, 'utf8');

const entries = await readdir(browserDir, { withFileTypes: true });
for (const ent of entries) {
  if (!ent.isFile()) {
    continue;
  }
  const name = ent.name;
  if (name.endsWith('.js') || name.endsWith('.css')) {
    await unlink(path.join(browserDir, name));
  }
}

console.log('Built sop-viewer-standalone.html and index.html (inlined JS/CSS); removed root .js/.css files.');
