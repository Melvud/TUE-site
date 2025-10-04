import { withPayload } from '@payloadcms/next/withPayload'
import path from 'node:path'
import url from 'node:url'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Убрали experimental.reactCompiler - не работает с React 18!
  poweredByHeader: false,
  compress: true,
  reactStrictMode: false,
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

export default withPayload(nextConfig)