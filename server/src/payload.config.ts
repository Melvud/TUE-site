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
import { ContactSubmissions } from './collections/ContactSubmissions'
import { JoinSubmissions } from './collections/JoinSubmissions'

import { Home } from './globals/Home'
import { About } from './globals/About'
import { JoinUs } from './globals/JoinUs'
import { Contact } from './globals/Contact'
import { EmailSettings } from './globals/EmailSettings'
import { EmailTemplates } from './globals/EmailTemplates'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    livePreview: {
      url: ({ data, collectionConfig, globalConfig }) => {
        const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
        const secret = process.env.PAYLOAD_SECRET

        let targetPath = '/'

        // Определяем путь для коллекций
        if (collectionConfig) {
          const slug = (data as any)?.slug

          switch (collectionConfig.slug) {
            case 'events':
              targetPath = slug ? `/events/${slug}` : '/events'
              break
            case 'news':
              targetPath = slug ? `/news/${slug}` : '/news'
              break
            default:
              targetPath = '/'
          }
        }

        // Определяем путь для globals
        if (globalConfig) {
          switch (globalConfig.slug) {
            case 'home':
              targetPath = '/'
              break
            case 'about':
              targetPath = '/about'
              break
            case 'join':
              targetPath = '/join'
              break
            case 'contact':
              targetPath = '/contact'
              break
            default:
              targetPath = '/'
          }
        }

        // Кодируем URL для редиректа
        const redirect = encodeURIComponent(targetPath)

        // Возвращаем URL с api/preview
        return `${baseUrl}/api/preview?secret=${secret}&redirect=${redirect}`
      },
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  collections: [
    Users,
    Media,
    Events,
    News,
    Members,
    MembersPast,
    ContactSubmissions,
    JoinSubmissions,
  ],
  globals: [
    Home, 
    About, 
    JoinUs, 
    Contact, 
    EmailSettings,
    EmailTemplates,
  ],
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