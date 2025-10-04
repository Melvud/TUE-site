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
      name: 'useCustomTemplate',
      label: 'Customize Email',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Override default templates from Email Templates settings',
      },
    },
    {
      name: 'acceptanceEmail',
      label: 'Acceptance Email',
      type: 'group',
      admin: {
        condition: (data) => data.status === 'accepted',
        description: 'Email sent when accepting the application',
      },
      fields: [
        {
          name: 'subject',
          label: 'Subject',
          type: 'text',
          admin: {
            placeholder: 'Uses default from Email Templates if empty',
            condition: (data) => data.useCustomTemplate,
          },
        },
        {
          name: 'body',
          label: 'Email Body',
          type: 'textarea',
          admin: {
            rows: 10,
            placeholder: 'Uses default from Email Templates if empty',
            description: 'Available: {{name}}, {{email}}',
            condition: (data) => data.useCustomTemplate,
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
      label: 'Rejection Email',
      type: 'group',
      admin: {
        condition: (data) => data.status === 'rejected',
        description: 'Email sent when rejecting the application',
      },
      fields: [
        {
          name: 'subject',
          label: 'Subject',
          type: 'text',
          admin: {
            placeholder: 'Uses default from Email Templates if empty',
            condition: (data) => data.useCustomTemplate,
          },
        },
        {
          name: 'body',
          label: 'Email Body',
          type: 'textarea',
          admin: {
            rows: 8,
            placeholder: 'Uses default from Email Templates if empty',
            description: 'Available: {{name}}, {{email}}',
            condition: (data) => data.useCustomTemplate,
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
          const statusChanged = previousDoc?.status !== doc.status

          // Acceptance email
          if (
            statusChanged &&
            doc.status === 'accepted' &&
            !doc.acceptanceEmail?.sent
          ) {
            try {
              const { sendAcceptanceEmail } = await import('@/lib/email')
              
              // Используем кастомный шаблон если указан, иначе из БД
              const customTemplate = doc.useCustomTemplate && doc.acceptanceEmail?.subject && doc.acceptanceEmail?.body
                ? {
                    subject: doc.acceptanceEmail.subject,
                    body: doc.acceptanceEmail.body,
                  }
                : undefined
              
              const success = await sendAcceptanceEmail(
                doc.email,
                doc.name,
                customTemplate
              )
              
              if (success) {
                console.log('✅ Acceptance email sent to:', doc.email)
                
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

          // Rejection email
          if (
            statusChanged &&
            doc.status === 'rejected' &&
            !doc.rejectionEmail?.sent
          ) {
            try {
              const { sendRejectionEmail } = await import('@/lib/email')
              
              const customTemplate = doc.useCustomTemplate && doc.rejectionEmail?.subject && doc.rejectionEmail?.body
                ? {
                    subject: doc.rejectionEmail.subject,
                    body: doc.rejectionEmail.body,
                  }
                : undefined
              
              const success = await sendRejectionEmail(
                doc.email,
                doc.name,
                customTemplate
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