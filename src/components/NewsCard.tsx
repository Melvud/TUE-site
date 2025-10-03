// src/components/NewsCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { News } from '../types';

interface NewsCardProps {
  article: News;
}

const NewsCard: React.FC<NewsCardProps> = ({ article }) => {
  // Поддержка разных вариантов полей для обратной совместимости
  const image = (article as any).coverUrl || article.image || '';
  const snippet = article.snippet || (article as any).summary || '';
  const date = article.date || '';
  const author = article.author || '';

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg transform hover:-translate-y-2 transition-transform duration-300 flex flex-col">
      <Link to={`/news/${article.id}`}>
        {image && (
          <img src={image} alt={article.title} className="w-full h-56 object-cover" />
        )}
      </Link>
      <div className="p-6 flex flex-col flex-grow">
        {(date || author) && (
          <p className="text-slate-500 text-sm mb-2">
            {date}
            {date && author && ' • '}
            {author}
          </p>
        )}
        <h3 className="text-xl font-bold text-white mb-3 flex-grow">
          <Link to={`/news/${article.id}`} className="hover:text-cyan-400 transition-colors">
            {article.title}
          </Link>
        </h3>
        {snippet && <p className="text-slate-400 mb-4 line-clamp-4">{snippet}</p>}
        <div className="mt-auto">
          <Link
            to={`/news/${article.id}`}
            className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Read More &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;