import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { type, subject, ...formData } = data

    console.log('📝 Form submission:', { type, subject, formData })

    const payload = await getPayload({ config })

    // Получаем настройки email
    const emailSettings = await payload.findGlobal({
      slug: 'email-settings',
    })

    console.log('📧 Email enabled:', emailSettings.enabled)

    if (type === 'contact') {
      // Сохраняем контактную форму
      const submission = await payload.create({
        collection: 'contact-submissions',
        data: {
          name: formData.name,
          email: formData.email,
          message: formData.message,
          formData,
        },
      })

      console.log('✅ Contact submission saved:', submission.id)

      // Отправляем уведомление админу
      if (emailSettings.enabled) {
        try {
          const { sendAdminNotification } = await import('@/lib/email')
          await sendAdminNotification('contact', formData)
          console.log('✅ Admin notification sent')
        } catch (emailError) {
          console.error('❌ Failed to send admin notification:', emailError)
          // Не прерываем процесс, если email не отправился
        }
      }

      return NextResponse.json({ success: true, id: submission.id })
    }

    if (type === 'join') {
      // Сохраняем заявку на вступление
      const submission = await payload.create({
        collection: 'join-submissions',
        data: {
          name: formData.name,
          email: formData.email,
          formData,
          status: 'pending',
        },
      })

      console.log('✅ Join submission saved:', submission.id)

      // Отправляем уведомление админу
      if (emailSettings.enabled) {
        try {
          const { sendAdminNotification } = await import('@/lib/email')
          await sendAdminNotification('join', formData)
          console.log('✅ Admin notification sent')
        } catch (emailError) {
          console.error('❌ Failed to send admin notification:', emailError)
          // Не прерываем процесс, если email не отправился
        }
      }

      return NextResponse.json({ success: true, id: submission.id })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid form type' },
      { status: 400 }
    )
  } catch (error) {
    console.error('❌ Form submission error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Submission failed',
      },
      { status: 500 }
    )
  }
}