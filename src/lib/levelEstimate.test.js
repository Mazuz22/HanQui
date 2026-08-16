import { describe, expect, it } from 'vitest'
import { estimateLevel, formatLevel } from './levelEstimate'

function kanji(char, lessonOrder, level) {
  return { char, lessonOrder, level }
}

const kanjiData = [
  kanji('a', 0, 1),
  kanji('b', 1, 1),
  kanji('c', 2, 1),
  kanji('d', 3, 1),
  kanji('e', 4, 1),
  kanji('f', 5, 1),
  kanji('g', 6, 2),
  kanji('h', 7, 2),
  kanji('i', 8, 2),
  kanji('j', 9, 2),
]

describe('estimateLevel', () => {
  it('returns null before any characters have been introduced', () => {
    expect(estimateLevel(kanjiData, 0)).toBeNull()
  })

  it('picks the most common level in the trailing window, not just the newest', () => {
    // 10 introduced, window of 4 -> last 4 (g,h,i,j) are all level 2.
    expect(estimateLevel(kanjiData, 10, 4)).toBe(2)
  })

  it('clamps the window to the start of the dataset for small progress', () => {
    expect(estimateLevel(kanjiData, 2, 15)).toBe(1)
  })

  it('breaks ties in favor of the easier level, staying conservative', () => {
    // window of 4 at introducedCount=8 -> e,f (level 1), g,h (level 2): a 2-2 tie.
    expect(estimateLevel(kanjiData, 8, 4)).toBe(1)
  })

  // Regression test for a real report: the lesson order isn't a clean
  // block-by-level sequence (it's a topological sort with level as only a
  // tie-break, so a lower-dependency character from a harder tier can
  // become "ready" and get scheduled early, interleaved into an easier
  // run). A single-point lookback can land squarely on one of those rare
  // interlopers and misreport the level even though the surrounding
  // characters are overwhelmingly the easier tier — exactly what happened
  // when a user with 161 known kanji, mostly N4, was told N3 because the
  // lookback point happened to land on one of only a few early N3 chars.
  it('is not thrown off by a single interloper from a harder tier', () => {
    const withInterloper = [
      kanji('a', 0, 1),
      kanji('b', 1, 1),
      kanji('c', 2, 2), // interloper: a harder-tier char scheduled early
      kanji('d', 3, 1),
      kanji('e', 4, 1),
      kanji('f', 5, 1),
      kanji('g', 6, 1),
      kanji('h', 7, 1),
      kanji('i', 8, 2),
      kanji('j', 9, 2),
    ]
    // A fixed single-point lookback (introducedCount - 1 - 5) would land on
    // index 2 here — the interloper — and wrongly report level 2.
    expect(estimateLevel(withInterloper, 8, 8)).toBe(1)
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
