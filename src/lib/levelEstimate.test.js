import { describe, expect, it } from 'vitest'
import { estimateLevel, formatLevel } from './levelEstimate'

function kanji(char, lessonOrder, level) {
  return { char, lessonOrder, level }
}

// 5 level-1, 5 level-2, in strict lesson order — this is the only shape
// estimateLevel ever sees in practice, since buildLessonOrder guarantees a
// level-monotonic sequence (see lessonOrder.test.js's monotonicity test).
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

  it('reports the tier of the most recently introduced character', () => {
    expect(estimateLevel(kanjiData, 2)).toBe(1) // 'b', still level 1
    expect(estimateLevel(kanjiData, 5)).toBe(1) // 'e', last of level 1
    expect(estimateLevel(kanjiData, 6)).toBe(2) // 'f', first of level 2
  })

  it('clamps to the last record once everything is introduced', () => {
    expect(estimateLevel(kanjiData, kanjiData.length)).toBe(2)
    expect(estimateLevel(kanjiData, 999)).toBe(2)
  })

  // Regression test for a real report: 224 known kanji — all of N5, most
  // but not all of N4, none of N3 yet — got reported as N3 by an earlier
  // coverage-threshold version of this function, because N4 had crossed
  // its "done" bar even though the learner hadn't touched N3 at all. The
  // frontier's own tier doesn't have this problem: it only changes once
  // you've actually started learning the next tier.
  it('does not advance to the next tier just because the current one is mostly done', () => {
    const data = [
      ...Array.from({ length: 5 }, (_, i) => kanji(`n5-${i}`, i, 1)), // all of N5
      ...Array.from({ length: 10 }, (_, i) => kanji(`n4-${i}`, 5 + i, 2)), // N4, 8 of 10 introduced
      ...Array.from({ length: 5 }, (_, i) => kanji(`n3-${i}`, 15 + i, 3)), // N3, none introduced
    ]
    expect(estimateLevel(data, 13)).toBe(2) // last introduced is n4-7, still level 2
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
