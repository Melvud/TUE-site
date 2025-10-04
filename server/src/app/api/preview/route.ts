import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const redirectUrl = searchParams.get('redirect')
  const secret = searchParams.get('secret')

  // Проверка секрета (опционально)
  if (secret && secret !== process.env.PAYLOAD_SECRET) {
    return new Response('Invalid token', { status: 401 })
  }

  // Включаем draft mode
  const draft = await draftMode()
  draft.enable()

  // Редирект на нужную страницу
  const finalUrl = redirectUrl || '/'
  redirect(finalUrl)
}