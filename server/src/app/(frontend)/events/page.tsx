import { getPayload } from 'payload'
import config from '@payload-config'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import EventHero from '@/components/EventHero'
import { 
  formatEuropeanDate, 
  isPastDate, 
  getDateSortKey 
} from '@/lib/dateUtils'

export const dynamic = 'force-dynamic'

function SmallEventCard({ ev }: { ev: any }) {
  const formattedDate = formatEuropeanDate(ev?.date, 'en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const img =
    (typeof ev?.cover === 'object' && ev?.cover?.url ? ev.cover.url : '') ||
    ev?.coverUrl ||
    ev?.image ||
    (Array.isArray(ev?.images) ? ev.images[0] : '') ||
    ''

  return (
    <Link
      href={`/events/${ev?.slug || ev?.id}`}
      className="block rounded-2xl border border-slate-700 bg-slate-900 hover:bg-slate-800/60 transition overflow-hidden"
    >
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img}
          alt={ev?.title || 'Event cover'}
          className="w-full h-40 object-cover"
          loading="lazy"
        />
      ) : null}
      <div className="p-4">
        {formattedDate && (
          <div className="text-sm text-cyan-400 mb-1">{formattedDate}</div>
        )}
        <h4 className="text-lg font-semibold text-white">{ev?.title}</h4>
      </div>
    </Link>
  )
}

type Grouped = Record<string, { label: string; year: number; month: number; items: any[] }>

export default async function EventsPage() {
  const { isEnabled } = await draftMode()
  const payload = await getPayload({ config })

  const res = await payload.find({
    collection: 'events',
    limit: 500,
    depth: 1,
    draft: isEnabled,
    sort: '-date',
  })

  const raw = (res?.docs ?? []) as any[]

  // Разделяем на upcoming и past используя европейскую timezone
  const upcoming: any[] = []
  const past: any[] = []

  for (const doc of raw) {
    if (isPastDate(doc?.date)) {
      past.push(doc)
    } else {
      upcoming.push(doc)
    }
  }

  // Featured: помеченный как latest или ближайший upcoming
  let featured: any | undefined
  const marked = upcoming.find((doc) => doc?.latest)
  if (marked) {
    featured = marked
  } else if (upcoming.length) {
    // Сортируем upcoming по дате (ближайшие первыми)
    featured = [...upcoming].sort(
      (a, b) => getDateSortKey(a.date) - getDateSortKey(b.date)
    )[0]
  }

  // Сортируем upcoming по дате (ближайшие первыми)
  const upcomingSorted = [...upcoming].sort(
    (a, b) => getDateSortKey(a.date) - getDateSortKey(b.date)
  )

  // Группируем по месяцам
  const grouped: Grouped = {}
  for (const doc of upcomingSorted) {
    if (!doc?.date) continue

    const date = new Date(doc.date)
    if (isNaN(date.getTime())) continue

    const year = date.getUTCFullYear()
    const month = date.getUTCMonth()
    const key = `${year}-${String(month + 1).padStart(2, '0')}`
    
    const label = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Amsterdam',
      month: 'long',
      year: 'numeric',
    }).format(date)

    if (!grouped[key]) {
      grouped[key] = { label, year, month, items: [] }
    }
    grouped[key].items.push(doc)
  }

  // Past events - сортируем от новых к старым
  past.sort((a, b) => getDateSortKey(b.date) - getDateSortKey(a.date))

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-center text-3xl sm:text-4xl font-extrabold tracking-tight mb-8">
        Events
      </h1>

      {/* Featured */}
      {featured && (
        <EventHero event={featured} className="mb-12" showBottomRegister={false} />
      )}

      {/* Upcoming - по месяцам */}
      <section className="mb-16">
        <h2 className="text-center text-2xl font-bold mb-6">Upcoming Events</h2>

        {Object.keys(grouped).length === 0 && !featured ? (
          <p className="text-center text-slate-400">No upcoming events.</p>
        ) : (
          Object.keys(grouped)
            .sort((a, b) => {
              const [ya, ma] = a.split('-').map(Number)
              const [yb, mb] = b.split('-').map(Number)
              if (ya !== yb) return ya - yb
              return ma - mb
            })
            .map((key) => {
              const bucket = grouped[key]
              return (
                <div key={key} className="mb-10">
                  <h3 className="text-center text-xl font-semibold mb-4">
                    {bucket.label}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {bucket.items.map((ev: any) => (
                      <SmallEventCard key={ev?.slug || String(ev?.id)} ev={ev} />
                    ))}
                  </div>
                </div>
              )
            })
        )}
      </section>

      {/* Past events */}
      <section className="mb-4">
        <h2 className="text-center text-2xl font-bold mb-6">Past Events</h2>
        {past.length === 0 ? (
          <p className="text-center text-slate-400">No past events.</p>
        ) : (
          <ul className="space-y-3">
            {past.map((doc) => {
              const formattedDate = formatEuropeanDate(doc?.date, 'en-GB', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })

              return (
                <li key={doc?.slug || String(doc?.id)} className="text-center">
                  <Link
                    href={`/events/${doc?.slug || doc?.id}`}
                    className="group inline-flex items-baseline gap-3 hover:text-cyan-300 transition-colors"
                  >
                    <span className="text-sm text-slate-500">
                      {formattedDate}
                    </span>
                    <span className="text-base font-medium group-hover:underline">
                      {doc?.title}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}