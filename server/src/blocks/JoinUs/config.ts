import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * JoinUs block encapsulates the membership sign‑up section. Editors can
 * freely edit the introductory copy and add or remove membership
 * options. Each membership option contains a title and a rich text
 * description to describe perks or eligibility. This structure makes it
 * easy to tailor the Join Us page for different audiences without code
 * changes.
 */
export const JoinUs: Block = {
  slug: 'joinUs',
  interfaceName: 'JoinUsBlock',
  labels: {
    singular: 'Join Us',
    plural: 'Join Us Blocks',
  },
  fields: [
    {
      name: 'intro',
      label: 'Introduction',
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
    {
      name: 'memberships',
      type: 'array',
      label: 'Membership Options',
      minRows: 1,
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Title',
          required: true,
        },
        {
          name: 'description',
          type: 'richText',
          label: 'Description',
          editor: lexicalEditor({
            features: ({ rootFeatures }) => {
              return [
                ...rootFeatures,
                HeadingFeature({ enabledHeadingSizes: ['h3', 'h4'] }),
                FixedToolbarFeature(),
                InlineToolbarFeature(),
              ]
            },
          }),
          required: true,
        },
      ],
    },
  ],
}