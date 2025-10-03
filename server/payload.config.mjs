import path from 'path';
import { fileURLToPath } from 'url';
import { postgresAdapter } from '@payloadcms/db-postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==== Роли ====
const ROLES = ['viewer', 'editor', 'admin'];
const isAdmin = ({ req }) => req.user?.role === 'admin';
const isEditorOrAdmin = ({ req }) => ['editor', 'admin'].includes(req.user?.role);

// === Конфиг Payload ===
export default {
  // ВАЖНО: секрет прямо в конфиге (v3 так требует)
  secret: process.env.PAYLOAD_SECRET || 'dev-secret',

  serverURL: process.env.SERVER_URL || '',
  admin: { user: 'users' },
  telemetry: false,
  rateLimit: { window: 60 * 1000, max: 600 },

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    },
  }),

  collections: [
    // ===== Users =====
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

    // ===== Media (локальные upload; без S3-плагина) =====
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

    // ===== Events =====
    {
      slug: 'events',
      labels: { singular: 'Event', plural: 'Events' },
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
      versions: { drafts: true, maxPerDoc: 20 },
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

    // ===== News =====
    {
      slug: 'news',
      labels: { singular: 'News', plural: 'News' },
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
      versions: { drafts: true, maxPerDoc: 20 },
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

    // ===== Members (current) =====
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

    // ===== Members Past =====
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

    // ===== Join submissions (формы) + email-хук =====
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
                host, port, secure: port === 465, auth: { user, pass },
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
    {
      slug: 'home',
      label: 'Home',
      versions: { drafts: true, max: 20 },
      admin: { preview: () => `${process.env.SERVER_URL || ''}/preview?type=home` },
      access: { read: () => true, update: isEditorOrAdmin },
      fields: [
        {
          name: 'typedPhrases',
          type: 'array',
          label: 'Ticker / Typed phrases',
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
            if (Array.isArray(data.typedPhrases)) {
              data.typedPhrases = data.typedPhrases.map((x) => x?.value || '');
            }
            return data;
          },
        ],
        beforeChange: [
          ({ data }) => {
            if (Array.isArray(data.typedPhrases) && typeof data.typedPhrases[0] === 'string') {
              data.typedPhrases = data.typedPhrases.map((s) => ({ value: s }));
            }
            return data;
          },
        ],
      },
    },
    {
      slug: 'about',
      label: 'About',
      versions: { drafts: true, max: 20 },
      admin: { preview: () => `${process.env.SERVER_URL || ''}/preview?type=about` },
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
    {
      slug: 'join',
      label: 'Join Us',
      versions: { drafts: true, max: 20 },
      admin: { preview: () => `${process.env.SERVER_URL || ''}/preview?type=join` },
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

  plugins: [],

  typescript: { outputFile: path.resolve(__dirname, './payload-types.ts') },
  graphQL: { disable: false },
};
