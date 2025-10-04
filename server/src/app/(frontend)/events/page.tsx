import { getPayload } from 'payload'
import config from '@payload-config'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import EventHero from '@/components/EventHero'

export const dynamic = 'force-dynamic'

/** Robust local date parser:
 *  - YYYY-MM-DD
 *  - YYYY-MM-DD HH:mm[:ss]
 *  - DD.MM.YYYY
 *  - MM/DD/YYYY
 *  - fallback to native Date
 */
function parseDateSafe(input?: string): Date | null {
  if (!input) return null
  const s = String(input).trim()

  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(s)
  if (iso) {
    const [, y, m, d, hh = '0', mm = '0', ss = '0'] = iso
    const dt = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss))
    return isNaN(+dt) ? null : dt
  }

  const eu = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s)
  if (eu) {
    const [, d, m, y] = eu
    const dt = new Date(Number(y), Number(m) - 1, Number(d))
    return isNaN(+dt) ? null : dt
  }

  const us = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s)
  if (us) {
    const [, m, d, y] = us
    const dt = new Date(Number(y), Number(m) - 1, Number(d))
    return isNaN(+dt) ? null : dt
  }

  const d = new Date(s)
  return isNaN(+d) ? null : d
}

/** Normalize to local midnight for stable "past vs upcoming" split */
function ymd(d: Date) {
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return local.getTime()
}

function formatHuman(d: Date, locale = 'en-US') {
  try {
    return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: '2-digit' })
  } catch {
    return d.toISOString().slice(0, 10)
  }
}

/** Small card used in the monthly "Upcoming" calendar */
function SmallEventCard({ ev }: { ev: any }) {
  const dt = parseDateSafe(ev?.date)
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
        {dt && <div className="text-sm text-cyan-400 mb-1">{formatHuman(dt, 'en-US')}</div>}
        <h4 className="text-lg font-semibold text-white">{ev?.title}</h4>
      </div>
    </Link>
  )
}

type Grouped = Record<string, { label: string; year: number; month: number; items: any[] }>

export default async function EventsPage() {
  const { isEnabled } = await draftMode()
  const payload = await getPayload({ config })

  // Load with depth:1 so cover comes as object with url (needed for cards & hero)
  const res = await payload.find({
    collection: 'events',
    limit: 500,
    depth: 1,
    draft: isEnabled,
    sort: '-date',
  })

  const raw = (res?.docs ?? []) as any[]

  // Split by date
  const todayKey = ymd(new Date())
  const upcoming: Array<{ doc: any; dt: Date }> = []
  const past: Array<{ doc: any; dt: Date }> = []

  for (const doc of raw) {
    const dt = parseDateSafe(doc?.date)
    if (!dt) continue
    if (ymd(dt) >= todayKey) upcoming.push({ doc, dt })
    else past.push({ doc, dt })
  }

  // Featured (big hero): marked 'latest' or closest upcoming
  let featured: any | undefined
  const marked = upcoming.find(({ doc }) => doc?.latest)
  if (marked) {
    featured = marked.doc
  } else if (upcoming.length) {
    featured = [...upcoming].sort((a, b) => +a.dt - +b.dt)[0].doc
  }

  // Sort upcoming by date asc (we will still include featured in month groups)
  const upcomingSorted = [...upcoming].sort((a, b) => +a.dt - +b.dt)

  // Group by month/year — ONLY months that have events
  const grouped: Grouped = {}
  for (const { doc, dt } of upcomingSorted) {
    const year = dt.getFullYear()
    const month = dt.getMonth()
    const key = `${year}-${String(month + 1).padStart(2, '0')}`
    const label = dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    if (!grouped[key]) grouped[key] = { label, year, month, items: [] }
    grouped[key].items.push(doc)
  }

  // Past events — newest first
  past.sort((a, b) => +b.dt - +a.dt)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-center text-3xl sm:text-4xl font-extrabold tracking-tight mb-8">
        Events
      </h1>

      {/* Featured (big) */}
      {featured && (
        <EventHero event={featured} className="mb-12" showBottomRegister={false} />
      )}

      {/* Upcoming — calendar by months (cards). Only months that actually have events. */}
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

      {/* Past — plain rows (date + title), no images */}
      <section className="mb-4">
        <h2 className="text-center text-2xl font-bold mb-6">Past Events</h2>
        {past.length === 0 ? (
          <p className="text-center text-slate-400">No past events.</p>
        ) : (
          <ul className="space-y-3">
            {past.map(({ doc, dt }) => (
              <li key={doc?.slug || String(doc?.id)} className="text-center">
                <Link
                  href={`/events/${doc?.slug || doc?.id}`}
                  className="group inline-flex items-baseline gap-3 hover:text-cyan-300 transition-colors"
                >
                  <span className="text-sm text-slate-500">
                    {dt ? formatHuman(dt, 'en-US') : ''}
                  </span>
                  <span className="text-base font-medium group-hover:underline">
                    {doc?.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
