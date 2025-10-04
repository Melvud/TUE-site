import { withPayload } from '@payloadcms/next/withPayload'
import path from 'node:path'
import url from 'node:url'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Чтобы Next не путался из-за нескольких lock-файлов (pnpm в корне, npm в server/)
  outputFileTracingRoot: path.join(__dirname, '..'),
  
  // Отключаем React Compiler (может конфликтовать с Payload)
  experimental: {
    reactCompiler: false,
  },

  // Отключаем strict mode для избежания двойного рендера в dev
  reactStrictMode: false,

  // Настройки для продакшена
  poweredByHeader: false,
  compress: true,

  // Webpack config для правильной работы с Payload
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Эти модули должны быть только на сервере
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }
    return config
  },
}

export default withPayload(nextConfig)