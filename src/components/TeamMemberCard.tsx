// src/components/TeamMemberCard.tsx
import React from 'react';
import { TeamMember } from '../types';

interface TeamMemberCardProps {
  member: TeamMember;
}

const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member }) => {
  // поддерживаем оба варианта поля: role (админка) и position (старые данные/тип)
  const role =
    (member as any)?.role ||
    (member as any)?.position ||
    '';

  const socials = (member as any)?.socials || {};
  const linkedin: string | undefined = socials.linkedin || (member as any).linkedin;
  const email: string | undefined = socials.email || (member as any).email;

  return (
    <div className="bg-slate-800 rounded-lg p-6 text-center shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
      <img
        src={(member as any).image || (member as any).photoUrl}
        alt={member.name}
        className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-cyan-400"
      />
      <h3 className="text-xl font-bold text-white">{member.name}</h3>

      {/* Показываем ДОЛЖНОСТЬ только для действующих участников (эта карточка используется для current members) */}
      {role && <p className="text-cyan-400 mb-4">{role}</p>}

      <div className="flex justify-center space-x-4">
        {linkedin && (
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-cyan-400 transition-colors"
            aria-label="LinkedIn"
          >
            <LinkedInIcon />
          </a>
        )}
        {email && (
          <a
            href={email.startsWith('mailto:') ? email : `mailto:${email}`}
            className="text-slate-400 hover:text-cyan-400 transition-colors"
            aria-label="Email"
          >
            <MailIcon />
          </a>
        )}
      </div>
    </div>
  );
};

export default TeamMemberCard;
