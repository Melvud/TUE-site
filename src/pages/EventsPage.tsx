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
function formatDayRange(r: DateRange) {
  const sameMonth = r.start.getFullYear() === r.end.getFullYear() && r.start.getMonth() === r.end.getMonth();
  const day = (d: Date) => d.getDate();
  return sameMonth ? (day(r.start) === day(r.end) ? `${day(r.start)}` : `${day(r.start)}–${day(r.end)}`) :
    // если вдруг диапазон на разные месяцы — покажем оба дня с ММ
    `${r.start.getDate()}/${r.start.getMonth() + 1}–${r.end.getDate()}/${r.end.getMonth() + 1}`;
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
      <div className="relative pt-28 pb-8 text-center text-white">
        <h1 className="text-5xl font-extrabold">PhE Events</h1>
        <p className="text-xl text-slate-300 mt-4">Discover upcoming events.</p>
      </div>

      {nextEvent && (
        <Section title="Next Event">
          <EventHero event={nextEvent} showBottomRegister={false} />
        </Section>
      )}

      <Section title="Upcoming Events">
        {calendarGroups.length === 0 ? (
          <div className="text-slate-400 text-center">No upcoming events yet.</div>
        ) : (
          <div className="space-y-10">
            {calendarGroups.map((group) => (
              <div key={group.title}>
                <div className="text-center text-xl font-semibold text-white">{group.title}</div>
                <div className="mt-4 flex flex-wrap items-stretch justify-center gap-4">
                  {group.items.map(({ e, r }) => {
                    const to = e?.id ? `/events/${e.id}` : undefined;
                    const dayStr = formatDayRange(r);
                    const content = (
                      <div className="w-[min(100%,320px)] rounded-xl border border-slate-700 bg-slate-800/40 p-4 hover:bg-slate-800 transition">
                        <div className="text-2xl font-extrabold text-cyan-300 text-center">{dayStr}</div>
                        <div className="mt-2 text-center text-white font-semibold leading-snug">{e?.title}</div>
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
