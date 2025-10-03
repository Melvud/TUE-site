/* eslint-disable no-console */
/**
 * TU/e Photonics — API и статический сервер для одной инстанции.
 * CommonJS (type: commonjs в server/package.json).
 * 
 * Возможности:
 * - Раздача фронта из ../dist + SPA fallback
 * - Auth: POST /api/auth/login, GET /api/auth/me
 * - CRUD: /api/news, /api/events, /api/members, /api/pages
 *   (админ-операции под /api/<entity>/admin* с requireAuth)
 * - Uploads: POST /api/upload (multer), статика /uploads
 * - Forms: POST /api/forms/submit — отправка письма на ivsilan2005@gmail.com
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
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

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
  // Отдаём публичный URL на этот файл
  const publicPath = `/uploads/${req.file.filename}`;
  res.json({ filename: req.file.filename, url: publicPath });
});

// Раздаём статику загруженных файлов
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '30d', immutable: true }));

// ---------- GENERIC CRUD HELPERS ----------
/**
 * Выставим единообразные поля:
 * id (uuid), createdAt (ISO), updatedAt (ISO)
 */
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
    items.unshift(item); // свежие — вверх
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

// ---------- PAGES ----------
// Для pages вместо списка часто нужен доступ по slug.
// Но оставим общий доступ к списку (см. generic LIST), плюс сделаем GET по slug.
app.get('/api/pages/slug/:slug', (req, res) => {
  const { slug } = req.params;
  const items = readJSON('pages', []);
  const found = items.find((p) => p.slug === slug);
  if (!found) return res.status(404).json({ error: 'Not found' });
  res.json(found);
});

// Админские CRUD уже покрыты generic-роутами /api/pages/admin...

// ---------- FORMS (email в ivsilan2005@gmail.com) ----------
/**
 * POST /api/forms/submit
 * Принимает произвольные поля формы (например: name, email, message, topic, attachments и т.п.)
 * Сохраняет в data/forms.json, отправляет email через SMTP (если настроен).
 */
const EMAIL_TO = process.env.EMAIL_TO || 'ivsilan2005@gmail.com';

async function sendMailSafe({ subject, html, text }) {
  // динамический импорт, чтобы сервер не падал без зависимости
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
    secure: port === 465, // true — если 465
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

app.post('/api/forms/submit', async (req, res) => {
  // Собираем данные формы
  const payload = req.body || {};
  const now = new Date().toISOString();

  // Сохраним в data/forms.json
  const forms = readJSON('forms', []);
  const entry = { id: uuidv4(), createdAt: now, ...payload };
  forms.unshift(entry);
  writeJSON('forms', forms);

  // Сформируем письмо
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
