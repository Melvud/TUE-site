import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const redirectUrl = searchParams.get('redirect')

  // Проверка секрета
  if (secret !== process.env.PAYLOAD_SECRET) {
    return new Response('Invalid token', { status: 401 })
  }

  if (!redirectUrl) {
    return new Response('No redirect URL provided', { status: 400 })
  }

  // Включаем draft mode
  const draft = await draftMode()
  draft.enable()

  // Редиректим на запрошенный URL
  redirect(redirectUrl)
}