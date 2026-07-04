import { cookies } from 'next/headers'
import { isLandingTemplate, DEFAULT_TEMPLATE, type LandingTemplate } from '@/lib/landing'
import { getLandingData, getLandingLayout } from '@/lib/landing.server'
import { designCssVarString, DEFAULT_DESIGN } from '@/lib/design'
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

  const landing =
    template === 'z-pattern' ? (
      <ZPatternLanding data={data} />
    ) : template === 'newspaper' ? (
      <NewspaperLanding data={data} />
    ) : template === 'immersive' ? (
      <ImmersiveLanding data={data} />
    ) : (
      <ThreeColumnLanding data={data} />
    )

  // Push the Design Studio palette onto <body> so the shared site chrome
  // (footer tabs, dispatches, language + reader gear — rendered in layout.tsx,
  // outside the .landing root) matches the homepage palette. Scoped to this
  // page only, so story/section pages keep the static newsroom palette.
  const bodyVars = designCssVarString(data.design ?? DEFAULT_DESIGN)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `body{${bodyVars}}` }} />
      {landing}
    </>
  )
}
