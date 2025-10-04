import { getPayload } from 'payload'
import config from '@payload-config'
import { draftMode } from 'next/headers'
import Hero from '@/components/Hero'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { isEnabled } = await draftMode()
  const payload = await getPayload({ config })

  const homeData = await payload.findGlobal({
    slug: 'home',
    draft: isEnabled,
  })

  const typedPhrases =
    homeData?.typedPhrases?.map((p: any) => p?.value).filter(Boolean) || [
      'Join us today and enjoy a free OPTICA subscription!',
      'Connect with the photonics community at TU/e.',
      'Workshops, talks, cleanroom tours, and more.',
    ]

  const heroImage =
    typeof homeData?.hero?.image === 'object' && homeData.hero?.image?.url
      ? homeData.hero.image.url
      : '/hero.jpg'

  return (
    <div className="bg-slate-900">
      <Hero
        bgUrl={heroImage}
        titleLine1="Photonics Society"
        titleLine2="Eindhoven"
        typedPhrases={typedPhrases}
        scrollTargetId="events"
      />
    </div>
  )
}