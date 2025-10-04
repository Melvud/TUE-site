import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  const secret = searchParams.get('secret')

  // Проверка секрета (опционально)
  if (secret !== process.env.PAYLOAD_SECRET) {
    return new Response('Invalid token', { status: 401 })
  }

  if (!url) {
    return new Response('No URL provided', { status: 400 })
  }

  const draft = await draftMode()
  draft.enable()

  redirect(url)
}