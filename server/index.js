/* eslint-disable no-console */
/**
 * TU/e Photonics — API и статический сервер для одной инстанции.
 * CommonJS (type: commonjs в server/package.json).
 *
 * Возможности:
 * - Раздача фронта из ../dist + SPA fallback
 * - Auth: POST /api/auth/login, GET /api/auth/me
 * - CRUD: /api/news, /api/events, /api/members
 * - Pages CMS: /api/pages (публичное), /api/pages/slug/:slug, админ: /api/pages/admin...
 *   Черновики, превью до публикации, блочная структура контента (текст/картинки/комбинированные блоки).
 *   Главная — поддержка бегущей строки (tickerTexts).
 *   "Join us" — редактируемые секции и настраиваемые поля формы (добавлять/удалять).
 * - Uploads: POST /api/upload (multer), статика /uploads
 * - Forms: POST /api/forms/submit — письма на EMAIL_TO (по умолчанию ivsilan2005@gmail.com)
 *
 * ENV:
 * - PORT
 * - ADMIN_TOKEN (обязателен для админ-маршрутов)
 * - ADMIN_EMAIL, ADMIN_PASSWORD (для /api/auth/login)
 * - EMAIL_TO (по умолчанию ivsilan2005@gmail.com)
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (для отправки почты)
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

// ---------- базовая конфигурация ----------
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Папки данных/загрузок
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ---------- утилиты работы с JSON-файлами ----------
const jsonFile = (name) => path.join(DATA_DIR, `${name}.json`);
const readJSON = (name, fallback) => {
  const f = jsonFile(name);
  if (!fs.existsSync(f)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch (e) {
    console.warn(`[data] broken JSON ${f}:`, e.message);
    return fallback;
  }
};
const writeJSON = (name, data) => {
  fs.writeFileSync(jsonFile(name), JSON.stringify(data, null, 2), 'utf8');
};

// Инициализируем файлы, если пусто
['news', 'events', 'members', 'pages', 'forms'].forEach((f) => {
  const p = jsonFile(f);
  if (!fs.existsSync(p)) writeJSON(f, []);
});

// ---------- auth-мидлвара ----------
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice('Bearer '.length) : '';
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
}

// ---------- AUTH ----------
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

/**
 * Login: принимает {email,password}, при успехе возвращает {token,user}
 * фронт ожидает именно такую структуру.
 */
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    return res.json({
      token: ADMIN_TOKEN,
      user: { id: 'admin', email: ADMIN_EMAIL, name: 'Admin' },
    });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

/** Текущий пользователь по токену */
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ id: 'admin', email: ADMIN_EMAIL, name: 'Admin' });
});

// ---------- UPLOADS ----------
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({ storage });

/** Загрузка файла (требуется авторизация) */
app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const publicPath = `/uploads/${req.file.filename}`;
  res.json({ filename: req.file.filename, url: publicPath });
});

// Раздаём статику загруженных файлов
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '30d', immutable: true }));

