import type { GlobalConfig } from 'payload'

export const EmailSettings: GlobalConfig = {
  slug: 'email-settings',
  label: 'Email Settings',
  access: {
    read: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
  },
  admin: {
    group: 'Settings',
    description: 'Configure email sending settings (SMTP)',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'SMTP Configuration',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'provider',
                  label: 'Email Provider',
                  type: 'select',
                  required: true,
                  defaultValue: 'gmail',
                  options: [
                    { label: '📧 Gmail', value: 'gmail' },
                    { label: '📨 SendGrid', value: 'sendgrid' },
                    { label: '📮 Mailgun', value: 'mailgun' },
                    { label: '🔧 Custom SMTP', value: 'custom' },
                  ],
                  admin: {
                    width: '50%',
                  },
                },
                {
                  name: 'enabled',
                  label: 'Enable Email Sending',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: {
                    width: '50%',
                    description: 'Turn on to start sending emails',
                  },
                },
              ],
            },

            // Gmail Settings
            {
              name: 'gmailSettings',
              type: 'group',
              admin: {
                condition: (data) => data.provider === 'gmail',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'user',
                      label: 'Gmail Address',
                      type: 'text',
                      required: true,
                      admin: {
                        placeholder: 'your-email@gmail.com',
                        width: '50%',
                      },
                    },
                    {
                      name: 'appPassword',
                      label: 'App Password',
                      type: 'text',
                      required: true,
                      admin: {
                        placeholder: 'xxxx xxxx xxxx xxxx',
                        width: '50%',
                        description: '16-character app password',
                      },
                    },
                  ],
                },
                {
                  name: 'fromName',
                  label: 'From Name',
                  type: 'text',
                  defaultValue: 'PhE Team',
                  admin: {
                    description: 'Display name in emails',
                  },
                },
              ],
            },

            // SendGrid Settings
            {
              name: 'sendgridSettings',
              type: 'group',
              admin: {
                condition: (data) => data.provider === 'sendgrid',
              },
              fields: [
                {
                  name: 'apiKey',
                  label: 'SendGrid API Key',
                  type: 'text',
                  required: true,
                  admin: {
                    placeholder: 'SG.xxxxxxxxxxxxxxxxxx',
                  },
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'fromEmail',
                      label: 'From Email',
                      type: 'email',
                      required: true,
                      admin: {
                        placeholder: 'noreply@phe.tue.nl',
                        width: '50%',
                      },
                    },
                    {
                      name: 'fromName',
                      label: 'From Name',
                      type: 'text',
                      defaultValue: 'PhE Team',
                      admin: {
                        width: '50%',
                      },
                    },
                  ],
                },
              ],
            },

            // Mailgun Settings
            {
              name: 'mailgunSettings',
              type: 'group',
              admin: {
                condition: (data) => data.provider === 'mailgun',
              },
              fields: [
                {
                  name: 'apiKey',
                  label: 'Mailgun API Key',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'domain',
                  label: 'Domain',
                  type: 'text',
                  required: true,
                  admin: {
                    placeholder: 'mg.phe.tue.nl',
                  },
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'fromEmail',
                      label: 'From Email',
                      type: 'email',
                      required: true,
                      admin: {
                        width: '50%',
                      },
                    },
                    {
                      name: 'fromName',
                      label: 'From Name',
                      type: 'text',
                      defaultValue: 'PhE Team',
                      admin: {
                        width: '50%',
                      },
                    },
                  ],
                },
              ],
            },

            // Custom SMTP Settings
            {
              name: 'customSettings',
              type: 'group',
              admin: {
                condition: (data) => data.provider === 'custom',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'host',
                      label: 'SMTP Host',
                      type: 'text',
                      required: true,
                      admin: {
                        placeholder: 'smtp.example.com',
                        width: '50%',
                      },
                    },
                    {
                      name: 'port',
                      label: 'Port',
                      type: 'number',
                      required: true,
                      defaultValue: 587,
                      admin: {
                        width: '25%',
                      },
                    },
                    {
                      name: 'secure',
                      label: 'Use SSL/TLS',
                      type: 'checkbox',
                      defaultValue: false,
                      admin: {
                        width: '25%',
                        description: 'Enable for port 465',
                      },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'user',
                      label: 'Username',
                      type: 'text',
                      required: true,
                      admin: {
                        width: '50%',
                      },
                    },
                    {
                      name: 'password',
                      label: 'Password',
                      type: 'text',
                      required: true,
                      admin: {
                        width: '50%',
                      },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'fromEmail',
                      label: 'From Email',
                      type: 'email',
                      required: true,
                      admin: {
                        width: '50%',
                      },
                    },
                    {
                      name: 'fromName',
                      label: 'From Name',
                      type: 'text',
                      defaultValue: 'PhE Team',
                      admin: {
                        width: '50%',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: '📖 Setup Instructions',
          fields: [
            {
              type: 'ui',
              name: 'instructions',
              admin: {
                components: {
                  Field: {
                    path: '@/components/EmailInstructions',
                    exportName: 'EmailInstructions',
                  },
                },
              },
            },
          ],
        },
        {
          label: '🧪 Test Email',
          fields: [
            {
              name: 'testEmail',
              label: 'Test Email Address',
              type: 'email',
              admin: {
                description: 'Send a test email to verify settings',
              },
            },
            {
              type: 'ui',
              name: 'testButton',
              admin: {
                components: {
                  Field: {
                    path: '@/components/TestEmailButton',
                    exportName: 'TestEmailButton',
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
}