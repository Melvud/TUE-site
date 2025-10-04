// src/app/(frontend)/about/page.tsx
import { getPayload } from 'payload'
import config from '@payload-config'
import { draftMode } from 'next/headers'
import { serializeLexical } from '@/lib/serializeLexical'

export const dynamic = 'force-dynamic'

export default async function AboutPage() {
  const { isEnabled } = await draftMode()
  const payload = await getPayload({ config })

  // читаем глобал с учетом draftMode
  const about = await payload.findGlobal({
    slug: 'about',
    draft: isEnabled,
  })

  const sections = (about as any)?.sections || []

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-8">
        About
      </h1>

      <div className="space-y-12">
        {sections.map((section: any, i: number) => {
          const html = section?.text ? serializeLexical(section.text) : ''
          const imgUrl =
            typeof section?.image === 'object' && section.image?.url
              ? section.image.url
              : undefined

          const isTextImage = section?.layout === 'text-image'

          return (
            <section
              key={i}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start"
            >
              {isTextImage ? (
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
      </div>
    </main>
  )
}