// ---------- GENERIC CRUD HELPERS ----------
function makeEntityRoutes(entityName, options = {}) {
  const { idKey = 'id' } = options;

  // LIST
  app.get(`/api/${entityName}`, (req, res) => {
    const items = readJSON(entityName, []);
    res.json(items);
  });

  // DETAIL
  app.get(`/api/${entityName}/:id`, (req, res) => {
    const { id } = req.params;
    const items = readJSON(entityName, []);
    const found = items.find((x) => String(x[idKey]) === String(id));
    if (!found) return res.status(404).json({ error: 'Not found' });
    res.json(found);
  });

  // CREATE (admin)
  app.post(`/api/${entityName}/admin`, requireAuth, (req, res) => {
    const items = readJSON(entityName, []);
    const now = new Date().toISOString();
    const payload = req.body || {};
    const item = {
      ...payload,
      [idKey]: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    items.unshift(item);
    writeJSON(entityName, items);
    res.status(201).json(item);
  });

  // UPDATE (admin)
  app.put(`/api/${entityName}/admin/:id`, requireAuth, (req, res) => {
    const { id } = req.params;
    const items = readJSON(entityName, []);
    const idx = items.findIndex((x) => String(x[idKey]) === String(id));
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const now = new Date().toISOString();
    const updated = { ...items[idx], ...req.body, updatedAt: now };
    items[idx] = updated;
    writeJSON(entityName, items);
    res.json(updated);
  });

  // DELETE (admin)
  app.delete(`/api/${entityName}/admin/:id`, requireAuth, (req, res) => {
    const { id } = req.params;
    const items = readJSON(entityName, []);
    const idx = items.findIndex((x) => String(x[idKey]) === String(id));
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const [removed] = items.splice(idx, 1);
    writeJSON(entityName, items);
    res.json({ ok: true, removed });
  });
}

// ---------- NEWS / EVENTS / MEMBERS ----------
makeEntityRoutes('news');
makeEntityRoutes('events');
makeEntityRoutes('members');

// ---------- PAGES CMS ----------
// Структура Page:
// {
//   id, slug, title,
//   status: 'draft' | 'published',
//   content: { blocks: Block[], tickerTexts?: string[], joinForm?: { fields: FormField[], leadText?: string } }   // опубликованное
//   draft?: { blocks: Block[], tickerTexts?: string[], joinForm?: {...} }                                         // черновик
//   updatedAt, createdAt, publishedAt?
// }
// Block:
// { id, type: 'text' | 'image' | 'textImage', align?: 'left'|'right', text?: string, imageUrl?: string, caption?: string }
//
// FormField: { id, label, type: 'text'|'email'|'textarea'|'checkbox'|'select', required?: boolean, options?: string[] }

function normalizePage(p) {
  // гарантируем поля
  return {
    id: p.id,
    slug: p.slug,
    title: p.title || '',
    status: p.status || 'draft',
    content: p.content || { blocks: [] },
    draft: p.draft || null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    publishedAt: p.publishedAt || null,
  };
}

// Публичные страницы — только опубликованные
app.get('/api/pages', (req, res) => {
  const pages = readJSON('pages', []).map(normalizePage);
  res.json(pages.filter((p) => p.status === 'published'));
});

// Доступ по slug — только опубликованное
app.get('/api/pages/slug/:slug', (req, res) => {
  const { slug } = req.params;
  const pages = readJSON('pages', []).map(normalizePage);
  const page = pages.find((p) => p.slug === slug && p.status === 'published');
  if (!page) return res.status(404).json({ error: 'Not found' });
  res.json(page);
});

// --- ADMIN: список всех страниц (включая черновики) ---
app.get('/api/pages/admin', requireAuth, (req, res) => {
  const pages = readJSON('pages', []).map(normalizePage);
  res.json(pages);
});

// Создать страницу (черновик)
app.post('/api/pages/admin', requireAuth, (req, res) => {
  const pages = readJSON('pages', []).map(normalizePage);
  const now = new Date().toISOString();
  const body = req.body || {};
  const page = normalizePage({
    id: uuidv4(),
    slug: body.slug || `page-${Date.now()}`,
    title: body.title || 'Untitled',
    status: 'draft',
    content: { blocks: [], tickerTexts: [], joinForm: { fields: [], leadText: '' } },
    draft: body.draft || { blocks: [], tickerTexts: [], joinForm: { fields: [], leadText: '' } },
    createdAt: now,
    updatedAt: now,
  });
  pages.unshift(page);
  writeJSON('pages', pages);
  res.status(201).json(page);
});

// Обновить черновик страницы (НЕ публикует)
app.put('/api/pages/admin/:id/draft', requireAuth, (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  const pages = readJSON('pages', []).map(normalizePage);
  const idx = pages.findIndex((p) => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const now = new Date().toISOString();
  pages[idx].draft = {
    ...(pages[idx].draft || {}),
    ...body, // ожидаем { blocks, tickerTexts, joinForm, title?, slug? }
  };
  if (typeof body.title === 'string') pages[idx].title = body.title;
  if (typeof body.slug === 'string') pages[idx].slug = body.slug;
  pages[idx].updatedAt = now;

  writeJSON('pages', pages);
  res.json(pages[idx]);
});

// Превью черновика (без публикации)
app.get('/api/pages/admin/:id/preview', requireAuth, (req, res) => {
  const { id } = req.params;
  const pages = readJSON('pages', []).map(normalizePage);
  const page = pages.find((p) => p.id === id);
  if (!page) return res.status(404).json({ error: 'Not found' });
  const preview = {
    ...page,
    // Если есть черновик — показываем его в content для превью, но статус не меняем
    content: page.draft ? page.draft : page.content,
  };
  res.json(preview);
});

// Публикация: переносит draft -> content, статус published
app.post('/api/pages/admin/:id/publish', requireAuth, (req, res) => {
  const { id } = req.params;
  const pages = readJSON('pages', []).map(normalizePage);
  const idx = pages.findIndex((p) => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const now = new Date().toISOString();
  const hasDraft = !!pages[idx].draft;
  if (hasDraft) {
    pages[idx].content = pages[idx].draft;
    pages[idx].draft = null;
  }
  pages[idx].status = 'published';
  pages[idx].publishedAt = now;
  pages[idx].updatedAt = now;

  writeJSON('pages', pages);
  res.json(pages[idx]);
});

// Снять с публикации (оставить черновиком)
app.post('/api/pages/admin/:id/unpublish', requireAuth, (req, res) => {
  const { id } = req.params;
  const pages = readJSON('pages', []).map(normalizePage);
  const idx = pages.findIndex((p) => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const now = new Date().toISOString();
  pages[idx].status = 'draft';
  pages[idx].updatedAt = now;
  writeJSON('pages', pages);
  res.json(pages[idx]);
});

// Удалить страницу
app.delete('/api/pages/admin/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const pages = readJSON('pages', []).map(normalizePage);
  const idx = pages.findIndex((p) => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const [removed] = pages.splice(idx, 1);
  writeJSON('pages', pages);
  res.json({ ok: true, removed });
});

// Хелпер-инициализатор для типовых страниц (если их нет): home/about/join
function ensureInitialPages() {
  const pages = readJSON('pages', []).map(normalizePage);
  const need = (slug) => !pages.some((p) => p.slug === slug);
  const now = new Date().toISOString();

  if (need('home')) {
    pages.push(
      normalizePage({
        id: uuidv4(),
        slug: 'home',
        title: 'Home',
        status: 'published',
        content: {
          tickerTexts: ['Welcome to Photonics Society Eindhoven', 'Join our events', 'Become a member'],
          blocks: [],
        },
        draft: null,
        createdAt: now,
        updatedAt: now,
        publishedAt: now,
      })
    );
  }
  if (need('about')) {
    pages.push(
      normalizePage({
        id: uuidv4(),
        slug: 'about',
        title: 'About us',
        status: 'published',
        content: {
          blocks: [
            { id: uuidv4(), type: 'textImage', align: 'left', text: 'Who we are...', imageUrl: '/uploads/sample-about-1.jpg', caption: '' },
            { id: uuidv4(), type: 'textImage', align: 'right', text: 'What we do...', imageUrl: '/uploads/sample-about-2.jpg', caption: '' },
          ],
        },
        draft: null,
        createdAt: now,
        updatedAt: now,
        publishedAt: now,
      })
    );
  }
  if (need('join')) {
    pages.push(
      normalizePage({
        id: uuidv4(),
        slug: 'join',
        title: 'Join us',
        status: 'published',
        content: {
          blocks: [
            { id: uuidv4(), type: 'text', text: 'Join the Photonics Society Eindhoven (PhE)' },
            { id: uuidv4(), type: 'text', text: 'Quick sign-up: Use our Telegram bot for one-click registration—fill a short form and we’ll approve it in 1–2 days. You don’t need Optica membership to join PhE; you can always add it later for extra benefits. We’re an Optica Student Chapter but open to all optics enthusiasts. As a member, you’ll get early/priority access to event registrations. This year we’re also launching a members-only Telegram space with a random-coffee bot, mentorship program, and our community ecosystem (news, chat, networking) before anywhere else.' },
            { id: uuidv4(), type: 'text', text: '1) PhE Member (open to all optics enthusiasts)\n\nNo student status required.\nPerks you get:\n\n• Priority access to event registrations\n• Invite to our closed Telegram (random-coffee, mentorship, news & networking)\n• First to hear about collabs, site visits, and workshops' },
            { id: uuidv4(), type: 'text', text: '2) Optica Student Member (students & PhDs)\n\nIf you’re a student (incl. PhD), we recommend also becoming an Optica (optica.org) student member:\n\n• Cost: $22/year (often reimbursable—ask your supervisor/department)\n• After joining Optica, list Photonics Society Eindhoven as your Student Chapter\n\nWhy add Optica student membership?\n\n• Community & networking: global student network, visiting lecturers, mentors\n• Funding & travel: eligibility for chapter grants, traveling-lecturer support, scholarships/travel grants, competitions\n• Career boost: reduced conference fees, programs, jobs & internships, member resources\n• Leadership experience: run events, budgets, partnerships—great for CVs/PhD or industry applications\n• Typical activities: traveling lecturers, company/lab visits, outreach, career panels, Student Leadership Conference\n\nNot a student?\n\nYou’re very welcome at our events without Optica membership.\nNote: when events are funded by Optica, priority may go to official Optica student members if required by the grant.\n\nHow to join\n\n• Everyone: sign up via our Telegram bot (we’ll send the closed-channel invite + add you to the priority list)\n• Students: get Optica student membership → add Photonics Society Eindhoven as your chapter in your Optica account' },
          ],
          joinForm: {
            leadText:
              'Quick sign-up via Telegram bot, or fill the form below. We’ll review and approve within 1–2 days.',
            fields: [
              { id: uuidv4(), label: 'Full name', type: 'text', required: true },
              { id: uuidv4(), label: 'Email', type: 'email', required: true },
              { id: uuidv4(), label: 'Affiliation / Program', type: 'text' },
              { id: uuidv4(), label: 'Are you an Optica Student Member?', type: 'select', options: ['No', 'Yes'], required: false },
              { id: uuidv4(), label: 'Notes', type: 'textarea' },
            ],
          },
        },
        draft: null,
        createdAt: now,
        updatedAt: now,
        publishedAt: now,
      })
    );
  }

  writeJSON('pages', pages);
}
ensureInitialPages();

// ---------- FORMS (email в EMAIL_TO) ----------
const EMAIL_TO = process.env.EMAIL_TO || 'ivsilan2005@gmail.com';

async function sendMailSafe({ subject, html, text }) {
  let nodemailer;
  try {
    nodemailer = await import('nodemailer');
  } catch (e) {
    console.warn('[mail] nodemailer не установлен, письмо не отправлено.');
    return { sent: false, error: 'nodemailer_not_installed' };
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('[mail] SMTP_* не заданы, письмо не отправлено.');
    return { sent: false, error: 'smtp_not_configured' };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Website Forms" <${user}>`,
      to: EMAIL_TO,
      subject,
      text,
      html,
    });
    return { sent: true, infoId: info.messageId };
  } catch (error) {
    console.error('[mail] send error:', error);
    return { sent: false, error: String(error && error.message) };
  }
}

/**
 * Универсальная форма обратной связи / подписки.
 * В теле можно присылать любые поля. Всё сохранится и уйдёт на почту.
 */
app.post('/api/forms/submit', async (req, res) => {
  const payload = req.body || {};
  const now = new Date().toISOString();

  const forms = readJSON('forms', []);
  const entry = { id: uuidv4(), createdAt: now, ...payload };
  forms.unshift(entry);
  writeJSON('forms', forms);

  const subject = payload.subject || payload.topic || 'Website form submission';
  const text = [
    `New form submission at ${now}`,
    '',
    ...Object.entries(payload).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`),
  ].join('\n');

  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;">
      <h2>New form submission</h2>
      <p><strong>Received at:</strong> ${now}</p>
      <table border="1" cellspacing="0" cellpadding="6">
        <tbody>
          ${Object.entries(payload)
            .map(
              ([k, v]) =>
                `<tr><td><strong>${k}</strong></td><td>${typeof v === 'object' ? `<pre>${JSON.stringify(v, null, 2)}</pre>` : String(v || '')}</td></tr>`
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;

  const result = await sendMailSafe({ subject, text, html });

  res.json({
    ok: true,
    savedId: entry.id,
    email: { to: EMAIL_TO, ...result },
  });
});

// ---------- STATIC FRONTEND (Vite build) ----------
const distPath = path.resolve(ROOT_DIR, '..', 'dist');
app.use(express.static(distPath, { maxAge: '7d', index: 'index.html' }));

// SPA fallback: любые не-API запросы — на index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

// ---------- START ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
