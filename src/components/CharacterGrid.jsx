import { TRACKS } from '../lib/tracks'
import { masteryLevel } from '../lib/mastery'

const MASTERY_RANK = { red: 0, yellow: 1, green: 2 }
const MASTERY_BADGE = { red: 'learning', yellow: 'developing' }

/**
 * A grid of small tiles, one per known character — the "advancement
 * board." Pure/presentational: used both embedded (a compact preview
 * right after a lesson, with that session's new characters highlighted)
 * and as the body of the full My Characters page.
 *
 * Sorted weakest-first (see lib/mastery.js's red/yellow/green tiers), so
 * the things most worth another look surface immediately rather than
 * being buried at the bottom of a long list — with a badge on red/yellow
 * tiles so "why is this one near the top" is obvious at a glance. Green
 * (deeply known) tiles get no badge at all, on purpose — they're the
 * quiet, unremarkable default once something is genuinely solid.
 */
export default function CharacterGrid({ track, chars, reviewState = {}, highlightChars = [] }) {
  const { data } = TRACKS[track]
  const byChar = new Map(data.map((k) => [k.char, k]))
  const highlightSet = new Set(highlightChars)

  const sorted = [...chars].sort((a, b) => {
    const rankA = MASTERY_RANK[masteryLevel(reviewState[a])]
    const rankB = MASTERY_RANK[masteryLevel(reviewState[b])]
    if (rankA !== rankB) return rankA - rankB
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
        const level = masteryLevel(reviewState[char])
        let className = 'char-tile'
        if (isNew) className += ' char-tile-new'
        else if (level === 'red') className += ' char-tile-red'
        else if (level === 'yellow') className += ' char-tile-yellow'
        return (
          <div key={char} className={className}>
            <span className="char-tile-char">{char}</span>
            <span className="char-tile-meaning">{record?.meanings?.[0]}</span>
            {!isNew && MASTERY_BADGE[level] && <span className="char-tile-badge">{MASTERY_BADGE[level]}</span>}
          </div>
        )
      })}
    </div>
  )
}
