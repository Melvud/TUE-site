import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, subject, ...formData } = body

    const payload = await getPayload({ config })

    // Определяем коллекцию по типу формы
    if (type === 'contact') {
      // Сохраняем в ContactSubmissions
      const submission = await payload.create({
        collection: 'contact-submissions',
        data: {
          name: formData.name || 'Anonymous',
          email: formData.email || '',
          message: formData.message || '',
          formData: formData,
          status: 'new',
        },
      })

      console.log('Contact submission saved:', submission.id)

      // 📧 Отправляем уведомление администратору
      try {
        const { sendAdminNotification } = await import('@/lib/email')
        await sendAdminNotification('contact', formData)
      } catch (emailError) {
        console.error('Failed to send admin notification:', emailError)
        // Не прерываем выполнение, форма всё равно сохранена
      }

      return NextResponse.json({ 
        success: true, 
        id: submission.id,
        message: 'Thank you for contacting us! We will reply soon.' 
      })
    }

    if (type === 'join') {
      // Сохраняем в JoinSubmissions
      const submission = await payload.create({
        collection: 'join-submissions',
        data: {
          name: formData.name || 'Anonymous',
          email: formData.email || '',
          formData: formData,
          status: 'pending',
        },
      })

      console.log('Join submission saved:', submission.id)

      // 📧 Отправляем уведомление администратору
      try {
        const { sendAdminNotification } = await import('@/lib/email')
        await sendAdminNotification('join', formData)
      } catch (emailError) {
        console.error('Failed to send admin notification:', emailError)
        // Не прерываем выполнение, форма всё равно сохранена
      }

      return NextResponse.json({ 
        success: true, 
        id: submission.id,
        message: 'Thank you for applying! We will review your application soon.' 
      })
    }

    // Fallback для других типов форм
    console.log('Form submission (not saved to DB):', body)
    
    return NextResponse.json({ 
      success: true,
      message: 'Form submitted successfully.' 
    })

  } catch (error) {
    console.error('Form submission error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to submit form',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}