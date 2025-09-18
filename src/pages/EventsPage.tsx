import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Section from '../components/Section';
import { useData } from '../context/DataContext';
import EventHero from '../components/EventHero';

type DateRange = { start: Date; end: Date; startMs: number; endMs: number };

function parseDateRange(input: any): DateRange | null {
  if (!input) return null;
  const raw = String(input).trim();

  // поддержка "YYYY-MM-DD..YYYY-MM-DD" (рекомендуемый формат),
  // а также "YYYY-MM-DD - YYYY-MM-DD" (с пробелами вокруг дефиса)
  let a = raw;
  let b = '';
  if (raw.includes('..')) {
    const [s, e] = raw.split('..').map((x) => x.trim());
    a = s; b = e || '';
  } else if (raw.includes(' - ')) {
    const [s, e] = raw.split(' - ').map((x) => x.trim());
    a = s; b = e || '';
  }

  const start = new Date(a);
  if (!Number.isFinite(+start)) return null;
  const end = b ? new Date(b) : start;
  const validEnd = Number.isFinite(+end) ? end : start;

  const s = new Date(start); s.setHours(0, 0, 0, 0);
  const e = new Date(validEnd); e.setHours(23, 59, 59, 999);

  return { start: s, end: e, startMs: s.getTime(), endMs: e.getTime() };
}

function formatMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function formatMonthTitle(d: Date) {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(d);
}
// Полная дата: "1 September 2025" или диапазон "1–4 September 2025" (или "30 September 2025 – 2 October 2025", если месяцы/годы разные)
function formatFullDateRange(r: DateRange) {
  const sameYear = r.start.getFullYear() === r.end.getFullYear();
  const sameMonth = sameYear && r.start.getMonth() === r.end.getMonth();
  if (r.startMs === r.endMs) {
    return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', year: 'numeric' }).format(r.start);
  }
  if (sameMonth) {
    const dayFrom = r.start.getDate();
    const dayTo = r.end.getDate();
    const tail = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(r.start);
    return `${dayFrom}–${dayTo} ${tail}`;
  }
  const fmt = (d: Date) => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  return `${fmt(r.start)} – ${fmt(r.end)}`;
}

const EventsPage: React.FC = () => {
  const { events } = useData() as any;

  const {
    nextEvent,
    calendarGroups,
  } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const nowMs = now.getTime();

    const safeEvents = (Array.isArray(events) ? events : []).filter(Boolean);

    const augmented = safeEvents.map((e: any) => {
      const range = parseDateRange(e?.date);
      return range ? { event: e, range } : null;
    }).filter(Boolean) as { event: any; range: DateRange }[];

    // ближайший — у кого start >= сегодня (или идёт сейчас), минимальный start
    const upcomingForNext = augmented
      .filter((x) => x.range.endMs >= nowMs) // и будущие, и текущие
      .sort((a, b) => a.range.startMs - b.range.startMs);

    const nextEvent = upcomingForNext[0]?.event || null;

    // календарь — только будущие/текущие
    const calendarBase = upcomingForNext;

    const groupsMap = new Map<string, { month: Date; items: { e: any; r: DateRange }[] }>();
    for (const { event: e, range: r } of calendarBase) {
      const key = formatMonthKey(r.start);
      if (!groupsMap.has(key)) groupsMap.set(key, { month: new Date(r.start), items: [] });
      groupsMap.get(key)!.items.push({ e, r });
    }

    const calendarGroups = Array.from(groupsMap.values())
      .sort((a, b) => a.month.getTime() - b.month.getTime())
      .map((g) => ({
        title: formatMonthTitle(g.month),
        items: g.items.sort((a, b) => a.r.startMs - b.r.startMs),
      }));

    return { nextEvent, calendarGroups };
  }, [events]);

  return (
    <div className="bg-slate-900">
      {/* Топ заголовок страницы — немного больше */}
      <div className="relative pt-28 pb-8 text-center text-white">
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight">PhE Events</h1>
        <p className="text-2xl text-slate-300 mt-4">Discover upcoming events.</p>
      </div>

      {/* Next Event — кастомный заголовок секции побольше, сама карточка ивента чуть меньше */}
      {nextEvent && (
        <Section>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white text-center mb-6">Next Event</h2>
          <div className="max-w-6xl mx-auto origin-top scale-[.96] md:scale-[.93] lg:scale-90">
            <EventHero event={nextEvent} showBottomRegister={false} />
          </div>
        </Section>
      )}

      {/* Upcoming Events — заголовок секции тоже чуть крупнее */}
      <Section>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white text-center mb-6">Upcoming Events</h2>

        {calendarGroups.length === 0 ? (
          <div className="text-slate-400 text-center">No upcoming events yet.</div>
        ) : (
          <div className="space-y-12">
            {calendarGroups.map((group) => (
              <div key={group.title}>
                {/* Заголовок месяца — немного побольше */}
                <div className="text-center text-2xl md:text-3xl font-bold text-white">{group.title}</div>

                {/* Ряд карточек месяца — сами карточки немного крупнее, по центру */}
                <div className="mt-6 flex flex-wrap items-stretch justify-center gap-6">
                  {group.items.map(({ e, r }) => {
                    const to = e?.id ? `/events/${e.id}` : undefined;
                    const fullDate = formatFullDateRange(r);
                    const img = e?.coverUrl || e?.image || '';

                    const content = (
                      <div className="w-[min(100%,380px)] rounded-2xl border border-slate-700 bg-slate-800/40 p-5 hover:bg-slate-800 transition">
                        {/* Название сверху */}
                        <div className="text-lg md:text-xl font-semibold text-white text-center leading-snug">
                          {e?.title}
                        </div>

                        {/* Небольшая превью-картинка */}
                        {img ? (
                          <img
                            src={img}
                            alt={e?.title || 'event cover'}
                            className="mt-3 w-full h-32 md:h-36 object-cover rounded-lg border border-slate-700"
                            loading="lazy"
                          />
                        ) : null}

                        {/* Полная дата снизу */}
                        <div className="mt-3 text-center text-sm md:text-base text-slate-300">
                          {fullDate}
                        </div>
                      </div>
                    );

                    return to ? (
                      <Link key={String(e?.id ?? e?.title)} to={to} className="block">
                        {content}
                      </Link>
                    ) : (
                      <div key={String(e?.title)}>{content}</div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
};

export default EventsPage;
