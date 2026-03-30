import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const sopPath = resolve(projectRoot, 'src/assets/content/sop.json');
const glossaryPath = resolve(projectRoot, 'src/assets/content/glossary.json');
const assetsDir = resolve(projectRoot, 'src/assets');
const imagesDir = resolve(projectRoot, 'src/assets/images');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/assets', express.static(assetsDir));

async function sendJsonError(res, error, status = 500) {
  const message = error instanceof Error ? error.message : String(error);
  await Promise.resolve(res.status(status).json({ error: message }));
}

function slugifyBaseName(fileName) {
  const ext = extname(fileName);
  const base = fileName.slice(0, fileName.length - ext.length);
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return {
    base: slug || 'image',
    ext: ext.toLowerCase() || '.png',
  };
}

async function createUniqueImagePath(originalName) {
  await mkdir(imagesDir, { recursive: true });
  const { base, ext } = slugifyBaseName(originalName);
  let attempt = 1;
  let candidate = `${base}${ext}`;
  let target = resolve(imagesDir, candidate);
  while (true) {
    try {
      await access(target);
      attempt += 1;
      candidate = `${base}-${attempt}${ext}`;
      target = resolve(imagesDir, candidate);
    } catch {
      return { fileName: candidate, path: target };
    }
  }
}

app.get('/api/sops', async (req, res) => {
  try {
    const data = await readFile(sopPath, 'utf8');
    res.send(JSON.parse(data));
  } catch (error) {
    await sendJsonError(res, error);
  }
});

app.get('/api/glossary', async (req, res) => {
  try {
    const data = await readFile(glossaryPath, 'utf8');
    res.send(JSON.parse(data));
  } catch (error) {
    await sendJsonError(res, error);
  }
});

app.post('/api/sops', async (req, res) => {
  try {
    await writeFile(sopPath, JSON.stringify(req.body, null, 2), 'utf8');
    res.send({ success: true });
  } catch (error) {
    await sendJsonError(res, error);
  }
});

app.post('/api/glossary', async (req, res) => {
  try {
    await writeFile(glossaryPath, JSON.stringify(req.body, null, 2), 'utf8');
    res.send({ success: true });
  } catch (error) {
    await sendJsonError(res, error);
  }
});

app.post('/api/assets/images', upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'Missing image file.' });
      return;
    }
    if (!file.mimetype?.startsWith('image/')) {
      res.status(400).json({ error: 'Only image uploads are supported.' });
      return;
    }

    const { fileName, path } = await createUniqueImagePath(file.originalname);
    await writeFile(path, file.buffer);

    const alt = fileName
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    res.send({
      success: true,
      src: `assets/images/${fileName}`,
      alt: alt || 'SOP Image',
    });
  } catch (error) {
    await sendJsonError(res, error);
  }
});

app.listen(3000, () =>
  console.log('Dev CMS Server running on http://localhost:3000'),
);
