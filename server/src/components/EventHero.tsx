import Link from 'next/link'
import { formatEuropeanDate, isPastDate } from '@/lib/dateUtils'

type EventType = {
  id?: string | number
  slug?: string
  title: string
  date?: string
  summary?: string
  description?: string
  cover?: { url?: string } | string | null
  coverUrl?: string
  image?: string
  images?: string[]
  googleFormUrl?: string
}

type Props = {
  event: EventType | null | undefined
  className?: string
  showBottomRegister?: boolean
}

export default function EventHero({
  event,
  className,
  showBottomRegister = false, // Изменили на false по умолчанию
}: Props) {
  if (!event) return null

  // Форматируем дату в европейский формат
  const formattedDate = formatEuropeanDate(event.date, 'en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Проверяем, прошло ли событие
  const isEventPast = isPastDate(event.date)

  const coverFromObject =
    typeof event.cover === 'object' && event.cover?.url ? event.cover.url : ''
  const img = coverFromObject || event.coverUrl || event.image || event.images?.[0] || ''

  const to =
    event?.slug ? `/events/${event.slug}` :
    event?.id   ? `/events/${event.id}`   :
    undefined

  const desc = event.summary || event.description || ''

  return (
    <section className={className ?? ''}>
      <div className="text-center px-4 sm:px-6 max-w-5xl mx-auto">
        {formattedDate && (
          <div className="text-cyan-400 font-semibold tracking-wide mb-3">
            <time dateTime={event.date}>{formattedDate}</time>
          </div>
        )}

        {to ? (
          <Link href={to} className="inline-block group">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight group-hover:text-cyan-200 transition-colors">
              {event.title}
            </h1>
          </Link>
        ) : (
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight">
            {event.title}
          </h1>
        )}

        {desc && (
          <p className="mt-5 text-lg sm:text-xl md:text-2xl text-slate-300 leading-relaxed">
            {desc}
          </p>
        )}

        {/* Показываем кнопки только если событие НЕ прошло */}
        {!isEventPast && (
          <div className="mt-6 flex items-center justify-center gap-3">
            {event.googleFormUrl && (
              <a
                href={event.googleFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-6 py-3 text-white font-semibold hover:bg-cyan-400 transition"
              >
                Register for event
              </a>
            )}
            {to && (
              <Link
                href={to}
                className="inline-flex items-center justify-center rounded-xl border border-slate-600 px-6 py-3 text-slate-200 hover:bg-slate-700/60 transition"
              >
                Details
              </Link>
            )}
          </div>
        )}

        {/* Для прошедших событий показываем только кнопку Details */}
        {isEventPast && to && (
          <div className="mt-6">
            <Link
              href={to}
              className="inline-flex items-center justify-center rounded-xl border border-slate-600 px-6 py-3 text-slate-200 hover:bg-slate-700/60 transition"
            >
              View Details
            </Link>
          </div>
        )}
      </div>

      <div className="mt-8 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 max-w-3xl mx-auto">
        {img ? (
          to ? (
            <Link href={to} aria-label={event.title}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={event.title}
                className="w-full h-auto object-cover hover:opacity-95 transition"
                loading="lazy"
              />
            </Link>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={event.title}
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          )
        ) : (
          <div className="aspect-[21/9] w-full bg-slate-800" />
        )}
      </div>

      {/* Убрали нижнюю кнопку регистрации */}
    </section>
  )
}