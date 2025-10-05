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
      admin: { readOnly: true },
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      admin: { readOnly: true },
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
      admin: { position: 'sidebar' },
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
          label: 'Subject (optional override)',
          type: 'text',
          admin: {
            placeholder: 'Leave empty to use default from Email Templates',
            condition: (data) => data.useCustomTemplate,
          },
        },
        {
          name: 'body',
          label: 'Email Body (optional override)',
          type: 'textarea',
          admin: {
            rows: 10,
            placeholder: 'Leave empty to use default from Email Templates',
            description: 'Available: {{name}}, {{email}}',
            condition: (data) => data.useCustomTemplate,
          },
        },
        {
          name: 'sendNow',
          label: '✉️ Send Email Now',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Check this box and click Save to send the email immediately',
            condition: (data) => !data.acceptanceEmail?.sent,
          },
        },
        {
          name: 'sent',
          label: 'Email Sent',
          type: 'checkbox',
          defaultValue: false,
          admin: { readOnly: true },
        },
        {
          name: 'sentAt',
          label: 'Sent At',
          type: 'date',
          admin: {
            readOnly: true,
            date: { pickerAppearance: 'dayAndTime' },
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
          label: 'Subject (optional override)',
          type: 'text',
          admin: {
            placeholder: 'Leave empty to use default from Email Templates',
            condition: (data) => data.useCustomTemplate,
          },
        },
        {
          name: 'body',
          label: 'Email Body (optional override)',
          type: 'textarea',
          admin: {
            rows: 8,
            placeholder: 'Leave empty to use default from Email Templates',
            description: 'Available: {{name}}, {{email}}',
            condition: (data) => data.useCustomTemplate,
          },
        },
        {
          name: 'sendNow',
          label: '✉️ Send Email Now',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Check this box and click Save to send the email immediately',
            condition: (data) => !data.rejectionEmail?.sent,
          },
        },
        {
          name: 'sent',
          label: 'Email Sent',
          type: 'checkbox',
          defaultValue: false,
          admin: { readOnly: true },
        },
        {
          name: 'sentAt',
          label: 'Sent At',
          type: 'date',
          admin: {
            readOnly: true,
            date: { pickerAppearance: 'dayAndTime' },
          },
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        if (operation !== 'update') return data

        const statusChanged = originalDoc?.status !== data.status

        console.log('🔍 JoinSubmissions beforeChange:', {
          statusChanged,
          newStatus: data.status,
          previousStatus: originalDoc?.status,
          originalAcceptanceSent: originalDoc?.acceptanceEmail?.sent,
          originalRejectionSent: originalDoc?.rejectionEmail?.sent,
          dataAcceptanceEmail: data.acceptanceEmail,
          dataRejectionEmail: data.rejectionEmail,
        })

        // ==================== ACCEPTANCE EMAIL ====================
        if (data.status === 'accepted') {
          // Инициализируем acceptanceEmail если его нет
          if (!data.acceptanceEmail) {
            data.acceptanceEmail = {}
          }

          // Проверяем, было ли уже отправлено
          const alreadySent = originalDoc?.acceptanceEmail?.sent === true

          console.log('📧 Acceptance email check:', {
            alreadySent,
            statusChanged,
            sendNow: data.acceptanceEmail?.sendNow,
            originalSendNow: originalDoc?.acceptanceEmail?.sendNow,
          })

          if (!alreadySent) {
            // Отправляем если:
            // 1. Статус изменился на accepted (автоматически)
            // 2. Галочка sendNow установлена (вручную)
            const shouldSend =
              statusChanged || (data.acceptanceEmail?.sendNow && !originalDoc?.acceptanceEmail?.sendNow)

            console.log('📧 Should send acceptance:', shouldSend)

            if (shouldSend) {
              try {
                console.log('📧 Attempting to send acceptance email to:', data.email)

                const emailSettings = await req.payload.findGlobal({
                  slug: 'email-settings',
                })

                console.log('📧 Email settings loaded:', {
                  enabled: emailSettings.enabled,
                  provider: (emailSettings as any).provider,
                })

                if (!emailSettings.enabled) {
                  console.warn('⚠️ Email sending is disabled in settings')
                  return data
                }

                const templates = await req.payload.findGlobal({
                  slug: 'email-templates',
                })

                console.log('📧 Templates loaded:', {
                  hasAcceptanceSubject: !!(templates as any)?.acceptanceSubject,
                  hasAcceptanceBody: !!(templates as any)?.acceptanceBody,
                })

                const { sendAcceptanceEmail } = await import('@/lib/email')

                // Используем кастомное ИЛИ дефолтное (приоритет дефолту если пусто)
                const subject =
                  (data.useCustomTemplate && data.acceptanceEmail?.subject?.trim()) ||
                  (templates as any)?.acceptanceSubject ||
                  'Welcome to Photonics Society Eindhoven'

                const body =
                  (data.useCustomTemplate && data.acceptanceEmail?.body?.trim()) ||
                  (templates as any)?.acceptanceBody ||
                  `Hello {{name}},\n\nCongratulations! Your application has been accepted.\n\nBest regards,\nPhE Team`

                console.log('📧 Sending acceptance with:', {
                  subject,
                  bodyLength: body.length,
                  useCustom: data.useCustomTemplate,
                })

                const success = await sendAcceptanceEmail(
                  data.email,
                  data.name,
                  subject,
                  body,
                  emailSettings as any
                )

                if (success) {
                  console.log('✅ Acceptance email sent to:', data.email)

                  data.acceptanceEmail = {
                    ...data.acceptanceEmail,
                    sendNow: false,
                    sent: true,
                    sentAt: new Date().toISOString(),
                  }
                } else {
                  console.error('❌ Failed to send acceptance email')
                }
              } catch (error) {
                console.error('❌ Error sending acceptance email:', error)
                if (error instanceof Error) {
                  console.error('Error details:', error.message)
                  console.error('Error stack:', error.stack)
                }
              }
            }
          } else {
            console.log('⏭️ Acceptance email already sent, skipping')
          }
        }

        // ==================== REJECTION EMAIL ====================
        if (data.status === 'rejected') {
          // Инициализируем rejectionEmail если его нет
          if (!data.rejectionEmail) {
            data.rejectionEmail = {}
          }

          const alreadySent = originalDoc?.rejectionEmail?.sent === true

          console.log('📧 Rejection email check:', {
            alreadySent,
            statusChanged,
            sendNow: data.rejectionEmail?.sendNow,
          })

          if (!alreadySent) {
            const shouldSend =
              statusChanged || (data.rejectionEmail?.sendNow && !originalDoc?.rejectionEmail?.sendNow)

            console.log('📧 Should send rejection:', shouldSend)

            if (shouldSend) {
              try {
                console.log('📧 Attempting to send rejection email to:', data.email)

                const emailSettings = await req.payload.findGlobal({
                  slug: 'email-settings',
                })

                if (!emailSettings.enabled) {
                  console.warn('⚠️ Email sending is disabled in settings')
                  return data
                }

                const templates = await req.payload.findGlobal({
                  slug: 'email-templates',
                })

                const { sendRejectionEmail } = await import('@/lib/email')

                const subject =
                  (data.useCustomTemplate && data.rejectionEmail?.subject?.trim()) ||
                  (templates as any)?.rejectionSubject ||
                  'Regarding your PhE application'

                const body =
                  (data.useCustomTemplate && data.rejectionEmail?.body?.trim()) ||
                  (templates as any)?.rejectionBody ||
                  `Hello {{name}},\n\nThank you for your interest in Photonics Society Eindhoven.\nAfter careful consideration, we won't be moving forward at this time.\n\nBest regards,\nPhE Team`

                console.log('📧 Sending rejection with:', {
                  subject,
                  bodyLength: body.length,
                  useCustom: data.useCustomTemplate,
                })

                const success = await sendRejectionEmail(
                  data.email,
                  data.name,
                  subject,
                  body,
                  emailSettings as any
                )

                if (success) {
                  console.log('✅ Rejection email sent to:', data.email)

                  data.rejectionEmail = {
                    ...data.rejectionEmail,
                    sendNow: false,
                    sent: true,
                    sentAt: new Date().toISOString(),
                  }
                } else {
                  console.error('❌ Failed to send rejection email')
                }
              } catch (error) {
                console.error('❌ Error sending rejection email:', error)
                if (error instanceof Error) {
                  console.error('Error details:', error.message)
                  console.error('Error stack:', error.stack)
                }
              }
            }
          } else {
            console.log('⏭️ Rejection email already sent, skipping')
          }
        }

        return data
      },
    ],
  },
}