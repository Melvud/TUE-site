import { getPayload } from 'payload'
import config from '@payload-config'
import { draftMode } from 'next/headers'
import Hero from '@/components/Hero'
import Section from '@/components/Section'
import NewsCard from '@/components/NewsCard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { isEnabled } = await draftMode()
  const payload = await getPayload({ config })

  const [homeData, newsData] = await Promise.all([
    payload.findGlobal({
      slug: 'home',
      draft: isEnabled,
    }),
    payload.find({
      collection: 'news',
      limit: 3,
      sort: '-date',
      draft: isEnabled,
      where: isEnabled ? undefined : { published: { equals: true } },
    }),
  ])

  const typedPhrases = homeData.typedPhrases?.map((p: any) => p.value) || []
  const heroImage = typeof homeData.hero?.image === 'object' && homeData.hero?.image?.url
    ? homeData.hero.image.url
    : '/hero.jpg'

  return (
    <div className="bg-slate-900">
      <Hero
        bgUrl={heroImage}
        titleLine1="Photonics Society"
        titleLine2="Eindhoven"
        typedPhrases={typedPhrases}
        scrollTargetId="news"
      />

      <div id="news" className="scroll-mt-24" />

      {newsData.docs.length > 0 && (
        <Section title="Latest News">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {newsData.docs.map((article: any) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/news" className="text-cyan-400 hover:text-cyan-300 font-semibold">
              View all news →
            </Link>
          </div>
        </Section>
      )}
    </div>
  )
}