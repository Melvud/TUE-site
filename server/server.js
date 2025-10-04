// server/server.js
import path from 'node:path'
import fs from 'node:fs'
import url from 'node:url'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import next from 'next'
import { v4 as uuidv4 } from 'uuid'
import pg from 'pg'
import morgan from 'morgan'

dotenv.config()

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dev = process.env.NODE_ENV !== 'production'
const nextApp = next({ dev, dir: __dirname })
const handle = nextApp.getRequestHandler()

const server = express()
server.disable('x-powered-by')
server.set('trust proxy', true)

// ---------- request id + базовые мидлвары
server.use((req, _res, nextFn) => {
  req.id = (req.headers['x-request-id']?.toString() || uuidv4()).slice(0, 12)
  nextFn()
})
server.use(cors())
server.use(express.json({ limit: '10mb' }))
server.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ---------- morgan с расширенным форматом
morgan.token('id', (req) => req.id)
morgan.token('body', (req) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) return '-'
    return JSON.stringify(req.body)
  } catch {
    return '[unserializable]'
  }
})
server.use(
  morgan(
    ':date[iso] :id :remote-addr :method :url :status :res[content-length] - :response-time ms :body'
  )
)

// ---------- health
server.get('/health', (_req, res) => res.status(200).send('ok'))

// =============== БАЗА ДАННЫХ: проверка подключения ===============
const { Pool } = pg

function shouldUseSSLFromUrl(connectionString) {
  if (!connectionString) return false
  if (/sslmode\s*=\s*require/i.test(connectionString)) return true
  if (/\.neon\.tech\b/i.test(connectionString)) return true
  return false
}
function createPgPool() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('❌ DATABASE_URL is not set')
    return null
  }
  const useSSL =
    shouldUseSSLFromUrl(connectionString) ||
    process.env.DATABASE_SSL === 'true'

  return new Pool({
    connectionString,
    ssl: useSSL ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    max: 5,
  })
}
const pgPool = createPgPool()

async function assertDatabaseConnection() {
  if (!pgPool) throw new Error('DATABASE_URL is not configured')
  let client
  try {
    client = await pgPool.connect()
    const { rows } = await client.query('SELECT 1 as ok')
    if (!rows?.length || rows[0].ok !== 1)
      throw new Error('Unexpected DB check response')
    console.log('✅ Database connection OK')
  } catch (err) {
    console.error('❌ Database connection FAILED:', err?.message || err)
    throw err
  } finally {
    client?.release()
  }
}
server.get('/db-health', async (_req, res) => {
  try {
    await assertDatabaseConnection()
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ ok: false, error: (e && e.message) || String(e) })
  }
})
// ================================================================

// ---------- uploads (локальное хранение)
const UPLOADS_DIR = path.join(__dirname, 'uploads')
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) =>
    cb(null, `${uuidv4()}${path.extname(file.originalname || '')}`),
})
const upload = multer({ storage })
server.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '30d', immutable: true }))
server.post('/api/upload-local', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' })
  console.log(`[${req.id}] UPLOAD saved: ${req.file.filename}`)
  res.json({ url: `/uploads/${req.file.filename}` })
})

await (async () => {
  try {
    await assertDatabaseConnection()
  } catch {
    process.exit(1)
  }
  await nextApp.prepare()

  // ===== ПОРЯДОК MIDDLEWARE КРИТИЧЕСКИ ВАЖЕН! =====
  
  // 1. Next.js static files (_next/*)
  server.all(/^\/_next\/.*/, (req, res) => {
    console.log(`[${req.id}] -> Next asset: ${req.method} ${req.originalUrl}`)
    return handle(req, res)
  })

  // 2. Next.js system files
  server.all(/^\/favicon\.ico$/, (req, res) => handle(req, res))
  server.all(/^\/robots\.txt$/, (req, res) => handle(req, res))
  server.all(/^\/sitemap\.xml$/, (req, res) => handle(req, res))

  // 3. Payload Admin UI (/admin и все вложенные пути)
  server.all(/^\/admin(\/.*)?$/, (req, res) => {
    console.log(`[${req.id}] -> AdminRoute: ${req.method} ${req.originalUrl}`)
    return handle(req, res)
  })

  // 4. Payload REST API (/api/*)
  server.all(/^\/api\/.*/, (req, res) => {
    console.log(`[${req.id}] -> APIRoute: ${req.method} ${req.originalUrl}`)
    return handle(req, res)
  })

  // 5. Payload GraphQL (/graphql и /graphql-playground)
  server.all(/^\/graphql(-playground)?$/, (req, res) => {
    console.log(`[${req.id}] -> GraphQLRoute: ${req.method} ${req.originalUrl}`)
    return handle(req, res)
  })

  // 6. Frontend SPA (dist/)
  const projectRoot = path.resolve(__dirname, '..')
  const distPath = path.resolve(projectRoot, 'dist')
  const indexFile = path.join(distPath, 'index.html')
  const hasDist = fs.existsSync(distPath) && fs.existsSync(indexFile)

  if (!hasDist) {
    console.warn('⚠️  Frontend dist/ not found. Run "npm run build" in root directory.')
  }

  // Static assets from dist/
  if (hasDist) {
    server.use(express.static(distPath, { index: false, maxAge: dev ? 0 : '1d' }))
  }

  // 7. SPA fallback (только для GET/HEAD HTML запросов, которые не попали в предыдущие правила)
  server.all('*', (req, res) => {
    const accept = req.headers.accept || ''
    const isHTML = accept.includes('text/html')
    const isGetOrHead = ['GET', 'HEAD'].includes(req.method?.toUpperCase() || 'GET')
    
    if (isGetOrHead && isHTML) {
      if (hasDist && fs.existsSync(indexFile)) {
        console.log(`[${req.id}] -> SPA fallback: ${req.method} ${req.originalUrl}`)
        return res.sendFile(indexFile)
      } else {
        console.log(`[${req.id}] -> SPA not available (dist missing)`)
        return res.status(404).send('Frontend not built. Please run "npm run build" in root directory.')
      }
    }
    
    // Для всех остальных запросов - 404
    return res.status(404).json({ error: 'Not found' })
  })

  // ---------- глобальный обработчик ошибок Express
  // eslint-disable-next-line no-unused-vars
  server.use((err, req, res, _next) => {
    console.error(`[${req.id}] ❌ Unhandled error:`, err?.stack || err)
    res.status(500).json({ error: 'Internal Server Error', rid: req.id })
  })

  // node-level
  process.on('unhandledRejection', (reason) => {
    console.error('⨯ unhandledRejection:', reason)
  })
  process.on('uncaughtException', (err) => {
    console.error('⨯ uncaughtException:', err)
  })

  const PORT = Number(process.env.PORT || 3000)
  server.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 Server ready')
    console.log(`   http://localhost:${PORT}`)
    console.log('📍 Admin Panel: /admin')
    console.log('📍 REST API:    /api/*')
    console.log('📍 GraphQL:     /graphql (и playground: /graphql-playground)')
    console.log('📍 Health:      /health')
    console.log('📍 DB Health:   /db-health')
    if (hasDist) {
      console.log('📍 Frontend:    / (React SPA)')
    } else {
      console.log('⚠️  Frontend:    Not available (run build)')
    }
  })
})()