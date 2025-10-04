import { getPayload } from 'payload'
import config from '@payload-config'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { serializeLexical } from '@/lib/serializeLexical'

export const dynamic = 'force-dynamic'

export default async function EventDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const { slug } = params
  const { isEnabled } = await draftMode()
  const payload = await getPayload({ config })

  const events = await payload.find({
    collection: 'events',
    where: { slug: { equals: slug } },
    limit: 1,
    draft: isEnabled,
  })

  const event: any = events.docs[0]
  if (!event) {
    notFound()
  }

  const coverUrl =
    typeof event.cover === 'object' && event.cover?.url ? event.cover.url : ''
  const contentHtml = serializeLexical(event.content)

  return (
    <div className="bg-slate-900 text-slate-100">
      <header className="pt-28 pb-10 text-center">
        <h1 className="font-extrabold leading-[1.08] tracking-tight text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
          {event.title}
        </h1>
        {event.date && (
          <p className="mt-4 text-base sm:text-lg text-slate-400">{event.date}</p>
        )}

        {event.googleFormUrl && (
          <div className="mt-6">
            <a
              href={event.googleFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-6 py-3 text-white font-semibold hover:bg-cyan-400 transition"
            >
              Register for event
            </a>
          </div>
        )}
      </header>

      {coverUrl && (
        <div className="max-w-6xl mx-auto px-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt={event.title}
            className="w-full h-auto rounded-2xl border border-slate-700"
          />
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 sm:px-6">
        {contentHtml && (
          <article
            className="prose prose-invert max-w-none mt-10"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        )}

        {event.googleFormUrl && (
          <div className="mt-12 mb-16 text-center">
            <a
              href={event.googleFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-6 py-3 text-white font-semibold hover:bg-cyan-400 transition"
            >
              Register for event
            </a>
          </div>
        )}
      </main>
    </div>
  )
}
