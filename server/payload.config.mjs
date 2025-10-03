import path from 'path';
import { fileURLToPath } from 'url';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Роли и аксесс-helpers ----
const ROLES = ['viewer', 'editor', 'admin'];
const isAdmin = ({ req }) => req.user?.role === 'admin';
const isEditorOrAdmin = ({ req }) => ['editor', 'admin'].includes(req.user?.role);

export default buildConfig({
  // ВАЖНО: в v3 secret указывается в конфиге
  // Ref: Migration guide v2 -> v3
  secret: process.env.PAYLOAD_SECRET || 'dev-secret',

  serverURL: process.env.SERVER_URL || '',
  telemetry: false,

  admin: {
    user: 'users',
    // можно включить HMR/диагностику при локальной разработке
  },

  // ВКЛЮЧАЕМ редактор для всех richText полей
  // Ref: Rich Text Editor docs
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => defaultFeatures,
  }),

  // БД (Postgres)
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    },
  }),

  rateLimit: { window: 60 * 1000, max: 600 },

  // -------- Коллекции --------
  collections: [
    // Users
    {
      slug: 'users',
      auth: {
        useAPIKey: false,
        cookies: { sameSite: 'lax', secure: false },
      },
      admin: { useAsTitle: 'email' },
      access: {
        read: isEditorOrAdmin,
        create: isAdmin,
        update: isAdmin,
        delete: isAdmin,
      },
      fields: [
        { name: 'name', type: 'text' },
        {
          name: 'role',
          type: 'select',
          required: true,
          defaultValue: 'editor',
          options: ROLES.map((r) => ({ label: r, value: r })),
        },
      ],
    },

    // Media (локальное хранилище; S3/R2 можно подключить позже плагином)
    {
      slug: 'media',
      labels: { singular: 'Media', plural: 'Media' },
      upload: true,
      admin: { useAsTitle: 'filename' },
      access: {
        read: () => true,
        create: isEditorOrAdmin,
        update: isEditorOrAdmin,
        delete: isEditorOrAdmin,
      },
      fields: [
        { name: 'alt', type: 'text' },
        { name: 'caption', type: 'textarea' },
      ],
    },

    // Events
    {
      slug: 'events',
      labels: { singular: 'Event', plural: 'Events' },
      versions: { drafts: true, maxPerDoc: 20 },
      admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'date', 'published', 'updatedAt'],
        preview: (doc) => `${process.env.SERVER_URL || ''}/preview?type=event&id=${doc?.id}`,
      },
      access: {
        read: () => true,
        create: isEditorOrAdmin,
        update: isEditorOrAdmin,
        delete: isEditorOrAdmin,
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'date', type: 'text', admin: { description: 'YYYY-MM-DD или YYYY-MM-DD..YYYY-MM-DD' } },
        { name: 'googleFormUrl', type: 'text' },
        { name: 'summary', type: 'textarea' },
        { name: 'content', type: 'richText' },
        { name: 'published', type: 'checkbox', defaultValue: false },
        { name: 'latest', type: 'checkbox', defaultValue: false },
        { name: 'publishAt', type: 'date' },
        { name: 'cover', type: 'relationship', relationTo: 'media', admin: { description: 'Обложка из Media' } },
      ],
    },

    // News
    {
      slug: 'news',
      labels: { singular: 'News', plural: 'News' },
      versions: { drafts: true, maxPerDoc: 20 },
      admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'date', 'published', 'updatedAt'],
        preview: (doc) => `${process.env.SERVER_URL || ''}/preview?type=news&id=${doc?.id}`,
      },
      access: {
        read: () => true,
        create: isEditorOrAdmin,
        update: isEditorOrAdmin,
        delete: isEditorOrAdmin,
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'date', type: 'date' },
        { name: 'author', type: 'text' },
        { name: 'summary', type: 'textarea' },
        { name: 'content', type: 'richText' },
        { name: 'published', type: 'checkbox', defaultValue: false },
        { name: 'publishAt', type: 'date' },
        { name: 'cover', type: 'relationship', relationTo: 'media' },
      ],
    },

    // Members (current)
    {
      slug: 'members',
      labels: { singular: 'Member', plural: 'Members' },
      admin: { useAsTitle: 'name', defaultColumns: ['name', 'role', 'order'] },
      access: {
        read: () => true,
        create: isEditorOrAdmin,
        update: isEditorOrAdmin,
        delete: isEditorOrAdmin,
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'role', type: 'text' },
        { name: 'order', type: 'number', defaultValue: 0 },
        { name: 'email', type: 'text' },
        { name: 'linkedin', type: 'text' },
        { name: 'instagram', type: 'text' },
        { name: 'photo', type: 'relationship', relationTo: 'media' },
      ],
    },

    // Members Past
    {
      slug: 'membersPast',
      labels: { singular: 'Past Member', plural: 'Past Members' },
      admin: { useAsTitle: 'name' },
      access: {
        read: isEditorOrAdmin,
        create: isEditorOrAdmin,
        update: isEditorOrAdmin,
        delete: isEditorOrAdmin,
      },
      fields: [
        { name: 'originalId', type: 'text' },
        { name: 'name', type: 'text' },
        { name: 'role', type: 'text' },
        { name: 'order', type: 'number' },
        { name: 'email', type: 'text' },
        { name: 'linkedin', type: 'text' },
        { name: 'instagram', type: 'text' },
        { name: 'photo', type: 'relationship', relationTo: 'media' },
      ],
    },

    // Join submissions (hook на email остаётся как было — отдельно от встроенного email-адаптера)
    {
      slug: 'joinSubmissions',
      labels: { singular: 'Join Submission', plural: 'Join Submissions' },
      admin: { useAsTitle: 'id' },
      access: {
        read: isAdmin,
        create: () => true,
        update: isAdmin,
        delete: isAdmin,
      },
      fields: [{ name: 'payload', type: 'json', required: true }],
      hooks: {
        afterChange: [
          async ({ doc, operation }) => {
            if (operation !== 'create') return;
            try {
              const nodemailer = await import('nodemailer');
              const host = process.env.SMTP_HOST;
              const port = Number(process.env.SMTP_PORT || 587);
              const user = process.env.SMTP_USER;
              const pass = process.env.SMTP_PASS;
              const to = process.env.EMAIL_TO || 'ivsilan2005@gmail.com';
              if (!host || !user || !pass) return;

              const transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth: { user, pass },
              });

              const data = doc?.payload || {};
              const subject = data.subject || 'Join form submission';
              const rows = Object.entries(data)
                .map(
                  ([k, v]) =>
                    `<tr><td><strong>${k}</strong></td><td>${
                      typeof v === 'object' ? `<pre>${JSON.stringify(v, null, 2)}</pre>` : String(v || '')
                    }</td></tr>`,
                )
                .join('');

              await transporter.sendMail({
                from: `"Website" <${user}>`,
                to,
                subject,
                text: Object.entries(data)
                  .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                  .join('\n'),
                html: `<div style="font-family:system-ui,Segoe UI,Roboto,sans-serif"><h2>Join form submission</h2><table border="1" cellspacing="0" cellpadding="6">${rows}</table></div>`,
              });
            } catch (e) {
              console.warn('[email hook] failed:', e.message);
            }
          },
        ],
      },
    },
  ],

  // Плагины сейчас не используем (S3/R2 подключим позже совместимой версией)
  plugins: [],

  // Сервисные настройки
  typescript: { outputFile: path.resolve(__dirname, './payload-types.ts') },
  graphQL: { disable: false },
});
