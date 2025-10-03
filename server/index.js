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

const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);
console.log('📁 CWD set to:', process.cwd());

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

app.get('/health', (_req, res) => res.status(200).send('ok'));

(async () => {
  try {
    const configPath = path.resolve(__dirname, 'payload.config.ts');
    console.log('➡️  Loading Payload config from:', configPath);
    if (!fs.existsSync(configPath)) {
      throw new Error('payload.config.ts missing in /server');
    }

    const rawDbUrl = process.env.DATABASE_URL || '';
    try {
      const { hostname } = new URL(rawDbUrl);
      console.log('🗄️  Postgres host:', hostname || '(empty)');
    } catch {
      console.warn('⚠️  DATABASE_URL is not a valid URL or empty');
    }

    const payloadMod = await import('payload');
    const payload = payloadMod.default ?? payloadMod;
    const cfgMod = await import(configPath + `?t=${Date.now()}`);
    const payloadConfig = cfgMod.default ?? cfgMod;

    if (!payloadConfig || typeof payloadConfig !== 'object') {
      throw new Error('Invalid payload.config.ts export');
    }

    console.log('🔧 Initializing Payload CMS...');

    await payload.init({
      secret: process.env.PAYLOAD_SECRET || 'dev-secret',
      express: app,
      config: payloadConfig,
      onInit: async (payloadInstance) => {
        console.log('✅ Payload CMS initialized');

        // Seed admin
        const email = process.env.PAYLOAD_SEED_ADMIN_EMAIL;
        const pass = process.env.PAYLOAD_SEED_ADMIN_PASSWORD;
        if (email && pass) {
          try {
            const { docs } = await payloadInstance.find({
              collection: 'users',
              where: { email: { equals: email } },
              limit: 1,
            });
            if (!docs?.length) {
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
          } catch (e) {
            console.error('❌ Seed admin failed:', e.message);
          }
        }
      },
    });

    console.log('✅ Payload routes mounted');

    const distPath = path.resolve(projectRoot, 'dist');
    if (!fs.existsSync(distPath)) {
      console.warn('⚠️  dist folder not found');
    }

    app.use((req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/admin')) {
        return next();
      }
      express.static(distPath, { 
        index: false,
        maxAge: '1d',
      })(req, res, next);
    });

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/admin')) {
        return next();
      }
      
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Frontend not built');
      }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Server: http://0.0.0.0:${PORT}`);
      console.log(`📍 Admin: /admin`);
      console.log(`📍 API: /api\n`);
    });

  } catch (err) {
    console.error('❌ Failed to init:', err);
    console.error(err.stack);
    process.exit(1);
  }
})();