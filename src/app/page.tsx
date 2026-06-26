import { isLandingTemplate, DEFAULT_TEMPLATE, type LandingTemplate } from '@/lib/landing'
import { getLandingData } from '@/lib/landing.server'
import ThreeColumnLanding from '@/components/ThreeColumnLanding'
import ZPatternLanding from '@/components/ZPatternLanding'
import NewspaperLanding from '@/components/NewspaperLanding'
import ImmersiveLanding from '@/components/ImmersiveLanding'

export const dynamic = 'force-dynamic'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const requested = typeof sp.layout === 'string' ? sp.layout : undefined
  const template: LandingTemplate = isLandingTemplate(requested) ? requested : DEFAULT_TEMPLATE

  const data = await getLandingData()

  switch (template) {
    case 'z-pattern':
      return <ZPatternLanding data={data} />
    case 'newspaper':
      return <NewspaperLanding data={data} />
    case 'immersive':
      return <ImmersiveLanding data={data} />
    case 'three-column':
    default:
      return <ThreeColumnLanding data={data} />
  }
}
