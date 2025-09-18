// src/pages/AboutPage.tsx
import React from 'react';
import Section from '../components/Section';
import TeamMemberCard from '../components/TeamMemberCard';
import { useData } from '../context/DataContext';

const AboutPage: React.FC = () => {
  const { members, pastMembers } = useData() as any;

  return (
    <div className="bg-slate-900">
      <div className="relative pt-32 pb-16 text-center text-white">
        <h1 className="text-5xl font-extrabold">About PhE</h1>
        <p className="text-xl text-slate-300 mt-4">Who we are, what we do, and why we do it.</p>
      </div>

      <Section>
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="text-lg text-slate-300 space-y-4">
            <h3 className="text-3xl font-bold text-white mb-4">
              Photonics Society <span className="text-cyan-400">Eindhoven</span>
            </h3>
            <p>
              The Photonics Society Endhoven (PhE) is a student community officially recognized as
              an Optica (formerly OSA) student chapter in March 2020. We are a group of enthusiastic
              and determined Ph.D. students committed to the dissemination of optics and photonics
              (O&amp;P) in the city of Eindhoven.
            </p>
            <p>
              Our main goal is to promote enrollment in O&amp;P by creating opportunities for
              students to perform high-level scientific research in technical areas within O&amp;P.
            </p>
          </div>
          <div>
            <img
              src="https://picsum.photos/seed/phe-group/600/400"
              alt="PhE Group"
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>
      </Section>

      <Section className="bg-slate-800/50">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <img
              src="https://picsum.photos/seed/optica-logo/600/400"
              alt="Optica Logo"
              className="rounded-lg shadow-lg"
            />
          </div>
          <div className="text-lg text-slate-300 space-y-4">
            <h3 className="text-3xl font-bold text-white mb-4">
              What is an <span className="text-cyan-400">Optica Chapter?</span>
            </h3>
            <p>
              As a student chapter, we benefit from the support of Optica, a non-profit organization
              founded in 1916. Optica is a leading organization focused on fostering the technical
              and professional development of over 23,000 members and supports a network of more than
              370 student chapters worldwide.
            </p>
            <p>
              These local chapters create valuable opportunities for professional development,
              including activity and travel grants, guest lecture resources, and networking
              opportunities.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Meet the Team">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {(members || []).map((m: any, idx: number) => (
            <TeamMemberCard
              key={String(m.id ?? idx)}
              member={{
                name: m.name,
                role: m.role,
                image: m.photoUrl,
                // ВАЖНО: передаём socials объектом, чтобы не было undefined.member.socials.*
                socials: {
                  email: m.email || '',
                  linkedin: m.linkedin || '',
                  instagram: m.instagram || '',
                },
              }}
            />
          ))}
        </div>
      </Section>

      <Section title="Past Members" className="bg-slate-800/50">
        <div className="flex flex-wrap justify-center gap-8">
          {(pastMembers || []).map((m: any, idx: number) => (
            <div key={String(m.id ?? idx)} className="text-center">
              <img
                src={m.photoUrl}
                alt={m.name}
                className="w-32 h-32 rounded-full mx-auto mb-2 object-cover border-4 border-slate-700"
              />
              <h4 className="font-semibold text-white">{m.name}</h4>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default AboutPage;
