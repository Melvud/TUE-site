// server.js  (ESM, для "type": "module")
import next from 'next'
import http from 'node:http'
import { URL } from 'node:url'

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

const port = process.env.PORT || 3000
const hostname = '0.0.0.0'

async function start() {
  await app.prepare()
  const server = http.createServer((req, res) => {
    // В Next 15 нужен объект URL для getRequestHandler
    const url = new URL(req.url || '/', `http://${req.headers.host}`)
    handle(req, res, url)
  })
  server.listen(port, hostname, () => {
    console.log(`> Next.js ready on http://localhost:${port}`)
  })
}

start().catch((err) => {
  console.error('Failed to start Next:', err)
  process.exit(1)
})
