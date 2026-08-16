import { TRACKS } from '../lib/tracks'
import { masteryLevel } from '../lib/mastery'

/**
 * A grid of small tiles, one per known character — the "advancement
 * board." Pure/presentational: used both embedded (a compact preview
 * right after a lesson, with that session's new characters highlighted)
 * and as the body of the full My Characters page.
 *
 * Characters still shaky (see lib/mastery.js) sort first, ahead of solidly
 * known ones, so the things most worth another look surface immediately
 * rather than being buried at the bottom of a long list — and get a
 * visible badge so "why is this one first" is obvious at a glance.
 */
export default function CharacterGrid({ track, chars, reviewState = {}, highlightChars = [] }) {
  const { data } = TRACKS[track]
  const byChar = new Map(data.map((k) => [k.char, k]))
  const highlightSet = new Set(highlightChars)

  const sorted = [...chars].sort((a, b) => {
    const levelA = masteryLevel(reviewState[a])
    const levelB = masteryLevel(reviewState[b])
    if (levelA !== levelB) return levelA === 'shaky' ? -1 : 1
    return (byChar.get(a)?.lessonOrder ?? 0) - (byChar.get(b)?.lessonOrder ?? 0)
  })

  if (sorted.length === 0) {
    return <p className="char-grid-empty">Nothing learned yet — finish a lesson first.</p>
  }

  return (
    <div className="char-grid">
      {sorted.map((char) => {
        const record = byChar.get(char)
        const isNew = highlightSet.has(char)
        const isShaky = !isNew && masteryLevel(reviewState[char]) === 'shaky'
        let className = 'char-tile'
        if (isNew) className += ' char-tile-new'
        else if (isShaky) className += ' char-tile-shaky'
        return (
          <div key={char} className={className}>
            <span className="char-tile-char">{char}</span>
            <span className="char-tile-meaning">{record?.meanings?.[0]}</span>
            {isShaky && <span className="char-tile-badge">learning</span>}
          </div>
        )
      })}
    </div>
  )
}
