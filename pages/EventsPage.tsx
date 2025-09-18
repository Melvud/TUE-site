
import React from 'react';
import Section from '../components/Section';
import EventCard from '../components/EventCard';
import { useData } from '../context/DataContext';

const EventsPage: React.FC = () => {
  const { events } = useData();
  const featuredEvent = events.find(e => e.featured);
  const otherEvents = events.filter(e => !e.featured).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-slate-900">
      <div className="relative pt-32 pb-16 text-center text-white">
        <h1 className="text-5xl font-extrabold">PhE Events</h1>
        <p className="text-xl text-slate-300 mt-4">Discover our upcoming and past events.</p>
      </div>

      {featuredEvent && (
        <Section title="High-Tech Exchange 2025">
          <div className="bg-slate-800/50 rounded-lg shadow-2xl overflow-hidden md:flex flex-col items-center p-8 text-center">
            <img src={featuredEvent.image} alt={featuredEvent.title} className="w-full max-w-4xl rounded-lg mb-8 shadow-lg" />
            <div className="max-w-3xl">
              <span className="text-cyan-400 font-semibold text-lg">{featuredEvent.date}</span>
              <h3 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4">{featuredEvent.title}</h3>
              <p className="text-slate-300 text-lg mb-8">{featuredEvent.description}</p>
              {featuredEvent.registrationLink &&
                <a href={featuredEvent.registrationLink} target="_blank" rel="noopener noreferrer" className="inline-block bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-4 px-10 rounded-full transition-transform duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/30 text-lg">
                  Register Now
                </a>
              }
            </div>
          </div>
        </Section>
      )}

      <Section title="Past & Upcoming Events">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {otherEvents.map((event, index) => (
            <EventCard key={index} event={event} />
          ))}
        </div>
      </Section>
    </div>
  );
};

export default EventsPage;