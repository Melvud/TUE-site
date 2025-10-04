import type { CollectionConfig } from 'payload'

export const JoinSubmissions: CollectionConfig = {
  slug: 'join-submissions',
  labels: {
    singular: 'Join Submission',
    plural: 'Join Submissions',
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
      name: 'formData',
      label: 'Application Data',
      type: 'json',
      admin: {
        description: 'All form fields submitted by the applicant',
        readOnly: true,
      },
    },
    {
      name: 'status',
      label: 'Application Status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: '🟡 Pending Review', value: 'pending' },
        { label: '✅ Accepted', value: 'accepted' },
        { label: '❌ Rejected', value: 'rejected' },
        { label: '📝 In Review', value: 'in-review' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'reviewNotes',
      label: 'Review Notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this application',
        rows: 4,
      },
    },
    {
      name: 'acceptanceEmail',
      label: 'Acceptance Email Template',
      type: 'group',
      admin: {
        condition: (data) => data.status === 'accepted',
        description: 'Email to send when accepting the application',
      },
      fields: [
        {
          name: 'subject',
          label: 'Subject',
          type: 'text',
          defaultValue: '🎉 Welcome to Photonics Society Eindhoven!',
        },
        {
          name: 'body',
          label: 'Email Body',
          type: 'textarea',
          admin: {
            rows: 10,
            placeholder: `Dear {{name}},

Congratulations! We are pleased to inform you that your application to join Photonics Society Eindhoven has been accepted.

Next steps:
1. Join our LinkedIn group: [link]
2. Check out upcoming events: [link]
3. Get your free OPTICA subscription

Welcome to the team!

Best regards,
PhE Team`,
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
        {
          name: 'sentAt',
          label: 'Sent At',
          type: 'date',
          admin: {
            readOnly: true,
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
      ],
    },
    {
      name: 'rejectionEmail',
      label: 'Rejection Email Template',
      type: 'group',
      admin: {
        condition: (data) => data.status === 'rejected',
        description: 'Email to send when rejecting the application',
      },
      fields: [
        {
          name: 'subject',
          label: 'Subject',
          type: 'text',
          defaultValue: 'Regarding your PhE application',
        },
        {
          name: 'body',
          label: 'Email Body',
          type: 'textarea',
          admin: {
            rows: 8,
            placeholder: `Dear {{name}},

Thank you for your interest in Photonics Society Eindhoven...`,
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
        // Автоматическая отправка email при изменении статуса
        if (operation === 'update') {
          const statusChanged = previousDoc?.status !== doc.status

          // Отправка acceptance email
          if (
            statusChanged &&
            doc.status === 'accepted' &&
            doc.acceptanceEmail?.body &&
            !doc.acceptanceEmail?.sent
          ) {
            try {
              // Динамический импорт для избежания проблем с Edge Runtime
              const { sendTemplateEmail } = await import('@/lib/email')
              
              const success = await sendTemplateEmail(
                doc.email,
                doc.acceptanceEmail.subject || '🎉 Welcome to PhE!',
                doc.acceptanceEmail.body,
                { name: doc.name, email: doc.email }
              )
              
              if (success) {
                console.log('✅ Acceptance email sent to:', doc.email)
                
                // Обновляем статус отправки
                await req.payload.update({
                  collection: 'join-submissions',
                  id: doc.id,
                  data: {
                    acceptanceEmail: {
                      ...doc.acceptanceEmail,
                      sent: true,
                      sentAt: new Date().toISOString(),
                    },
                  },
                })
              }
            } catch (error) {
              console.error('❌ Failed to send acceptance email:', error)
            }
          }

          // Отправка rejection email
          if (
            statusChanged &&
            doc.status === 'rejected' &&
            doc.rejectionEmail?.body &&
            !doc.rejectionEmail?.sent
          ) {
            try {
              const { sendTemplateEmail } = await import('@/lib/email')
              
              const success = await sendTemplateEmail(
                doc.email,
                doc.rejectionEmail.subject || 'Regarding your application',
                doc.rejectionEmail.body,
                { name: doc.name, email: doc.email }
              )
              
              if (success) {
                console.log('✅ Rejection email sent to:', doc.email)
                
                await req.payload.update({
                  collection: 'join-submissions',
                  id: doc.id,
                  data: {
                    rejectionEmail: {
                      ...doc.rejectionEmail,
                      sent: true,
                    },
                  },
                })
              }
            } catch (error) {
              console.error('❌ Failed to send rejection email:', error)
            }
          }
        }
      },
    ],
  },
}