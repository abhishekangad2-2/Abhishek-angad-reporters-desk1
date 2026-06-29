import { cookies } from 'next/headers'
import { isLandingTemplate, DEFAULT_TEMPLATE, type LandingTemplate } from '@/lib/landing'
import { getLandingData, getLandingLayout } from '@/lib/landing.server'
import { translateLandingData } from '@/lib/translate.server'
import { LOCALE_COOKIE, isLocale, DEFAULT_LOCALE } from '@/lib/i18n'
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
  // Priority: ?layout= preview override → editor's CMS choice → default.
  const requested = typeof sp.layout === 'string' ? sp.layout : undefined
  const editorChoice = requested ? undefined : await getLandingLayout()
  const resolved = requested ?? editorChoice ?? undefined
  const template: LandingTemplate = isLandingTemplate(resolved) ? resolved : DEFAULT_TEMPLATE

  const cookieStore = await cookies()
  // ?lang= wins (forces a fresh translated render); cookie persists the choice.
  const localeRaw =
    (typeof sp.lang === 'string' ? sp.lang : undefined) ?? cookieStore.get(LOCALE_COOKIE)?.value
  const locale = isLocale(localeRaw) ? localeRaw : DEFAULT_LOCALE

  let data = await getLandingData()
  if (locale !== DEFAULT_LOCALE) data = await translateLandingData(data, locale)

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
