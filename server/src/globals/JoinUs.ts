import type { GlobalConfig } from 'payload'

export const JoinUs: GlobalConfig = {
  slug: 'join',
  admin: {
    livePreview: {
      url: () => `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/join?preview=true`,
    },
  },
  fields: [
    {
      name: 'introText',
      type: 'richText',
      required: true,
      admin: {
        description: 'Introduction shown above the form',
      },
    },
    {
      name: 'detailsHtml',
      type: 'richText',
      required: true,
      admin: {
        description: 'Detailed membership information (tiers, benefits, etc.)',
      },
    },
    {
      name: 'formFields',
      type: 'array',
      required: true,
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          admin: {
            description: 'Field name (used in form data)',
          },
        },
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          options: [
            { label: 'Text', value: 'text' },
            { label: 'Email', value: 'email' },
            { label: 'Textarea', value: 'textarea' },
            { label: 'Select', value: 'select' },
          ],
        },
        {
          name: 'required',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'placeholder',
          type: 'text',
        },
        {
          name: 'options',
          type: 'array',
          admin: {
            condition: (data, siblingData) => siblingData?.type === 'select',
          },
          fields: [
            {
              name: 'value',
              type: 'text',
              required: true,
            },
          ],
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