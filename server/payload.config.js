// CommonJS config for CLI usage (migrations). Avoid ESM-only imports here.
const path = require('path')
const { buildConfig } = require('payload')
const { postgresAdapter } = require('@payloadcms/db-postgres')

const ROLES = ['viewer', 'editor', 'admin']
const isAdmin = ({ req }) => req && req.user && req.user.role === 'admin'
const isEditorOrAdmin = ({ req }) => {
  const role = req && req.user && req.user.role
  return role === 'editor' || role === 'admin'
}

module.exports = buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'dev-secret',
  serverURL: process.env.SERVER_URL || 'http://localhost:3000',
  telemetry: false,
  admin: { user: 'users', disable: false },

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    },
    migrationDir: path.resolve(__dirname, 'migrations'),
  }),

  rateLimit: { window: 60 * 1000, max: 600, trustProxy: true },

  collections: [
    {
      slug: 'users',
      auth: {
        useAPIKey: false,
        tokenExpiration: 7200,
        cookies: { sameSite: 'lax', secure: process.env.NODE_ENV === 'production' },
      },
      admin: { useAsTitle: 'email', defaultColumns: ['email', 'name', 'role'] },
      access: { read: isEditorOrAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
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
    {
      slug: 'media',
      labels: { singular: 'Media', plural: 'Media' },
      upload: { staticDir: path.resolve(__dirname, 'uploads'), mimeTypes: ['image/*'] },
      admin: { useAsTitle: 'filename' },
      access: { read: () => true, create: isEditorOrAdmin, update: isEditorOrAdmin, delete: isEditorOrAdmin },
      fields: [{ name: 'alt', type: 'text' }, { name: 'caption', type: 'textarea' }],
    },
    {
      slug: 'events',
      labels: { singular: 'Event', plural: 'Events' },
      versions: { drafts: true, maxPerDoc: 20 },
      admin: { useAsTitle: 'title', defaultColumns: ['title', 'date', 'published', 'updatedAt'] },
      access: { read: () => true, create: isEditorOrAdmin, update: isEditorOrAdmin, delete: isEditorOrAdmin },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'date', type: 'text', required: true },
        { name: 'googleFormUrl', type: 'text' },
        { name: 'summary', type: 'textarea' },
        { name: 'content', type: 'textarea' },
        { name: 'published', type: 'checkbox', defaultValue: false },
        { name: 'latest', type: 'checkbox', defaultValue: false },
        { name: 'publishAt', type: 'date' },
        { name: 'cover', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      slug: 'news',
      labels: { singular: 'News', plural: 'News' },
      versions: { drafts: true, maxPerDoc: 20 },
      admin: { useAsTitle: 'title', defaultColumns: ['title', 'date', 'published', 'updatedAt'] },
      access: { read: () => true, create: isEditorOrAdmin, update: isEditorOrAdmin, delete: isEditorOrAdmin },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'date', type: 'date', required: true },
        { name: 'author', type: 'text' },
        { name: 'summary', type: 'textarea' },
        { name: 'content', type: 'textarea' },
        { name: 'published', type: 'checkbox', defaultValue: false },
        { name: 'publishAt', type: 'date' },
        { name: 'cover', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      slug: 'members',
      labels: { singular: 'Member', plural: 'Members' },
      admin: { useAsTitle: 'name', defaultColumns: ['name', 'role', 'order'] },
      access: { read: () => true, create: isEditorOrAdmin, update: isEditorOrAdmin, delete: isEditorOrAdmin },
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
    {
      slug: 'membersPast',
      labels: { singular: 'Past Member', plural: 'Past Members' },
      admin: { useAsTitle: 'name' },
      access: { read: isEditorOrAdmin, create: isEditorOrAdmin, update: isEditorOrAdmin, delete: isEditorOrAdmin },
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
    {
      slug: 'joinSubmissions',
      labels: { singular: 'Join Submission', plural: 'Join Submissions' },
      admin: { useAsTitle: 'id' },
      access: { read: isAdmin, create: () => true, update: isAdmin, delete: isAdmin },
      fields: [{ name: 'payload', type: 'json', required: true }],
    },
  ],

  typescript: { outputFile: path.resolve(__dirname, './payload-types.ts') },
  graphQL: { disable: false },
})
