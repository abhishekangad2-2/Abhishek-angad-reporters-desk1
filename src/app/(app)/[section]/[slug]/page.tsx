import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'

import { translateStory } from '@/lib/translate.server'
import { LOCALE_COOKIE, isLocale, DEFAULT_LOCALE } from '@/lib/i18n'
import { SITE_URL, absoluteUrl, buildArticleJsonLd } from '@/lib/seo'
import Template1 from '@/components/templates/Template1'
import Template2 from '@/components/templates/Template2'
import Template3 from '@/components/templates/Template3'
import Template4 from '@/components/templates/Template4'

export const dynamic = 'force-dynamic'

// Friendly names (and the raw template_N values) map to the four designs, so a
// ?template= override can preview a single story in any layout.
const TEMPLATE_ALIASES: Record<string, string> = {
  'three-column': 'template_1',
  'z-pattern': 'template_2',
  newspaper: 'template_3',
  immersive: 'template_4',
  template_1: 'template_1',
  template_2: 'template_2',
  template_3: 'template_3',
  template_4: 'template_4',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string; slug: string }>
}): Promise<Metadata> {
  try {
    const { section: sectionSlug, slug } = await params
    const payload = await getPayload({ config })
    const sec = await payload.find({
      collection: 'sections',
      where: { slug: { equals: sectionSlug } },
      limit: 1,
    })
    const section = sec.docs[0]
    if (!section) return {}
    const res = await payload.find({
      collection: 'stories',
      where: {
        slug: { equals: slug },
        section: { equals: section.id },
        status: { equals: 'published' },
      },
      limit: 1,
      depth: 1,
    })
    const story: any = res.docs[0]
    if (!story) return {}
    const seo = story.seoMeta || {}
    const title: string = seo.title || story.headline
    const description: string = seo.description || story.strap
    const img = absoluteUrl(
      story.heroMedia && typeof story.heroMedia === 'object' ? story.heroMedia.url : undefined,
    )
    const canonical = `${SITE_URL}/${sectionSlug}/${slug}`
    const authors = (Array.isArray(story.author) ? story.author : [])
      .map((a: any) => [a?.firstName, a?.lastName].filter(Boolean).join(' ').trim() || a?.name)
      .filter(Boolean)
    return {
      metadataBase: new URL(SITE_URL),
      title,
      description,
      keywords: seo.keywords || undefined,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        type: 'article',
        url: canonical,
        siteName: 'ReportersDesk',
        section: section.name || sectionSlug,
        publishedTime: story.publishedAt ? new Date(story.publishedAt).toISOString() : undefined,
        modifiedTime: story.updatedAt ? new Date(story.updatedAt).toISOString() : undefined,
        authors: authors.length ? authors : undefined,
        images: img ? [{ url: img }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: img ? [img] : undefined,
      },
    }
  } catch {
    return {}
  }
}

export default async function StoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string; slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { section: sectionSlug, slug } = await params
  const sp = await searchParams
  const payload = await getPayload({ config })

  // Resolve the section from the Sections collection by slug.
  const sectionResult = await payload.find({
    collection: 'sections',
    where: { slug: { equals: sectionSlug } },
    limit: 1,
  })
  const section = sectionResult.docs[0]
  if (!section) {
    notFound()
  }

  const stories = await payload.find({
    collection: 'stories',
    where: {
      slug: { equals: slug },
      section: { equals: section.id },
      status: { equals: 'published' },
    },
    limit: 1,
  })
  if (!stories.docs.length) {
    notFound()
  }

  let story = stories.docs[0]

  // Translate the story (header + Lexical body) when a non-English locale is
  // selected via ?lang= or the rd_lang cookie.
  const cookieStore = await cookies()
  const localeRaw =
    (typeof sp.lang === 'string' ? sp.lang : undefined) ?? cookieStore.get(LOCALE_COOKIE)?.value
  const locale = isLocale(localeRaw) ? localeRaw : DEFAULT_LOCALE
  if (locale !== DEFAULT_LOCALE) story = await translateStory(story, locale)

  // ?template= preview override — view this story in any of the four designs
  // without re-saving its CMS layout_type. Falls back to the saved layout_type.
  const override = typeof sp.template === 'string' ? TEMPLATE_ALIASES[sp.template] : undefined
  const layout = override ?? (story as any).layout_type

  // NewsArticle structured data — built from the (untranslated-or-translated)
  // story so the schema matches the rendered copy.
  const jsonLd = buildArticleJsonLd(story, {
    url: `${SITE_URL}/${sectionSlug}/${slug}`,
    sectionName: (section as any).name || sectionSlug,
  })

  const Template =
    layout === 'template_2'
      ? Template2
      : layout === 'template_3'
        ? Template3
        : layout === 'template_4'
          ? Template4
          : Template1

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Template story={story as any} />
    </>
  )
}
