import { getPayload } from 'payload'
import config from '@payload-config'
import { draftMode } from 'next/headers'
import { serializeLexical } from '@/lib/serializeLexical'
import TeamMemberCard from '@/components/TeamMemberCard'
import Section from '@/components/Section'
import PartnersCarousel from '@/components/PartnersCarousel'

export const dynamic = 'force-dynamic'

type AboutGlobal = {
  sections?: Array<{
    title?: string
    layout?: 'text-image' | 'image-text' | 'text-only' | 'image-only' | string
    text?: unknown
    image?: { url?: string } | string | null
  }>
  supportedByTitle?: string
  supportedByDescription?: string
  supportedByLogo?: { url?: string } | string | null
  partnersTitle?: string
  partnersDescription?: string
  partners?: Array<{
    id?: string
    name: string
    logo?: { url?: string } | string | null
    website?: string | null
  }>
}

type KnownMemberCollections = 'members' | 'pastMembers' | 'membersPast'

export default async function AboutPage() {
  const { isEnabled } = await draftMode()
  const payload = await getPayload({ config })

  const about = (await payload.findGlobal({
    slug: 'about',
    draft: isEnabled,
    depth: 2,
  })) as AboutGlobal

  const sections = about?.sections ?? []
  const partners = about?.partners ?? []

  const safeFind = async (collection: KnownMemberCollections) => {
    try {
      const res = await payload.find({
        collection,
        draft: isEnabled,
        limit: 100,
        depth: 2,
        sort: 'order',
      } as any)
      return res?.docs ?? []
    } catch {
      return []
    }
  }

  const members = await safeFind('members')
  let pastMembers = await safeFind('pastMembers')
  if (pastMembers.length === 0) pastMembers = await safeFind('membersPast')

  const supportedByLogoUrl =
    typeof about?.supportedByLogo === 'object' && about.supportedByLogo?.url
      ? about.supportedByLogo.url
      : ''

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-8 text-center">
        About
      </h1>

      <div className="space-y-12">
        {/* Content Sections */}
        {sections.map((section, i) => {
          const html =
            section?.text && typeof section.text === 'object'
              ? serializeLexical(section.text)
              : ''
          const imgUrl =
            typeof section?.image === 'object' && section.image?.url
              ? section.image.url
              : undefined

          // Text only
          if (section?.layout === 'text-only') {
            return (
              <section key={i} className="max-w-4xl mx-auto">
                {section?.title && (
                  <h2 className="text-2xl font-bold mb-4 text-center">
                    {section.title}
                  </h2>
                )}
                {html && (
                  <article
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                )}
              </section>
            )
          }

          // Image only
          if (section?.layout === 'image-only') {
            return (
              <section key={i} className="max-w-3xl mx-auto">
                {section?.title && (
                  <h2 className="text-2xl font-bold mb-4 text-center">
                    {section.title}
                  </h2>
                )}
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
              </section>
            )
          }

          // Text-image layout
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
                      <h2 className="text-2xl font-bold mb-4 text-center md:text-left">
                        {section.title}
                      </h2>
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
                      <h2 className="text-2xl font-bold mb-4 text-center md:text-left">
                        {section.title}
                      </h2>
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

        {/* ==================== SUPPORTED BY SECTION ==================== */}
        {(about.supportedByTitle || about.supportedByDescription || supportedByLogoUrl) && (
          <section className="py-16 border-t border-b border-slate-800/50">
            <div className="max-w-3xl mx-auto text-center">
              {about.supportedByTitle && (
                <h2 className="text-3xl font-bold mb-4">
                  <span className="text-cyan-400">
                    {about.supportedByTitle.split(' ')[0]}
                  </span>
                  <span className="text-white">
                    {' ' + about.supportedByTitle.substring(about.supportedByTitle.indexOf(' ') + 1)}
                  </span>
                </h2>
              )}
              {about.supportedByDescription && (
                <p className="text-slate-400 mb-8 text-lg">
                  {about.supportedByDescription}
                </p>
              )}
              {supportedByLogoUrl && (
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={supportedByLogoUrl}
                    alt={about.supportedByTitle || 'Main Supporter'}
                    className="max-h-32 object-contain filter brightness-95 hover:brightness-110 transition-all"
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* ==================== PARTNERS CAROUSEL ==================== */}
        {partners.length > 0 && (
          <section className="py-16">
            <div className="text-center mb-12">
              {about.partnersTitle && (
                <h2 className="text-3xl font-bold mb-4">
                  <span className="text-cyan-400">
                    {about.partnersTitle.split(' ')[0]}
                  </span>
                  <span className="text-white">
                    {' ' + about.partnersTitle.substring(about.partnersTitle.indexOf(' ') + 1)}
                  </span>
                </h2>
              )}
              {about.partnersDescription && (
                <p className="text-slate-400 max-w-3xl mx-auto text-lg">
                  {about.partnersDescription}
                </p>
              )}
            </div>

            <PartnersCarousel partners={partners} />
          </section>
        )}

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