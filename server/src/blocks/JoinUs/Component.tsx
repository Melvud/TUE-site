import React from 'react'
import RichText from '@/components/RichText'

// Локальные пропсы вместо импортов из '@/payload-types'
type JoinUsProps = {
  intro?: unknown
  memberships?: Array<{
    title?: string
    description?: unknown
  }>
}

/**
 * JoinUsBlock displays a join-the-society section comprised of an
 * introductory paragraph and a list of membership tiers. Each tier is
 * rendered with its title and description. The use of rich text
 * throughout allows editors to emphasize important details, add links,
 * and insert other rich formatting.
 */
export const JoinUsBlock: React.FC<JoinUsProps> = ({ intro, memberships }) => {
  return (
    <div className="container my-12">
      {intro && <RichText data={intro} />}
      <div className="mt-8 space-y-8">
        {(memberships || []).map((option, idx) => (
          <div
            key={idx}
            className="border border-border rounded p-6 bg-card shadow-sm"
          >
            <h3 className="text-2xl font-bold mb-4">{option.title}</h3>
            {option.description && <RichText data={option.description} />}
          </div>
        ))}
      </div>
    </div>
  )
}
