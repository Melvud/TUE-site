import { getPayload } from 'payload'
import config from '@payload-config'
import { draftMode } from 'next/headers'
import Section from '@/components/Section'
import { serializeLexical } from '@/lib/serializeLexical'
import JoinForm from '@/components/JoinForm'

export const dynamic = 'force-dynamic'

export default async function JoinUsPage() {
  const { isEnabled } = await draftMode()
  const payload = await getPayload({ config })

  const joinData = await payload.findGlobal({
    slug: 'join',
    draft: isEnabled,
  })

  const introHtml = serializeLexical(joinData.introText)
  const detailsHtml = serializeLexical(joinData.detailsHtml)
  const formFields = joinData.formFields || []

  return (
    <div className="bg-slate-900 text-white">
      <div className="pt-28 pb-10 text-center">
        <h1 className="text-4xl font-extrabold">Join Us</h1>
      </div>

      <Section>
        <div className="max-w-4xl mx-auto">
          <div
            className="prose prose-invert max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: introHtml }}
          />
          
          <div
            className="prose prose-invert max-w-none mb-10"
            dangerouslySetInnerHTML={{ __html: detailsHtml }}
          />

          <JoinForm fields={formFields} />
        </div>
      </Section>
    </div>
  )
}