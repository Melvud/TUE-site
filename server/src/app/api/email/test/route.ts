import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: Request) {
  try {
    const { to } = await request.json()

    if (!to) {
      return NextResponse.json(
        { success: false, error: 'Email address is required' },
        { status: 400 }
      )
    }

    console.log('🧪 Test email request for:', to)

    const payload = await getPayload({ config })

    // Получаем настройки email
    const settings = await payload.findGlobal({
      slug: 'email-settings',
    })

    console.log('📧 Email settings from DB:', JSON.stringify({
      enabled: settings.enabled,
      provider: (settings as any).provider,
      hasGmailSettings: !!(settings as any).gmailSettings,
      gmailUser: (settings as any).gmailSettings?.user,
    }, null, 2))

    if (!settings.enabled) {
      return NextResponse.json(
        { success: false, error: 'Email sending is disabled. Enable it in settings.' },
        { status: 400 }
      )
    }

    // Динамический импорт email утилиты
    const { sendTestEmail } = await import('@/lib/email')

    const success = await sendTestEmail(to, settings as any)

    if (success) {
      console.log('✅ Test email sent successfully')
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${to}`,
      })
    } else {
      console.error('❌ Failed to send test email')
      return NextResponse.json(
        { success: false, error: 'Failed to send test email. Check server logs for details.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ Test email error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}