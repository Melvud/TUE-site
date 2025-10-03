import { withPayload } from '@payloadcms/next/withPayload'
import path from 'node:path'
import url from 'node:url'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    reactCompiler: false,
  },
  // Чтобы Next не путался из-за нескольких lock-файлов (pnpm в корне, npm в server/)
  outputFileTracingRoot: path.join(__dirname, '..'),
}

export default withPayload(nextConfig)
