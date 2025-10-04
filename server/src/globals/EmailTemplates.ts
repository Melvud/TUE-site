import type { GlobalConfig } from 'payload'

export const EmailTemplates: GlobalConfig = {
  slug: 'email-templates',
  label: 'Email Templates',
  access: {
    read: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
  },
  admin: {
    group: 'Settings',
    description: 'Customize email templates for automated responses',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: '✅ Acceptance Email',
          description: 'Template for accepted join applications',
          fields: [
            {
              name: 'acceptanceSubject',
              label: 'Subject Line',
              type: 'text',
              required: true,
              defaultValue: '🎉 Welcome to Photonics Society Eindhoven!',
              admin: {
                placeholder: 'Welcome to PhE!',
              },
            },
            {
              name: 'acceptanceBody',
              label: 'Email Body',
              type: 'textarea',
              required: true,
              admin: {
                rows: 15,
                description: 'Available variables: {{name}}, {{email}}',
              },
              defaultValue: `Dear {{name}},

Congratulations! We are pleased to inform you that your application to join Photonics Society Eindhoven has been accepted.

Next steps:
1. Join our LinkedIn group: https://www.linkedin.com/company/photonics-society-eindhoven/
2. Check out upcoming events: https://phe.tue.nl/events
3. Get your free OPTICA subscription - we'll contact you with details

Welcome to the team! We're excited to have you join our photonics community.

Best regards,
PhE Team

---
Photonics Society Eindhoven
TU Eindhoven`,
            },
          ],
        },
        {
          label: '❌ Rejection Email',
          description: 'Template for rejected join applications',
          fields: [
            {
              name: 'rejectionSubject',
              label: 'Subject Line',
              type: 'text',
              required: true,
              defaultValue: 'Regarding your PhE application',
              admin: {
                placeholder: 'Application Update',
              },
            },
            {
              name: 'rejectionBody',
              label: 'Email Body',
              type: 'textarea',
              required: true,
              admin: {
                rows: 15,
                description: 'Available variables: {{name}}, {{email}}',
              },
              defaultValue: `Dear {{name}},

Thank you for your interest in Photonics Society Eindhoven.

After careful consideration of all applications, we regret to inform you that we are unable to accept your application at this time.

We encourage you to:
- Attend our public events: https://phe.tue.nl/events
- Follow us on LinkedIn: https://www.linkedin.com/company/photonics-society-eindhoven/
- Consider reapplying in the future

We appreciate your interest in our community and wish you all the best in your future endeavors.

Best regards,
PhE Team

---
Photonics Society Eindhoven
TU Eindhoven`,
            },
          ],
        },
        {
          label: '📧 Contact Reply',
          description: 'Default template for contact form replies',
          fields: [
            {
              name: 'contactReplySubject',
              label: 'Default Subject',
              type: 'text',
              required: true,
              defaultValue: 'Re: Your message to PhE',
              admin: {
                description: 'Can be overridden per-response in Contact Submissions',
              },
            },
            {
              name: 'contactReplyBody',
              label: 'Default Body',
              type: 'textarea',
              required: true,
              admin: {
                rows: 12,
                description: 'Available variables: {{name}}, {{email}}, {{message}}',
              },
              defaultValue: `Dear {{name}},

Thank you for contacting Photonics Society Eindhoven.

We have received your message and will get back to you as soon as possible, typically within 1-2 business days.

For urgent matters, you can also reach us on LinkedIn:
https://www.linkedin.com/company/photonics-society-eindhoven/

Best regards,
PhE Team

---
Your message:
{{message}}`,
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: '💡 Tips & Best Practices',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'tips',
          type: 'textarea',
          admin: {
            readOnly: true,
            rows: 8,
            description: 'Email template best practices',
          },
          defaultValue: `📝 Email Template Tips:

✅ Personalization: Use {{name}} and {{email}} for personal touch
✅ Clear CTAs: Include specific next steps or links
✅ Tone: Keep professional but friendly
✅ Signature: Always end with team name and contact info
✅ Test: Use "Send Test Email" in Email Settings to preview
⚠️ Variables: {{name}}, {{email}}, {{message}} are automatically replaced`,
        },
      ],
    },
  ],
}