
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import Section from '../components/Section';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { events } = useData();
  const event = events.find(e => e.id === id);

  if (!event) {
    return (
      <div className="bg-slate-900 text-center py-40">
        <h1 className="text-4xl text-white font-bold">Event not found</h1>
        <Link to="/events" className="text-cyan-400 mt-4 inline-block">Back to events</Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-900">
       <div className="relative pt-32 pb-16 text-white bg-cover bg-center" style={{backgroundImage: `url(${event.image})`}}>
         <div className="absolute inset-0 bg-black/70"></div>
         <div className="relative z-10 text-center px-4">
            <p className="text-lg text-cyan-400 font-semibold">{event.date}</p>
            <h1 className="text-5xl font-extrabold mt-2">{event.title}</h1>
         </div>
      </div>
      
      <Section>
        <div className="max-w-4xl mx-auto text-lg text-slate-300 space-y-6 prose prose-invert lg:prose-xl">
          <p className="lead">{event.description}</p>
          <div dangerouslySetInnerHTML={{ __html: event.content }} />

          {event.registrationLink && (
             <div className="text-center pt-8">
                 <a href={event.registrationLink} target="_blank" rel="noopener noreferrer" className="inline-block bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-4 px-10 rounded-full transition-transform duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/30 text-lg no-underline">
                  Register Now
                </a>
             </div>
          )}
        </div>
      </Section>
    </div>
  );
};

export default EventDetailPage;
