// Next.js Custom Server + Express (Payload v3)
// - Next обслуживает Payload: /admin, /api, /graphql, /graphql-playground
// - Express обслуживает:
//     • /health
//     • /db-health (проверка БД)
//     • /uploads (статик)
//     • /api/upload-local (локальные загрузки)
//     • SPA фронт из /dist с fallback на index.html
//
// Дополнительно:
// - Жёсткая проверка соединения с БД на старте (pg.Pool SELECT 1)
//   Если соединение не установлено — процесс завершается с кодом 1.

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

dotenv.config()

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dev = process.env.NODE_ENV !== 'production'
const nextApp = next({ dev, dir: __dirname })
const handle = nextApp.getRequestHandler()

const server = express()
server.disable('x-powered-by')
server.set('trust proxy', true)

// ----------- базовые мидлвары
server.use(cors())
server.use(express.json({ limit: '10mb' }))
server.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ----------- health
server.get('/health', (_req, res) => res.status(200).send('ok'))

// =============== БАЗА ДАННЫХ: проверка подключения ===============
const { Pool } = pg

function shouldUseSSLFromUrl(connectionString) {
  if (!connectionString) return false
  // Если в строке явно sslmode=require — используем SSL
  if (/sslmode\s*=\s*require/i.test(connectionString)) return true
  // Простейшая эвристика для Neon/Managed: их хосты требуют TLS
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
    // Немного таймаутов, чтобы быстрее отваливаться при сетевых проблемах
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    max: 5,
  })
}

const pgPool = createPgPool()

async function assertDatabaseConnection() {
  if (!pgPool) {
    throw new Error('DATABASE_URL is not configured')
  }
  let client
  try {
    client = await pgPool.connect()
    const { rows } = await client.query('SELECT 1 as ok')
    if (!rows?.length || rows[0].ok !== 1) {
      throw new Error('Unexpected DB check response')
    }
    console.log('✅ Database connection OK')
  } catch (err) {
    console.error('❌ Database connection FAILED:', err?.message || err)
    throw err
  } finally {
    client?.release()
  }
}

// Эндпоинт для внешней проверки БД
server.get('/db-health', async (_req, res) => {
  try {
    await assertDatabaseConnection()
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ ok: false, error: (e && e.message) || String(e) })
  }
})
// ================================================================

// ----------- uploads (локальное хранение — как было)
const UPLOADS_DIR = path.join(__dirname, 'uploads')
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname || '')}`)
})
const upload = multer({ storage })

server.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '30d', immutable: true }))

server.post('/api/upload-local', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' })
  res.json({ url: `/uploads/${req.file.filename}` })
})

// ----------- Next (Payload) — строго на префиксах
server.all(
  [
    '/admin', '/admin/*',
    '/api', '/api/*',
    '/graphql', '/graphql/*',
    '/graphql-playground', '/graphql-playground/*',
  ],
  (req, res) => handle(req, res)
)

// ----------- SPA фронт из /dist
const projectRoot = path.resolve(__dirname, '..')       // корень репо
const distPath = path.resolve(projectRoot, 'dist')      // Vite build outDir
const indexFile = path.join(distPath, 'index.html')

// 1) отдаём ассеты как статику (JS/CSS/img и т.п.)
server.use(express.static(distPath, { index: false, maxAge: dev ? 0 : '1d' }))

// 2) fallback для SPA: любые НЕ-Payload пути (GET, html) -> dist/index.html
server.get('*', (req, res, nextFn) => {
  const accept = req.headers.accept || ''
  const isHTML = accept.includes('text/html')
  const isGet = (req.method || 'GET').toUpperCase() === 'GET'
  if (isGet && isHTML) {
    if (fs.existsSync(indexFile)) {
      return res.sendFile(indexFile)
    }
  }
  return nextFn()
})

/**
 * Порядок запуска:
 * 1) Жёсткая проверка БД (assertDatabaseConnection)
 * 2) Подготовка Next (Payload)
 * 3) Прослушивание порта
 */
try {
  await assertDatabaseConnection()
} catch {
  // Сразу падаем — так легче диагностировать проблемы с доступом к базе.
  process.exit(1)
}

await nextApp.prepare()
server.all('*', (req, res) => handle(req, res))

const PORT = Number(process.env.PORT || 3000)
server.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Server ready')
  console.log(`   http://localhost:${PORT}`)
  console.log('📍 Admin Panel: /admin')
  console.log('📍 REST API:    /api/*')
  console.log('📍 GraphQL:     /graphql (и playground: /graphql-playground)')
  console.log('📍 Health:      /health')
  console.log('📍 DB Health:   /db-health')
})
