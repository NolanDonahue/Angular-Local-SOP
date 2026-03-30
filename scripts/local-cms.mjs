import express from 'express';
import cors from 'cors';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const sopPath = resolve(projectRoot, 'src/assets/content/sop.json');
const glossaryPath = resolve(projectRoot, 'src/assets/content/glossary.json');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

async function sendJsonError(res, error, status = 500) {
  const message = error instanceof Error ? error.message : String(error);
  await Promise.resolve(res.status(status).json({ error: message }));
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

app.listen(3000, () =>
  console.log('Dev CMS Server running on http://localhost:3000'),
);
