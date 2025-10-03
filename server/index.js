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

// Health check ПЕРЕД Payload
app.get('/health', (_req, res) => res.status(200).send('ok'));

// 🔍 Проверка БД
async function checkDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    const result = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`);
    console.log(`✅ Database OK (${result.rows.length} tables)\n`);
    await client.end();
  } catch (err) {
    console.error('❌ Database failed:', err.message);
    throw err;
  }
}

// Инициализация Payload
(async () => {
  try {
    await checkDatabase();

    const mjsPath = path.resolve(__dirname, 'payload.config.mjs');
    const jsPath  = path.resolve(__dirname, 'payload.config.js');
    const configPath = fs.existsSync(mjsPath) ? mjsPath : jsPath;

    console.log('➡️  Loading config:', configPath);

    const payloadMod = await import('payload');
    const payload = payloadMod.default ?? payloadMod;

    const cfgMod = await import(configPath + `?t=${Date.now()}`);
    const payloadConfig = cfgMod.default ?? cfgMod;

    // 🔍 ПРОВЕРЯЕМ КОНФИГ ПЕРЕД ИНИЦИАЛИЗАЦИЕЙ
    console.log('\n🔍 Payload config check:');
    console.log('  serverURL:', payloadConfig.serverURL);
    console.log('  admin.disable:', payloadConfig.admin?.disable);
    console.log('  admin.user:', payloadConfig.admin?.user);
    
    if (payloadConfig.routes) {
      console.log('  routes.api:', payloadConfig.routes.api);
      console.log('  routes.admin:', payloadConfig.routes.admin);
    } else {
      console.log('  routes: (using defaults)');
    }
    console.log('');

    if (payloadConfig.admin?.disable === true) {
      console.error('❌ CRITICAL: admin.disable = true in config!');
      console.error('   This prevents admin panel from loading.');
      console.error('   Set admin.disable = false in payload.config.mjs\n');
    }

    console.log('🔧 Initializing Payload CMS...');
    
    // 🔥 ВОЗВРАЩАЕМ express: app
    await payload.init({
      secret: process.env.PAYLOAD_SECRET || 'dev-secret',
      express: app,  // ← ВОЗВРАЩАЕМ!
      config: payloadConfig,
      onInit: async (instance) => {
        console.log('✅ Payload initialized');

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

    console.log('✅ Payload init completed\n');

    // Upload endpoint ПОСЛЕ Payload
    app.post('/api/upload-local', upload.single('file'), (req, res) => {
      if (!req.file) return res.status(400).json({ error: 'No file' });
      res.json({ url: `/uploads/${req.file.filename}` });
    });

    // 🔍 ДЕТАЛЬНАЯ ПРОВЕРКА РОУТОВ
    console.log('🔍 Checking Express routes...\n');
    
    const allRoutes = [];
    
    function extractRoutes(stack, prefix = '') {
      stack.forEach((layer) => {
        if (layer.route) {
          // Прямой роут
          const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
          const fullPath = prefix + layer.route.path;
          allRoutes.push({ methods, path: fullPath, type: 'route' });
        } else if (layer.name === 'router' && layer.handle.stack) {
          // Вложенный router
          const routerPath = layer.regexp.source
            .replace('\\/?', '')
            .replace('(?=\\/|$)', '')
            .replace(/\\/g, '')
            .replace('^', '');
          
          extractRoutes(layer.handle.stack, routerPath);
        } else if (layer.name === 'bound dispatch') {
          // Payload может использовать этот тип
          const routerPath = layer.regexp ? layer.regexp.source
            .replace('\\/?', '')
            .replace('(?=\\/|$)', '')
            .replace(/\\/g, '')
            .replace('^', '') : '';
          
          if (routerPath) {
            allRoutes.push({ methods: 'ALL', path: routerPath, type: 'middleware' });
          }
        }
      });
    }
    
    extractRoutes(app._router.stack);
    
    console.log('📍 All registered routes:');
    allRoutes.forEach(r => {
      console.log(`  [${r.type}] ${r.methods} ${r.path}`);
    });
    
    const adminRoutes = allRoutes.filter(r => r.path.includes('admin'));
    const apiRoutes = allRoutes.filter(r => r.path.includes('api'));
    
    console.log(`\n  Total: ${allRoutes.length} routes`);
    console.log(`  Admin: ${adminRoutes.length > 0 ? '✅' : '❌'} (${adminRoutes.length} routes)`);
    console.log(`  API: ${apiRoutes.length > 0 ? '✅' : '❌'} (${apiRoutes.length} routes)`);
    console.log('');

    if (adminRoutes.length === 0) {
      console.error('❌ CRITICAL: No /admin routes found!');
      console.error('   Possible causes:');
      console.error('   1. admin.disable = true in config');
      console.error('   2. Payload version incompatibility');
      console.error('   3. Config not loading correctly\n');
    }

    if (apiRoutes.length === 0) {
      console.error('⚠️  WARNING: No /api routes found!');
      console.error('   Collections may not be accessible via REST API\n');
    }

    // Фронтенд (SPA) - ТОЛЬКО после Payload
    const distPath = path.resolve(projectRoot, 'dist');

    // Статика (НЕ для /api и /admin)
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

    // Запуск сервера
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 ═══════════════════════════════════════════════');
      console.log(`   Server: http://0.0.0.0:${PORT}`);
      console.log('🚀 ═══════════════════════════════════════════════');
      console.log('');
      console.log('📍 Admin Panel: /admin');
      console.log('📍 REST API: /api');
      console.log('📍 Health Check: /health');
      console.log('');
      console.log('🔐 Login: admin@tue.nl');
      console.log('');
    });

  } catch (err) {
    console.error('❌ Startup failed:', err);
    console.error(err.stack);
    process.exit(1);
  }
})();