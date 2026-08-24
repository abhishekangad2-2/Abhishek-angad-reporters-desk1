/** End-of-article marker — a full-width rule with the Reporters Desk end-mark,
 *  the traditional signal that the piece is finished. */
export default function StoryEnd() {
  return (
    <div className="story-end" role="separator" aria-label="End of article">
      <span className="story-end-mark" aria-hidden>
        ■
      </span>
    </div>
  )
}
