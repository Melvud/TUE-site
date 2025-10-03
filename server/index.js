// server/index.js
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

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// ────────────── ENV ──────────────
const PORT = Number(process.env.PORT || 3000);
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@tue.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Site Admin';

// Email для отправки форм
const CONTACT_EMAIL = 'ivsilan2005@gmail.com';

// ────────────── HELPERS ──────────────
async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true }).catch(() => {});
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function initDB() {
  await ensureDir(DATA_DIR);
  if (!(await exists(DB_FILE))) {
    const init = {
      events: [],
      news: [],
      members: [],
      pastMembers: [],
      pages: {
        home: {
          typedPhrases: [
            'Join us today and enjoy a free OPTICA subscription!',
            'Connect with the photonics community at TU/e.',
            'Workshops, talks, cleanroom tours, and more.',
          ],
          heroImage: '/hero.jpg',
        },
        about: {
          sections: [
            {
              id: '1',
              type: 'text-image',
              title: 'Photonics Society Eindhoven',
              text: '<p>The Photonics Society Eindhoven (PhE) is a student community officially recognized as an Optica (formerly OSA) student chapter in March 2020. We are a group of enthusiastic and determined Ph.D. students committed to the dissemination of optics and photonics (O&P) in the city of Eindhoven.</p><p>Our main goal is to promote enrollment in O&P by creating opportunities for students to perform high-level scientific research in technical areas within O&P.</p>',
              image: 'https://picsum.photos/seed/phe-group/600/400',
            },
            {
              id: '2',
              type: 'image-text',
              title: 'What is an Optica Chapter?',
              text: '<p>As a student chapter, we benefit from the support of Optica, a non-profit organization founded in 1916. Optica is a leading organization focused on fostering the technical and professional development of over 23,000 members and supports a network of more than 370 student chapters worldwide.</p><p>These local chapters create valuable opportunities for professional development, including activity and travel grants, guest lecture resources, and networking opportunities.</p>',
              image: 'https://picsum.photos/seed/optica-logo/600/400',
            },
          ],
        },
        joinUs: {
          introText:
            '<h2>Join the Photonics Society Eindhoven (PhE)</h2><p><strong>Quick sign-up:</strong> Use our Telegram bot for one-click registration—fill a short form and we\'ll approve it in 1–2 days. You don\'t need Optica membership to join PhE; you can always add it later for extra benefits. We\'re an Optica Student Chapter but open to all optics enthusiasts. As a member, you\'ll get early/priority access to event registrations. This year we\'re also launching a members-only Telegram space with a random-coffee bot, mentorship program, and our community ecosystem (news, chat, networking) before anywhere else.</p><h3>1) PhE Member (open to all optics enthusiasts)</h3><p>No student status required.<br/>Perks you get:</p><ul><li>Priority access to event registrations</li><li>Invite to our closed Telegram (random-coffee, mentorship, news & networking)</li><li>First to hear about collabs, site visits, and workshops</li></ul><h3>2) Optica Student Member (students & PhDs)</h3><p>If you\'re a student (incl. PhD), we recommend also becoming an Optica (optica.org) student member:</p><ul><li>Cost: $22/year (often reimbursable—ask your supervisor/department)</li><li>After joining Optica, list Photonics Society Eindhoven as your Student Chapter</li></ul><p><strong>Why add Optica student membership?</strong></p><ul><li>Community & networking: global student network, visiting lecturers, mentors</li><li>Funding & travel: eligibility for chapter grants, traveling-lecturer support, scholarships/travel grants, competitions</li><li>Career boost: reduced conference fees, programs, jobs & internships, member resources</li><li>Leadership experience: run events, budgets, partnerships—great for CVs/PhD or industry applications</li><li>Typical activities: traveling lecturers, company/lab visits, outreach, career panels, Student Leadership Conference</li></ul><p><strong>Not a student?</strong><br/>You\'re very welcome at our events without Optica membership.<br/>Note: when events are funded by Optica, priority may go to official Optica student members if required by the grant.</p><h3>How to join</h3><ul><li>Everyone: sign up via our Telegram bot (we\'ll send the closed-channel invite + add you to the priority list)</li><li>Students: get Optica student membership → add Photonics Society Eindhoven as your chapter in your Optica account</li></ul>',
          formFields: [
            {
              id: '1',
              name: 'name',
              label: 'Full name',
              type: 'text',
              required: true,
              placeholder: '',
            },
            {
              id: '2',
              name: 'email',
              label: 'Email',
              type: 'email',
              required: true,
              placeholder: '',
            },
            {
              id: '3',
              name: 'level',
              label: 'Level',
              type: 'text',
              required: false,
              placeholder: 'e.g. Undergraduate',
            },
            {
              id: '4',
              name: 'department',
              label: 'Department',
              type: 'text',
              required: false,
              placeholder: '',
            },
          ],
        },
      },
    };
    await fs.writeFile(DB_FILE, JSON.stringify(init, null, 2), 'utf8');
  }
}

async function readDB() {
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    const j = JSON.parse(raw || '{}');
    return {
      events: Array.isArray(j.events) ? j.events : [],
      news: Array.isArray(j.news) ? j.news : [],
      members: Array.isArray(j.members) ? j.members : [],
      pastMembers: Array.isArray(j.pastMembers) ? j.pastMembers : [],
      pages: j.pages || {},
    };
  } catch {
    return { events: [], news: [], members: [], pastMembers: [], pages: {} };
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
  if ('latest' in target) target.latest = !!target.latest;
  return target;
}

