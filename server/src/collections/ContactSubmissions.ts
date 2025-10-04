import type { CollectionConfig } from 'payload'

export const ContactSubmissions: CollectionConfig = {
  slug: 'contact-submissions',
  labels: {
    singular: 'Contact Submission',
    plural: 'Contact Submissions',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'status', 'createdAt'],
    group: 'Forms',
  },
  access: {
    read: ({ req: { user } }) => !!user,
    create: () => true,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'message',
      label: 'Message',
      type: 'textarea',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'formData',
      label: 'Additional Form Data',
      type: 'json',
      admin: {
        description: 'All form fields submitted',
        readOnly: true,
      },
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'Replied', value: 'replied' },
        { label: 'Closed', value: 'closed' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'adminNotes',
      label: 'Admin Notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes (not visible to user)',
      },
    },
    {
      name: 'useCustomTemplate',
      label: 'Customize Reply',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Override default template from Email Templates',
      },
    },
    {
      name: 'replyTemplate',
      label: 'Reply Email',
      type: 'group',
      admin: {
        description: 'Compose and send reply email',
      },
      fields: [
        {
          name: 'subject',
          label: 'Subject',
          type: 'text',
          admin: {
            placeholder: 'Uses default from Email Templates if empty',
          },
        },
        {
          name: 'body',
          label: 'Email Body',
          type: 'textarea',
          admin: {
            rows: 10,
            placeholder: 'Uses default from Email Templates if empty. Available: {{name}}, {{email}}, {{message}}',
          },
        },
        {
          name: 'sent',
          label: 'Email Sent',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            readOnly: true,
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req, operation }) => {
        if (operation === 'update') {
          const replyChanged = 
            (doc.replyTemplate?.subject && doc.replyTemplate?.subject !== previousDoc?.replyTemplate?.subject) ||
            (doc.replyTemplate?.body && doc.replyTemplate?.body !== previousDoc?.replyTemplate?.body)

          if (replyChanged && !doc.replyTemplate?.sent) {
            try {
              const { sendReplyEmail } = await import('@/lib/email')
              
              const success = await sendReplyEmail(
                doc.email,
                doc.name,
                doc.replyTemplate?.subject,
                doc.replyTemplate?.body,
                doc.message
              )
              
              if (success) {
                console.log('✅ Reply email sent to:', doc.email)
                
                await req.payload.update({
                  collection: 'contact-submissions',
                  id: doc.id,
                  data: {
                    status: 'replied',
                    replyTemplate: {
                      ...doc.replyTemplate,
                      sent: true,
                    },
                  },
                })
              }
            } catch (error) {
              console.error('❌ Failed to send reply email:', error)
            }
          }
        }
      },
    ],
  },
}