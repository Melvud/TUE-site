import React from 'react';
import { Link } from 'react-router-dom';

type EventType = {
  id?: string | number;
  title: string;
  date?: string;
  summary?: string;
  description?: string;
  coverUrl?: string;
  image?: string;
  images?: string[];
  googleFormUrl?: string;
};

type Props = {
  event: EventType | null | undefined;
  className?: string;
  /** Показывать вторую (нижнюю) кнопку "Register for event" под картинкой */
  showBottomRegister?: boolean;
};

const EventHero: React.FC<Props> = ({ event, className, showBottomRegister = true }) => {
  if (!event) return null;

  const dateStr = (() => {
    try {
      if (!event.date) return '';
      const d = new Date(event.date);
      if (isNaN(+d)) return event.date;
      return d.toISOString().slice(0, 10);
    } catch {
      return event.date || '';
    }
  })();

  const img = event.coverUrl || event.image || event.images?.[0] || '';
  const desc = event.summary || event.description || '';
  const to = event?.id ? `/events/${event.id}` : undefined;

  return (
    <section className={className ?? ''}>
      <div className="text-center px-4 sm:px-6 max-w-5xl mx-auto">
        {dateStr && (
          <div className="text-cyan-400 font-semibold tracking-wide mb-3">
            {dateStr}
          </div>
        )}

        {/* Заголовок кликабельный */}
        {to ? (
          <Link to={to} className="inline-block group">
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
              to={to}
              className="inline-flex items-center justify-center rounded-xl border border-slate-600 px-6 py-3 text-slate-200 hover:bg-slate-700/60 transition"
            >
              Details
            </Link>
          )}
        </div>
      </div>

      {/* Обложка кликабельная */}
      <div className="mt-8 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 max-w-6xl mx-auto">
        {img ? (
          to ? (
            <Link to={to} aria-label={event.title}>
              <img
                src={img}
                alt={event.title}
                className="w-full h-auto object-cover hover:opacity-95 transition"
                loading="lazy"
              />
            </Link>
          ) : (
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

      {/* Нижняя кнопка регистрации — управляется пропом */}
      {showBottomRegister && event.googleFormUrl && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 text-center">
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
    </section>
  );
};

export default EventHero;
