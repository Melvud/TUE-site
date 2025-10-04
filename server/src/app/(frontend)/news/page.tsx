import { getPayload } from 'payload'
import config from '@payload-config'
import { draftMode } from 'next/headers'
import Section from '@/components/Section'
import NewsCard from '@/components/NewsCard'

export const dynamic = 'force-dynamic'

export default async function NewsPage() {
  const { isEnabled } = await draftMode()
  const payload = await getPayload({ config })

  const newsData = await payload.find({
    collection: 'news',
    limit: 100,
    sort: '-date',
    draft: isEnabled,
    where: isEnabled ? undefined : { published: { equals: true } },
  })

  return (
    <div className="bg-slate-900">
      <div className="relative pt-32 pb-16 text-center text-white">
        <h1 className="text-5xl font-extrabold">PhE News</h1>
        <p className="text-xl text-slate-300 mt-4">The latest updates and articles from the society.</p>
      </div>

      <Section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {newsData.docs.map((article: any) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      </Section>
    </div>
  )
}