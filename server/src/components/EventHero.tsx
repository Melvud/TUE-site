import Link from 'next/link'

type Props = {
  event: {
    id?: string | number
    slug?: string
    title: string
    date?: string
    summary?: string
    cover?: any
    googleFormUrl?: string
  }
  className?: string
  showBottomRegister?: boolean
}

export default function EventHero({ event, className, showBottomRegister = true }: Props) {
  const coverUrl = typeof event.cover === 'object' && event.cover?.url ? event.cover.url : ''
  const href = event.slug ? `/events/${event.slug}` : '#'

  return (
    <><section className={className ?? ''}>
          <div className="text-center px-4 sm:px-6 max-w-5xl mx-auto">
              {event.date && (
                  <div className="text-cyan-400 font-semibold tracking-wide mb-3">{event.date}</div>
              )}

              <Link href={href} className="inline-block group">
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight group-hover:text-cyan-200 transition-colors">
                      {event.title}
                  </h1>
              </Link>

              {event.summary && (
                  <p className="mt-5 text-lg sm:text-xl md:text-2xl text-slate-300 leading-relaxed">
                      {event.summary}
                  </p>
              )}

              <div className="mt-6 flex items-center justify-center gap-3">
                  {event.googleFormUrl && (

                      href = { event,: .googleFormUrl })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-6 py-3 text-white font-semibold hover:bg-cyan-400 transition"
                  >
                  Register for event
              </a>
              )}
              <Link
                  href={href}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-600 px-6 py-3 text-slate-200 hover:bg-slate-700/60 transition"
              >
                  Details
              </Link>
          </div>
      </div><div className="mt-8 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 max-w-6xl mx-auto">
              {coverUrl ? (
                  <Link href={href}>
                      <img src={coverUrl} alt={event.title} className="w-full h-auto object-cover hover:opacity-95 transition" />
                  </Link>
              ) : (
                  <div className="aspect-[21/9] w-full bg-slate-800" />
              )}
          </div></>

      {showBottomRegister && event.googleFormUrl && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 text-center">
          
            href={event.googleFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-6 py-3 text-white font-semibold hover:bg-cyan-400 transition"
          >
            Register for event
          </a>
        </div>
      )}
    </section>
  )
}