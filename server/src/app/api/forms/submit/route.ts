import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Здесь добавьте отправку email через nodemailer или другой сервис
    console.log('Form submission:', body)
    
    // Пример простого ответа
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to submit form' },
      { status: 500 }
    )
  }
}