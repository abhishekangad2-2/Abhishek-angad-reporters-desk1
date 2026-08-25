import Link from 'next/link'

/** Small reader-funding note at the foot of an article, after the end-mark. */
export default function StorySupport() {
  return (
    <aside className="story-support" aria-label="Support Reporters Desk">
      <p className="story-support-text">
        Reporters Desk is independent, reader-funded journalism.
      </p>
      <Link href="/support" className="story-support-btn">
        Become a member →
      </Link>
    </aside>
  )
}
