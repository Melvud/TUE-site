import type { CollectionConfig } from 'payload'
import { lexicalEditor, UploadFeature } from '@payloadcms/richtext-lexical'

export const News: CollectionConfig = {
  slug: 'news',
  labels: { singular: 'News', plural: 'News' },
  admin: {
    useAsTitle: 'title',
    livePreview: {
        url: () => `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}?preview=true`,
      },
    defaultColumns: ['title', 'date', 'published'],
  },
  access: {
    read: () => true, // public
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { placeholder: 'e.g. first-article' },
    },
    {
      name: 'date',
      label: 'Date',
      type: 'date',
      admin: { date: {
        pickerAppearance: 'dayOnly', // календарь без времени
        displayFormat: 'yyyy-MM-dd', // как видеть в админке
      } },
    },
    {
      name: 'summary',
      label: 'Summary',
      type: 'textarea',
    },
    {
      name: 'cover',
      label: 'Cover',
      type: 'upload',
      relationTo: 'media', // <-- change if your media collection slug differs
    },
    {
      name: 'content',
      label: 'Content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          UploadFeature({
            // extra fields for inline images inside the editor
            collections: {
              media: {
                fields: [
                  {
                    name: 'align',
                    label: 'Alignment',
                    type: 'select',
                    defaultValue: 'center',
                    options: [
                      { label: 'Left', value: 'left' },
                      { label: 'Center', value: 'center' },
                      { label: 'Right', value: 'right' },
                    ],
                  },
                  {
                    name: 'width',
                    label: 'Width (%)',
                    type: 'select',
                    defaultValue: '100',
                    options: [
                      { label: '25%', value: '25' },
                      { label: '50%', value: '50' },
                      { label: '75%', value: '75' },
                      { label: '100%', value: '100' },
                    ],
                  },
                  {
                    name: 'alt',
                    label: 'Alt text',
                    type: 'text',
                  },
                  {
                    name: 'caption',
                    label: 'Caption',
                    type: 'text',
                    admin: { placeholder: 'Optional caption' },
                  },
                ],
              },
            },
          }),
        ],
      }),
    },
    {
      type: 'row',
      fields: [
        {
          name: 'published',
          label: 'Published',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'publishAt',
          label: 'Publish At',
          type: 'date',
          admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
        },
      ],
    },
  ],
}
