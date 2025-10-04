import { getPayload } from 'payload'
import config from '@payload-config'
import { draftMode } from 'next/headers'
import Section from '@/components/Section'
import EventHero from '@/components/EventHero'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function parseDateRange(input: string) {
  const raw = input.trim()
  let a = raw, b = ''
  
  if (raw.includes('..')) {
    [a, b] = raw.split('..').map(x => x.trim())
  } else if (raw.includes(' - ')) {
    [a, b] = raw.split(' - ').map(x => x.trim())
  }
  
  const start = new Date(a)
  if (!Number.isFinite(+start)) return null
  
  const end = b ? new Date(b) : start
  const validEnd = Number.isFinite(+end) ? end : start
  
  return { start, end: validEnd }
}

export default async function EventsPage() {
  const { isEnabled } = await draftMode()
  const payload = await getPayload({ config })

  const eventsData = await payload.find({
    collection: 'events',
    limit: 100,
    sort: 'date',
    draft: isEnabled,
    where: isEnabled ? undefined : { published: { equals: true } },
  })

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const upcoming = eventsData.docs
    .map((e: any) => {
      const range = parseDateRange(e.date)
      return range ? { ...e, range } : null
    })
    .filter((e: any) => e && e.range.end >= now)

  const nextEvent = upcoming[0] || null

  return (
    <div className="bg-slate-900">
      <div className="relative pt-28 pb-8 text-center text-white">
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight">PhE Events</h1>
        <p className="text-2xl text-slate-300 mt-4">Discover upcoming events.</p>
      </div>

      {nextEvent && (
        <Section>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white text-center mb-6">Next Event</h2>
          <EventHero event={nextEvent} showBottomRegister={false} />
        </Section>
      )}

      <Section>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white text-center mb-6">Upcoming Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {upcoming.map((event: any) => {
            const coverUrl = typeof event.cover === 'object' && event.cover?.url ? event.cover.url : ''
            return (
              <Link key={event.id} href={`/events/${event.slug}`} className="block">
                <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:-translate-y-2 transition-transform">
                  {coverUrl && <img src={coverUrl} alt={event.title} className="w-full h-56 object-cover" />}
                  <div className="p-6">
                    <p className="text-cyan-400 text-sm font-semibold mb-2">{event.date}</p>
                    <h3 className="text-xl font-bold text-white mb-3">{event.title}</h3>
                    {event.summary && <p className="text-slate-400 line-clamp-3">{event.summary}</p>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </Section>
    </div>
  )
}