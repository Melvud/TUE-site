import { getPayload } from 'payload'
import config from '@payload-config'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import Section from '@/components/Section'
import { serializeLexical } from '@/lib/serializeLexical'

export const dynamic = 'force-dynamic'

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { isEnabled } = await draftMode()
  const payload = await getPayload({ config })

  const newsData = await payload.find({
    collection: 'news',
    where: { slug: { equals: slug } },
    limit: 1,
    draft: isEnabled,
    depth: 2, // ensure cover + upload nodes have url
  })

  const article = newsData.docs[0]
  if (!article) return notFound()

  const coverUrl =
    typeof article.cover === 'object' && article.cover?.url ? article.cover.url : ''
  const contentHtml = serializeLexical(article.content)

  return (
    <div className="bg-slate-900 text-white">
      <div className="pt-28 pb-10 text-center">
        <h1 className="text-4xl font-extrabold">{article.title}</h1>
        <p className="text-slate-300 mt-2">
          {article.date ? new Date(article.date).toLocaleDateString('en-US') : ''}
        </p>
      </div>

      <Section>
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt={article.title} className="w-full rounded-lg mb-6" />
        )}
        {article.summary && <p className="text-slate-300 mb-4">{article.summary}</p>}
        <div
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </Section>
    </div>
  )
}
