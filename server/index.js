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

// Служебные роуты ПЕРЕД Payload
app.get('/health', (_req, res) => res.status(200).send('ok'));

// Инициализация Payload и настройка роутинга
(async () => {
  try {
    const mjsPath = path.resolve(__dirname, 'payload.config.mjs');
    const jsPath  = path.resolve(__dirname, 'payload.config.js');
    const configPath = fs.existsSync(mjsPath) ? mjsPath : jsPath;
    if (!configPath) throw new Error('No Payload config found in /server');

    console.log('➡️  Loading Payload config from:', configPath);

    const payloadMod = await import('payload');
    const payload = payloadMod.default ?? payloadMod;

    const cfgMod = await import(configPath + `?t=${Date.now()}`);
    const payloadConfig = cfgMod.default ?? cfgMod;

    console.log('🔧 Initializing Payload CMS...');
    
    // 🔥 КРИТИЧНО: Payload должен инициализироваться БЕЗ express: app
    // Мы вручную смонтируем роуты после инициализации
    const payloadInstance = await payload.init({
      secret: process.env.PAYLOAD_SECRET || 'dev-secret',
      config: payloadConfig,
      onInit: async (instance) => {
        console.log('✅ Payload CMS initialized');

        // Создание админа
        const email = process.env.PAYLOAD_SEED_ADMIN_EMAIL;
        const pass = process.env.PAYLOAD_SEED_ADMIN_PASSWORD;
        
        if (email && pass) {
          try {
            // Удаляем временного админа из SQL (если есть)
            try {
              await instance.delete({
                collection: 'users',
                where: {
                  email: { equals: email },
                  hash: { equals: '$2a$10$dummyhashfornow' },
                },
              });
              console.log('🗑️  Removed temporary admin from SQL');
            } catch (e) {
              // Игнорируем
            }

            // Проверяем существование админа
            const { docs } = await instance.find({
              collection: 'users',
              where: { email: { equals: email } },
              limit: 1,
            });
            
            if (!docs?.length) {
              await instance.create({
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

    // 🔥 ВРУЧНУЮ монтируем Payload роуты ПЕРВЫМИ
    app.use(payloadInstance.express);
    console.log('✅ Payload routes mounted manually');

    // Upload endpoint после Payload
    app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '30d', immutable: true }));
    app.post('/api/upload-local', upload.single('file'), (req, res) => {
      if (!req.file) return res.status(400).json({ error: 'No file' });
      res.json({ url: `/uploads/${req.file.filename}` });
    });

    // Путь к собранному фронтенду
    const distPath = path.resolve(projectRoot, 'dist');

    // 🔥 ВАЖНО: SPA fallback только для НЕ-API и НЕ-ADMIN путей
    app.use((req, res, next) => {
      const url = req.path;
      
      // Если это API или Admin - пропускаем (уже обработано Payload)
      if (url.startsWith('/api') || url.startsWith('/admin')) {
        return next();
      }
      
      // Пытаемся отдать статику из dist
      const filePath = path.join(distPath, url);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        return res.sendFile(filePath);
      }
      
      // Если файл не найден - отдаём index.html (SPA fallback)
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        return res.sendFile(indexFile);
      }
      
      // Если даже index.html нет
      res.status(404).send('Frontend not built');
    });

    // Запуск сервера
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server: http://0.0.0.0:${PORT}`);
      console.log(`📍 Admin: http://0.0.0.0:${PORT}/admin`);
      console.log(`📍 API: http://0.0.0.0:${PORT}/api`);
      console.log(`📍 Health: http://0.0.0.0:${PORT}/health`);
    });

  } catch (err) {
    console.error('❌ Failed to init:', err);
    console.error(err.stack);
    process.exit(1);
  }
})();