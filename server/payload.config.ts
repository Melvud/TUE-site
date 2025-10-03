import path from 'path';
import { fileURLToPath } from 'url';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';

// __dirname в ESM/TS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Простейшие проверки ролей (без TS-типов Payload, чтобы не ловить конфликтов)
const ROLES = ['viewer', 'editor', 'admin'] as const;
type Role = (typeof ROLES)[number];

const isAdmin = ({ req }: { req: any }) => req?.user?.role === 'admin';
const isEditorOrAdmin = ({ req }: { req: any }) =>
  (['editor', 'admin'] as Role[]).includes(req?.user?.role as Role);

export default buildConfig({
  // ВНИМАНИЕ: в проде задайте PAYLOAD_SECRET, SERVER_URL
  secret: process.env.PAYLOAD_SECRET || 'dev-secret',
  serverURL: process.env.SERVER_URL || 'http://localhost:3000',
  telemetry: false,

  admin: {
    user: 'users',
    disable: false,
  },

  // Редактор
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => defaultFeatures,
  }),

  // БД (Postgres)
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_SSL === 'true'
          ? { rejectUnauthorized: false }
          : undefined,
    },
    migrationDir: path.resolve(__dirname, 'migrations'),
  }),

  // Рейт-лимит
  rateLimit: {
    window: 60 * 1000,
    max: 600,
    trustProxy: true,
  },

  // Коллекции
  collections: [
    // Users
    {
      slug: 'users',
      auth: {
        useAPIKey: false,
        tokenExpiration: 60 * 60 * 2, // 2 часа
        cookies: {
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        },
      },
      admin: {
        useAsTitle: 'email',
        defaultColumns: ['email', 'name', 'role'],
      },
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
          options: ROLES.map((r) => ({ label: r, value: r })),
        },
      ],
    },

    // Media
    {
      slug: 'media',
      labels: { singular: 'Media', plural: 'Media' },
      upload: {
        staticDir: path.resolve(__dirname, 'uploads'),
        mimeTypes: ['image/*'],
      },
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
      },
      access: {
        read: () => true,
        create: isEditorOrAdmin,
        update: isEditorOrAdmin,
        delete: isEditorOrAdmin,
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        // В исходном проекте дата события — строка
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

    // News
    {
      slug: 'news',
      labels: { singular: 'News', plural: 'News' },
      versions: { drafts: true, maxPerDoc: 20 },
      admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'date', 'published', 'updatedAt'],
      },
      access: {
        read: () => true,
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

    // Members
    {
      slug: 'members',
      labels: { singular: 'Member', plural: 'Members' },
      admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'role', 'order'],
      },
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
        { name: 'email', type: 'email' },
        { name: 'linkedin', type: 'text' },
        { name: 'instagram', type: 'text' },
        { name: 'photo', type: 'upload', relationTo: 'media' },
      ],
    },

    // MembersPast
    {
      slug: 'membersPast',
      labels: { singular: 'Past Member', plural: 'Past Members' },
      admin: { useAsTitle: 'name' },
      access: {
        // В исходнике доступ к прошлым участникам — только редакторы/админы
        read: isEditorOrAdmin,
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

    // Join submissions (отправка письма)
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
              // динамический импорт, чтобы не тянуть модуль без надобности
              const nodemailer = await import('nodemailer');
              const host = process.env.SMTP_HOST;
              const port = Number(process.env.SMTP_PORT || 587);
              const user = process.env.SMTP_USER;
              const pass = process.env.SMTP_PASS;
              const to = process.env.EMAIL_TO || 'ivsilan2005@gmail.com';

              if (!host || !user || !pass) {
                console.warn('📧 SMTP not configured');
                return;
              }

              const transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth: { user, pass },
              } as any);

              const data = (doc as any)?.payload || {};
              const rows = Object.entries(data)
                .map(
                  ([k, v]) =>
                    `<tr><td><strong>${k}</strong></td><td>${
                      typeof v === 'object'
                        ? `<pre>${JSON.stringify(v, null, 2)}</pre>`
                        : String(v ?? '')
                    }</td></tr>`,
                )
                .join('');

              await transporter.sendMail({
                from: `"PhE Website" <${user}>`,
                to,
                subject: (data as any).subject || 'Join form',
                html: `
                  <div style="font-family:system-ui,sans-serif">
                    <h2>Join Form Submission</h2>
                    <table border="1" cellspacing="0" cellpadding="6">
                      ${rows}
                    </table>
                  </div>
                `,
              });

              console.log('📧 Email sent');
            } catch (e: any) {
              console.error('📧 Email failed:', e?.message || e);
            }
          },
        ],
      },
    },
  ],

  // Плагины (если появятся — добавите сюда)
  plugins: [],

  // Генерация типов (удобно в локалке)
  typescript: {
    outputFile: path.resolve(__dirname, './payload-types.ts'),
  },

  graphQL: { disable: false },
});
