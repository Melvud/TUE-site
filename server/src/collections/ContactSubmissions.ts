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
    create: () => true, // Публичное создание через форму
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
          defaultValue: 'Re: Your contact form submission',
        },
        {
          name: 'body',
          label: 'Email Body',
          type: 'textarea',
          admin: {
            rows: 8,
            placeholder: 'Dear {{name}},\n\nThank you for contacting us...',
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req, operation }) => {
        // Отправка reply email при заполнении и сохранении
        if (
          operation === 'update' &&
          doc.replyTemplate?.body &&
          doc.replyTemplate?.subject
        ) {
          // Проверяем, изменился ли шаблон (чтобы не отправлять повторно)
          const templateChanged = 
            previousDoc?.replyTemplate?.body !== doc.replyTemplate?.body ||
            previousDoc?.replyTemplate?.subject !== doc.replyTemplate?.subject

          if (templateChanged) {
            try {
              const { sendTemplateEmail } = await import('@/lib/email')
              
              const success = await sendTemplateEmail(
                doc.email,
                doc.replyTemplate.subject,
                doc.replyTemplate.body,
                { name: doc.name, email: doc.email }
              )
              
              if (success) {
                console.log('✅ Reply email sent to:', doc.email)
                
                // Обновляем статус на "Replied"
                if (doc.status !== 'replied') {
                  await req.payload.update({
                    collection: 'contact-submissions',
                    id: doc.id,
                    data: {
                      status: 'replied',
                    },
                  })
                }
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