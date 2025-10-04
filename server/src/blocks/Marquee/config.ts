import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * Marquee block configuration. This block powers a scrolling text
 * component on the homepage. Content editors can add an array of
 * rich‑text items which will scroll horizontally across the page. A
 * configurable speed setting controls how fast the text scrolls.
 */
export const Marquee: Block = {
  slug: 'marquee',
  interfaceName: 'MarqueeBlock',
  labels: {
    singular: 'Marquee',
    plural: 'Marquees',
  },
  fields: [
    {
      name: 'items',
      label: 'Scrolling Text Items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'text',
          type: 'richText',
          editor: lexicalEditor({
            features: ({ rootFeatures }) => {
              return [
                ...rootFeatures,
                FixedToolbarFeature(),
                InlineToolbarFeature(),
              ]
            },
          }),
          label: false,
        },
      ],
    },
    {
      name: 'speed',
      label: 'Scroll Speed (seconds)',
      type: 'number',
      required: false,
      defaultValue: 20,
    },
  ],
}