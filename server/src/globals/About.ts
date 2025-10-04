import type { GlobalConfig, Block } from 'payload'
import {
  lexicalEditor,
  BlocksFeature,
  FixedToolbarFeature,
  EXPERIMENTAL_TableFeature,
} from '@payloadcms/richtext-lexical'

const CodeBlock: Block = {
  slug: 'codeBlock',
  labels: { singular: 'Code Block', plural: 'Code Blocks' },
  fields: [
    {
      name: 'language',
      label: 'Language',
      type: 'select',
      defaultValue: 'plaintext',
      options: [
        { label: 'Plain text', value: 'plaintext' },
        { label: 'JavaScript', value: 'js' },
        { label: 'TypeScript', value: 'ts' },
        { label: 'TSX', value: 'tsx' },
        { label: 'JSON', value: 'json' },
        { label: 'HTML', value: 'html' },
        { label: 'CSS', value: 'css' },
        { label: 'Markdown', value: 'md' },
      ],
    },
    {
      name: 'code',
      label: 'Code',
      type: 'textarea',
      required: true,
      admin: { rows: 10 },
    },
  ],
}

export const About: GlobalConfig = {
  slug: 'about',
  access: { read: () => true },
  versions: { drafts: true },

  admin: {
    description: 'About page content',
    livePreview: {
      url: () => {
        const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
        const redirect = encodeURIComponent('/about')
        return `${base}/api/preview?redirect=${redirect}`
      },
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },

  fields: [
    {
      name: 'sections',
      label: 'Sections',
      type: 'array',
      required: true,
      admin: { initCollapsed: false },
      fields: [
        {
          name: 'layout',
          label: 'Layout',
          type: 'select',
          required: true,
          defaultValue: 'text-image',
          options: [
            { label: 'Text → Image', value: 'text-image' },
            { label: 'Image → Text', value: 'image-text' },
            { label: 'Text Only', value: 'text-only' },
            { label: 'Image Only', value: 'image-only' },
          ],
        },
        { 
          name: 'title', 
          label: 'Title', 
          type: 'text', 
          required: false,
        },

        {
          name: 'text',
          label: 'Text',
          type: 'richText',
          required: false,
          admin: {
            condition: (data, siblingData) => 
              siblingData?.layout !== 'image-only',
          },
          editor: lexicalEditor({
            features: ({ defaultFeatures }) => [
              ...defaultFeatures,
              FixedToolbarFeature(),
              EXPERIMENTAL_TableFeature(),
              BlocksFeature({
                blocks: [CodeBlock],
              }),
            ],
          }),
        },

        {
          name: 'image',
          label: 'Image',
          type: 'upload',
          relationTo: 'media',
          required: false,
          admin: {
            condition: (data, siblingData) => 
              siblingData?.layout !== 'text-only',
          },
        },
      ],
    },
  ],
}

export default About