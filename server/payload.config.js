const path = require('path');
const { postgresAdapter } = require('@payloadcms/db-postgres');
const { cloudStorage } = require('@payloadcms/plugin-cloud-storage');
const { S3Client } = require('@aws-sdk/client-s3');

// ==== S3 / R2 client ====
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT || undefined, // для Cloudflare R2 задайте https://<accountid>.r2.cloudflarestorage.com
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  credentials: process.env.S3_ACCESS_KEY_ID && process.envS3_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  } : undefined,
});

// ==== Roles ====
const ROLES = ['viewer', 'editor', 'admin'];

const isAdmin = ({ req }) => req.user?.role === 'admin';
const isEditorOrAdmin = ({ req }) => ['editor', 'admin'].includes(req.user?.role);

// ==== RichText common config (в Payload 3 richText внутри fields.type='richText') ====
// (payload админ сам включает тулбар, вставку ссылок, изображений через коллекцию media)

module.exports = {
  serverURL: process.env.SERVER_URL || '',
  admin: {
    user: 'users',
    // Включим предпросмотр: появится кнопка "Preview" в админке
    // Preview URL генерируем для коллекций Events/News и глобалов
    components: {},
  },

  rateLimit: { window: 60 * 1000, max: 600 },

  telemetry: false,

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
      // Render: обязательно включите SSL, если требуется
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    },
  }),

  collections: [
    // ===== Users (Auth) =====
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

    // ===== Media (upload to S3/R2) =====
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
      hooks: {},
    },

    // ===== Events =====
    {
      slug: 'events',
      labels: { singular: 'Event', plural: 'Events' },
      admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'date', 'published', 'updatedAt'],
        preview: (doc) => {
          const id = doc?.id;
          return `${process.env.SERVER_URL || ''}/preview?type=event&id=${id}`;
        },
      },
      access: {
        read: () => true,
        create: isEditorOrAdmin,
        update: isEditorOrAdmin,
        delete: isEditorOrAdmin,
      },
      versions: { drafts: true, maxPerDoc: 20 },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'date', type: 'text', admin: { description: 'YYYY-MM-DD или диапазон YYYY-MM-DD..YYYY-MM-DD' } },
        {
          name: 'cover',
          type: 'relationship',
          relationTo: 'media',
          admin: { description: 'Обложка (из коллекции Media)' },
        },
        { name: 'googleFormUrl', type: 'text' },
        { name: 'summary', type: 'textarea' },
        { name: 'content', type: 'richText' },
        { name: 'published', type: 'checkbox', defaultValue: false },
        { name: 'latest', type: 'checkbox', defaultValue: false },
        { name: 'publishAt', type: 'date' },
      ],
    },

    // ===== News =====
    {
      slug: 'news',
      labels: { singular: 'News', plural: 'News' },
      admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'date', 'published', 'updatedAt'],
        preview: (doc) => {
          const id = doc?.id;
          return `${process.env.SERVER_URL || ''}/preview?type=news&id=${id}`;
        },
      },
      access: {
        read: () => true,
        create: isEditorOrAdmin,
        update: isEditorOrAdmin,
        delete: isEditorOrAdmin,
      },
      versions: { drafts: true, maxPerDoc: 20 },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'date', type: 'date' },
        { name: 'author', type: 'text' },
        {
          name: 'cover',
          type: 'relationship',
          relationTo: 'media',
        },
        { name: 'summary', type: 'textarea' },
        { name: 'content', type: 'richText' },
        { name: 'published', type: 'checkbox', defaultValue: false },
        { name: 'publishAt', type: 'date' },
      ],
    },

    // ===== Members (current) =====
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
        {
          name: 'photo',
          type: 'relationship',
          relationTo: 'media',
        },
        { name: 'email', type: 'text' },
        { name: 'linkedin', type: 'text' },
        { name: 'instagram', type: 'text' },
      ],
    },

    // ===== Members Past (archive) =====
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
        {
          name: 'photo',
          type: 'relationship',
          relationTo: 'media',
        },
        { name: 'email', type: 'text' },
        { name: 'linkedin', type: 'text' },
        { name: 'instagram', type: 'text' },
        { name: 'order', type: 'number' },
      ],
    },

    // ===== Join submissions (формы) + email-hook =====
    {
      slug: 'joinSubmissions',
      labels: { singular: 'Join Submission', plural: 'Join Submissions' },
      admin: { useAsTitle: 'id' },
      access: {
        read: isAdmin, // submissions — только для админов
        create: () => true,
        update: isAdmin,
        delete: isAdmin,
      },
      fields: [
        { name: 'payload', type: 'json', required: true },
      ],
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
                .map(([k, v]) => `<tr><td><strong>${k}</strong></td><td>${typeof v === 'object' ? `<pre>${JSON.stringify(v, null, 2)}</pre>` : String(v || '')}</td></tr>`)
                .join('');

              await transporter.sendMail({
                from: `"Website" <${user}>`,
                to,
                subject,
                text: Object.entries(data).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n'),
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

  // ===== Globals =====
  globals: [
    // Home
    {
      slug: 'home',
      label: 'Home',
      versions: { drafts: true, max: 20 },
      admin: {
        preview: () => `${process.env.SERVER_URL || ''}/preview?type=home`,
      },
      access: {
        read: () => true,
        update: isEditorOrAdmin,
      },
      fields: [
        {
          name: 'typedPhrases',
          type: 'array',
          label: 'Ticker / Typed phrases',
          labels: { singular: 'Phrase', plural: 'Phrases' },
          fields: [{ name: 'value', type: 'text', required: true }],
        },
        {
          name: 'hero',
          type: 'group',
          fields: [
            { name: 'title', type: 'text' },
            { name: 'subtitle', type: 'text' },
            { name: 'ctaText', type: 'text' },
            { name: 'ctaUrl', type: 'text' },
            { name: 'image', type: 'relationship', relationTo: 'media' },
          ],
        },
      ],
      hooks: {
        afterRead: [
          ({ data }) => {
            // для удобства фронта можно разворачивать typedPhrases в string[]
            if (Array.isArray(data.typedPhrases)) {
              data.typedPhrases = data.typedPhrases.map((x) => x?.value || '');
            }
            return data;
          },
        ],
        beforeChange: [
          ({ data }) => {
            // принимаем typedPhrases как string[]
            if (Array.isArray(data.typedPhrases) && typeof data.typedPhrases[0] === 'string') {
              data.typedPhrases = data.typedPhrases.map((s) => ({ value: s }));
            }
            return data;
          },
        ],
      },
    },

    // About (блоки: text-image / image-text / text / image)
    {
      slug: 'about',
      label: 'About',
      versions: { drafts: true, max: 20 },
      admin: {
        preview: () => `${process.env.SERVER_URL || ''}/preview?type=about`,
      },
      access: { read: () => true, update: isEditorOrAdmin },
      fields: [
        {
          name: 'sections',
          type: 'array',
          label: 'Sections',
          fields: [
            { name: 'id', type: 'text' },
            {
              name: 'layout',
              type: 'select',
              options: [
                { label: 'text-image', value: 'text-image' },
                { label: 'image-text', value: 'image-text' },
                { label: 'text only', value: 'text' },
                { label: 'image only', value: 'image' },
              ],
              defaultValue: 'text-image',
              required: true,
            },
            { name: 'title', type: 'text' },
            { name: 'text', type: 'richText' },
            { name: 'image', type: 'relationship', relationTo: 'media' },
          ],
        },
      ],
    },

    // Join (rich text + динамическая форма)
    {
      slug: 'join',
      label: 'Join Us',
      versions: { drafts: true, max: 20 },
      admin: {
        preview: () => `${process.env.SERVER_URL || ''}/preview?type=join`,
      },
      access: { read: () => true, update: isEditorOrAdmin },
      fields: [
        { name: 'introText', type: 'richText', label: 'Intro (HTML)' },
        { name: 'detailsHtml', type: 'richText', label: 'Details (HTML)' },
        {
          name: 'formFields',
          type: 'array',
          label: 'Form Builder',
          fields: [
            { name: 'id', type: 'text' },
            { name: 'name', type: 'text', required: true },
            { name: 'label', type: 'text', required: true },
            {
              name: 'type',
              type: 'select',
              options: ['text', 'email', 'textarea', 'select', 'checkbox'],
              defaultValue: 'text',
            },
            { name: 'required', type: 'checkbox', defaultValue: false },
            { name: 'placeholder', type: 'text' },
            {
              name: 'options',
              type: 'array',
              admin: { condition: (_, sibling) => sibling?.type === 'select' },
              fields: [{ name: 'value', type: 'text' }],
            },
          ],
        },
      ],
      hooks: {
        afterRead: [
          ({ data }) => {
            if (Array.isArray(data.formFields)) {
              data.formFields = data.formFields.map((f) => ({
                ...f,
                options: Array.isArray(f.options) ? f.options.map((o) => o.value) : undefined,
              }));
            }
            return data;
          },
        ],
        beforeChange: [
          ({ data }) => {
            if (Array.isArray(data.formFields)) {
              data.formFields = data.formFields.map((f) => ({
                ...f,
                options: Array.isArray(f.options) ? f.options.map((v) => ({ value: v })) : undefined,
              }));
            }
            return data;
          },
        ],
      },
    },
  ],

  // Подключаем облачное хранилище для media
  plugins: [
    cloudStorage({
      collections: {
        media: {
          adapter: 's3',
          s3: {
            bucket: process.env.S3_BUCKET,
            prefix: process.env.S3_PREFIX || 'uploads',
            client: s3Client,
            acl: 'public-read',
          },
        },
      },
      enabled: Boolean(process.env.S3_BUCKET),
    }),
  ],

  typescript: { outputFile: path.resolve(__dirname, './payload-types.ts') },
  graphQL: { disable: false },
};
