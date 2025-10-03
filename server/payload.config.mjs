// server/payload.config.mjs
import path from 'path';
import { fileURLToPath } from 'url';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROLES = ['viewer', 'editor', 'admin'];
const isAdmin = ({ req }) => req?.user?.role === 'admin';
const isEditorOrAdmin = ({ req }) =>
  req?.user?.role === 'editor' || req?.user?.role === 'admin';

const APP_URL = process.env.SERVER_URL || 'http://localhost:3000';

export default buildConfig({
  // ===== Database (PostgreSQL on Neon) =====
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : undefined,
    },
    migrationDir: path.resolve(__dirname, 'migrations'),
  }),

  // ===== Admin panel settings =====
  admin: {
    user: 'users',            // Коллекция для auth
    importMap: { baseDir: path.resolve(__dirname) } 
    // importMap нужен для корректной сборки Payload + Next
  },

  // ===== Security settings =====
  // ВАЖНО: csrf должен быть массивом; пустой массив корректен и не ломает билд.
  csrf: [],  // Отключаем CSRF-защиту (можно оставить пустой массив для сборки)
  cors: {
    origins: [APP_URL],
    credentials: true,
  },
  cookiePrefix: 'p_',  
  serverURL: APP_URL,
  secret: process.env.PAYLOAD_SECRET || 'dev-secret',
  telemetry: false,

  // ===== Rich Text Editor (Lexical) =====
  editor: lexicalEditor(),  // подключаем редактор Lexical для richText полей

  // ===== Rate limiting (защита от брута) =====
  rateLimit: { window: 60_000, max: 600, trustProxy: true },

  // ===== Collections =====
  collections: [
    // Users collection (for admin/auth)
    {
      slug: 'users',
      auth: {
        useAPIKey: false,
        tokenExpiration: 60 * 60 * 2, // 2 hours
        cookies: {
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        },
      },
      admin: { useAsTitle: 'email', defaultColumns: ['email', 'name', 'role'] },
      access: {
        read: isEditorOrAdmin,   // редакторы и админы могут просматривать пользователей
        create: isAdmin,         // создавать/редактировать/удалять пользователей – только админ
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
          options: ROLES.map(r => ({ label: r, value: r })),  // viewer/editor/admin
        },
        // Поля email и password добавляются автоматически Payload при auth: true
      ],
    },

    // Media collection (for file uploads)
    {
      slug: 'media',
      labels: { singular: 'Media', plural: 'Media' },
      upload: {
        staticDir: path.resolve(__dirname, 'uploads'), // локальное хранилище файлов
        mimeTypes: ['image/*'],
      },
      admin: { useAsTitle: 'filename' },
      access: {
        read: () => true,           // разрешаем читать всем (публичные файлы)
        create: isEditorOrAdmin,    // загрузка и изменения – редактор или админ
        update: isEditorOrAdmin,
        delete: isEditorOrAdmin,
      },
      fields: [
        { name: 'alt', type: 'text' },      // альтернативный текст изображения
        { name: 'caption', type: 'textarea' } // подпись
      ],
    },

    // Events collection (мероприятия)
    {
      slug: 'events',
      labels: { singular: 'Event', plural: 'Events' },
      versions: { drafts: true, maxPerDoc: 20 },  // включаем версии/черновики
      admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'date', 'published', 'updatedAt'],
      },
      access: {
        read: () => true,           // публично доступно (только опубликованные на сайте фильтруются на фронте)
        create: isEditorOrAdmin, 
        update: isEditorOrAdmin,
        delete: isEditorOrAdmin,
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'date', type: 'text', required: true },     // можно хранить дату как текст или date
        { name: 'googleFormUrl', type: 'text' },            // ссылка на гугл-форму регистрации (опционально)
        { name: 'summary', type: 'textarea' },              // краткое описание
        { name: 'content', type: 'richText' },              // основное описание (Rich Text с Lexical)
        { name: 'published', type: 'checkbox', defaultValue: false }, // флаг опубликованности
        { name: 'latest', type: 'checkbox', defaultValue: false },    // флаг "последнее событие" (например, для выделения)
        { name: 'publishAt', type: 'date' },                // отложенная публикация (не используется, но на будущее)
        { name: 'cover', type: 'upload', relationTo: 'media' } // обложка (из Media коллекции)
      ],
    },

    // News collection (новости)
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
        { name: 'author', type: 'text' },      // автор новости (опционально)
        { name: 'summary', type: 'textarea' }, // краткое описание/анонс
        { name: 'content', type: 'richText' }, // полный текст новости (Rich Text)
        { name: 'published', type: 'checkbox', defaultValue: false },
        { name: 'publishAt', type: 'date' },
        { name: 'cover', type: 'upload', relationTo: 'media' }
      ],
    },

    // Members collection (текущие участники команды)
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
        { name: 'role', type: 'text' },    // должность/роль в команде
        { name: 'order', type: 'number', defaultValue: 0 }, // порядок сортировки на сайте
        { name: 'email', type: 'email' },
        { name: 'linkedin', type: 'text' },
        { name: 'instagram', type: 'text' },
        { name: 'photo', type: 'upload', relationTo: 'media' } // фото участника
      ],
    },

    // Past Members collection (бывшие участники)
    {
      slug: 'membersPast',
      labels: { singular: 'Past Member', plural: 'Past Members' },
      admin: { useAsTitle: 'name' },
      access: {
        read: () => true,
        create: isEditorOrAdmin,
        update: isEditorOrAdmin,
        delete: isEditorOrAdmin,
      },
      fields: [
        { name: 'originalId', type: 'text' }, // может хранить связку с 'members' (ID оттуда)
        { name: 'name', type: 'text', required: true },
        { name: 'role', type: 'text' },
        { name: 'order', type: 'number' },
        { name: 'email', type: 'email' },
        { name: 'linkedin', type: 'text' },
        { name: 'instagram', type: 'text' },
        { name: 'photo', type: 'upload', relationTo: 'media' }
      ],
    },

    // Join Submissions collection (заявки с формы "Join Us")
    {
      slug: 'joinSubmissions',
      labels: { singular: 'Join Submission', plural: 'Join Submissions' },
      admin: { useAsTitle: 'id' },
      access: {
        read: isAdmin,      // просмотр заявок — только админ
        create: () => true, // публичная API будет использовать create для записи заявок
        update: isAdmin,
        delete: isAdmin,
      },
      fields: [
        { name: 'payload', type: 'json', required: true } // храним всё содержимое формы как JSON
      ],
      hooks: {
        afterChange: [
          async ({ doc, operation }) => {
            // После создания записи отправляем уведомление на email
            if (operation !== 'create') return;
            try {
              const nm = await import('nodemailer');
              const nodemailer = nm.default || nm;
              const host = process.env.SMTP_HOST;
              const port = Number(process.env.SMTP_PORT || 587);
              const user = process.env.SMTP_USER;
              const pass = process.env.SMTP_PASS;
              const to = process.env.EMAIL_TO || 'admin@example.com';
              if (!host || !user || !pass) {
                console.warn('📧 SMTP not configured');
                return;
              }
              const transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth: { user, pass },
              });
              const data = doc?.payload || {};
              // Формируем таблицу из полей формы
              const rows = Object.entries(data)
                .map(([k, v]) =>
                  `<tr><td><strong>${k}</strong></td><td>${
                    typeof v === 'object'
                      ? `<pre>${JSON.stringify(v, null, 2)}</pre>`
                      : String(v ?? '')
                  }</td></tr>`
                )
                .join('');
              await transporter.sendMail({
                from: `"PhE Website" <${user}>`,
                to,
                subject: data?.subject || 'Join form',
                html: `<div style="font-family:system-ui,sans-serif">
                        <h2>Join Form Submission</h2>
                        <table border="1" cellspacing="0" cellpadding="6">${rows}</table>
                       </div>`,
              });
              console.log('📧 Email sent');
            } catch (e) {
              console.error('📧 Email failed:', e?.message || e);
            }
          },
        ],
      },
    },
  ],

  // ===== API Settings =====
  graphQL: { disable: false }, // включаем GraphQL API
  typescript: { outputFile: path.resolve(__dirname, './payload-types.ts') }, // генерируем типы (опционально)
});
