import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const browserDir = path.resolve('dist/sop-viewer/browser');
const indexPath = path.join(browserDir, 'index.html');
const indexHtml = await readFile(indexPath, 'utf8');

const mainMatch = indexHtml.match(/<script\s+src="(\.\/main[^"]+\.js)"\s+type="module"><\/script>/);
if (!mainMatch) {
  throw new Error('Could not find module main script in built index.html');
}

const mainRel = mainMatch[1];
const mainAbs = path.join(browserDir, mainRel.replace('./', ''));
const outRel = './app-file-static.js';
const outAbs = path.join(browserDir, outRel.replace('./', ''));

await build({
  entryPoints: [mainAbs],
  outfile: outAbs,
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2018'],
  sourcemap: false,
  minify: true,
});

const rewrittenIndex = indexHtml
  .replace(/<link rel="modulepreload" href="[^"]+">/g, '')
  .replace(/<script\s+src="\.\/main[^"]+\.js"\s+type="module"><\/script>/, `<script src="${outRel}"></script>`);

await writeFile(indexPath, rewrittenIndex, 'utf8');
console.log('Built file-static bundle:', outRel);
