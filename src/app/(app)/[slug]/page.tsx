import { notFound } from 'next/navigation';
import { getPayload } from 'payload';
import configPromise from '@payload-config';
import Template1 from '@/components/templates/Template1';
import Template2 from '@/components/templates/Template2';
import Template3 from '@/components/templates/Template3';
import Template4 from '@/components/templates/Template4';

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const payload = await getPayload({ config: configPromise });

  const result = await payload.find({
    collection: 'stories',
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
  });

  const story = result.docs[0];

  if (!story) {
    return notFound();
  }

  // Determine which template to render based on layout_type
  switch (story.layout_type) {
    case 'template_1':
      return <Template1 story={story} />;
    case 'template_2':
      return <Template2 story={story} />;
    case 'template_3':
      return <Template3 story={story} />;
    case 'template_4':
      return <Template4 story={story} />;
    default:
      // Fallback to Template 1
      return <Template1 story={story} />;
  }
}
