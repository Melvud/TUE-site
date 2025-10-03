/* eslint-disable no-console */
/**
 * Express + Payload CMS + Vite static (Render friendly)
 * Порядок важен:
 *  1) init Payload (он сам монтирует /admin и /api)
 *  2) затем статика и SPA fallback (но /admin и /api не трогаем)
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

// ===== Рабочая директория — корень репозитория =====
const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);
console.log('📁 CWD set to:', process.cwd());

// Базовые middlewares до Payload — только безопасные
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Временные локальные аплоады (основные медиа — через Payload upload collection)
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname || '')}`),
});
const upload = multer({ storage });
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '30d', immutable: true }));
app.post('/api/upload-local', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// Healthcheck
app.get('/health', (_req, res) => res.status(200).send('ok'));

// ===== ИНИЦИАЛИЗАЦИЯ PAYLOAD =====
(async () => {
  try {
    const configPath = path.resolve(__dirname, 'payload.config.mjs');
    console.log('➡️  Trying to load Payload config at:', configPath);
    if (!fs.existsSync(configPath)) {
      throw new Error('payload.config.mjs missing in /server');
    }

    // Диагностика БД
    const rawDbUrl = process.env.DATABASE_URL || '';
    try {
      const { hostname } = new URL(rawDbUrl);
      console.log('🗄️  Postgres host:', hostname || '(empty)');
    } catch {
      console.warn('⚠️  DATABASE_URL is not a valid URL or empty');
    }

    // Импорт Payload и конфига (оба — ESM)
    const payloadMod = await import('payload');
    const payload = payloadMod.default ?? payloadMod;
    const cfgMod = await import(configPath + `?t=${Date.now()}`);
    const payloadConfig = cfgMod.default ?? cfgMod;

    if (!payloadConfig || typeof payloadConfig !== 'object') {
      throw new Error('Invalid payload.config.mjs export');
    }

    await payload.init({
      // секрет также указан в конфиге (v3), но здесь оставим fallback
      secret: process.env.PAYLOAD_SECRET || 'dev-secret',
      express: app,              // ⬅️ ВАЖНО: Payload САМ смонтирует /admin и /api
      config: payloadConfig,
      onInit: async () => {
        console.log('✅ Payload CMS is ready at /admin');

        // Разовый сид админа (если заданы env)
        const email = process.env.PAYLOAD_SEED_ADMIN_EMAIL;
        const pass = process.env.PAYLOAD_SEED_ADMIN_PASSWORD;
        if (email && pass) {
          try {
            const { docs } = await payload.find({
              collection: 'users',
              where: { email: { equals: email } },
              limit: 1,
            });
            if (!docs?.length) {
              await payload.create({
                collection: 'users',
                data: { email, password: pass, name: 'Admin', role: 'admin' },
              });
              console.log(`👤 Seed admin user created: ${email}`);
            }
          } catch (e) {
            console.warn('Seed admin check failed:', e.message);
          }
        }
      },
    });

    // ❌ НЕ МОНТИРУЕМ руками payload.router / payload.expressRouter
    // В v3 при передаче { express: app } Payload уже повесил маршруты.
    // Дополнительный app.use(...) иногда ломает order и даёт 404/дубли.

    // ===== Раздача фронтенда (Vite build) =====
    const distPath = path.resolve(projectRoot, 'dist');
    app.use(express.static(distPath, { index: 'index.html', maxAge: '7d' }));

    // SPA fallback — НЕ перехватывать /admin и /api (пусть их обрабатывает Payload)
    app.get('*', (req, res, next) => {
      if (req.path === '/api' || req.path.startsWith('/api/') || req.path.startsWith('/admin')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`));
  } catch (err) {
    console.error('Failed to init Payload:', err);
    process.exit(1);
  }
})();
