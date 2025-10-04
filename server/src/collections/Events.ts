import type { CollectionConfig } from 'payload'
import { lexicalEditor, UploadFeature } from '@payloadcms/richtext-lexical'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Event', plural: 'Events' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'latest', 'published'],
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
      admin: { placeholder: 'e.g. photonics-day-2026' },
    },
    {
      name: 'date',
      label: 'Date',
      type: 'date',
      required: true,
      admin: { date: {
        pickerAppearance: 'dayOnly', // календарь без времени
        displayFormat: 'yyyy-MM-dd', // как видеть в админке
      }},
    },
    {
      name: 'summary',
      label: 'Summary',
      type: 'textarea',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
    },
    {
      name: 'googleFormUrl',
      label: 'Google Form URL',
      type: 'text',
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
          name: 'latest',
          label: 'Latest',
          type: 'checkbox',
          defaultValue: false,
        },
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
