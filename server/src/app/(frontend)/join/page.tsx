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

  const join = await payload.findGlobal({
    slug: 'join',
    draft: isEnabled,
    depth: 2,
  })

  const html = join?.content ? serializeLexical(join.content as any) : ''

  // Безопасное получение formFields с fallback
  const formFields = Array.isArray(join?.formFields) ? join.formFields : []

  return (
    <div className="bg-slate-900 text-white">
      <header className="pt-28 pb-10 text-center">
        <h1 className="text-4xl font-extrabold">Join Us</h1>
      </header>

      <Section>
        <div className="max-w-4xl mx-auto">
          {html && (
            <div
              className="prose prose-invert max-w-none mb-10"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}

          <JoinForm fields={formFields} />
        </div>
      </Section>
    </div>
  )
}