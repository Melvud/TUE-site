import React from 'react'

import type { MarqueeBlock } from '@/payload-types'
import RichText from '@/components/RichText'

/**
 * MarqueeBlock renders an animated horizontal scrolling ticker. It
 * accepts an array of rich‑text items and an optional speed
 * controlling the scroll duration. The animation loops infinitely.
 */
export const MarqueeBlock: React.FC<MarqueeBlock> = ({ items, speed = 20 }) => {
  if (!items || items.length === 0) return null

  // Convert the provided speed (in seconds) to a CSS duration. If the
  // editor supplies an invalid number, fall back to 20 seconds.
  const animationDuration = `${typeof speed === 'number' && speed > 0 ? speed : 20}s`

  return (
    <div className="w-full overflow-hidden bg-accent text-primary py-2">
      <div
        className="flex whitespace-nowrap animate-marquee"
        style={{ animationDuration }}
      >
        {/* Repeat the items twice to ensure a seamless loop */}
        {[...items, ...items].map(({ text }, idx) => (
          <div key={idx} className="flex items-center px-4">
            {text && <RichText data={text} />}
            <span className="mx-4">•</span>
          </div>
        ))}
      </div>
      {/* Inline keyframes definition. Using styled-jsx keeps the CSS scoped
          to this component. */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          display: inline-flex;
          animation-name: marquee;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  )
}