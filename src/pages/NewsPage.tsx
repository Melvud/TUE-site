
import React from 'react';
import Section from '../components/Section';
import NewsCard from '../components/NewsCard';
import { useData } from '../context/DataContext';

const NewsPage: React.FC = () => {
  const { news } = useData();
  const sortedNews = [...news].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-slate-900">
      <div className="relative pt-32 pb-16 text-center text-white">
        <h1 className="text-5xl font-extrabold">PhE News</h1>
        <p className="text-xl text-slate-300 mt-4">The latest updates and articles from the society.</p>
      </div>

      <Section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedNews.map((article, index) => (
            <NewsCard key={index} article={article} />
          ))}
        </div>
      </Section>
    </div>
  );
};

export default NewsPage;
