import { readFile, stat, readdir } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const sopDataPath = resolve(projectRoot, 'src/app/core/data/sop.data.ts');
const browserOutDir = resolve(projectRoot, 'dist/sop-viewer/browser');

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function reportBrowserJsSizes() {
  try {
    const files = await readdir(browserOutDir);
    const jsFiles = files.filter((name) => extname(name) === '.js');
    if (jsFiles.length === 0) {
      return;
    }

    console.log('JavaScript asset sizes:');
    for (const file of jsFiles.sort()) {
      const jsPath = resolve(browserOutDir, file);
      const jsStats = await stat(jsPath);
      console.log(`- ${file}: ${formatKb(jsStats.size)}`);
    }
  } catch {
    console.log('No dist output found yet (skip JS asset size report).');
  }
}

async function main() {
  const [contents, fileStats] = await Promise.all([readFile(sopDataPath, 'utf8'), stat(sopDataPath)]);

  if (contents.includes('base64Data')) {
    throw new Error('External bundle check failed: found base64Data in generated sop.data.ts.');
  }

  console.log(`OK: sop.data.ts contains no base64Data (external image paths only).`);
  console.log(`sop.data.ts size: ${formatKb(fileStats.size)}`);
  await reportBrowserJsSizes();
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
