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
        { label: '🆕 New', value: 'new' },
        { label: '⏳ In Progress', value: 'in-progress' },
        { label: '✅ Replied', value: 'replied' },
        { label: '🔒 Closed', value: 'closed' },
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
            placeholder: 'Leave empty to use default from Email Templates',
          },
        },
        {
          name: 'body',
          label: 'Email Body',
          type: 'textarea',
          admin: {
            rows: 10,
            placeholder: 'Leave empty to use default from Email Templates. Available: {{name}}, {{email}}, {{message}}',
          },
        },
        {
          name: 'sendNow',
          label: '✉️ Send Reply Now',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Check this box and click Save to send the reply immediately',
            condition: (data) => !data.replyTemplate?.sent,
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

        if (originalDoc?.replyTemplate?.sent) {
          console.log('📧 Email already sent, skipping')
          return data
        }

        // Отправляем если:
        // 1. Subject или Body изменились (custom reply)
        // 2. Галочка sendNow установлена (default reply)
        const customChanged =
          (data.replyTemplate?.subject && data.replyTemplate?.subject !== originalDoc?.replyTemplate?.subject) ||
          (data.replyTemplate?.body && data.replyTemplate?.body !== originalDoc?.replyTemplate?.body)

        const sendNowChecked = data.replyTemplate?.sendNow && !originalDoc?.replyTemplate?.sendNow

        const shouldSend = customChanged || sendNowChecked

        console.log('📧 Contact reply check:', {
          shouldSend,
          customChanged,
          sendNowChecked,
        })

        if (!shouldSend) {
          return data
        }

        try {
          console.log('📧 Attempting to send reply email to:', data.email)

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

          const { sendReplyEmail } = await import('@/lib/email')

          const subject =
            data.replyTemplate?.subject?.trim() ||
            (templates as any)?.contactReplySubject ||
            'Re: Your message to PhE'

          const body =
            data.replyTemplate?.body?.trim() ||
            (templates as any)?.contactReplyBody ||
            `Dear {{name}},\n\nThank you for contacting Photonics Society Eindhoven.\n\nBest regards,\nPhE Team`

          console.log('📧 Sending reply with:', {
            subject,
            bodyLength: body.length,
          })

          const success = await sendReplyEmail(
            data.email,
            data.name,
            subject,
            body,
            data.message,
            emailSettings as any
          )

          if (success) {
            console.log('✅ Reply email sent to:', data.email)

            data.status = 'replied'
            data.replyTemplate = {
              ...data.replyTemplate,
              sendNow: false,
              sent: true,
              sentAt: new Date().toISOString(),
            }
          } else {
            console.error('❌ Failed to send reply email')
          }
        } catch (error) {
          console.error('❌ Failed to send reply email:', error)
          if (error instanceof Error) {
            console.error('Error details:', error.message)
          }
        }

        return data
      },
    ],
  },
}