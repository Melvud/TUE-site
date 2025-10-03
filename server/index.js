/* eslint-disable no-console */
/**
 * Single-server: Express + Payload CMS + Vite static.
 * Здесь НЕТ самописной админки — только Payload Admin на /admin.
 * Фронт раздается из ../dist.
 */

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const payload = require('payload');

dotenv.config();

process.env.PAYLOAD_CONFIG_PATH = path.resolve(__dirname, 'payload.config.js');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Локальная папка для «быстрых» загрузок из редактора, если нужно
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname || '')}`)
});
const upload = multer({ storage });

// Даем статику для локальных аплоадов (на проде лучше S3/R2 через Payload)
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '30d', immutable: true }));

// Только если хотите временную точку для загрузки картинок из внешних виджетов:
// (внутри Payload админки используйте коллекцию media — см. payload.config.js)
app.post('/api/upload-local', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// Инициализация Payload
(async () => {
  await payload.init({
    secret: process.env.PAYLOAD_SECRET || 'dev-secret',
    express: app,
    onInit: async () => {
      console.log('✅ Payload CMS is ready at /admin');

      // Создать первого пользователя, если нет (для входа в /admin)
      // Безопасно: выполнится один раз
      const seedEmail = process.env.PAYLOAD_SEED_ADMIN_EMAIL;
      const seedPass = process.env.PAYLOAD_SEED_ADMIN_PASSWORD;
      if (seedEmail && seedPass) {
        const { docs } = await payload.find({ collection: 'users', where: { email: { equals: seedEmail } } });
        if (!docs?.length) {
          await payload.create({
            collection: 'users',
            data: { email: seedEmail, password: seedPass, name: 'Admin', role: 'admin' }
          });
          console.log(`👤 Seed admin user created: ${seedEmail}`);
        }
      }
    }
  });

  // Раздача фронтенда (Vite build)
  const distPath = path.resolve(__dirname, '..', 'dist');
  app.use(express.static(distPath, { index: 'index.html', maxAge: '7d' }));

  // SPA fallback
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/admin') || req.path.startsWith('/media')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`));
})();
