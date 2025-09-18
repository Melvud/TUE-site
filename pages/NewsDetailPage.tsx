
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import Section from '../components/Section';

const NewsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { news } = useData();
  const article = news.find(n => n.id === id);

  if (!article) {
    return (
      <div className="bg-slate-900 text-center py-40">
        <h1 className="text-4xl text-white font-bold">News article not found</h1>
        <Link to="/news" className="text-cyan-400 mt-4 inline-block">Back to news</Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-900">
      <div className="relative pt-32 pb-16 text-white">
        <div className="absolute inset-0">
          <img src={article.image} alt={article.title} className="w-full h-full object-cover opacity-30"/>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
        </div>
         <div className="relative z-10 text-center px-4 container mx-auto">
            <h1 className="text-5xl font-extrabold mt-2 max-w-4xl mx-auto">{article.title}</h1>
            <p className="text-lg text-slate-400 font-semibold mt-4">{article.date} &bull; By {article.author}</p>
         </div>
      </div>
      
      <Section>
        <div className="max-w-3xl mx-auto text-lg text-slate-300 space-y-6 prose prose-invert lg:prose-xl">
          <p className="lead text-xl text-slate-200">{article.snippet}</p>
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>
      </Section>
    </div>
  );
};

export default NewsDetailPage;
