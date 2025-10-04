// src/app/(frontend)/about/page.tsx
import { getPayload } from 'payload'
import config from '@payload-config'
import { draftMode } from 'next/headers'
import { serializeLexical } from '@/lib/serializeLexical'
import TeamMemberCard from '@/components/TeamMemberCard'
import Section from '@/components/Section'

export const dynamic = 'force-dynamic'

// Тип глобала "about" — нам важен только массив секций
type AboutGlobal = {
  sections?: Array<{
    title?: string
    layout?: 'text-image' | 'image-text' | string
    text?: unknown
    image?: { url?: string } | string | null
  }>
}

export default async function AboutPage() {
  const { isEnabled } = await draftMode()
  const payload = await getPayload({ config })

  // читаем глобал с учетом draftMode, без any/ассертов
  const about = await payload.findGlobal<AboutGlobal>({
    slug: 'about',
    draft: isEnabled,
  })

  const sections = about.sections ?? []

  // helper: безопасно получить документы из коллекции (если коллекции нет — вернётся [])
  const safeFind = async (collection: string) => {
    try {
      const res = await payload.find({
        collection,
        draft: isEnabled,
        limit: 100,
      })
      return res?.docs ?? []
    } catch {
      return []
    }
  }

  // У разных проектов встречаются названия pastMembers / membersPast — пробуем оба.
  const members = await safeFind('members')
  let pastMembers = await safeFind('pastMembers')
  if (pastMembers.length === 0) pastMembers = await safeFind('membersPast')

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-8">About</h1>

      <div className="space-y-12">
        {sections.map((section, i) => {
          const html =
            section?.text && typeof section.text === 'object'
              ? serializeLexical(section.text)
              : ''
          const imgUrl =
            typeof section?.image === 'object' && section.image?.url
              ? section.image.url
              : undefined
          const isTextImageLayout = section?.layout === 'text-image'

          return (
            <section
              key={i}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start"
            >
              {isTextImageLayout ? (
                <>
                  <div>
                    {section?.title && (
                      <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                    )}
                    {html && (
                      <article
                        className="prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: html }}
                      />
                    )}
                  </div>
                  <div>
                    {imgUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imgUrl}
                        alt={section?.title || 'About image'}
                        className="w-full h-auto rounded-2xl border border-slate-700"
                        loading="lazy"
                      />
                    ) : (
                      <div className="aspect-[4/3] w-full rounded-2xl bg-slate-800" />
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    {imgUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imgUrl}
                        alt={section?.title || 'About image'}
                        className="w-full h-auto rounded-2xl border border-slate-700"
                        loading="lazy"
                      />
                    ) : (
                      <div className="aspect-[4/3] w-full rounded-2xl bg-slate-800" />
                    )}
                  </div>
                  <div>
                    {section?.title && (
                      <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                    )}
                    {html && (
                      <article
                        className="prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: html }}
                      />
                    )}
                  </div>
                </>
              )}
            </section>
          )
        })}

        {/* Members */}
        {members.length > 0 && (
          <Section title="Meet the Team" id="members">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {members.map((m: any) => (
                <TeamMemberCard
                  key={m.id}
                  member={{
                    name: m.name || m.title || '',
                    role: m.role,
                    // компонент ожидает поле photo; берём photo или image, если так называется в коллекции
                    photo: m.photo ?? m.image ?? null,
                    email: m.email,
                    linkedin: m.linkedin,
                    instagram: m.instagram,
                  }}
                />
              ))}
            </div>
          </Section>
        )}

        {/* Past Members */}
        {pastMembers.length > 0 && (
          <Section title="Past Members" id="past-members">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {pastMembers.map((m: any) => (
                <TeamMemberCard
                  key={m.id}
                  member={{
                    name: m.name || m.title || '',
                    role: m.role,
                    photo: m.photo ?? m.image ?? null,
                    email: m.email,
                    linkedin: m.linkedin,
                    instagram: m.instagram,
                  }}
                />
              ))}
            </div>
          </Section>
        )}
      </div>
    </main>
  )
}
