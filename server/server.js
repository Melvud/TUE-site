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
const app = next({ dev, dir: __dirname })
const handle = app.getRequestHandler()

const server = express()
server.disable('x-powered-by')
server.set('trust proxy', true)

server.use(cors())
server.use(express.json({ limit: '10mb' }))
server.use(express.urlencoded({ extended: true, limit: '10mb' }))

server.get('/health', (_req, res) => res.status(200).send('ok'))

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

const projectRoot = path.resolve(__dirname, '..')
const distPath = path.resolve(projectRoot, 'dist')

server.use((req, res, nextFn) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/admin') || req.path.startsWith('/graphql')) {
    return nextFn()
  }
  express.static(distPath, { index: false, maxAge: '1d' })(req, res, nextFn)
})

await app.prepare()
server.all('*', (req, res) => handle(req, res))

const PORT = Number(process.env.PORT || 3000)
server.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Server ready')
  console.log(`   http://localhost:${PORT}`)
  console.log('📍 Admin Panel: /admin')
  console.log('📍 REST API:    /api/*')
  console.log('📍 GraphQL:     /graphql (и playground: /graphql-playground)')
  console.log('📍 Health:      /health')
})
