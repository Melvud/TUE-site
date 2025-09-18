
import React from 'react';
import Section from '../components/Section';
import TeamMemberCard from '../components/TeamMemberCard';
import { CURRENT_TEAM, PAST_TEAM } from '../constants';

const AboutPage: React.FC = () => {
  return (
    <div className="bg-slate-900">
      <div className="relative pt-32 pb-16 text-center text-white">
        <h1 className="text-5xl font-extrabold">About PhE</h1>
        <p className="text-xl text-slate-300 mt-4">Who we are, what we do, and why we do it.</p>
      </div>

      <Section>
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="text-lg text-slate-300 space-y-4">
             <h3 className="text-3xl font-bold text-white mb-4">Photonics Society <span className="text-cyan-400">Eindhoven</span></h3>
            <p>The Photonics Society Endhoven (PhE) is a student community officially recognized as an Optica (formerly OSA) student chapter in March 2020. We are a group of enthusiastic and determined Ph.D. students committed to the dissemination of optics and photonics (O&P) in the city of Eindhoven.</p>
            <p>Our main goal is to promote enrollment in O&P by creating opportunities for students to perform high-level scientific research in technical areas within O&P.</p>
          </div>
          <div>
            <img src="https://picsum.photos/seed/phe-group/600/400" alt="PhE Group" className="rounded-lg shadow-lg" />
          </div>
        </div>
      </Section>
      
      <Section className="bg-slate-800/50">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
             <img src="https://picsum.photos/seed/optica-logo/600/400" alt="Optica Logo" className="rounded-lg shadow-lg" />
          </div>
          <div className="text-lg text-slate-300 space-y-4">
             <h3 className="text-3xl font-bold text-white mb-4">What is an <span className="text-cyan-400">Optica Chapter?</span></h3>
            <p>As a student chapter, we benefit from the support of Optica, a non-profit organization founded in 1916. Optica is a leading organization focused on fostering the technical and professional development of over 23,000 members and supports a network of more than 370 student chapters worldwide.</p>
            <p>These local chapters create valuable opportunities for professional development, including activity and travel grants, guest lecture resources, and networking opportunities.</p>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="text-lg text-slate-300 space-y-4">
             <h3 className="text-3xl font-bold text-white mb-4">Eindhoven: <span className="text-cyan-400">City of Light</span></h3>
            <p>There wouldn’t be a more suitable place for an optics and photonics chapter than Eindhoven: the Dutch city of light. Its legacy with light began with Philips in 1891 and the "Lucifer" match industry in 1870. Today, this heritage is celebrated in the annual GLOW light festival.</p>
          </div>
          <div>
             <img src="https://picsum.photos/seed/eindhoven/600/400" alt="Eindhoven City" className="rounded-lg shadow-lg" />
          </div>
        </div>
      </Section>
      
      <Section title="Meet the Team">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {CURRENT_TEAM.map((member, index) => (
            <TeamMemberCard key={index} member={member} />
          ))}
        </div>
      </Section>

      <Section title="Past Members" className="bg-slate-800/50">
         <div className="flex flex-wrap justify-center gap-8">
          {PAST_TEAM.map((member, index) => (
            <div key={index} className="text-center">
              <img src={member.image} alt={member.name} className="w-32 h-32 rounded-full mx-auto mb-2 object-cover border-4 border-slate-700"/>
              <h4 className="font-semibold text-white">{member.name}</h4>
            </div>
          ))}
        </div>
      </Section>

    </div>
  );
};

export default AboutPage;
