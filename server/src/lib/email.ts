// src/lib/email.ts
// Node-only helpers for sending emails in Next.js / Payload stack

import nodemailer from 'nodemailer'

type SMTPConfig = {
  host: string
  port: number
  secure?: boolean
  user: string
  pass: string
}

export type EmailSettings = {
  enabled?: boolean
  provider?: 'gmail' | 'sendgrid' | 'mailgun' | 'custom'
  from?: string
  smtp?: Partial<SMTPConfig>
  host?: string
  port?: number
  secure?: boolean
  user?: string
  pass?: string
  // Provider-specific settings
  gmailSettings?: {
    user?: string
    appPassword?: string
    fromName?: string
  }
  sendgridSettings?: {
    apiKey?: string
    fromEmail?: string
    fromName?: string
  }
  mailgunSettings?: {
    apiKey?: string
    domain?: string
    fromEmail?: string
    fromName?: string
  }
  customSettings?: {
    host?: string
    port?: number
    secure?: boolean
    user?: string
    password?: string
    fromEmail?: string
    fromName?: string
  }
}

type SendArgs = {
  to: string
  subject: string
  html?: string
  text?: string
}

/* -------------------------------- Utilities -------------------------------- */

function pickSMTP(settings?: EmailSettings): SMTPConfig {
  const s = settings || {}
  
  let host: string | undefined
  let port: number | undefined
  let user: string | undefined
  let pass: string | undefined
  let secure: boolean | undefined

  // Определяем настройки в зависимости от провайдера
  switch (s.provider) {
    case 'gmail': {
      const gmail = s.gmailSettings
      if (!gmail) {
        console.error('❌ Gmail settings not found')
        break
      }
      host = 'smtp.gmail.com'
      port = 587
      secure = false
      user = gmail.user
      pass = gmail.appPassword
      console.log('📧 Using Gmail SMTP:', { host, port, user: user?.substring(0, 20) + '...', secure })
      break
    }
      
    case 'sendgrid': {
      const sg = s.sendgridSettings
      if (!sg) {
        console.error('❌ SendGrid settings not found')
        break
      }
      host = 'smtp.sendgrid.net'
      port = 587
      secure = false
      user = 'apikey'
      pass = sg.apiKey
      console.log('📧 Using SendGrid SMTP:', { host, port, secure })
      break
    }
      
    case 'mailgun': {
      const mg = s.mailgunSettings
      if (!mg) {
        console.error('❌ Mailgun settings not found')
        break
      }
      host = 'smtp.mailgun.org'
      port = 587
      secure = false
      user = `postmaster@${mg.domain}`
      pass = mg.apiKey
      console.log('📧 Using Mailgun SMTP:', { host, port, domain: mg.domain, secure })
      break
    }
      
    case 'custom': {
      const custom = s.customSettings
      if (!custom) {
        console.error('❌ Custom settings not found')
        break
      }
      host = custom.host
      port = custom.port
      secure = custom.secure
      user = custom.user
      pass = custom.password
      console.log('📧 Using Custom SMTP:', { host, port, user: user?.substring(0, 20) + '...', secure })
      break
    }
      
    default: {
      // Fallback на старую логику для совместимости с ENV переменными
      console.log('📧 Using fallback/ENV SMTP config')
      const viaNested = s.smtp || {}
      host = viaNested.host ?? s.host ?? process.env.SMTP_HOST
      const portRaw = viaNested.port ?? s.port ?? process.env.SMTP_PORT
      port = typeof portRaw === 'string' ? parseInt(portRaw, 10) : (portRaw as number | undefined)
      secure = viaNested.secure ?? s.secure ?? 
        (process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465)
      user = viaNested.user ?? s.user ?? process.env.SMTP_USER
      pass = viaNested.pass ?? s.pass ?? process.env.SMTP_PASS
    }
  }

  // Проверка на полноту настроек
  if (!host || !port || !user || !pass) {
    console.error('❌ SMTP settings incomplete:', { 
      host: !!host, 
      port: !!port, 
      user: !!user, 
      pass: !!pass,
      provider: s.provider
    })
    throw new Error(
      `SMTP settings are incomplete for provider "${s.provider || 'default'}": host/port/user/pass are required (from Payload global or env).`
    )
  }

  console.log('✅ SMTP Config ready:', { host, port, user: user.substring(0, 20) + '...', secure })

  return { host, port, secure: !!secure, user, pass }
}

