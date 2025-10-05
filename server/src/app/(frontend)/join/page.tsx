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

  // Берём поля формы и приводим к ожидаемому виду
  const formFields = (Array.isArray(join?.formFields) ? join.formFields : []).map((f: any) => {
    const { id, options, placeholder, required, rows, ...rest } = f || {}

    return {
      ...rest,
      // id допускает только string | undefined
      ...(id ? { id: String(id) } : {}),
      // placeholder: string | null | undefined - исправляем проверку
      ...(placeholder !== undefined && placeholder !== null ? { placeholder: String(placeholder) } : {}),
      // required: только boolean
      required: Boolean(required),
      // rows для textarea
      ...(rows !== undefined && rows !== null ? { rows: Number(rows) } : {}),
      // options: чистим id внутри options
      ...(Array.isArray(options)
        ? {
            options: options.map((o: any) => {
              if (!o) return { value: '' }
              const { id: oid, value, label, ...or } = o
              return {
                ...or,
                value: value || '',
                ...(label ? { label: String(label) } : {}),
                ...(oid ? { id: String(oid) } : {}),
              }
            }),
          }
        : {}),
    }
  })

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