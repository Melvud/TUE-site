'use client'

import { useEffect, useRef } from 'react'

type Partner = {
  id?: string
  name: string
  logo?: { url?: string } | string | null
  website?: string | null
}

type Props = {
  partners: Partner[]
}

export default function PartnersCarousel({ partners }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    let scrollAmount = 0
    const scrollSpeed = 0.5 // pixels per frame

    const animate = () => {
      if (!scrollContainer) return

      scrollAmount += scrollSpeed
      
      // Reset scroll when reaching the middle (since we duplicate items)
      if (scrollAmount >= scrollContainer.scrollWidth / 2) {
        scrollAmount = 0
      }

      scrollContainer.scrollLeft = scrollAmount
      requestAnimationFrame(animate)
    }

    const animationId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationId)
  }, [])

  // Duplicate partners for seamless loop
  const duplicatedPartners = [...partners, ...partners]

  return (
    <div className="relative overflow-hidden">
      {/* Gradient overlays */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />

      <div
        ref={scrollRef}
        className="flex gap-8 overflow-x-hidden"
        style={{ scrollBehavior: 'auto' }}
      >
        {duplicatedPartners.map((partner, index) => {
          const logoUrl =
            typeof partner.logo === 'object' && partner.logo?.url
              ? partner.logo.url
              : ''

          const card = (
            <div
              key={`${partner.id || partner.name}-${index}`}
              className="flex-shrink-0 w-64 h-40 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-cyan-400/50 transition-all duration-300 flex flex-col items-center justify-center p-6 group hover:scale-105"
            >
              {logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={partner.name}
                  className="max-h-20 max-w-full object-contain mb-3 filter brightness-90 group-hover:brightness-110 transition-all"
                />
              )}
              <p className="text-slate-300 text-center font-medium group-hover:text-cyan-400 transition-colors">
                {partner.name}
              </p>
            </div>
          )

          if (partner.website) {
            return (
              <a
                key={`${partner.id || partner.name}-${index}`}
                href={partner.website}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {card}
              </a>
            )
          }

          return card
        })}
      </div>
    </div>
  )
}