function fromAddress(settings?: EmailSettings): string {
  const s = settings || {}
  
  if (s.provider === 'gmail' && s.gmailSettings) {
    const gmail = s.gmailSettings
    const name = gmail.fromName || 'PhE Team'
    return `${name} <${gmail.user}>`
  }
  
  if (s.provider === 'sendgrid' && s.sendgridSettings) {
    const sg = s.sendgridSettings
    const name = sg.fromName || 'PhE Team'
    return `${name} <${sg.fromEmail}>`
  }
  
  if (s.provider === 'mailgun' && s.mailgunSettings) {
    const mg = s.mailgunSettings
    const name = mg.fromName || 'PhE Team'
    return `${name} <${mg.fromEmail}>`
  }
  
  if (s.provider === 'custom' && s.customSettings) {
    const custom = s.customSettings
    const name = custom.fromName || 'PhE Team'
    return `${name} <${custom.fromEmail}>`
  }

  return s.from || process.env.SMTP_FROM || 'no-reply@phe.tue.nl'
}

function escapeHTML(value: unknown): string {
  if (value == null) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Гибкая подстановка для любых {{key}} */
function renderAny(template: string, vars: Record<string, string | number | undefined | null>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, key: string) => {
    const val = vars[key]
    return val == null ? '' : String(val)
  })
}

/* ------------------------------- Base sender ------------------------------- */

export async function sendEmail(
  args: SendArgs,
  settings?: EmailSettings
): Promise<boolean> {
  try {
    const smtp = pickSMTP(settings)

    console.log('📤 Attempting to send email to:', args.to)
    console.log('📧 SMTP Configuration:', {
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      user: smtp.user.substring(0, 20) + '...',
    })

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: !!smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
      // Добавляем дополнительные опции для отладки
      logger: true,
      debug: true,
    })

    // Проверяем соединение перед отправкой
    await transporter.verify()
    console.log('✅ SMTP connection verified')

    const from = fromAddress(settings)
    console.log('📧 From address:', from)

    const result = await transporter.sendMail({
      from,
      to: args.to,
      subject: args.subject,
      text: args.text,
      html: args.html,
    })

    console.log('✅ Email sent successfully:', result.messageId)
    return true
  } catch (e) {
    console.error('❌ sendEmail error:', e)
    if (e instanceof Error) {
      console.error('Error message:', e.message)
      console.error('Error stack:', e.stack)
    }
    return false
  }
}

/* ------------------------------- Test email -------------------------------- */

export async function sendTestEmail(
  to: string,
  settings?: EmailSettings
): Promise<boolean> {
  console.log('🧪 Sending test email to:', to)
  return sendEmail(
    {
      to,
      subject: 'PhE — test email',
      text: 'This is a test email from phe.tue.nl',
      html: `<p>This is a <b>test email</b> from <a href="https://phe.tue.nl">phe.tue.nl</a>.</p>`,
    },
    settings
  )
}

/* ---------------------- Admin notification (HTML-rich) --------------------- */

