// Next.js Custom Server + Express (Payload v3)
// - Next обслуживает Payload: /admin, /api, /graphql, /graphql-playground
// - Express обслуживает:
//     • /health
//     • /uploads (статик)
//     • /api/upload-local (локальные загрузки — сохраняем старую логику)
//     • SPA фронт из /dist с fallback на index.html для любых не-пейлоад маршрутов

import path from 'node:path'
import fs from 'node:fs'
import url from 'node:url'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import next from 'next'
import { v4 as uuidv4 } from 'uuid'

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
// Эти пути ОБЯЗАТЕЛЬНО обрабатывает Next/Payload:
server.all(['/admin', '/admin/*', '/api', '/api/*', '/graphql', '/graphql/*', '/graphql-playground', '/graphql-playground/*'], (req, res) => {
  return handle(req, res)
})

// ----------- SPA фронт из /dist
const projectRoot = path.resolve(__dirname, '..')       // корень репо
const distPath = path.resolve(projectRoot, 'dist')      // Vite build outDir
const indexFile = path.join(distPath, 'index.html')

// 1) отдаём ассеты как статику (JS/CSS/img и т.п.)
server.use(express.static(distPath, { index: false, maxAge: dev ? 0 : '1d' }))

// 2) fallback для SPA: любые НЕ-Payload пути (GET, html) -> dist/index.html
server.get('*', (req, res, nextFn) => {
  // всё, что начинается с admin/api/graphql/playground уже перехвачено выше
  // сюда попадают только остальные пути
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

// ----------- на всякий случай — общий обработчик Next (не должен часто вызываться)
await nextApp.prepare()
server.all('*', (req, res) => handle(req, res))

// ----------- запуск
const PORT = Number(process.env.PORT || 3000)
server.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Server ready')
  console.log(`   http://localhost:${PORT}`)
  console.log('📍 Admin Panel: /admin')
  console.log('📍 REST API:    /api/*')
  console.log('📍 GraphQL:     /graphql (и playground: /graphql-playground)')
  console.log('📍 Health:      /health')
})
