import React from 'react';
import { Link } from 'react-router-dom';
import Section from '../components/Section';
import { useData } from '../context/DataContext';
import NewsCard from '../components/NewsCard';
import EventHero from '../components/EventHero';
import Hero from '../components/Hero';

const safeTime = (v: any): number => {
  if (!v) return 0;
  const d = new Date(v);
  const t = d.getTime();
  return Number.isFinite(t) ? t : 0;
};

const HomePage: React.FC = () => {
  const { events, news } = useData() as any;

  const safeEvents = Array.isArray(events) ? events.filter(Boolean) : [];
  const safeNews = Array.isArray(news) ? news.filter(Boolean) : [];

  const upcomingSorted = safeEvents
    .filter((e: any) => safeTime(e?.date) >= Date.now())
    .sort((a: any, b: any) => safeTime(a?.date) - safeTime(b?.date));

  const byRecentDesc = [...safeEvents].sort(
    (a: any, b: any) => safeTime(b?.date) - safeTime(a?.date)
  );

  const latestEvent =
    safeEvents.find((e: any) => e?.latest) ||
    upcomingSorted[0] ||
    byRecentDesc[0] ||
    null;

  const newsKey = (n: any) =>
    safeTime(n?.date || n?.updatedAt || n?.createdAt);

  const recentNews = [...safeNews]
    .sort((a: any, b: any) => newsKey(b) - newsKey(a))
    .slice(0, 3);

  return (
    <div className="bg-slate-900">
      <Hero
        bgUrl="/hero.jpg"
        titleLine1="Photonics Society"
        titleLine2="Eindhoven"
        typedPhrases={[
          'Join us today and enjoy a free OPTICA subscription!',
          'Connect with the photonics community at TU/e.',
          'Workshops, talks, cleanroom tours, and more.',
        ]}
        scrollTargetId="upcoming"
      />

      <div id="upcoming" className="scroll-mt-24" />

      {latestEvent && (
        <Section title="Upcoming Events">
          <EventHero event={latestEvent} showBottomRegister={false} />
        </Section>
      )}

      {recentNews.length > 0 && (
        <Section title="Latest News">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentNews.map((item: any, idx: number) =>
              item ? (
                <NewsCard
                  key={String(item.id ?? item.title ?? idx)}
                  item={item}
                />
              ) : null
            )}
          </div>
          <div className="mt-8 text-center">
            <Link to="/news" className="text-cyan-400 hover:text-cyan-300 font-semibold">
              View all news →
            </Link>
          </div>
        </Section>
      )}
    </div>
  );
};

export default HomePage;
