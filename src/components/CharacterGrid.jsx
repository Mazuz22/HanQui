import { TRACKS } from '../lib/tracks'

/**
 * A grid of small tiles, one per known character — the "advancement
 * board." Pure/presentational: used both embedded (a compact preview
 * right after a lesson, with that session's new characters highlighted)
 * and as the body of the full My Characters page.
 */
export default function CharacterGrid({ track, chars, highlightChars = [] }) {
  const { data } = TRACKS[track]
  const byChar = new Map(data.map((k) => [k.char, k]))
  const sorted = [...chars].sort((a, b) => (byChar.get(a)?.lessonOrder ?? 0) - (byChar.get(b)?.lessonOrder ?? 0))
  const highlightSet = new Set(highlightChars)

  if (sorted.length === 0) {
    return <p className="char-grid-empty">Nothing learned yet — finish a lesson first.</p>
  }

  return (
    <div className="char-grid">
      {sorted.map((char) => {
        const record = byChar.get(char)
        return (
          <div key={char} className={highlightSet.has(char) ? 'char-tile char-tile-new' : 'char-tile'}>
            <span className="char-tile-char">{char}</span>
            <span className="char-tile-meaning">{record?.meanings?.[0]}</span>
          </div>
        )
      })}
    </div>
  )
}
