/* eslint-disable no-console */
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

// Рабочая директория — корень проекта (../ от папки server)
const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);
console.log('📁 CWD set to:', process.cwd());

// Базовая конфигурация Express
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Локальная загрузка файлов
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname || '')}`),
});
const upload = multer({ storage });
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '30d', immutable: true }));

// Health check ПЕРЕД Payload
app.get('/health', (_req, res) => res.status(200).send('ok'));

// Инициализация Payload и настройка роутинга
(async () => {
  try {
    // Выбираем .mjs‑конфиг для рантайма; при его отсутствии fallback на .js
    const mjsPath = path.resolve(__dirname, 'payload.config.mjs');
    const jsPath  = path.resolve(__dirname, 'payload.config.js');
    const configPath = fs.existsSync(mjsPath) ? mjsPath : jsPath;
    if (!configPath) throw new Error('No Payload config found in /server');

    console.log('➡️  Loading Payload config from:', configPath);

    // Динамический импорт Payload (работает как с CJS, так и с ESM)
    const payloadMod = await import('payload');
    const payload = payloadMod.default ?? payloadMod;

    // Загружаем конфиг (поддерживает .mjs и .js)
    const cfgMod = await import(configPath + `?t=${Date.now()}`);
    const payloadConfig = cfgMod.default ?? cfgMod;

    console.log('🔧 Initializing Payload CMS...');
    
    // 🔥 КЛЮЧЕВОЙ МОМЕНТ: Payload автоматически монтируется в app
    await payload.init({
      secret: process.env.PAYLOAD_SECRET || 'dev-secret',
      express: app,
      config: payloadConfig,
      onInit: async (payloadInstance) => {
        console.log('✅ Payload CMS initialized');

        // Создание админа при первом старте
        const email = process.env.PAYLOAD_SEED_ADMIN_EMAIL;
        const pass = process.env.PAYLOAD_SEED_ADMIN_PASSWORD;
        
        if (email && pass) {
          try {
            // Удаляем временного админа из SQL (если есть)
            try {
              await payloadInstance.delete({
                collection: 'users',
                where: {
                  email: { equals: email },
                  hash: { equals: '$2a$10$dummyhashfornow' },
                },
              });
              console.log('🗑️  Removed temporary admin from SQL');
            } catch (e) {
              // Игнорируем если не найден
            }

            // Проверяем существование реального админа
            const { docs } = await payloadInstance.find({
              collection: 'users',
              where: { email: { equals: email } },
              limit: 1,
            });
            
            if (!docs?.length) {
              // Создаём админа с правильным хешем пароля
              await payloadInstance.create({
                collection: 'users',
                data: { 
                  email, 
                  password: pass, 
                  name: 'Admin', 
                  role: 'admin' 
                },
              });
              console.log(`👤 Seed admin created: ${email}`);
            } else {
              console.log(`👤 Admin already exists: ${email}`);
            }
          } catch (err) {
            console.error('❌ Seed admin failed:', err.message);
          }
        }
      },
    });

    console.log('✅ Payload routes mounted at /api and /admin');

    // 🔥 ВАЖНО: Убедимся что /admin и /admin/ оба работают
    // (Payload может монтировать только один из вариантов)
    app.use((req, res, next) => {
      // Если запрос к /admin без слеша - добавляем слеш
      if (req.path === '/admin') {
        return res.redirect(301, '/admin/');
      }
      next();
    });

    // Upload endpoint (если нужен дополнительно)
    app.post('/api/upload-local', upload.single('file'), (req, res) => {
      if (!req.file) return res.status(400).json({ error: 'No file' });
      res.json({ url: `/uploads/${req.file.filename}` });
    });

    // Путь к собранному фронтенду (Vite)
    const distPath = path.resolve(projectRoot, 'dist');

    // 🔥 КРИТИЧНО: Статика и SPA fallback ТОЛЬКО для НЕ-API путей
    // Payload уже обработал /api и /admin выше, поэтому эти запросы сюда не дойдут
    
    // Отдаём статические файлы (JS, CSS, images), но НЕ для /api и /admin
    app.use((req, res, next) => {
      // Пропускаем Payload роуты
      if (req.path.startsWith('/api') || req.path.startsWith('/admin')) {
        return next();
      }
      // Для остальных пробуем отдать статику
      express.static(distPath, { 
        index: false,  // НЕ автоматически отдавать index.html
        maxAge: '1d',
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
          }
        }
      })(req, res, next);
    });

    // SPA fallback для всех остальных путей
    // 🔥 КРИТИЧНО: НЕ перехватываем /api и /admin - они уже обработаны Payload
    app.get('*', (req, res, next) => {
      // Если путь начинается с /api или /admin - пропускаем
      if (req.path.startsWith('/api') || req.path.startsWith('/admin')) {
        return next();
      }
      
      // Для всех остальных путей отдаём index.html
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Frontend not built');
      }
    });

    // Запуск сервера на PORT из окружения (Render задаёт PORT автоматически)
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('🚀 ═══════════════════════════════════════════════');
      console.log(`   Server running on http://0.0.0.0:${PORT}`);
      console.log('🚀 ═══════════════════════════════════════════════');
      console.log('');
      console.log('📍 Admin Panel: /admin');
      console.log('📍 REST API: /api');
      console.log('📍 GraphQL: /api/graphql');
      console.log('📍 Health Check: /health');
      console.log('📍 Frontend: /');
      console.log('');
      console.log('🔐 Login with:');
      console.log(`   Email: ${process.env.PAYLOAD_SEED_ADMIN_EMAIL || 'admin@tue.nl'}`);
      console.log(`   Password: ${process.env.PAYLOAD_SEED_ADMIN_PASSWORD || '[check env var]'}`);
      console.log('');
    });

  } catch (err) {
    console.error('❌ Failed to init:', err);
    console.error(err.stack);
    process.exit(1);
  }
})();