import { getPayload } from 'payload'
import config from '@payload-config'
import { draftMode } from 'next/headers'
import Section from '@/components/Section'
import TeamMemberCard from '@/components/TeamMemberCard'
import { serializeLexical } from '@/lib/serializeLexical'

export const dynamic = 'force-dynamic'

export default async function AboutPage() {
  const { isEnabled } = await draftMode()
  const payload = await getPayload({ config })

  const [aboutData, membersData, pastMembersData] = await Promise.all([
    payload.findGlobal({
      slug: 'about',
      draft: isEnabled,
    }),
    payload.find({
      collection: 'members',
      limit: 100,
      sort: 'order',
    }),
    payload.find({
      collection: 'membersPast',
      limit: 100,
      sort: '-createdAt',
    }).catch(() => ({ docs: [] })),
  ])

  const sections = aboutData.sections || []

  return (
    <div className="bg-slate-900">
      <div className="relative pt-32 pb-16 text-center text-white">
        <h1 className="text-5xl font-extrabold">About PhE</h1>
        <p className="text-xl text-slate-300 mt-4">Who we are, what we do, and why we do it.</p>
      </div>

      {sections.map((section: any, idx: number) => {
        const isTextImage = section.layout === 'text-image'
        const imageUrl = typeof section.image === 'object' && section.image?.url ? section.image.url : ''
        const textHtml = serializeLexical(section.text)

        return (
          <Section key={section.id} className={idx % 2 === 1 ? 'bg-slate-800/50' : ''}>
            <div className="grid md:grid-cols-2 gap-16 items-center">
              {isTextImage ? (
                <>
                  <div className="text-lg text-slate-300 space-y-4">
                    <h3 className="text-3xl font-bold text-white mb-4">{section.title}</h3>
                    <div dangerouslySetInnerHTML={{ __html: textHtml }} />
                  </div>
                  <div>
                    <img src={imageUrl} alt={section.title} className="rounded-lg shadow-lg" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <img src={imageUrl} alt={section.title} className="rounded-lg shadow-lg" />
                  </div>
                  <div className="text-lg text-slate-300 space-y-4">
                    <h3 className="text-3xl font-bold text-white mb-4">{section.title}</h3>
                    <div dangerouslySetInnerHTML={{ __html: textHtml }} />
                  </div>
                </>
              )}
            </div>
          </Section>
        )
      })}

      <Section title="Meet the Team">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {membersData.docs.map((member: any) => (
            <TeamMemberCard key={member.id} member={member} />
          ))}
        </div>
      </Section>

      {pastMembersData.docs.length > 0 && (
        <Section title="Past Members" className="bg-slate-800/50">
          <div className="flex flex-wrap justify-center gap-8">
            {pastMembersData.docs.map((member: any) => {
              const photoUrl = typeof member.photo === 'object' && member.photo?.url ? member.photo.url : ''
              return (
                <div key={member.id} className="text-center">
                  <img
                    src={photoUrl}
                    alt={member.name}
                    className="w-32 h-32 rounded-full mx-auto mb-2 object-cover border-4 border-slate-700"
                  />
                  <h4 className="font-semibold text-white">{member.name}</h4>
                </div>
              )
            })}
          </div>
        </Section>
      )}
    </div>
  )
}