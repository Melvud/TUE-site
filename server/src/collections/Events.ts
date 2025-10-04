import type { CollectionConfig } from 'payload'
import { lexicalEditor, UploadFeature } from '@payloadcms/richtext-lexical'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Event', plural: 'Events' },
  admin: {
    useAsTitle: 'title',
    livePreview: {
      url: () => `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}?preview=true`,
    },
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
        pickerAppearance: 'dayOnly',
        displayFormat: 'yyyy-MM-dd',
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
      relationTo: 'media',
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
          admin: {
            description: '⭐ Featured event on Events page (only one can be Latest)',
          },
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
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Если устанавливается latest: true
        if (data.latest === true) {
          // Снимаем latest со всех остальных событий
          try {
            const allEvents = await req.payload.find({
              collection: 'events',
              where: {
                latest: { equals: true },
              },
              limit: 1000,
            })

            // Обновляем все события, кроме текущего
            for (const event of allEvents.docs) {
              if (operation === 'update' && event.id === data.id) {
                // Пропускаем текущее событие при update
                continue
              }
              if (operation === 'create') {
                // При создании снимаем latest со всех
                await req.payload.update({
                  collection: 'events',
                  id: event.id,
                  data: {
                    latest: false,
                  },
                })
              } else if (event.id !== data.id) {
                // При обновлении снимаем latest со всех, кроме текущего
                await req.payload.update({
                  collection: 'events',
                  id: event.id,
                  data: {
                    latest: false,
                  },
                })
              }
            }

            console.log('✅ Latest flag updated - only one event is now Latest')
          } catch (error) {
            console.error('Failed to update latest flags:', error)
          }
        }

        return data
      },
    ],
  },
}