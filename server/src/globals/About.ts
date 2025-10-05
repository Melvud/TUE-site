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

  // Замените только секцию admin в About.ts:
admin: {
    group: 'Site',
    description: 'About page content',
    livePreview: {
      url: () => {
        const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
        const secret = process.env.PAYLOAD_SECRET
        const redirect = encodeURIComponent('/about')
        return `${baseUrl}/api/preview?secret=${secret}&redirect=${redirect}`
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
      label: 'Content Sections',
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

    // ==================== SUPPORTED BY SECTION ====================
    {
      type: 'collapsible',
      label: '🤝 Supported By Section',
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: 'supportedByTitle',
          label: 'Title',
          type: 'text',
          defaultValue: 'Supported by Optica',
        },
        {
          name: 'supportedByDescription',
          label: 'Description',
          type: 'textarea',
          defaultValue: 'PhE is an Optica Student Chapter supported by Optica (formerly OSA).',
          admin: {
            rows: 3,
          },
        },
        {
          name: 'supportedByLogo',
          label: 'Main Supporter Logo (e.g., Optica)',
          type: 'upload',
          relationTo: 'media',
          required: false,
        },
      ],
    },

    // ==================== PARTNERS CAROUSEL ====================
    {
      type: 'collapsible',
      label: '🎡 Partners & Hosts Carousel',
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: 'partnersTitle',
          label: 'Title',
          type: 'text',
          defaultValue: 'Partners & Hosts',
        },
        {
          name: 'partnersDescription',
          label: 'Description',
          type: 'textarea',
          defaultValue: 'These partners help make PhE events possible. Some have hosted lab/company tours, some have shared speakers and expertise, and others have supported specific activities. Thank you for opening doors to the Eindhoven photonics community.',
          admin: {
            rows: 4,
          },
        },
        {
          name: 'partners',
          label: 'Partner Companies',
          type: 'array',
          admin: {
            initCollapsed: true,
            description: 'Add companies that support PhE',
          },
          fields: [
            {
              name: 'name',
              label: 'Company Name',
              type: 'text',
              required: true,
            },
            {
              name: 'logo',
              label: 'Company Logo',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
            {
              name: 'website',
              label: 'Website URL (optional)',
              type: 'text',
              admin: {
                placeholder: 'https://example.com',
              },
            },
          ],
        },
      ],
    },
  ],
}

export default About