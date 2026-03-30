import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import { createServer } from 'node:net';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const sopPath = resolve(projectRoot, 'src/assets/content/sop.json');
const glossaryPath = resolve(projectRoot, 'src/assets/content/glossary.json');
const assetsDir = resolve(projectRoot, 'src/assets');
const imagesDir = resolve(projectRoot, 'src/assets/images');
const tempUploadsDir = resolve(projectRoot, '.tmp/local-cms-uploads');
const preferredPort = 3000;
const fallbackPortCount = 20;

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/assets', express.static(assetsDir));

async function sendJsonError(res, error, status = 500) {
  const message = error instanceof Error ? error.message : String(error);
  await Promise.resolve(res.status(status).json({ error: message }));
}

function slugifyBaseName(fileName) {
  const ext = extname(fileName || '');
  const base = fileName.slice(0, fileName.length - ext.length);
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || 'image';
}

async function createUniqueImagePath(originalName) {
  await mkdir(imagesDir, { recursive: true });
  const base = slugifyBaseName(originalName);
  let attempt = 1;
  let candidate = `${base}.jpg`;
  let target = resolve(imagesDir, candidate);
  while (true) {
    try {
      await access(target);
      attempt += 1;
      candidate = `${base}-${attempt}.jpg`;
      target = resolve(imagesDir, candidate);
    } catch {
      return { fileName: candidate, path: target };
    }
  }
}

const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, callback) => {
      try {
        await mkdir(tempUploadsDir, { recursive: true });
        callback(null, tempUploadsDir);
      } catch (error) {
        callback(error);
      }
    },
    filename: (req, file, callback) => {
      const stamp = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      callback(null, `${stamp}.upload`);
    },
  }),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (file.mimetype?.startsWith('image/')) {
      callback(null, true);
      return;
    }
    callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'image'));
  },
});

function parseConfiguredPort(value) {
  if (!value) {
    return null;
  }
  const num = Number.parseInt(value, 10);
  if (!Number.isInteger(num) || num < 1 || num > 65535) {
    return null;
  }
  return num;
}

function isPortFree(port) {
  return new Promise((resolvePromise) => {
    const tester = createServer()
      .once('error', () => resolvePromise(false))
      .once('listening', () => tester.close(() => resolvePromise(true)))
      .listen(port, '127.0.0.1');
  });
}

async function resolveServerPort() {
  const configuredPort = parseConfiguredPort(process.env.CMS_PORT ?? process.env.PORT);
  const candidatePorts = configuredPort
    ? [configuredPort]
    : Array.from({ length: fallbackPortCount }, (_, index) => preferredPort + index);

  for (const candidate of candidatePorts) {
    if (await isPortFree(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    configuredPort
      ? `Configured CMS port ${configuredPort} is unavailable.`
      : `No available port found in range ${preferredPort}-${preferredPort + fallbackPortCount - 1}.`,
  );
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
  const tempPath = req.file?.path;
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
    await sharp(file.path)
      .resize({
        width: 1024,
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 80,
        progressive: true,
        force: true,
      })
      .toFile(path);

    const alt = fileName
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    res.send({
      success: true,
      src: `assets/images/${fileName}`,
      alt: alt || 'SOP Image',
      fileName,
    });
  } catch (error) {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        await sendJsonError(res, 'Image exceeds 25MB upload limit.', 413);
        return;
      }
      await sendJsonError(res, 'Only image uploads are supported.', 400);
      return;
    }

    console.error('Image processing error:', error);
    await sendJsonError(res, 'Failed to process and save image.');
  } finally {
    if (tempPath) {
      await rm(tempPath, { force: true });
    }
  }
});

const selectedPort = await resolveServerPort();
app.listen(selectedPort, () =>
  console.log(`Dev CMS Server running on http://localhost:${selectedPort}`),
);
