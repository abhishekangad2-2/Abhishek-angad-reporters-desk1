'use client'

import { useEffect, useState } from 'react'

type Comment = { id: string | number; author: string; body: string; createdAt: string | null }

function when(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}

/** Reader comments shown after a story. Auto-published: a new comment appears
 *  immediately (optimistically appended, and persisted via /api/comments). */
export default function Comments({ storyId, storySlug }: { storyId: string; storySlug?: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loaded, setLoaded] = useState(false)
  const [author, setAuthor] = useState('')
  const [body, setBody] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/comments?story=${encodeURIComponent(storyId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setComments(Array.isArray(d.comments) ? d.comments : [])
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [storyId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setError(null)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story: storyId, storySlug, author, body, website }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'Could not post your comment.')
        setStatus('error')
        return
      }
      if (data.comment) setComments((prev) => [...prev, data.comment])
      setBody('')
      setStatus('idle')
    } catch {
      setError('Could not post your comment.')
      setStatus('error')
    }
  }

  return (
    <section className="comments" aria-label="Reader comments">
      <h2 className="comments-title">
        Comments{comments.length > 0 && <span className="comments-count"> · {comments.length}</span>}
      </h2>

      <ul className="comments-list">
        {loaded && comments.length === 0 && (
          <li className="comments-empty">Be the first to comment.</li>
        )}
        {comments.map((c) => (
          <li key={c.id} className="comment">
            <div className="comment-head">
              <span className="comment-author">{c.author}</span>
              {c.createdAt && <span className="comment-date">{when(c.createdAt)}</span>}
            </div>
            <p className="comment-body">{c.body}</p>
          </li>
        ))}
      </ul>

      <form className="comment-form" onSubmit={handleSubmit}>
        <p className="comment-form-title">Join the conversation</p>
        <input
          className="comment-input"
          type="text"
          required
          maxLength={80}
          placeholder="Your name"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          aria-label="Your name"
        />
        <textarea
          className="comment-textarea"
          required
          rows={4}
          maxLength={4000}
          placeholder="Add your comment…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-label="Your comment"
        />
        {/* Honeypot — visually hidden, ignored by real users. */}
        <div className="comment-hp" aria-hidden="true">
          <label htmlFor="comment-website">Leave this field empty</label>
          <input
            id="comment-website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>
        <button className="comment-submit" type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Posting…' : 'Post comment'}
        </button>
        {status === 'error' && <p className="comment-error" role="alert">{error}</p>}
      </form>
    </section>
  )
}
