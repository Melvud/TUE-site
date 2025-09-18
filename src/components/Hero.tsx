import React from 'react';
import TypedText from './TypedText';

type Props = {
  bgUrl?: string;
  titleLine1: string;
  titleLine2?: string;
  typedPhrases: string[];
  /** id секции, к которой прокручиваем по клику на стрелку */
  scrollTargetId?: string;
};

const Hero: React.FC<Props> = ({
  bgUrl = '/hero.jpg',
  titleLine1,
  titleLine2,
  typedPhrases,
  scrollTargetId = 'upcoming',
}) => {
  const onScrollDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(scrollTargetId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="relative min-h-[92vh] w-full overflow-hidden" aria-label="Hero">
      {/* background */}
      <div className="absolute inset-0">
        <img src={bgUrl} alt="" className="h-full w-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-slate-900/70" />
      </div>

      {/* content */}
      <div className="relative z-10 grid min-h-[92vh] place-items-center px-4">
        <div className="text-center text-white w-full max-w-6xl mx-auto">
          <h1 className="font-extrabold leading-tight tracking-tight">
            <span className="block text-5xl sm:text-6xl md:text-7xl">{titleLine1}</span>
            {titleLine2 && (
              <span className="block text-5xl sm:text-6xl md:text-7xl mt-1 opacity-95">
                {titleLine2}
              </span>
            )}
          </h1>

          <p className="mt-6 text-xl sm:text-2xl opacity-95">
            <TypedText
              words={typedPhrases}
              className="align-middle"
              typeSpeed={42}
              deleteSpeed={26}
              pause={1200}
              loop
            />
          </p>

          <button
            onClick={onScrollDown}
            className="mt-16 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/50 hover:border-white/80 hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-white/60 mx-auto"
            aria-label="Scroll to upcoming event"
          >
            <span className="text-2xl leading-none">▾</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
