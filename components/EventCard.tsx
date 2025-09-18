
import React from 'react';
import { Link } from 'react-router-dom';
import { Event } from '../types';

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg transform hover:-translate-y-2 transition-transform duration-300 flex flex-col">
      <Link to={`/events/${event.id}`}>
        <img src={event.image} alt={event.title} className="w-full h-56 object-cover" />
      </Link>
      <div className="p-6 flex flex-col flex-grow">
        <p className="text-cyan-400 text-sm font-semibold mb-2">{event.date}</p>
        <h3 className="text-xl font-bold text-white mb-3 flex-grow">
           <Link to={`/events/${event.id}`} className="hover:text-cyan-400 transition-colors">{event.title}</Link>
        </h3>
        <p className="text-slate-400 mb-4 line-clamp-3">{event.description}</p>
        <div className="mt-auto">
          <Link to={`/events/${event.id}`} className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
            Read More &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
