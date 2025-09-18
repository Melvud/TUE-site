// server/src/index.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

// ---------- paths ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..'); // server/
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(ROOT, 'uploads');

// ---------- env ----------
const PORT = Number(process.env.PORT || 3000);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'dev-admin-token';
// учётка админа для логина
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// ---------- helpers ----------
async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true }).catch(() => {});
}

async function readDB() {
  try {
    const raw = await fs.readFile(DB_FILE, 'utf-8');
    const json = JSON.parse(raw);
    return {
      events: Array.isArray(json.events) ? json.events : [],
      news: Array.isArray(json.news) ? json.news : [],
    };
  } catch {
    const initial = { events: [], news: [] };
    await ensureDir(DATA_DIR);
    await fs.writeFile(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

async function writeDB(db) {
  await ensureDir(DATA_DIR);
  const tmp = DB_FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), 'utf-8');
  await fs.rename(tmp, DB_FILE);
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : null;
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ---------- uploads (multer) ----------
await ensureDir(UPLOADS_DIR);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const base = path.basename(file.originalname || 'file', ext).replace(/[^\w.-]+/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});
const upload = multer({ storage });

// ---------- app ----------
const app = express();
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

// статика для загруженных файлов
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d', fallthrough: true }));

// ---------- health ----------
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ---------- AUTH ----------
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (String(email) === ADMIN_EMAIL && String(password) === ADMIN_PASSWORD) {
    // можно также поставить httpOnly cookie, но фронт уже использует Bearer
    return res.json({ token: ADMIN_TOKEN, user: { email: ADMIN_EMAIL } });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

// быстрый чек валидности токена
app.get('/api/auth/verify', requireAuth, (_req, res) => res.json({ ok: true }));

// ---------- NEWS ----------
app.get('/api/news', async (_req, res) => {
  const db = await readDB();
  res.json(db.news);
});

app.post('/api/news', requireAuth, async (req, res) => {
  const db = await readDB();
  const body = req.body || {};
  const item = {
    id: genId(),
    title: String(body.title || '').trim(),
    coverUrl: body.coverUrl || '',
    summary: body.summary || '',
    content: body.content || '',
    published: !!body.published,
    date: body.date || new Date().toISOString(),
  };
  db.news.unshift(item);
  await writeDB(db);
  res.json(item);
});

app.put('/api/news/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  const idx = db.news.findIndex((n) => String(n.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const prev = db.news[idx];
  const b = req.body || {};
  const updated = {
    ...prev,
    title: b.title ?? prev.title,
    coverUrl: b.coverUrl ?? prev.coverUrl,
    summary: b.summary ?? prev.summary,
    content: b.content ?? prev.content,
    published: b.published ?? prev.published,
  };
  db.news[idx] = updated;
  await writeDB(db);
  res.json(updated);
});

app.delete('/api/news/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  const before = db.news.length;
  db.news = db.news.filter((n) => String(n.id) !== String(id));
  if (db.news.length === before) return res.status(404).json({ error: 'Not found' });
  await writeDB(db);
  res.json({ ok: true });
});

// ---------- EVENTS ----------
app.get('/api/events', async (_req, res) => {
  const db = await readDB();
  res.json(db.events);
});

app.get('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  const item = db.events.find((e) => String(e.id) === String(id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

app.post('/api/events', requireAuth, async (req, res) => {
  const db = await readDB();
  const b = req.body || {};
  const item = {
    id: genId(),
    title: String(b.title || '').trim(),
    date: b.date || '',
    coverUrl: b.coverUrl || b.image || '',
    googleFormUrl: b.googleFormUrl || '',
    summary: b.summary || b.description || '',
    content: b.content || '',
    published: !!b.published,
    latest: !!b.latest,
  };
  if (item.latest) {
    db.events = db.events.map((e) => ({ ...e, latest: false }));
  }
  db.events.unshift(item);
  await writeDB(db);
  res.json(item);
});

app.put('/api/events/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  const idx = db.events.findIndex((e) => String(e.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const prev = db.events[idx];
  const b = req.body || {};
  const updated = {
    ...prev,
    title: b.title ?? prev.title,
    date: b.date ?? prev.date,
    coverUrl: b.coverUrl ?? prev.coverUrl,
    googleFormUrl: b.googleFormUrl ?? prev.googleFormUrl,
    summary: b.summary ?? prev.summary,
    content: b.content ?? prev.content,
    published: b.published ?? prev.published,
    latest: b.latest ?? prev.latest,
  };
  if (updated.latest) {
    db.events = db.events.map((e, i) => (i === idx ? updated : { ...e, latest: false }));
  } else {
    db.events[idx] = updated;
  }
  await writeDB(db);
  res.json(updated);
});

app.delete('/api/events/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  const before = db.events.length;
  db.events = db.events.filter((e) => String(e.id) !== String(id));
  if (db.events.length === before) return res.status(404).json({ error: 'Not found' });
  await writeDB(db);
  res.json({ ok: true });
});

// ---------- UPLOAD ----------
app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  return res.json({ url: `/uploads/${req.file.filename}` });
});

// ---------- start ----------
await ensureDir(DATA_DIR);
await ensureDir(UPLOADS_DIR);

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  console.log(`CORS allowed origin: ${CORS_ORIGIN}`);
  console.log(`Uploads dir: ${UPLOADS_DIR} → /uploads/*`);
  console.log(`Admin login: ${ADMIN_EMAIL}/${ADMIN_PASSWORD}`);
});
