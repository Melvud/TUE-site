import type { GlobalConfig } from 'payload'

export const About: GlobalConfig = {
  slug: 'about',
  admin: {
    livePreview: {
      url: () => `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/about?preview=true`,
    },
  },
  fields: [
    {
      name: 'sections',
      type: 'array',
      required: true,
      fields: [
        {
          name: 'layout',
          type: 'select',
          required: true,
          options: [
            { label: 'Text → Image', value: 'text-image' },
            { label: 'Image → Text', value: 'image-text' },
          ],
          defaultValue: 'text-image',
        },
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'text',
          type: 'richText',
          required: true,
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
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