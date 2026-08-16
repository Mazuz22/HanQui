import { describe, expect, it } from 'vitest'
import { estimateLevel, formatLevel } from './levelEstimate'

function kanji(char, lessonOrder, level) {
  return { char, lessonOrder, level }
}

// 5 level-1, 5 level-2, in strict lesson order — no interleaving, so
// coverage and "most recent tier" agree here (see the interleaved dataset
// below for the case where they don't).
const kanjiData = [
  kanji('a', 0, 1),
  kanji('b', 1, 1),
  kanji('c', 2, 1),
  kanji('d', 3, 1),
  kanji('e', 4, 1),
  kanji('f', 5, 2),
  kanji('g', 6, 2),
  kanji('h', 7, 2),
  kanji('i', 8, 2),
  kanji('j', 9, 2),
]

describe('estimateLevel', () => {
  it('returns null before any characters have been introduced', () => {
    expect(estimateLevel(kanjiData, 0)).toBeNull()
  })

  it('stays on the easier tier until it is mostly covered', () => {
    // 2 of 5 level-1 known -> 40%, below the 60% bar -> still level 1.
    expect(estimateLevel(kanjiData, 2)).toBe(1)
  })

  it('advances once the easier tier crosses the completion threshold', () => {
    // 7 introduced: level 1 is 5/5 = 100% (done), level 2 is 2/5 = 40%
    // (not done) -> the tier being worked on is level 2, even though
    // barely any of it has been covered yet.
    expect(estimateLevel(kanjiData, 7)).toBe(2)
  })

  it('respects a custom threshold', () => {
    expect(estimateLevel(kanjiData, 7, 0.9)).toBe(2) // level 1 done regardless; level 2 at 40% < 90%
    expect(estimateLevel(kanjiData, 7, 0.3)).toBe(2) // both tiers clear a lax 30% bar -> reports the hardest
  })

  it('reports the hardest tier once everything is covered', () => {
    expect(estimateLevel(kanjiData, kanjiData.length)).toBe(2)
  })

  // Regression test for a real report: with 188 known kanji only 55% of
  // all N4-level kanji had actually been introduced (the rest were still
  // blocked on component dependencies), yet the level estimate said N3
  // because that's what the *most recent* lessons happened to be tagged.
  it('is not fooled by a harder tier interleaved ahead of an unfinished easier one', () => {
    const interleaved = [
      // 4 level-1, fully covered early.
      kanji('a', 0, 1),
      kanji('b', 1, 1),
      kanji('c', 2, 1),
      kanji('d', 3, 1),
      // Only 3 of level-2's eventual 6 are scheduled this early — the
      // other 3 are blocked on later-introduced components (indices 20+,
      // not shown here since introducedCount never reaches them).
      kanji('e', 4, 2),
      kanji('f', 5, 2),
      kanji('g', 6, 2),
      // A run of level-3 characters becomes "ready" (simple dependencies)
      // and gets scheduled before level-2 is anywhere near finished.
      kanji('h', 7, 3),
      kanji('i', 8, 3),
      kanji('j', 9, 3),
      kanji('k', 10, 3),
      kanji('l', 11, 3),
      // The remaining level-2 characters, still not learned by index 16.
      kanji('m', 20, 2),
      kanji('n', 21, 2),
      kanji('o', 22, 2),
    ]
    // 11 introduced (through index 10): level 1 = 4/4 = 100%, level 2 =
    // 3/6 = 50% (below threshold), level 3 = 5/5 = 100% of what's been
    // *scheduled* so far but the recent lessons are all level 3. The
    // right answer is still level 2 — it's what's actually unfinished.
    expect(estimateLevel(interleaved, 11)).toBe(2)
  })
})

describe('formatLevel', () => {
  it('formats a known kanji level as an N-tier label', () => {
    expect(formatLevel(2, 'kanji')).toBe('N4')
  })

  it('formats a known hanzi level as an HSK label', () => {
    expect(formatLevel(2, 'hanzi')).toBe('HSK2')
  })

  it('reports not-yet-placed for a null level', () => {
    expect(formatLevel(null, 'kanji')).toBe('Not yet placed')
  })
})
