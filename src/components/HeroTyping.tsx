// src/components/HeroTyping.tsx
import React, { useEffect, useRef } from 'react';
import Typed from 'typed.js';

type Props = {
  strings: string[];
  typeSpeed?: number;
  backSpeed?: number;
  backDelay?: number;
  loop?: boolean;
  showCursor?: boolean;
};

const HeroTyping: React.FC<Props> = ({
  strings,
  typeSpeed = 50,
  backSpeed = 25,
  backDelay = 1200,
  loop = true,
  showCursor = true,
}) => {
  const el = useRef<HTMLSpanElement | null>(null);
  const typedRef = useRef<Typed | null>(null);

  useEffect(() => {
    if (!el.current) return;

    typedRef.current = new Typed(el.current, {
      strings,
      typeSpeed,
      backSpeed,
      backDelay,
      loop,
      showCursor,
      smartBackspace: true,
    });

    return () => {
      typedRef.current?.destroy();
      typedRef.current = null;
    };
  }, [strings, typeSpeed, backSpeed, backDelay, loop, showCursor]);

  return <span ref={el} />;
};

export default HeroTyping;
