// src/pages/NewsDetailPage.tsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Section from '../components/Section';
import { useData } from '../context/DataContext';
import { apiGet } from '../api/client';
import type { News } from '../types';

const NewsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { news } = useData();

  const articleFromContext = React.useMemo(
    () => news.find((n) => n.id === id || n.slug === id),
    [news, id]
  );

  const [fetched, setFetched] = React.useState<News | null>(articleFromContext ?? null);
  const [loading, setLoading] = React.useState(false);
  const current = articleFromContext ?? fetched;

  React.useEffect(() => {
    let cancelled = false;
    if (!articleFromContext && id) {
      setLoading(true);
      apiGet<News>(`/api/news/${id}`)
        .then((a) => {
          if (!cancelled) setFetched(a);
        })
        .finally(() => !cancelled && setLoading(false));
    }
    return () => {
      cancelled = true;
    };
  }, [id, articleFromContext]);

  if (loading) return <div className="bg-slate-900 text-center text-white py-32">Loading…</div>;
  if (!current)
    return (
      <div className="bg-slate-900 text-white py-32 text-center">
        <p>Article not found.</p>
        <Link to="/news" className="text-cyan-400 underline mt-4 inline-block">
          Back to News
        </Link>
      </div>
    );

  return (
    <div className="bg-slate-900 text-white">
      <div className="pt-28 pb-10 text-center">
        <h1 className="text-4xl font-extrabold">{current.title}</h1>
        <p className="text-slate-300 mt-2">
          {current.date} {current.author ? `• ${current.author}` : ''}
        </p>
      </div>

      <Section>
        {current.image && (
          <img src={current.image} alt={current.title} className="w-full rounded-lg mb-6" />
        )}
        {current.snippet && <p className="text-slate-300 mb-4">{current.snippet}</p>}
        <div
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: current.content || '' }}
        />
      </Section>
    </div>
  );
};

export default NewsDetailPage;
