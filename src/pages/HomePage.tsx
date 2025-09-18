import React from 'react';
import { Link } from 'react-router-dom';
import Section from '../components/Section';
import { useData } from '../context/DataContext';
import NewsCard from '../components/NewsCard';
import EventHero from '../components/EventHero';
import Hero from '../components/Hero';

const HomePage: React.FC = () => {
  const { events, news } = useData() as any;

  const latestEvent =
    events?.find((e: any) => e.latest) ||
    events?.filter((e: any) => new Date(e.date) >= new Date())
      ?.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ||
    events?.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const recentNews =
    [...(news || [])]
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
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

      {recentNews?.length > 0 && (
        <Section title="Latest News">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentNews.map((item: any) => (
              <NewsCard key={item.id || item.title} item={item} />
            ))}
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
