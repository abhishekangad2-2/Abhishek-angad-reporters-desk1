import ThreeColumnLanding from '../../../components/landing/ThreeColumnLanding'

async function getStories() {
  const res = await fetch(
    `${process.env.PAYLOAD_API_URL}/api/articles?where[landingTemplate][equals]=three-column&where[_status][equals]=published&sort=-publishedAt&limit=3&depth=1`,
    { next: { revalidate: 60 } },
  )
  const data = await res.json()
  return data.docs.map((d: any) => ({
    id: d.slug,
    headline: d.headline,
    strap: d.strap,
    section: d.section,
    heroImage: d.heroMedia?.sizes?.card?.url ?? '',
  }))
}

export default async function Page() {
  const stories = await getStories()
  return <ThreeColumnLanding stories={stories} />
}
