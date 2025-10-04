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
      // Payload 3.x: { data, collectionConfig?, globalConfig? }
      url: ({ data, collectionConfig, globalConfig }) => {
        const baseUrl =
          process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

        const slug: string | undefined =
          (data as any)?.slug || (data as any)?.id

        // Коллекции
        if (collectionConfig) {
          switch (collectionConfig.slug) {
            case 'events':
              return slug
                ? `${baseUrl}/events/${slug}?preview=true`
                : `${baseUrl}/events?preview=true`
            case 'news':
              return slug
                ? `${baseUrl}/news/${slug}?preview=true`
                : `${baseUrl}/news?preview=true`
            default:
              return slug
                ? `${baseUrl}/${collectionConfig.slug}/${slug}?preview=true`
                : `${baseUrl}/${collectionConfig.slug}?preview=true`
          }
        }

        // Глобалы (используйте только реальные slugs из вашего проекта)
        if (globalConfig) {
          switch (globalConfig.slug) {
            case 'home':
              return `${baseUrl}?preview=true`
            case 'about':
              return `${baseUrl}/about?preview=true`
            case 'join': // соответствует ./globals/JoinUs
              return `${baseUrl}/join?preview=true`
            default:
              return `${baseUrl}?preview=true`
          }
        }

        return baseUrl
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
