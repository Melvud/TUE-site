/* eslint-disable no-console */
/**
 * Express + Payload CMS (ESM-конфиг импортируем вручную) + Vite static.
 * Админка только Payload на /admin. SPA не перехватывает /admin.
 */

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const projectRoot = path.resolve(__dirname, '..'); // ← корень репозитория (над /server)
process.chdir(projectRoot);
console.log('📁 CWD set to:', process.cwd());

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Локальные загрузки (вспомогательно; для продакшена используйте S3/R2 в Payload) ──
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname || '')}`),
});
const upload = multer({ storage });

app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '30d', immutable: true }));

// Временная точка для сторонних виджетов; в админке Payload используйте коллекцию media
app.post('/api/upload-local', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// ── Инициализация Payload (ESM в CommonJS через dynamic import) ──
(async () => {
  const configPath = path.resolve(__dirname, 'payload.config.mjs');
  console.log('➡️  Trying to load Payload config at:', configPath);
  if (!fs.existsSync(configPath)) {
    console.error('❌ Payload config file not found at:', configPath);
    throw new Error('payload.config.mjs is missing. Ensure it exists in /server.');
  }

  // Импортируем сам Payload (ESM)
  const payloadMod = await import('payload');
  const payload = payloadMod.default ?? payloadMod;

  // Импортируем ваш конфиг (ESM) и берём default-экспорт
  const cfgMod = await import(configPath + `?t=${Date.now()}`); // cache-bust на всякий случай
  const payloadConfig = cfgMod.default ?? cfgMod;
  if (!payloadConfig || typeof payloadConfig !== 'object') {
    console.error('❌ payload.config.mjs does not export default object.');
    throw new Error('Invalid payload.config.mjs export');
  }

  console.log('✅ Payload config loaded.');

  await payload.init({
    secret: process.env.PAYLOAD_SECRET || 'dev-secret',
    express: app,
    // КЛЮЧЕВОЕ: передаем конфиг напрямую, не полагаясь на PAYLOAD_CONFIG_PATH
    config: payloadConfig,
    onInit: async () => {
      console.log('✅ Payload CMS is ready at /admin');

      // Seed admin-пользователь один раз, если задан в ENV
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

  // ── Раздача фронтенда (Vite build) ──
  const distPath = path.resolve(__dirname, '..', 'dist');
  app.use(express.static(distPath, { index: 'index.html', maxAge: '7d' }));

  // SPA fallback — не перехватывать /admin, /media и /api
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/admin') || req.path.startsWith('/media')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`));
})().catch((e) => {
  console.error('Failed to init Payload:', e);
  process.exit(1);
});
