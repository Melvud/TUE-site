/* eslint-disable no-console */
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { Client } = require('pg');

dotenv.config();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);

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

// Health check
app.get('/health', (_req, res) => res.status(200).send('ok'));

// 🔍 Проверка БД
async function checkDatabase() {
  console.log('\n🔍 Checking database...\n');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    const result = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `);

    console.log(`✅ Database OK (${result.rows.length} tables)`);

    const requiredTables = ['users', 'events', 'news', 'members', 'media'];
    const existingTables = result.rows.map(r => r.tablename);
    const missing = requiredTables.filter(t => !existingTables.includes(t));

    if (missing.length > 0) {
      console.error('❌ Missing tables:', missing.join(', '));
      throw new Error('Database schema incomplete');
    }

    console.log('✅ All required tables exist\n');
  } catch (err) {
    console.error('❌ Database check failed:', err.message);
    throw err;
  } finally {
    await client.end();
  }
}

// Инициализация Payload
(async () => {
  try {
    await checkDatabase();

    const mjsPath = path.resolve(__dirname, 'payload.config.mjs');
    const jsPath  = path.resolve(__dirname, 'payload.config.js');
    const configPath = fs.existsSync(mjsPath) ? mjsPath : jsPath;

    console.log('➡️  Loading Payload config from:', configPath);

    const payloadMod = await import('payload');
    const payload = payloadMod.default ?? payloadMod;

    const cfgMod = await import(configPath + `?t=${Date.now()}`);
    const payloadConfig = cfgMod.default ?? cfgMod;

    console.log('🔧 Initializing Payload CMS...');
    
    // 🔥 НОВЫЙ ПОДХОД: НЕ передаём express app
    const payloadInstance = await payload.init({
      secret: process.env.PAYLOAD_SECRET || 'dev-secret',
      config: payloadConfig,
      // express: app, ← НЕ ПЕРЕДАЁМ!
      onInit: async (instance) => {
        console.log('✅ Payload CMS initialized');

        const email = process.env.PAYLOAD_SEED_ADMIN_EMAIL;
        const pass = process.env.PAYLOAD_SEED_ADMIN_PASSWORD;
        
        if (email && pass) {
          try {
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

    // 🔥 ВРУЧНУЮ монтируем Payload middleware
    console.log('🔧 Mounting Payload routes manually...');
    
    // Payload создаёт собственный Express app внутри
    if (payloadInstance.express) {
      app.use(payloadInstance.express);
      console.log('✅ Payload routes mounted via instance.express');
    } else {
      console.error('❌ payloadInstance.express is undefined!');
      console.error('   Payload version might be incompatible');
      console.error('   Trying alternative approach...');
      
      // Альтернатива: используем getAdminURL и getAPIURL
      const adminURL = payloadInstance.getAdminURL ? payloadInstance.getAdminURL() : '/admin';
      const apiURL = payloadInstance.getAPIURL ? payloadInstance.getAPIURL() : '/api';
      
      console.log(`   Admin URL: ${adminURL}`);
      console.log(`   API URL: ${apiURL}`);
    }

    // Upload endpoint
    app.post('/api/upload-local', upload.single('file'), (req, res) => {
      if (!req.file) return res.status(400).json({ error: 'No file' });
      res.json({ url: `/uploads/${req.file.filename}` });
    });

    // Фронтенд (SPA)
    const distPath = path.resolve(projectRoot, 'dist');

    // Статика (только НЕ для /api и /admin)
    app.use((req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/admin')) {
        return next();
      }
      express.static(distPath, { index: false, maxAge: '1d' })(req, res, next);
    });

    // SPA fallback
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/admin')) {
        return next();
      }
      
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Frontend not built');
      }
    });

    // 🔍 Проверяем зарегистрированные роуты
    console.log('\n📍 Registered routes:');
    let routeCount = 0;
    let adminFound = false;
    let apiFound = false;

    app._router.stack.forEach((layer) => {
      if (layer.route) {
        routeCount++;
        const path = layer.route.path;
        console.log(`  ${Object.keys(layer.route.methods).join(',').toUpperCase()} ${path}`);
        if (path.includes('admin')) adminFound = true;
        if (path.includes('api')) apiFound = true;
      } else if (layer.name === 'router') {
        layer.handle.stack.forEach((r) => {
          if (r.route) {
            routeCount++;
            const path = r.route.path;
            console.log(`  ${Object.keys(r.route.methods).join(',').toUpperCase()} ${path}`);
            if (path.includes('admin')) adminFound = true;
            if (path.includes('api')) apiFound = true;
          }
        });
      }
    });

    console.log(`\n  Total routes: ${routeCount}`);
    console.log(`  Admin routes: ${adminFound ? '✅' : '❌'}`);
    console.log(`  API routes: ${apiFound ? '✅' : '❌'}`);
    console.log('');

    // Запуск сервера
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 ═══════════════════════════════════════════════');
      console.log(`   Server: http://0.0.0.0:${PORT}`);
      console.log('🚀 ═══════════════════════════════════════════════');
      console.log('');
      console.log('📍 Admin: /admin');
      console.log('📍 API: /api');
      console.log('📍 Health: /health');
      console.log('');
      console.log('🔐 Login:');
      console.log(`   ${process.env.PAYLOAD_SEED_ADMIN_EMAIL || 'admin@tue.nl'}`);
      console.log(`   ${process.env.PAYLOAD_SEED_ADMIN_PASSWORD || '[password]'}`);
      console.log('');
    });

  } catch (err) {
    console.error('❌ Startup failed:', err);
    console.error(err.stack);
    process.exit(1);
  }
})();