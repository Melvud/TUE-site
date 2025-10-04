import type { GlobalConfig } from 'payload'
import { lexicalEditor, UploadFeature } from '@payloadcms/richtext-lexical'

export const Contact: GlobalConfig = {
  slug: 'contact',
  access: { read: () => true },
  admin: {
    group: 'Site',
    livePreview: {
      url: () => `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/contact?preview=true`,
    },
  },
  fields: [
    {
      name: 'title',
      label: 'Page Title',
      type: 'text',
      required: true,
      defaultValue: 'Contact Us',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'text',
      defaultValue: 'We usually reply within 1–2 days.',
      admin: {
        description: 'Text shown below the title',
      },
    },
    {
      name: 'socialLinks',
      label: 'Social Media Links',
      type: 'group',
      fields: [
        {
          name: 'linkedin',
          label: 'LinkedIn URL',
          type: 'text',
          admin: {
            placeholder: 'https://www.linkedin.com/company/...',
          },
        },
        {
          name: 'instagram',
          label: 'Instagram URL',
          type: 'text',
          admin: {
            placeholder: 'https://www.instagram.com/...',
          },
        },
      ],
    },
    {
      name: 'content',
      label: 'Additional Content',
      type: 'richText',
      required: false,
      admin: {
        description: 'Optional content displayed above the form',
      },
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
                  { name: 'alt', label: 'Alt text', type: 'text' },
                  { name: 'caption', label: 'Caption', type: 'text' },
                ],
              },
            },
          }),
        ],
      }),
    },
    {
      name: 'formFields',
      label: 'Form Fields',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Field', plural: 'Fields' },
      defaultValue: [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'message', label: 'Message', type: 'textarea', required: true, rows: 6 },
      ],
      fields: [
        { 
          name: 'name', 
          label: 'Field Name (key)', 
          type: 'text', 
          required: true,
          admin: {
            description: 'Internal name (e.g., "name", "email", "phone")',
          },
        },
        { 
          name: 'label', 
          label: 'Field Label', 
          type: 'text', 
          required: true,
          admin: {
            description: 'Visible label for the user',
          },
        },
        {
          name: 'type',
          label: 'Field Type',
          type: 'select',
          required: true,
          defaultValue: 'text',
          options: [
            { label: 'Text', value: 'text' },
            { label: 'Email', value: 'email' },
            { label: 'Phone', value: 'tel' },
            { label: 'Number', value: 'number' },
            { label: 'Textarea', value: 'textarea' },
            { label: 'Select', value: 'select' },
            { label: 'Checkbox', value: 'checkbox' },
          ],
        },
        { 
          name: 'placeholder', 
          label: 'Placeholder', 
          type: 'text',
          admin: {
            condition: (data, siblingData) => 
              siblingData?.type !== 'checkbox' && siblingData?.type !== 'select',
          },
        },
        { 
          name: 'required', 
          label: 'Required', 
          type: 'checkbox', 
          defaultValue: false 
        },
        {
          name: 'rows',
          label: 'Rows (for textarea)',
          type: 'number',
          defaultValue: 4,
          admin: {
            condition: (data, siblingData) => siblingData?.type === 'textarea',
          },
        },
        {
          name: 'options',
          label: 'Options (for Select)',
          type: 'array',
          fields: [
            { name: 'label', label: 'Label', type: 'text', required: true },
            { name: 'value', label: 'Value', type: 'text', required: true },
          ],
          admin: {
            condition: (data, siblingData) => siblingData?.type === 'select',
          },
        },
      ],
    },
    {
      name: 'submitButtonText',
      label: 'Submit Button Text',
      type: 'text',
      defaultValue: 'Send message',
    },
    {
      name: 'successMessage',
      label: 'Success Message',
      type: 'text',
      defaultValue: 'Message sent!',
    },
  ],
}