// server/index.js
// Запуск: node server/index.js
// Требуется Node 18+ и "type": "module" в package.json (или замените импорты на require).

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// ────────────── PATHS ──────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');          // server/data
const DB_FILE  = path.join(DATA_DIR, 'db.json');

const UPLOADS_DIR = path.join(__dirname, 'uploads');    // server/uploads

// ────────────── ENV ──────────────
const PORT = Number(process.env.PORT || 3000);
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const ADMIN_TOKEN    = process.env.ADMIN_TOKEN    || 'admin-secret';
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@tue.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_NAME     = process.env.ADMIN_NAME     || 'Site Admin';

// ────────────── HELPERS ──────────────
async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true }).catch(() => {});
}

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function initDB() {
  await ensureDir(DATA_DIR);
  if (!(await exists(DB_FILE))) {
    const init = { events: [], news: [], members: [], pastMembers: [] };
    await fs.writeFile(DB_FILE, JSON.stringify(init, null, 2), 'utf8');
  }
}

async function readDB() {
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    const j = JSON.parse(raw || '{}');
    return {
      events: Array.isArray(j.events) ? j.events : [],
      news:   Array.isArray(j.news)   ? j.news   : [],
      members: Array.isArray(j.members) ? j.members : [],
      pastMembers: Array.isArray(j.pastMembers) ? j.pastMembers : [],
    };
  } catch {
    return { events: [], news: [], members: [], pastMembers: [] };
  }
}

async function writeDB(db) {
  await ensureDir(DATA_DIR);
  const tmp = DB_FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), 'utf8');
  await fs.rename(tmp, DB_FILE);
}

function nextId(arr) {
  const max = arr.reduce((m, it) => Math.max(m, Number(it.id) || 0), 0);
  return (max + 1).toString();
}

function requireAuth(req, res, next) {
  const hdr = req.headers.authorization || '';
  const m = hdr.match(/^Bearer\s+(.+)$/i);
  if (!m || m[1] !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function mergeFields(target, source, allowed) {
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(source, k) && source[k] !== undefined) {
      target[k] = source[k];
    }
  }
  if ('published' in target) target.published = !!target.published;
  if ('latest' in target)    target.latest = !!target.latest;
  return target;
}

const EVENT_FIELDS = [
  'title', 'date', 'coverUrl', 'googleFormUrl', 'summary', 'content',
  'published', 'latest', 'publishAt',
];
const NEWS_FIELDS = [
  'title', 'coverUrl', 'summary', 'content', 'published', 'publishAt',
];

// Для members
const MEMBER_FIELDS = [
  'name', 'role', 'photoUrl', 'email', 'linkedin', 'instagram', 'order',
];

function sortMembersByOrder(list) {
  return (Array.isArray(list) ? list : []).slice().sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));
}

