
import React from 'react';

interface SectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

const Section: React.FC<SectionProps> = ({ title, children, className = '', id }) => {
  return (
    <section id={id} className={`py-16 md:py-24 ${className}`}>
      <div className="container mx-auto px-6">
        {title && (
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            <span className="text-cyan-400">{title.split(' ')[0]}</span>
            <span className="text-white"> {title.substring(title.indexOf(' ') + 1)}</span>
          </h2>
        )}
        {children}
      </div>
    </section>
  );
};

export default Section;