export async function sendAdminNotification(
  formType: 'contact' | 'join',
  formData: Record<string, any>
): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail) {
    console.warn('⚠️ ADMIN_EMAIL not configured, skipping notification')
    return false
  }

  const isContact = formType === 'contact'
  const subject = isContact
    ? `📧 New Contact Form: ${formData.name}`
    : `🎓 New Application: ${formData.name}`

  const adminUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/admin/collections/${
    isContact ? 'contact-submissions' : 'join-submissions'
  }`

  const fields = Object.entries(formData)
    .filter(([key]) => key !== 'subject' && key !== 'type')
    .map(
      ([key, value]) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;text-transform:capitalize;">
            ${escapeHTML(key.replace(/([A-Z])/g, ' $1').trim())}:
          </td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#1f2937;">
            ${escapeHTML(value ?? 'N/A')}
          </td>
        </tr>
      `
    )
    .join('')

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </head>
      <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f3f4f6;">
        <div style="max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:#fff;padding:30px 20px;border-radius:8px 8px 0 0;">
            <h1 style="margin:0;font-size:24px;">
              ${isContact ? '📧 New Contact Form' : '🎓 New Join Application'}
            </h1>
            <p style="margin:8px 0 0;opacity:.9;font-size:14px;">Photonics Society Eindhoven</p>
          </div>

          <div style="background:#fff;padding:30px 20px;border-radius:0 0 8px 8px;box-shadow:0 4px 6px -1px rgba(0,0,0,.1);">
            <table style="width:100%;border-collapse:collapse;">
              ${fields}
            </table>

            <div style="margin-top:30px;text-align:center;">
              <a href="${adminUrl}"
                 style="display:inline-block;background-color:#22d3ee;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;">
                View in Admin Panel
              </a>
            </div>

            <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;color:#6b7280;font-size:12px;">
              <p style="margin:0;">This notification was sent automatically from your PhE website.</p>
              <p style="margin:8px 0 0;">
                Received at ${new Date().toLocaleString('en-GB', {
                  timeZone: 'Europe/Amsterdam',
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `You have received a new ${
    isContact ? 'contact form' : 'join application'
  }:

${Object.entries(formData)
  .filter(([key]) => key !== 'subject' && key !== 'type')
  .map(([key, value]) => `${key}: ${value}`)
  .join('\n')}

---
View in admin: ${adminUrl}
Sent from PhE Website at ${new Date().toISOString()}`

  return sendEmail({ to: adminEmail, subject, text, html })
}

/* ----------------------------- Reply to contact ---------------------------- */

/**
 * Отправляет ответ отправителю контактной формы.
 * Плейсхолдеры: {{name}}, {{email}}, {{message}} + любые из extraVars
 */
export async function sendReplyEmail(
  to: string,
  name?: string | null,
  subjectTemplate?: string | null,
  bodyTemplate?: string | null,
  originalMessage?: string | null,
  settings?: EmailSettings,
  extraVars: Record<string, string | number | null | undefined> = {}
): Promise<boolean> {
  const safeName = (name ?? '').trim()
  const safeMsg = (originalMessage ?? '').trim()

  const subject =
    (subjectTemplate && subjectTemplate.trim()) ||
    'Thank you for contacting Photonics Society Eindhoven'

  const body =
    (bodyTemplate && bodyTemplate.trim()) ||
    `Hello {{name}},

Thank you for your message to Photonics Society Eindhoven.
We have received your request and will get back to you soon.

Your message:
"{{message}}"

Best regards,
Photonics Society Eindhoven`

  const vars = {
    name: safeName,
    email: to,
    message: safeMsg,
    ...extraVars,
  }

  const textRendered = renderAny(body, vars)

  const htmlRendered = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#111827">
      ${renderAny(
        body
          .replace(/\n{2,}/g, '</p><p>')
          .replace(/\n/g, '<br/>'),
        vars
      )}
    </div>
  `

  return sendEmail(
    {
      to,
      subject: renderAny(subject, vars),
      text: textRendered,
      html: htmlRendered,
    },
    settings
  )
}

/* ---------------------------- Join: Acceptance ----------------------------- */

/**
 * Письмо об успешном вступлении/принятии заявки.
 * Можно передавать кастомные subject/body; если пусто — дефолт.
 * Поддерживает плейсхолдеры из vars ({{name}}, {{committee}}, {{role}} и т.п.).
 */
export async function sendAcceptanceEmail(
  to: string,
  name?: string | null,
  subjectTemplate?: string | null,
  bodyTemplate?: string | null,
  settings?: EmailSettings,
  extraVars: Record<string, string | number | null | undefined> = {}
): Promise<boolean> {
  const safeName = (name ?? '').trim()

  const subject =
    (subjectTemplate && subjectTemplate.trim()) ||
    'Welcome to Photonics Society Eindhoven'

  const body =
    (bodyTemplate && bodyTemplate.trim()) ||
    `Hello {{name}},

Great news — your application has been accepted!
We're excited to welcome you to Photonics Society Eindhoven.

You will receive further details shortly. If you have any questions, just reply to this email.

Best regards,
Photonics Society Eindhoven`

  const vars = { name: safeName, email: to, ...extraVars }

  const textRendered = renderAny(body, vars)
  const htmlRendered = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#111827">
      ${renderAny(
        body.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br/>'),
        vars
      )}
    </div>
  `

  return sendEmail(
    {
      to,
      subject: renderAny(subject, vars),
      text: textRendered,
      html: htmlRendered,
    },
    settings
  )
}

/* ---------------------------- Join: Rejection ------------------------------ */

/**
 * Письмо-отказ по заявке (на случай, если используется где-то ещё).
 */
export async function sendRejectionEmail(
  to: string,
  name?: string | null,
  subjectTemplate?: string | null,
  bodyTemplate?: string | null,
  settings?: EmailSettings,
  extraVars: Record<string, string | number | null | undefined> = {}
): Promise<boolean> {
  const safeName = (name ?? '').trim()

  const subject =
    (subjectTemplate && subjectTemplate.trim()) ||
    'Your application status — Photonics Society Eindhoven'

  const body =
    (bodyTemplate && bodyTemplate.trim()) ||
    `Hello {{name}},

Thank you for your interest in Photonics Society Eindhoven.
After careful consideration, we won't be moving forward at this time.

We truly appreciate your time and wish you all the best.
You're welcome to apply again in the future.

Best regards,
Photonics Society Eindhoven`

  const vars = { name: safeName, email: to, ...extraVars }

  const textRendered = renderAny(body, vars)
  const htmlRendered = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#111827">
      ${renderAny(
        body.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br/>'),
        vars
      )}
    </div>
  `

  return sendEmail(
    {
      to,
      subject: renderAny(subject, vars),
      text: textRendered,
      html: htmlRendered,
    },
    settings
  )
}