// src/pages/EventDetailPage.tsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';

const fmtDate = (d?: string) => {
  if (!d) return '';
  const dd = new Date(d);
  if (isNaN(+dd)) return d;
  return dd.toISOString().slice(0, 10);
};

const EventDetailPage: React.FC = () => {
  const { id } = useParams();
  const { events } = useData() as any;

  const event =
    (events || []).find((e: any) => String(e.id) === String(id)) || null;

  if (!event) {
    return (
      <div className="min-h-[60vh] bg-slate-900 text-slate-200 grid place-items-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Event not found</h1>
          <p className="mt-2 text-slate-400">
            It might have been removed or is not published yet.
          </p>
          <Link to="/events" className="mt-6 inline-block text-cyan-400 hover:text-cyan-300">
            ← Back to events
          </Link>
        </div>
      </div>
    );
  }

  const dateStr = fmtDate(event.date);
  const cover = event.coverUrl || event.image || event.images?.[0];

  return (
    <div className="bg-slate-900 text-slate-100">
      {/* ======= Title block (center, medium-large) ======= */}
      <header className="pt-28 pb-10 text-center">
        <h1
          className="
            font-extrabold leading-[1.08] tracking-tight
            w-full block
            text-4xl sm:text-5xl md:text-6xl lg:text-7xl
          "
        >
          {event.title}
        </h1>
        {dateStr && (
          <p className="mt-4 text-base sm:text-lg text-slate-400">{dateStr}</p>
        )}

        {/* верхняя кнопка регистрации */}
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

      {/* ======= Cover image ======= */}
      {cover && (
        <div className="max-w-6xl mx-auto px-4">
          <img
            src={cover}
            alt={event.title}
            className="w-full h-auto rounded-2xl border border-slate-700"
            loading="lazy"
          />
        </div>
      )}

      {/* ======= Content ======= */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Удалено: краткое описание (summary) под превью */}

        {event.content && (
          <article
            className="prose prose-invert max-w-none mt-10 prose-img:rounded-lg prose-a:text-cyan-300"
            dangerouslySetInnerHTML={{ __html: event.content }}
          />
        )}

        {/* нижняя кнопка регистрации */}
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
  );
};

export default EventDetailPage;
