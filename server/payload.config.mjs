// server/payload.config.mjs
import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROLES = ['viewer', 'editor', 'admin']
const isAdmin = ({ req }) => req?.user?.role === 'admin'
const isEditorOrAdmin = ({ req }) => (req?.user?.role === 'editor' || req?.user?.role === 'admin')

// домен приложения (для CORS/CSRF). На Render это твой прод-домен:
const APP_URL = process.env.SERVER_URL || 'http://localhost:3000'

export default buildConfig({
  // ===== БАЗА =====
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    },
    migrationDir: path.resolve(__dirname, 'migrations'),
  }),

  // ===== АДМИНКА =====
  admin: {
    user: 'users',
    // оставляем /admin по умолчанию (совпадает с файловой структурой)
    importMap: { baseDir: path.resolve(__dirname) },
    // можно добавить titleSuffix, logo и т.д. по желанию
  },

  // ===== БЕЗОПАСНОСТЬ (важно для 403/пустого экрана) =====
  // Разрешаем запросы с того же домена (Render), и корректный CSRF
  cors: {
    origins: [APP_URL],
    credentials: true,
  },
  csrf: [APP_URL],

  // Куки для prod
  // (в проде secure=true; sameSite=lax из коробки хорошо работает на одном домене)
  cookiePrefix: 'p_',
  serverURL: APP_URL,
  secret: process.env.PAYLOAD_SECRET || 'dev-secret',
  telemetry: false,

  // ===== EDITOR =====
  editor: lexicalEditor(),

  // ===== КОЛЛЕКЦИИ =====
  collections: [
    // --- USERS (AUTH) ---
    {
      slug: 'users',
      auth: {
        useAPIKey: false,
        tokenExpiration: 60 * 60 * 2, // 2 часа
        cookies: { sameSite: 'lax', secure: process.env.NODE_ENV === 'production' },
      },
      admin: { useAsTitle: 'email', defaultColumns: ['email', 'name', 'role'] },
      // !!! ВАЖНО !!!
      // Не делаем публичного чтения пользователей, но и не блокируем загрузку админки:
      // create/update/delete — только админ. read тоже ограничен (как и было).
      access: {
        read: isEditorOrAdmin,
        create: isAdmin,
        update: isAdmin,
        delete: isAdmin,
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'role',
          type: 'select',
          required: true,
          defaultValue: 'editor',
          options: ROLES.map(r => ({ label: r, value: r })),
        },
      ],
    },

    // --- MEDIA ---
    {
      slug: 'media',
      labels: { singular: 'Media', plural: 'Media' },
      upload: {
        staticDir: path.resolve(__dirname, 'uploads'),
        mimeTypes: ['image/*'],
      },
      admin: { useAsTitle: 'filename' },
      access: {
        read: () => true,               // публично
        create: isEditorOrAdmin,
        update: isEditorOrAdmin,
        delete: isEditorOrAdmin,
      },
      fields: [{ name: 'alt', type: 'text' }, { name: 'caption', type: 'textarea' }],
    },

    // --- EVENTS ---
    {
      slug: 'events',
      labels: { singular: 'Event', plural: 'Events' },
      versions: { drafts: true, maxPerDoc: 20 },
      admin: { useAsTitle: 'title', defaultColumns: ['title', 'date', 'published', 'updatedAt'] },
      access: {
        read: () => true,               // публично
        create: isEditorOrAdmin,
        update: isEditorOrAdmin,
        delete: isEditorOrAdmin,
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'date', type: 'text', required: true },
        { name: 'googleFormUrl', type: 'text' },
        { name: 'summary', type: 'textarea' },
        { name: 'content', type: 'richText' },
        { name: 'published', type: 'checkbox', defaultValue: false },
        { name: 'latest', type: 'checkbox', defaultValue: false },
        { name: 'publishAt', type: 'date' },
        { name: 'cover', type: 'upload', relationTo: 'media' },
      ],
    },

    // --- NEWS ---
    {
      slug: 'news',
      labels: { singular: 'News', plural: 'News' },
      versions: { drafts: true, maxPerDoc: 20 },
      admin: { useAsTitle: 'title', defaultColumns: ['title', 'date', 'published', 'updatedAt'] },
      access: {
        read: () => true,               // публично
        create: isEditorOrAdmin,
        update: isEditorOrAdmin,
        delete: isEditorOrAdmin,
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'date', type: 'date', required: true },
        { name: 'author', type: 'text' },
        { name: 'summary', type: 'textarea' },
        { name: 'content', type: 'richText' },
        { name: 'published', type: 'checkbox', defaultValue: false },
        { name: 'publishAt', type: 'date' },
        { name: 'cover', type: 'upload', relationTo: 'media' },
      ],
    },

    // --- MEMBERS ---
    {
      slug: 'members',
      labels: { singular: 'Member', plural: 'Members' },
      admin: { useAsTitle: 'name', defaultColumns: ['name', 'role', 'order'] },
      access: {
        read: () => true,               // публично
        create: isEditorOrAdmin,
        update: isEditorOrAdmin,
        delete: isEditorOrAdmin,
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'role', type: 'text' },
        { name: 'order', type: 'number', defaultValue: 0 },
        { name: 'email', type: 'email' },
        { name: 'linkedin', type: 'text' },
        { name: 'instagram', type: 'text' },
        { name: 'photo', type: 'upload', relationTo: 'media' },
      ],
    },

    // --- MEMBERS PAST ---
    {
      slug: 'membersPast',
      labels: { singular: 'Past Member', plural: 'Past Members' },
      admin: { useAsTitle: 'name' },
      access: {
        read: () => true,               // публично (или ужесточить при необходимости)
        create: isEditorOrAdmin,
        update: isEditorOrAdmin,
        delete: isEditorOrAdmin,
      },
      fields: [
        { name: 'originalId', type: 'text' },
        { name: 'name', type: 'text', required: true },
        { name: 'role', type: 'text' },
        { name: 'order', type: 'number' },
        { name: 'email', type: 'email' },
        { name: 'linkedin', type: 'text' },
        { name: 'instagram', type: 'text' },
        { name: 'photo', type: 'upload', relationTo: 'media' },
      ],
    },

    // --- JOIN SUBMISSIONS ---
    {
      slug: 'joinSubmissions',
      labels: { singular: 'Join Submission', plural: 'Join Submissions' },
      admin: { useAsTitle: 'id' },
      access: {
        read: isAdmin,
        create: () => true,            // публичная отправка формы
        update: isAdmin,
        delete: isAdmin,
      },
      fields: [{ name: 'payload', type: 'json', required: true }],
      hooks: {
        afterChange: [
          async ({ doc, operation }) => {
            if (operation !== 'create') return
            try {
              const nm = await import('nodemailer')
              const nodemailer = nm.default || nm
              const host = process.env.SMTP_HOST
              const port = Number(process.env.SMTP_PORT || 587)
              const user = process.env.SMTP_USER
              const pass = process.env.SMTP_PASS
              const to = process.env.EMAIL_TO || 'ivsilan2005@gmail.com'
              if (!host || !user || !pass) {
                console.warn('📧 SMTP not configured')
                return
              }
              const transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth: { user, pass },
              })
              const data = (doc && doc.payload) || {}
              const rows = Object.entries(data)
                .map(
                  ([k, v]) =>
                    `<tr><td><strong>${k}</strong></td><td>${
                      typeof v === 'object' ? `<pre>${JSON.stringify(v, null, 2)}</pre>` : String(v ?? '')
                    }</td></tr>`,
                )
                .join('')
              await transporter.sendMail({
                from: `"PhE Website" <${user}>`,
                to,
                subject: (data && data.subject) || 'Join form',
                html: `<div style="font-family:system-ui,sans-serif"><h2>Join Form Submission</h2><table border="1" cellspacing="0" cellpadding="6">${rows}</table></div>`,
              })
              console.log('📧 Email sent')
            } catch (e) {
              console.error('📧 Email failed:', (e && e.message) || String(e))
            }
          },
        ],
      },
    },
  ],

  // ===== TYPES =====
  typescript: { outputFile: path.resolve(__dirname, './payload-types.ts') },
  graphQL: { disable: false },
})
