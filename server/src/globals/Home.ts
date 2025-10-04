import type { GlobalConfig } from 'payload'

export const Home: GlobalConfig = {
  slug: 'home',
  admin: {
    livePreview: {
      url: () => `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}?preview=true`,
    },
  },
  fields: [
    {
      name: 'hero',
      type: 'group',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: false, // ← Изменили с true на false
          admin: {
            description: 'Hero background image',
          },
        },
      ],
    },
    {
      name: 'typedPhrases',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
        },
      ],
      admin: {
        description: 'Rotating phrases in hero section',
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