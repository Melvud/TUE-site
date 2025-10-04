import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * TextImage block pairs an uploaded image with a rich‑text section.
 * Editors can choose whether the image appears on the left or right.
 */
export const TextImage: Block = {
  slug: 'textImage',
  interfaceName: 'TextImageBlock',
  labels: {
    singular: 'Text & Image',
    plural: 'Text & Image Blocks',
  },
  fields: [
    {
      name: 'imagePosition',
      label: 'Image Position',
      type: 'select',
      required: true,
      defaultValue: 'left',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
      required: true,
    },
  ],
}