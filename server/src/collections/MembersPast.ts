import type { CollectionConfig } from 'payload'

export const MembersPast: CollectionConfig = {
  slug: 'membersPast',
  admin: {
    useAsTitle: 'name',
    livePreview: {
      url: () => `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}?preview=true`,
    },
    group: 'Archive',
  },
  access: {
    read: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'text',
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
  ],
}