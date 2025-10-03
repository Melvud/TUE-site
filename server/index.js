/* eslint-disable no-console */
/**
 * Express + Payload CMS + Vite static
 * - Монтаж админки Payload на /admin
 * - SPA не перехватывает /admin и /api
 * - Совместимо с Render (PORT из env)
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
app.disable('x-powered-by');
app.set('trust proxy', true);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ======= ВАЖНО: рабочая директория — корень репо (нужна Payload для Admin UI) =======
const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);
console.log('📁 CWD set to:', process.cwd());

// ======= Локальные аплоады (временное решение; для продакшена используйте S3/R2 в Payload) =======
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname || '')}`),
});
const upload = multer({ storage });

app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '30d', immutable: true }));

// Точка для вспомогательных загрузок (основные медиа — через коллекцию media в Payload)
app.post('/api/upload-local', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// Простой healthcheck (Render иногда дергает корень/health)
app.get('/health', (_req, res) => res.status(200).send('ok'));

// ======= Инициализация Payload (ESM в CommonJS через dynamic import) =======
(async () => {
  try {
    const configPath = path.resolve(__dirname, 'payload.config.mjs');
    console.log('➡️  Trying to load Payload config at:', configPath);
    if (!fs.existsSync(configPath)) {
      console.error('❌ Payload config file not found at:', configPath);
      throw new Error('payload.config.mjs is missing in /server');
    }

    // Базовая диагностика переменных окружения
    const rawDbUrl = process.env.DATABASE_URL || '';
    try {
      const { hostname } = new URL(rawDbUrl);
      console.log('🗄️  Postgres host:', hostname || '(empty)');
    } catch {
      console.warn('⚠️  DATABASE_URL is not a valid URL or empty');
    }

    // Импорт Payload (ESM)
    const payloadMod = await import('payload');
    const payload = payloadMod.default ?? payloadMod;

    // Импорт конфига (ESM, через default export)
    const cfgMod = await import(configPath + `?t=${Date.now()}`); // cache-bust
    const payloadConfig = cfgMod.default ?? cfgMod;
    if (!payloadConfig || typeof payloadConfig !== 'object') {
      throw new Error('Invalid payload.config.mjs export (no default object)');
    }
    console.log('✅ Payload config loaded.');

    await payload.init({
      // secret также задан в payload.config.mjs (v3 требует), но оставим дублирующий fallback
      secret: process.env.PAYLOAD_SECRET || 'dev-secret',
      express: app,
      config: payloadConfig,
      onInit: async () => {
        console.log('✅ Payload CMS is ready at /admin');

        // Разовый сид-админ (если заданы переменные)
        const seedEmail = process.env.PAYLOAD_SEED_ADMIN_EMAIL;
        const seedPass = process.env.PAYLOAD_SEED_ADMIN_PASSWORD;
        if (seedEmail && seedPass) {
          try {
            const { docs } = await payload.find({
              collection: 'users',
              where: { email: { equals: seedEmail } },
              limit: 1,
            });
            if (!docs?.length) {
              await payload.create({
                collection: 'users',
                data: { email: seedEmail, password: seedPass, name: 'Admin', role: 'admin' },
              });
              console.log(`👤 Seed admin user created: ${seedEmail}`);
            }
          } catch (e) {
            console.warn('Seed admin check failed:', e.message);
          }
        }
      },
    });

    // ЯВНО монтируем роутер Payload (чтобы /admin и /api точно работали)
    if (payload.expressRouter) {
      app.use(payload.expressRouter);
    } else if (payload.router) {
      app.use(payload.router);
    }

    // ======= Раздача фронтенда (Vite build) =======
    const distPath = path.resolve(projectRoot, 'dist');
    app.use(express.static(distPath, { index: 'index.html', maxAge: '7d' }));

    // SPA fallback — НЕ перехватывать /admin, /api, /media, /uploads
    app.get('*', (req, res, next) => {
      if (
        req.path === '/api' ||
        req.path.startsWith('/api/') ||
        req.path.startsWith('/admin') ||
        req.path.startsWith('/media') ||
        req.path.startsWith('/uploads')
      ) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`));
  } catch (e) {
    console.error('Failed to init Payload:', e);
    process.exit(1);
  }
})();
