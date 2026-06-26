import { getPayload } from 'payload'
import config from '@/payload.config'
import { notFound } from 'next/navigation'

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
    },
    limit: 1,
  })
  if (!stories.docs.length) {
    notFound()
  }

  const story = stories.docs[0]

  // ?template= preview override — view this story in any of the four designs
  // without re-saving its CMS layout_type. Falls back to the saved layout_type.
  const override = typeof sp.template === 'string' ? TEMPLATE_ALIASES[sp.template] : undefined
  const layout = override ?? (story as any).layout_type

  switch (layout) {
    case 'template_2':
      return <Template2 story={story as any} />
    case 'template_3':
      return <Template3 story={story as any} />
    case 'template_4':
      return <Template4 story={story as any} />
    case 'template_1':
    default:
      return <Template1 story={story as any} />
  }
}
