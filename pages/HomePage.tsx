
import React from 'react';
import { Link } from 'react-router-dom';
import Section from '../components/Section';
import { useData } from '../context/DataContext';
import EventCard from '../components/EventCard';
import NewsCard from '../components/NewsCard';

const HomePage: React.FC = () => {
  const { events, news } = useData();
  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);
  const recentNews = news
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <div className="bg-slate-900">
      {/* Hero Section */}
      <div className="relative h-[60vh] md:h-[80vh] flex items-center justify-center text-center text-white bg-cover bg-center" style={{backgroundImage: "url('https://picsum.photos/seed/hero-bg/1600/900')"}}>
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 px-4">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
            Welcome to the <span className="text-cyan-400">Photonics Society Eindhoven</span>
          </h1>
          <p className="text-lg md:text-2xl text-slate-300 max-w-3xl mx-auto mb-8">
            Connecting students and professionals in the world of optics and photonics.
          </p>
          <Link to="/about" className="inline-block bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-3 px-8 rounded-full transition-transform duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/30 text-lg">
            Learn More
          </Link>
        </div>
      </div>
      
      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <Section title="Upcoming Events">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingEvents.map(event => <EventCard key={event.id} event={event} />)}
          </div>
          <div className="text-center mt-12">
            <Link to="/events" className="text-cyan-400 hover:text-cyan-300 font-semibold text-lg transition-colors">
              View All Events &rarr;
            </Link>
          </div>
        </Section>
      )}

      {/* Recent News */}
      {recentNews.length > 0 && (
        <Section title="Recent News" className="bg-slate-800/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentNews.map(article => <NewsCard key={article.id} article={article} />)}
          </div>
           <div className="text-center mt-12">
            <Link to="/news" className="text-cyan-400 hover:text-cyan-300 font-semibold text-lg transition-colors">
              Read All News &rarr;
            </Link>
          </div>
        </Section>
      )}

       {/* Join Us Section */}
      <Section title="Get Involved">
        <div className="max-w-4xl mx-auto text-center">
            <p className="text-xl text-slate-300 mb-8">
                Ready to be a part of a vibrant community and shape the future of photonics? Join us today and connect with fellow enthusiasts and professionals.
            </p>
            <Link to="/join" className="inline-block bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-4 px-10 rounded-full transition-transform duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/30 text-lg">
              Become a Member
            </Link>
        </div>
      </Section>

    </div>
  );
};

export default HomePage;
