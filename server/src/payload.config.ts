import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Events } from './collections/Events'
import { News } from './collections/News'
import { Members } from './collections/Members'
import { MembersPast } from './collections/MembersPast'
import { Home } from './globals/Home'
import { About } from './globals/About'
import { JoinUs } from './globals/JoinUs'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    livePreview: {
      url: ({ data, documentConfig }) => {
        const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
        
        // Для коллекций с slug
        if ('slug' in data && data.slug) {
          if (documentConfig?.slug === 'events') {
            return `${baseUrl}/events/${data.slug}?preview=true`
          }
          if (documentConfig?.slug === 'news') {
            return `${baseUrl}/news/${data.slug}?preview=true`
          }
        }

        // Для globals
        if (documentConfig?.slug === 'home') {
          return `${baseUrl}?preview=true`
        }
        if (documentConfig?.slug === 'about') {
          return `${baseUrl}/about?preview=true`
        }
        if (documentConfig?.slug === 'join') {
          return `${baseUrl}/join?preview=true`
        }

        return '' // ← Вернуть пустую строку вместо undefined
      },
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  collections: [Users, Media, Events, News, Members, MembersPast],
  globals: [Home, About, JoinUs],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins: [payloadCloudPlugin()],
})