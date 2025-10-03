// src/pages/HomePage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import Section from '../components/Section';
import { useData } from '../context/DataContext';
import NewsCard from '../components/NewsCard';
import Hero from '../components/Hero';
import type { News } from '../types';

const safeTime = (v: any): number => {
  if (!v) return 0;
  const d = new Date(v);
  const t = d.getTime();
  return Number.isFinite(t) ? t : 0;
};

const HomePage: React.FC = () => {
  const { news, homePageContent } = useData();

  const safeNews = Array.isArray(news) ? news.filter(Boolean) : [];

  const newsKey = (n: News) => safeTime(n?.date || (n as any)?.updatedAt || (n as any)?.createdAt);

  const recentNews = [...safeNews]
    .sort((a, b) => newsKey(b) - newsKey(a))
    .slice(0, 3);

  const typedPhrases = homePageContent?.typedPhrases || [
    'Join us today and enjoy a free OPTICA subscription!',
    'Connect with the photonics community at TU/e.',
    'Workshops, talks, cleanroom tours, and more.',
  ];

  const heroImage = homePageContent?.heroImage || '/hero.jpg';

  return (
    <div className="bg-slate-900">
      <Hero
        bgUrl={heroImage}
        titleLine1="Photonics Society"
        titleLine2="Eindhoven"
        typedPhrases={typedPhrases}
        scrollTargetId="upcoming"
      />

      <div id="upcoming" className="scroll-mt-24" />

      {recentNews.length > 0 && (
        <Section title="Latest News">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentNews.map((article) => (
              <NewsCard
                key={String(article.id ?? (article as any).slug ?? article.title)}
                article={article}
              />
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