import { getPayload } from 'payload'
import config from '@/payload.config'
import { notFound } from 'next/navigation'

import Template1 from '@/components/templates/Template1'
import Template2 from '@/components/templates/Template2'
import Template3 from '@/components/templates/Template3'
import Template4 from '@/components/templates/Template4'

export const dynamic = 'force-dynamic'

export default async function StoryPage({ params }: { params: Promise<{ section: string, slug: string }> }) {
  const resolvedParams = await params;
  const payload = await getPayload({ config })

  // Resolve the section from the Sections collection by slug. The hardcoded
  // SECTIONS list has no Payload document id, so querying stories by it never
  // matched — look up the real section document instead.
  const sectionResult = await payload.find({
    collection: 'sections',
    where: { slug: { equals: resolvedParams.section } },
    limit: 1,
  })
  const section = sectionResult.docs[0]

  if (!section) {
    notFound()
  }

  const stories = await payload.find({
    collection: 'stories',
    where: {
      'slug': {
        equals: resolvedParams.slug,
      },
      'section': {
        equals: section.id,
      },
    },
    limit: 1,
  })

  if (!stories.docs.length) {
    notFound()
  }

  const story = stories.docs[0]
  
  // Dynamically render the correct template based on the layout_type field
  switch (story.layout_type) {
    case 'template_1':
      return <Template1 story={story} />
    case 'template_2':
      return <Template2 story={story} />
    case 'template_3':
      return <Template3 story={story} />
    case 'template_4':
      return <Template4 story={story} />
    default:
      return <Template1 story={story} />
  }
}
