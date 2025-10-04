import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

type EmailSettings = {
  enabled: boolean
  provider: 'gmail' | 'sendgrid' | 'mailgun' | 'custom'
  gmailSettings?: {
    user: string
    appPassword: string
    fromName?: string
  }
  sendgridSettings?: {
    apiKey: string
    fromEmail: string
    fromName?: string
  }
  mailgunSettings?: {
    apiKey: string
    domain: string
    fromEmail: string
    fromName?: string
  }
  customSettings?: {
    host: string
    port: number
    secure: boolean
    user: string
    password: string
    fromEmail: string
    fromName?: string
  }
}

/**
 * Получает настройки email из БД или fallback на .env
 */
async function getEmailSettings(): Promise<EmailSettings | null> {
  try {
    const { getPayload } = await import('payload')
    const config = await import('@payload-config')
    
    const payload = await getPayload({ config: config.default })
    const settings = await payload.findGlobal({
      slug: 'email-settings',
    })

    if (settings && settings.enabled) {
      return settings as EmailSettings
    }
  } catch (error) {
    console.log('Using fallback .env email settings')
  }

  // Fallback на .env
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      enabled: true,
      provider: 'custom',
      customSettings: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASS,
        fromEmail: process.env.SMTP_FROM || process.env.SMTP_USER,
        fromName: 'PhE Team',
      },
    }
  }

  return null
}

/**
 * Создает transporter на основе настроек
 */
function createTransporter(settings: EmailSettings): Transporter | null {
  try {
    switch (settings.provider) {
      case 'gmail':
        if (!settings.gmailSettings) return null
        return nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: settings.gmailSettings.user,
            pass: settings.gmailSettings.appPassword,
          },
        })

      case 'sendgrid':
        if (!settings.sendgridSettings) return null
        return nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: settings.sendgridSettings.apiKey,
          },
        })

      case 'mailgun':
        if (!settings.mailgunSettings) return null
        return nodemailer.createTransport({
          host: 'smtp.mailgun.org',
          port: 587,
          secure: false,
          auth: {
            user: `postmaster@${settings.mailgunSettings.domain}`,
            pass: settings.mailgunSettings.apiKey,
          },
        })

      case 'custom':
        if (!settings.customSettings) return null
        return nodemailer.createTransport({
          host: settings.customSettings.host,
          port: settings.customSettings.port,
          secure: settings.customSettings.secure,
          auth: {
            user: settings.customSettings.user,
            pass: settings.customSettings.password,
          },
        })

      default:
        return null
    }
  } catch (error) {
    console.error('Failed to create email transporter:', error)
    return null
  }
}

/**
 * Получает From адрес из настроек
 */
function getFromAddress(settings: EmailSettings): string {
  let email = ''
  let name = 'PhE Team'

  switch (settings.provider) {
    case 'gmail':
      email = settings.gmailSettings?.user || ''
      name = settings.gmailSettings?.fromName || name
      break
    case 'sendgrid':
      email = settings.sendgridSettings?.fromEmail || ''
      name = settings.sendgridSettings?.fromName || name
      break
    case 'mailgun':
      email = settings.mailgunSettings?.fromEmail || ''
      name = settings.mailgunSettings?.fromName || name
      break
    case 'custom':
      email = settings.customSettings?.fromEmail || ''
      name = settings.customSettings?.fromName || name
      break
  }

  return name ? `${name} <${email}>` : email
}

/**
 * Заменяет переменные в шаблоне
 */
function replaceVariables(template: string, variables: Record<string, any>): string {
  let result = template

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(regex, String(value || ''))
  })

  return result
}

type EmailOptions = {
  to: string
  subject: string
  text?: string
  html?: string
}

/**
 * Отправляет email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const settings = await getEmailSettings()

    if (!settings || !settings.enabled) {
      console.error('Email sending is disabled or not configured')
      return false
    }

    const transporter = createTransporter(settings)
    if (!transporter) {
      console.error('Failed to create email transporter')
      return false
    }

    const from = getFromAddress(settings)

    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text?.replace(/\n/g, '<br>'),
    })

    console.log('✅ Email sent:', info.messageId)
    return true
  } catch (error) {
    console.error('❌ Email sending failed:', error)
    return false
  }
}

/**
 * Отправляет email с заменой переменных
 */
export async function sendTemplateEmail(
  to: string,
  subject: string,
  bodyTemplate: string,
  variables: Record<string, any>
): Promise<boolean> {
  const body = replaceVariables(bodyTemplate, variables)
  const subjectFilled = replaceVariables(subject, variables)

  return sendEmail({
    to,
    subject: subjectFilled,
    text: body,
  })
}

/**
 * Отправляет тестовый email
 */
export async function sendTestEmail(
  to: string,
  settings?: EmailSettings
): Promise<boolean> {
  const actualSettings = settings || (await getEmailSettings())

  if (!actualSettings) {
    throw new Error('Email settings not configured')
  }

  const transporter = createTransporter(actualSettings)
  if (!transporter) {
    throw new Error('Failed to create email transporter')
  }

  const from = getFromAddress(actualSettings)

  const info = await transporter.sendMail({
    from,
    to,
    subject: '🧪 Test Email from PhE Website',
    text: `This is a test email from Photonics Society Eindhoven website.

If you received this email, your email configuration is working correctly!

Provider: ${actualSettings.provider}
Sent at: ${new Date().toISOString()}

Best regards,
PhE Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22d3ee;">🧪 Test Email</h2>
        <p>This is a test email from <strong>Photonics Society Eindhoven</strong> website.</p>
        <p>If you received this email, your email configuration is working correctly! ✅</p>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          <strong>Provider:</strong> ${actualSettings.provider}<br>
          <strong>Sent at:</strong> ${new Date().toISOString()}
        </p>
        <p>Best regards,<br><strong>PhE Team</strong></p>
      </div>
    `,
  })

  console.log('✅ Test email sent:', info.messageId)
  return true
}

/**
 * Отправляет acceptance email
 */
export async function sendAcceptanceEmail(
  to: string,
  name: string,
  customTemplate?: { subject: string; body: string }
): Promise<boolean> {
  const defaultSubject = '🎉 Welcome to Photonics Society Eindhoven!'
  const defaultBody = `Dear {{name}},

Congratulations! We are pleased to inform you that your application to join Photonics Society Eindhoven has been accepted.

Next steps:
1. Join our LinkedIn group
2. Check out upcoming events at https://phe.tue.nl/events
3. Get your free OPTICA subscription

Welcome to the team!

Best regards,
PhE Team`

  const subject = customTemplate?.subject || defaultSubject
  const body = customTemplate?.body || defaultBody

  return sendTemplateEmail(to, subject, body, { name })
}

/**
 * Отправляет rejection email
 */
export async function sendRejectionEmail(
  to: string,
  name: string,
  customTemplate?: { subject: string; body: string }
): Promise<boolean> {
  const defaultSubject = 'Regarding your PhE application'
  const defaultBody = `Dear {{name}},

Thank you for your interest in Photonics Society Eindhoven.

After careful consideration, we regret to inform you that we are unable to accept your application at this time.

We appreciate your interest and wish you all the best in your future endeavors.

Best regards,
PhE Team`

  const subject = customTemplate?.subject || defaultSubject
  const body = customTemplate?.body || defaultBody

  return sendTemplateEmail(to, subject, body, { name })
}

/**
 * Отправляет reply email
 */
export async function sendReplyEmail(
  to: string,
  name: string,
  subject: string,
  body: string
): Promise<boolean> {
  return sendTemplateEmail(to, subject, body, { name })
}