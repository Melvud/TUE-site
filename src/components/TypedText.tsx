import React, { useEffect, useState } from 'react';

type Props = {
  words: string[];
  typeSpeed?: number;    // мс на символ при наборе
  deleteSpeed?: number;  // мс на символ при удалении
  pause?: number;        // пауза на полном слове
  loop?: boolean;
  className?: string;
  cursor?: boolean;
};

const TypedText: React.FC<Props> = ({
  words,
  typeSpeed = 45,
  deleteSpeed = 28,
  pause = 1100,
  loop = true,
  className,
  cursor = true,
}) => {
  const [wordIndex, setWordIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!words.length) return;
    const current = words[wordIndex];

    // конец набора слова
    if (!deleting && subIndex === current.length) {
      const t = setTimeout(() => setDeleting(true), pause);
      return () => clearTimeout(t);
    }

    // конец удаления
    if (deleting && subIndex === 0) {
      setDeleting(false);
      setWordIndex((i) => {
        const next = i + 1;
        if (next < words.length) return next;
        return loop ? 0 : i; // если не loop — залипаем на последнем
      });
      return;
    }

    const t = setTimeout(() => {
      setSubIndex((i) => i + (deleting ? -1 : 1));
    }, deleting ? deleteSpeed : typeSpeed);

    return () => clearTimeout(t);
  }, [subIndex, deleting, wordIndex, words, typeSpeed, deleteSpeed, pause, loop]);

  const text = words.length ? words[wordIndex].slice(0, subIndex) : '';

  return (
    <span className={className}>
      {text}
      {cursor && <span className="animate-pulse">|</span>}
    </span>
  );
};

export default TypedText;
