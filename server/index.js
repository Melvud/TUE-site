/* eslint-disable no-console */
/**
 * Single-server (Vite static + API) для сайта PhE.
 * Совместим с текущей админкой:
 *  - /api/pages/home|about|joinUs  (GET/PUT)
 *  - /api/events, /api/news        (GET, POST, PUT/:id, DELETE/:id)
 *  - /api/members                  (GET, POST, PUT/:id, DELETE/:id)
 *  - /api/members/reorder          (POST)
 *  - /api/members/past             (GET)
 *  - /api/members/past/:id/restore (POST)
 *  - /api/members/past/:id         (DELETE)
 *  - /api/upload                   (POST multipart) -> {url}
 *  - /api/forms/submit             (POST) -> сохраняет и (по возможности) шлет письмо
 *  - /api/auth/login, /api/auth/me
 */

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Директории данных/загрузок ---
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const UPLOADS_DIR = path.join(ROOT, 'uploads');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// --- Утилиты JSON-хранилища (простая файловая БД) ---
const jf = (name) => path.join(DATA_DIR, `${name}.json`);
const readJSON = (name, fallback) => {
  try {
    const p = jf(name);
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.warn(`[data] broken ${name}.json`, e.message);
    return fallback;
  }
};
const writeJSON = (name, data) =>
  fs.writeFileSync(jf(name), JSON.stringify(data, null, 2), 'utf8');

// Инициализация файлов
const ensureFile = (name, def) => {
  const p = jf(name);
  if (!fs.existsSync(p)) writeJSON(name, def);
};
ensureFile('events', []);
ensureFile('news', []);
ensureFile('members', []);
ensureFile('members_past', []);
ensureFile('forms', []);
// Страницы — под отдельные файлы, чтобы соответствовать фронту
ensureFile('page_home', { typedPhrases: ['Welcome to PhE'], heroImage: '' });
ensureFile('page_about', { sections: [] });
ensureFile('page_joinUs', { introText: '<p>Join PhE</p>', detailsHtml: '', formFields: [] });

// --- Auth ---
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token || token !== ADMIN_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    return res.json({ token: ADMIN_TOKEN, user: { id: 'admin', email: ADMIN_EMAIL, name: 'Admin' } });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

app.get('/api/auth/me', requireAuth, (_req, res) => {
  res.json({ id: 'admin', email: ADMIN_EMAIL, name: 'Admin' });
});

// --- Uploads ---
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({ storage });

app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '30d', immutable: true }));

// --- Events ---
app.get('/api/events', (_req, res) => res.json(readJSON('events', [])));

app.post('/api/events', requireAuth, (req, res) => {
  const items = readJSON('events', []);
  const now = new Date().toISOString();
  const payload = req.body || {};
  const item = {
    id: uuidv4(),
    title: payload.title || '',
    date: payload.date || '',
    coverUrl: payload.coverUrl || payload.image || '',
    googleFormUrl: payload.googleFormUrl || '',
    summary: payload.summary || payload.description || '',
    content: payload.content || '',
    published: !!payload.published,
    latest: !!payload.latest,
    publishAt: payload.publishAt || null,
    createdAt: now,
    updatedAt: now,
  };
  items.unshift(item);
  writeJSON('events', items);
  res.status(201).json(item);
});

