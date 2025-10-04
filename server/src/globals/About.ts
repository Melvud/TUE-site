import type { GlobalConfig, Block } from 'payload'
import {
  lexicalEditor,
  BlocksFeature,
  FixedToolbarFeature,
  EXPERIMENTAL_TableFeature,
} from '@payloadcms/richtext-lexical'

// Простой блок «Code Block» через BlocksFeature (для многострочного кода)
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

  // ВКЛЮЧАЕМ черновики — без этого «Preview» и живое превью не появятся
  versions: { drafts: true },

  admin: {
    description: 'About page content',
    // Локально для about включаем Live Preview (кнопка «глаз» в админке)
    livePreview: {
      // идём через /api/preview, чтобы включить draftMode и сделать редирект
      url: () => {
        const base =
          process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
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
          ],
        },
        { name: 'title', label: 'Title', type: 'text', required: true },

        {
          name: 'text',
          label: 'Text',
          type: 'richText',
          required: false,
          editor: lexicalEditor({
            features: ({ defaultFeatures }) => [
              ...defaultFeatures,            // базовый набор (заголовки, списки, цитаты, ссылки, inline-code и т.п.)
              FixedToolbarFeature(),         // фиксированная верхняя панель
              EXPERIMENTAL_TableFeature(),   // таблицы
              BlocksFeature({                // блочная вставка кода
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
        },
      ],
    },
  ],
}

export default About