// ────────────── APP ──────────────
const app = express();
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Статические файлы: только /uploads/*
await ensureDir(UPLOADS_DIR);
app.use('/uploads', express.static(UPLOADS_DIR));

// ────────────── UPLOADS ──────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const safe = String(file.originalname || 'file').replace(/[^\w.\-]+/g, '_');
    cb(null, `${ts}_${safe}`);
  },
});
const upload = multer({ storage });

app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  // Возвращаем URL именно с /uploads/
  return res.json({ url: `/uploads/${req.file.filename}` });
});

// ────────────── AUTH ──────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (String(email) === ADMIN_EMAIL && String(password) === ADMIN_PASSWORD) {
    return res.json({
      token: ADMIN_TOKEN,
      user: { id: 'admin', email: ADMIN_EMAIL, name: ADMIN_NAME },
    });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

app.get('/api/auth/verify', requireAuth, (_req, res) => {
  res.json({ ok: true, user: { id: 'admin', email: ADMIN_EMAIL, name: ADMIN_NAME } });
});

// ────────────── EVENTS ──────────────
app.get('/api/events', async (_req, res) => {
  const db = await readDB();
  res.json(db.events);
});

app.get('/api/events/:id', async (req, res) => {
  const db = await readDB();
  const item = db.events.find((e) => String(e.id) === String(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

// ADMIN list
app.get('/api/events/admin', requireAuth, async (_req, res) => {
  const db = await readDB();
  res.json(db.events);
});

app.post('/api/events', requireAuth, async (req, res) => {
  const db = await readDB();
  const now = new Date().toISOString();
  const item = mergeFields(
    { id: nextId(db.events), createdAt: now, updatedAt: now },
    req.body || {},
    EVENT_FIELDS
  );

  if (item.latest) {
    db.events = db.events.map((e) => ({ ...e, latest: false }));
  }
  db.events.unshift(item);
  await writeDB(db);
  res.status(201).json(item);
});

app.put('/api/events/:id', requireAuth, async (req, res) => {
  const db = await readDB();
  const id = String(req.params.id);
  const idx = db.events.findIndex((e) => String(e.id) === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const before = db.events[idx];
  const updated = mergeFields({ ...before }, req.body || {}, EVENT_FIELDS);
  updated.id = before.id;
  updated.updatedAt = new Date().toISOString();

  if (updated.latest) {
    db.events = db.events.map((e, i) => (i === idx ? updated : { ...e, latest: false }));
  } else {
    db.events[idx] = updated;
  }

  await writeDB(db);
  res.json(updated);
});

app.delete('/api/events/:id', requireAuth, async (req, res) => {
  const db = await readDB();
  const id = String(req.params.id);
  const before = db.events.length;
  db.events = db.events.filter((e) => String(e.id) !== id);
  if (db.events.length === before) return res.status(404).json({ error: 'Not found' });
  await writeDB(db);
  res.status(204).end();
});

// ────────────── NEWS ──────────────
app.get('/api/news', async (_req, res) => {
  const db = await readDB();
  res.json(db.news);
});

app.get('/api/news/:id', async (req, res) => {
  const db = await readDB();
  const item = db.news.find((n) => String(n.id) === String(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

app.get('/api/news/admin', requireAuth, async (_req, res) => {
  const db = await readDB();
  res.json(db.news);
});

app.post('/api/news', requireAuth, async (req, res) => {
  const db = await readDB();
  const now = new Date().toISOString();
  const item = mergeFields(
    { id: nextId(db.news), createdAt: now, updatedAt: now },
    req.body || {},
    NEWS_FIELDS
  );

  db.news.unshift(item);
  await writeDB(db);
  res.status(201).json(item);
});

app.put('/api/news/:id', requireAuth, async (req, res) => {
  const db = await readDB();
  const id = String(req.params.id);
  const idx = db.news.findIndex((n) => String(n.id) === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const before = db.news[idx];
  const updated = mergeFields({ ...before }, req.body || {}, NEWS_FIELDS);
  updated.id = before.id;
  updated.updatedAt = new Date().toISOString();

  db.news[idx] = updated;
  await writeDB(db);
  res.json(updated);
});

app.delete('/api/news/:id', requireAuth, async (req, res) => {
  const db = await readDB();
  const id = String(req.params.id);
  const before = db.news.length;
  db.news = db.news.filter((n) => String(n.id) !== id);
  if (db.news.length === before) return res.status(404).json({ error: 'Not found' });
  await writeDB(db);
  res.status(204).end();
});

// ────────────── MEMBERS ──────────────
// PUBLIC
app.get('/api/members', async (_req, res) => {
  const db = await readDB();
  res.json(sortMembersByOrder(db.members));
});
app.get('/api/members/past', async (_req, res) => {
  const db = await readDB();
  res.json(db.pastMembers);
});

// ADMIN (чтение)
app.get('/api/members/admin', requireAuth, async (_req, res) => {
  const db = await readDB();
  res.json(sortMembersByOrder(db.members));
});
app.get('/api/members/past/admin', requireAuth, async (_req, res) => {
  const db = await readDB();
  res.json(db.pastMembers);
});

// CREATE
app.post('/api/members', requireAuth, async (req, res) => {
  const db = await readDB();
  const now = new Date().toISOString();

  const list = Array.isArray(db.members) ? db.members : [];
  const nextOrder = (list.reduce((max, m) => Math.max(max, Number(m.order) || 0), 0) || 0) + 1;

  const base = {
    id: nextId(list),
    name: '',
    role: '',
    photoUrl: '',
    email: '',
    linkedin: '',
    instagram: '',
    order: nextOrder,
    createdAt: now,
    updatedAt: now,
  };
  const item = mergeFields(base, (req.body || {}), MEMBER_FIELDS);

  if (!item.name?.trim() || !item.role?.trim() || !item.photoUrl?.trim()) {
    return res.status(400).json({ error: 'name, role, photoUrl are required' });
  }

  list.push(item);
  db.members = sortMembersByOrder(list);
  await writeDB(db);
  res.status(201).json(item);
});

// UPDATE
app.put('/api/members/:id', requireAuth, async (req, res) => {
  const db = await readDB();
  const id = String(req.params.id);
  const list = Array.isArray(db.members) ? db.members : [];
  const idx = list.findIndex((m) => String(m.id) === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const before = list[idx];
  const updated = mergeFields({ ...before }, (req.body || {}), MEMBER_FIELDS);
  updated.id = before.id;
  updated.updatedAt = new Date().toISOString();

  list[idx] = updated;
  db.members = sortMembersByOrder(list);
  await writeDB(db);
  res.json(updated);
});

// DELETE (current members)
app.delete('/api/members/:id', requireAuth, async (req, res) => {
  const db = await readDB();
  const id = String(req.params.id);
  const list = Array.isArray(db.members) ? db.members : [];
  const next = list.filter((m) => String(m.id) !== id);
  if (next.length === list.length) return res.status(404).json({ error: 'Not found' });
  db.members = sortMembersByOrder(next);
  await writeDB(db);
  res.status(204).end();
});

// MOVE TO PAST
app.post('/api/members/:id/move-to-past', requireAuth, async (req, res) => {
  const db = await readDB();
  const id = String(req.params.id);
  const list = Array.isArray(db.members) ? db.members : [];
  const idx = list.findIndex((m) => String(m.id) === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const m = list[idx];
  list.splice(idx, 1);
  db.members = sortMembersByOrder(list);

  const pm = Array.isArray(db.pastMembers) ? db.pastMembers : [];
  pm.push({
    id: m.id,               // сохраняем тот же id
    name: m.name,
    photoUrl: m.photoUrl,
    createdAt: new Date().toISOString(),
  });
  db.pastMembers = pm;

  await writeDB(db);
  res.json({ ok: true });
});

// RESTORE FROM PAST
app.post('/api/past-members/:id/restore', requireAuth, async (req, res) => {
  const db = await readDB();
  const id = String(req.params.id);

  const pm = Array.isArray(db.pastMembers) ? db.pastMembers : [];
  const idx = pm.findIndex((m) => String(m.id) === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const restored = pm[idx];
  pm.splice(idx, 1);
  db.pastMembers = pm;

  const list = Array.isArray(db.members) ? db.members : [];
  // Если по каким-то причинам такой id уже существует в текущих — выдадим новый id
  const idConflict = list.some((m) => String(m.id) === String(restored.id));
  const newId = idConflict ? nextId(list) : restored.id;

  const nextOrder = (list.reduce((max, mm) => Math.max(max, Number(mm.order) || 0), 0) || 0) + 1;
  list.push({
    id: newId,
    name: restored.name,
    role: 'Member',     // дефолт, можно потом отредактировать в админке
    photoUrl: restored.photoUrl,
    email: '',
    linkedin: '',
    instagram: '',
    order: nextOrder,
    createdAt: restored.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  db.members = sortMembersByOrder(list);

  await writeDB(db);
  res.json({ ok: true });
});

// DELETE PAST
app.delete('/api/past-members/:id', requireAuth, async (req, res) => {
  const db = await readDB();
  const id = String(req.params.id);
  const pm = Array.isArray(db.pastMembers) ? db.pastMembers : [];
  const next = pm.filter((m) => String(m.id) !== id);
  if (next.length === pm.length) return res.status(404).json({ error: 'Not found' });
  db.pastMembers = next;
  await writeDB(db);
  res.status(204).end();
});

// REORDER (members)
app.post('/api/members/reorder', requireAuth, async (req, res) => {
  const db = await readDB();
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : null;
  if (!ids || ids.length === 0) return res.status(400).json({ error: 'ids[] required' });

  const orderMap = new Map(ids.map((id, i) => [id, i + 1]));
  const list = Array.isArray(db.members) ? db.members : [];
  const next = list.map((m) => ({
    ...m,
    order: orderMap.has(String(m.id)) ? orderMap.get(String(m.id)) : (m.order ?? 0),
    updatedAt: new Date().toISOString(),
  }));
  db.members = sortMembersByOrder(next);
  await writeDB(db);
  res.json({ ok: true });
});

// ────────────── HEALTH ──────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// ────────────── BOOT ──────────────
await initDB();
await ensureDir(UPLOADS_DIR);

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  console.log(`CORS allowed origin: ${CORS_ORIGIN}`);
  console.log(`DB file: ${DB_FILE}`);
  console.log(`Uploads served at: /uploads/*`);
  console.log(`Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
});
