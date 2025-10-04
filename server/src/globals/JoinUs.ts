// src/globals/JoinUs.ts
import type { GlobalConfig } from 'payload'
import { lexicalEditor, UploadFeature } from '@payloadcms/richtext-lexical'

export const JoinUs: GlobalConfig = {
  slug: 'join',            // URL в админке: /admin/globals/join
  access: { read: () => true },
  admin: { group: 'Site', 
    livePreview: {
    url: () => `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}?preview=true`,
  }},
  fields: [
    {
      name: 'content',
      label: 'Content',
      type: 'richText',
      required: false,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          UploadFeature({
            collections: {
              // поменяй 'media', если у тебя другой slug коллекции медиа
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
                  { name: 'alt', label: 'Alt text', type: 'text' },
                  { name: 'caption', label: 'Caption', type: 'text' },
                ],
              },
            },
          }),
        ],
      }),
    },

    // Если используешь форму на странице — оставляем конфиг полей формы
    {
      name: 'formFields',
      label: 'Form Fields',
      type: 'array',
      required: false,
      labels: { singular: 'Field', plural: 'Fields' },
      fields: [
        { name: 'name', label: 'Name (key)', type: 'text', required: true },
        { name: 'label', label: 'Label', type: 'text', required: true },
        {
          name: 'type',
          label: 'Type',
          type: 'select',
          required: true,
          defaultValue: 'text',
          options: [
            { label: 'Text', value: 'text' },
            { label: 'Email', value: 'email' },
            { label: 'Textarea', value: 'textarea' },
            { label: 'Select', value: 'select' },
          ],
        },
        { name: 'placeholder', label: 'Placeholder', type: 'text' },
        { name: 'required', label: 'Required', type: 'checkbox', defaultValue: false },
        {
          name: 'options',
          label: 'Options (for Select)',
          type: 'array',
          fields: [{ name: 'value', label: 'Value', type: 'text', required: true }],
          admin: { condition: (_data, sibling) => sibling?.type === 'select' },
        },
      ],
    },
  ],
}
