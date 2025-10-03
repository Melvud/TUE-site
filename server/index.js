/* eslint-disable no-console */
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);
console.log('📁 CWD set to:', process.cwd());

// 🔥 СОЗДАЁМ ДВА ОТДЕЛЬНЫХ EXPRESS APP
const payloadApp = express(); // Для Payload (/api, /admin)
const mainApp = express();    // Главный app

mainApp.disable('x-powered-by');
mainApp.set('trust proxy', true);
mainApp.use(cors());

(async () => {
  try {
    // === 1. Инициализируем Payload в отдельном app ===
    const mjsPath = path.resolve(__dirname, 'payload.config.mjs');
    const jsPath  = path.resolve(__dirname, 'payload.config.js');
    const configPath = fs.existsSync(mjsPath) ? mjsPath : jsPath;

    console.log('➡️  Loading Payload config from:', configPath);

    const payloadMod = await import('payload');
    const payload = payloadMod.default ?? payloadMod;

    const cfgMod = await import(configPath + `?t=${Date.now()}`);
    const payloadConfig = cfgMod.default ?? cfgMod;

    console.log('🔧 Initializing Payload CMS...');
    
    await payload.init({
      secret: process.env.PAYLOAD_SECRET || 'dev-secret',
      express: payloadApp, // 🔥 Используем отдельный app!
      config: payloadConfig,
      onInit: async (instance) => {
        console.log('✅ Payload CMS initialized');

        const email = process.env.PAYLOAD_SEED_ADMIN_EMAIL;
        const pass = process.env.PAYLOAD_SEED_ADMIN_PASSWORD;
        
        if (email && pass) {
          try {
            try {
              await instance.delete({
                collection: 'users',
                where: {
                  email: { equals: email },
                  hash: { equals: '$2a$10$dummyhashfornow' },
                },
              });
              console.log('🗑️  Removed temporary admin');
            } catch (e) {}

            const { docs } = await instance.find({
              collection: 'users',
              where: { email: { equals: email } },
              limit: 1,
            });
            
            if (!docs?.length) {
              await instance.create({
                collection: 'users',
                data: { email, password: pass, name: 'Admin', role: 'admin' },
              });
              console.log(`👤 Admin created: ${email}`);
            } else {
              console.log(`👤 Admin exists: ${email}`);
            }
          } catch (err) {
            console.error('❌ Admin seed failed:', err.message);
          }
        }
      },
    });

    console.log('✅ Payload app ready');

    // === 2. Монтируем Payload app в главный ===
    // Все запросы к /api и /admin идут в payloadApp
    mainApp.use('/api', payloadApp);
    mainApp.use('/admin', payloadApp);
    console.log('✅ Mounted Payload at /api and /admin');

    // === 3. Uploads ===
    const UPLOADS_DIR = path.join(__dirname, 'uploads');
    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    mainApp.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '30d' }));

    // === 4. Health check ===
    mainApp.get('/health', (_req, res) => res.send('ok'));

    // === 5. Фронтенд (SPA) ===
    const distPath = path.resolve(projectRoot, 'dist');
    const indexFile = path.join(distPath, 'index.html');

    // Статические файлы
    mainApp.use(express.static(distPath, { 
      index: false,
      maxAge: '1d' 
    }));

    // SPA fallback
    mainApp.get('*', (_req, res) => {
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Frontend not built');
      }
    });

    // === 6. Запуск ===
    const PORT = process.env.PORT || 3000;
    mainApp.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server: http://0.0.0.0:${PORT}`);
      console.log(`📍 Admin: http://0.0.0.0:${PORT}/admin`);
      console.log(`📍 API: http://0.0.0.0:${PORT}/api`);
    });

  } catch (err) {
    console.error('❌ Failed:', err);
    console.error(err.stack);
    process.exit(1);
  }
})();