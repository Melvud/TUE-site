import type { CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'published', 'updatedAt'],
    livePreview: {
      url: ({ data }) => {
        if (data?.slug) {
          return `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/events/${data.slug}?preview=true`
        }
        return '' // ← Вернуть пустую строку вместо undefined
      },
    },
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true
      return {
        published: { equals: true },
      }
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'date',
      type: 'text',
      required: true,
      admin: {
        description: 'Single date (YYYY-MM-DD) or range (YYYY-MM-DD..YYYY-MM-DD)',
      },
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'summary',
      type: 'textarea',
      admin: {
        description: 'Brief description shown on cards',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'googleFormUrl',
      type: 'text',
      admin: {
        description: 'Registration link',
      },
    },
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'latest',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Mark as featured/next event',
      },
    },
    {
      name: 'publishAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'Schedule publication',
      },
    },
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 375,
      },
    },
  },
}