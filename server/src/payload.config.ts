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
      // В Payload 3.x сюда приходят { data, collectionConfig?, globalConfig? ... }
      url: ({ data, collectionConfig, globalConfig }) => {
        const baseUrl =
          process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

        const slug: string | undefined =
          (data as any)?.slug || (data as any)?.id

        // Превью для коллекций
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
              // общее правило для любых других коллекций
              return slug
                ? `${baseUrl}/${collectionConfig.slug}/${slug}?preview=true`
                : `${baseUrl}/${collectionConfig.slug}?preview=true`
          }
        }

        // Превью для globals
        if (globalConfig) {
          switch (globalConfig.slug) {
            case 'home':
              return `${baseUrl}?preview=true`
            case 'about':
              return `${baseUrl}/about?preview=true`
            case 'join':
            case 'join-us':
              return `${baseUrl}/join?preview=true`
            default:
              // если есть другие глобалы — отправим в корень админки как fallback
              return `${baseUrl}?preview=true`
          }
        }

        // Fallback — безопасно вернуть базовый URL
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