const EVENT_FIELDS = [
  'title',
  'date',
  'coverUrl',
  'googleFormUrl',
  'summary',
  'content',
  'published',
  'latest',
  'publishAt',
];
const NEWS_FIELDS = ['title', 'coverUrl', 'summary', 'content', 'published', 'publishAt'];

const MEMBER_FIELDS = [
  'name',
  'role',
  'photoUrl',
  'email',
  'linkedin',
  'instagram',
  'order',
];

function sortMembersByOrder(list) {
  return (Array.isArray(list) ? list : [])
    .slice()
    .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));
}

// ────────────── APP ──────────────
const app = express();
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));

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
app.get('/api/members', async (_req, res) => {
  const db = await readDB();
  res.json(sortMembersByOrder(db.members));
});
app.get('/api/members/past', async (_req, res) => {
  const db = await readDB();
  res.json(db.pastMembers);
});

app.get('/api/members/admin', requireAuth, async (_req, res) => {
  const db = await readDB();
  res.json(sortMembersByOrder(db.members));
});
app.get('/api/members/past/admin', requireAuth, async (_req, res) => {
  const db = await readDB();
  res.json(db.pastMembers);
});

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
  const item = mergeFields(base, req.body || {}, MEMBER_FIELDS);

  if (!item.name?.trim() || !item.role?.trim() || !item.photoUrl?.trim()) {
    return res.status(400).json({ error: 'name, role, photoUrl are required' });
  }

  list.push(item);
  db.members = sortMembersByOrder(list);
  await writeDB(db);
  res.status(201).json(item);
});

app.put('/api/members/:id', requireAuth, async (req, res) => {
  const db = await readDB();
  const id = String(req.params.id);
  const list = Array.isArray(db.members) ? db.members : [];
  const idx = list.findIndex((m) => String(m.id) === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const before = list[idx];
  const updated = mergeFields({ ...before }, req.body || {}, MEMBER_FIELDS);
  updated.id = before.id;
  updated.updatedAt = new Date().toISOString();

  list[idx] = updated;
  db.members = sortMembersByOrder(list);
  await writeDB(db);
  res.json(updated);
});

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
    id: m.id,
    name: m.name,
    photoUrl: m.photoUrl,
    createdAt: new Date().toISOString(),
  });
  db.pastMembers = pm;

  await writeDB(db);
  res.json({ ok: true });
});

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
  const idConflict = list.some((m) => String(m.id) === String(restored.id));
  const newId = idConflict ? nextId(list) : restored.id;

  const nextOrder = (list.reduce((max, mm) => Math.max(max, Number(mm.order) || 0), 0) || 0) + 1;
  list.push({
    id: newId,
    name: restored.name,
    role: 'Member',
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

app.post('/api/members/reorder', requireAuth, async (req, res) => {
  const db = await readDB();
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : null;
  if (!ids || ids.length === 0) return res.status(400).json({ error: 'ids[] required' });

  const orderMap = new Map(ids.map((id, i) => [id, i + 1]));
  const list = Array.isArray(db.members) ? db.members : [];
  const next = list.map((m) => ({
    ...m,
    order: orderMap.has(String(m.id)) ? orderMap.get(String(m.id)) : m.order ?? 0,
    updatedAt: new Date().toISOString(),
  }));
  db.members = sortMembersByOrder(next);
  await writeDB(db);
  res.json({ ok: true });
});

// ────────────── PAGES ──────────────
app.get('/api/pages/:pageName', async (req, res) => {
  const db = await readDB();
  const page = db.pages?.[req.params.pageName];
  if (!page) return res.status(404).json({ error: 'Page not found' });
  res.json(page);
});

app.put('/api/pages/:pageName', requireAuth, async (req, res) => {
  const db = await readDB();
  if (!db.pages) db.pages = {};
  db.pages[req.params.pageName] = req.body;
  await writeDB(db);
  res.json(db.pages[req.params.pageName]);
});

// ────────────── CONTACT / JOIN FORM (отправка на email) ──────────────
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    // В production используйте nodemailer или сервис вроде SendGrid
    // Здесь простая заглушка - в реальном проекте нужно настроить SMTP
    console.log('Contact form submission:', { to: CONTACT_EMAIL, from: email, name, message });

    // Для демонстрации - просто логируем
    // В production добавьте реальную отправку email:
    /*
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({...});
    await transporter.sendMail({
      from: email,
      to: CONTACT_EMAIL,
      subject: `Contact form: ${name}`,
      text: message
    });
    */

    res.json({ ok: true, message: 'Form submitted (email logged to console)' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to send' });
  }
});

app.post('/api/join', async (req, res) => {
  try {
    const formData = req.body;
    console.log('Join form submission:', { to: CONTACT_EMAIL, formData });

    // В production - отправка email через nodemailer
    res.json({ ok: true, message: 'Application submitted (logged to console)' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to submit' });
  }
});

// ────────────── HEALTH ──────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// ────────────── CLIENT (STATIC) ──────────────
const CLIENT_DIST = path.join(__dirname, '..', 'dist');
app.use(express.static(CLIENT_DIST));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(CLIENT_DIST, 'index.html'));
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
  console.log(`Contact email: ${CONTACT_EMAIL}`);
});