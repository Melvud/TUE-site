import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Подсказываем Next где "корень" трейсинга — серверная папка,
  // чтобы не ругался на pnpm-lock.yaml в корне репо
  outputFileTracingRoot: __dirname,

  // Важно для Payload admin (иначе часто белый экран из-за не транспилированных ESM)
  transpilePackages: [
    'payload',
    '@payloadcms/next',
    '@payloadcms/richtext-lexical',
    '@faceless-ui/modal',
    '@faceless-ui/scroll-info'
  ],

  // Иногда полезно, если встретится ESM/CJS мешанина в зависимости
  // (раскомментируй при необходимости)
  // experimental: {
  //   esmExternals: 'loose'
  // },
};

export default nextConfig;