app.put('/api/events/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const items = readJSON('events', []);
  const idx = items.findIndex((x) => String(x.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const now = new Date().toISOString();
  items[idx] = { ...items[idx], ...req.body, updatedAt: now };
  writeJSON('events', items);
  res.json(items[idx]);
});

app.delete('/api/events/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const items = readJSON('events', []);
  const idx = items.findIndex((x) => String(x.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const [removed] = items.splice(idx, 1);
  writeJSON('events', items);
  res.json({ ok: true, removed });
});

// --- News ---
app.get('/api/news', (_req, res) => res.json(readJSON('news', [])));

app.post('/api/news', requireAuth, (req, res) => {
  const items = readJSON('news', []);
  const now = new Date().toISOString();
  const payload = req.body || {};
  const item = {
    id: uuidv4(),
    title: payload.title || '',
    date: payload.date || new Date().toISOString(),
    author: payload.author || '',
    coverUrl: payload.coverUrl || payload.image || '',
    summary: payload.summary || payload.snippet || '',
    content: payload.content || '',
    published: !!payload.published,
    publishAt: payload.publishAt || null,
    createdAt: now,
    updatedAt: now,
  };
  items.unshift(item);
  writeJSON('news', items);
  res.status(201).json(item);
});

app.put('/api/news/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const items = readJSON('news', []);
  const idx = items.findIndex((x) => String(x.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const now = new Date().toISOString();
  items[idx] = { ...items[idx], ...req.body, updatedAt: now };
  writeJSON('news', items);
  res.json(items[idx]);
});

app.delete('/api/news/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const items = readJSON('news', []);
  const idx = items.findIndex((x) => String(x.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const [removed] = items.splice(idx, 1);
  writeJSON('news', items);
  res.json({ ok: true, removed });
});

// --- Members (текущие) ---
app.get('/api/members', (_req, res) => {
  const items = readJSON('members', []);
  // сортировка по order (если есть)
  items.sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));
  res.json(items);
});

app.post('/api/members', requireAuth, (req, res) => {
  const items = readJSON('members', []);
  const now = new Date().toISOString();
  const p = req.body || {};
  const item = {
    id: uuidv4(),
    name: p.name || '',
    role: p.role || p.position || '',
    photoUrl: p.photoUrl || p.image || '',
    email: p.email || p.socials?.email || '',
    linkedin: p.linkedin || p.socials?.linkedin || '',
    instagram: p.instagram || p.socials?.instagram || '',
    order: typeof p.order === 'number' ? p.order : items.length,
    createdAt: now,
    updatedAt: now,
  };
  items.push(item);
  writeJSON('members', items);
  res.status(201).json(item);
});

app.put('/api/members/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const items = readJSON('members', []);
  const idx = items.findIndex((x) => String(x.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const now = new Date().toISOString();
  items[idx] = { ...items[idx], ...req.body, updatedAt: now };
  writeJSON('members', items);
  res.json(items[idx]);
});

app.delete('/api/members/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  // переносим удаляемого в "past"
  const items = readJSON('members', []);
  const past = readJSON('members_past', []);
  const idx = items.findIndex((x) => String(x.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const [removed] = items.splice(idx, 1);
  writeJSON('members', items);
  past.unshift({
    ...removed,
    id: removed.id || uuidv4(),
    removedAt: new Date().toISOString(),
  });
  writeJSON('members_past', past);
  res.json({ ok: true, removed });
});

app.post('/api/members/reorder', requireAuth, (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be array' });
  const items = readJSON('members', []);
  const map = new Map(ids.map((id, i) => [String(id), i]));
  for (const m of items) {
    if (map.has(String(m.id))) m.order = map.get(String(m.id));
  }
  // те, кого нет в ids — отправим в конец по текущему порядку
  let maxOrder = Math.max(-1, ...items.map((m) => m.order ?? -1));
  for (const m of items) {
    if (typeof m.order !== 'number') m.order = ++maxOrder;
  }
  writeJSON('members', items);
  res.json({ ok: true, count: items.length });
});

// --- Members (past) ---
app.get('/api/members/past', (_req, res) => {
  res.json(readJSON('members_past', []));
});

app.post('/api/members/past/:id/restore', requireAuth, (req, res) => {
  const { id } = req.params;
  const past = readJSON('members_past', []);
  const curr = readJSON('members', []);
  const idx = past.findIndex((x) => String(x.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const [rec] = past.splice(idx, 1);
  // вернем в текущие (в конец)
  curr.push({
    id: rec.id || uuidv4(),
    name: rec.name || '',
    role: rec.role || rec.position || '',
    photoUrl: rec.photoUrl || rec.image || '',
    email: rec.email || rec.socials?.email || '',
    linkedin: rec.linkedin || rec.socials?.linkedin || '',
    instagram: rec.instagram || rec.socials?.instagram || '',
    order: typeof rec.order === 'number' ? rec.order : curr.length,
    createdAt: rec.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  writeJSON('members', curr);
  writeJSON('members_past', past);
  res.json({ ok: true });
});

app.delete('/api/members/past/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const past = readJSON('members_past', []);
  const idx = past.findIndex((x) => String(x.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const [removed] = past.splice(idx, 1);
  writeJSON('members_past', past);
  res.json({ ok: true, removed });
});

// --- Pages (ровно те пути, которые ожидает фронт) ---
app.get('/api/pages/home', (_req, res) => res.json(readJSON('page_home', { typedPhrases: [], heroImage: '' })));
app.put('/api/pages/home', requireAuth, (req, res) => {
  const payload = req.body || {};
  writeJSON('page_home', {
    typedPhrases: Array.isArray(payload.typedPhrases) ? payload.typedPhrases : [],
    heroImage: payload.heroImage || '',
  });
  res.json(readJSON('page_home', { typedPhrases: [], heroImage: '' }));
});

app.get('/api/pages/about', (_req, res) => res.json(readJSON('page_about', { sections: [] })));
app.put('/api/pages/about', requireAuth, (req, res) => {
  const payload = req.body || {};
  writeJSON('page_about', {
    sections: Array.isArray(payload.sections) ? payload.sections : [],
  });
  res.json(readJSON('page_about', { sections: [] }));
});

app.get('/api/pages/joinUs', (_req, res) =>
  res.json(readJSON('page_joinUs', { introText: '', detailsHtml: '', formFields: [] }))
);
app.put('/api/pages/joinUs', requireAuth, (req, res) => {
  const p = req.body || {};
  writeJSON('page_joinUs', {
    introText: p.introText || '',
    detailsHtml: p.detailsHtml || '',
    formFields: Array.isArray(p.formFields) ? p.formFields : [],
  });
  res.json(readJSON('page_joinUs', { introText: '', detailsHtml: '', formFields: [] }));
});

// --- Forms -> email + сохранение ---
const EMAIL_TO = process.env.EMAIL_TO || 'ivsilan2005@gmail.com';
async function sendMail({ subject, text, html }) {
  try {
    const nodemailer = await import('nodemailer');
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
      console.warn('[mail] SMTP not configured; skipping send');
      return { sent: false, error: 'smtp_not_configured' };
    }
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    const info = await transporter.sendMail({
      from: `"Website" <${user}>`,
      to: EMAIL_TO,
      subject,
      text,
      html,
    });
    return { sent: true, id: info.messageId };
  } catch (e) {
    console.warn('[mail] error:', e.message);
    return { sent: false, error: e.message };
  }
}

app.post('/api/forms/submit', async (req, res) => {
  const payload = req.body || {};
  const now = new Date().toISOString();
  const forms = readJSON('forms', []);
  const id = uuidv4();
  forms.unshift({ id, createdAt: now, ...payload });
  writeJSON('forms', forms);

  const subject = payload.subject || 'Website form submission';
  const text = [
    `New form at ${now}`,
    ...Object.entries(payload).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`),
  ].join('\n');

  const html = `
  <div style="font-family:system-ui,Segoe UI,Roboto,sans-serif">
    <h2>New form submission</h2>
    <p><strong>Time:</strong> ${now}</p>
    <table border="1" cellspacing="0" cellpadding="6">
      ${Object.entries(payload)
        .map(
          ([k, v]) =>
            `<tr><td><strong>${k}</strong></td><td>${
              typeof v === 'object' ? `<pre>${JSON.stringify(v, null, 2)}</pre>` : String(v || '')
            }</td></tr>`
        )
        .join('')}
    </table>
  </div>`;

  const mailResult = await sendMail({ subject, text, html });
  res.json({ ok: true, id, email: { to: EMAIL_TO, ...mailResult } });
});

// --- Static Vite build + SPA fallback ---
const distPath = path.resolve(ROOT, '..', 'dist');
app.use(express.static(distPath, { index: 'index.html', maxAge: '7d' }));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

// --- Start ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://0.0.0.0:${PORT}`));
