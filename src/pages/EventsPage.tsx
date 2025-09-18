import React from 'react';
import Section from '../components/Section';
import { useData } from '../context/DataContext';
import EventHero from '../components/EventHero';

const EventsPage: React.FC = () => {
  const { events } = useData() as any;

  const latestEvent =
    events?.find((e: any) => e.latest) ||
    [...(events || [])].sort(
      (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];

  return (
    <div className="bg-slate-900">
      <div className="relative pt-28 pb-8 text-center text-white">
        <h1 className="text-5xl font-extrabold">PhE Events</h1>
        <p className="text-xl text-slate-300 mt-4">Discover our upcoming event.</p>
      </div>

      <Section>
        <EventHero event={latestEvent} showBottomRegister={false} />
      </Section>
    </div>
  );
};

export default EventsPage;
