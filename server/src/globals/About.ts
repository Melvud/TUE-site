import type { GlobalConfig, Block } from 'payload'
import {
  lexicalEditor,
  BlocksFeature,
  FixedToolbarFeature,
  EXPERIMENTAL_TableFeature,
} from '@payloadcms/richtext-lexical'

// Простой блок для «кодовых вставок» (code block).
// Это не inline-«code», а отдельный блок с полем textarea.
// При желании позже можно заменить на CodeField из @payloadcms/ui
// (см. пример в доках по BlocksFeature).
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
  admin: { description: 'About page content' },
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
        {
          name: 'title',
          label: 'Title',
          type: 'text',
          required: true,
        },
        {
          name: 'text',
          label: 'Text',
          type: 'richText',
          required: false,
          editor: lexicalEditor({
            // см. docs: features можно вернуть функцией, добавив к defaultFeatures свои
            // Official features список + правильные имена: EXPERIMENTAL_TableFeature, FixedToolbarFeature и т.д.
            // Таблицы НЕ включены по умолчанию.
            features: ({ defaultFeatures }) => [
              ...defaultFeatures, // включает заголовки, списки, цитаты, ссылки, inline code и пр.
              FixedToolbarFeature(), // закреплённая панель сверху
              EXPERIMENTAL_TableFeature(), // таблицы (экспериментально)
              BlocksFeature({
                blocks: [CodeBlock], // даём возможность вставлять наш Code Block
                inlineBlocks: [],    // при желании можно добавить inline-блоки
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
