import { describe, expect, it } from 'vitest'
import { estimateJlptLevel, formatJlptLevel } from './levelEstimate'

function kanji(char, lessonOrder, jlptLevel) {
  return { char, lessonOrder, jlptLevel }
}

const kanjiData = [
  kanji('a', 0, 5),
  kanji('b', 1, 5),
  kanji('c', 2, 5),
  kanji('d', 3, 5),
  kanji('e', 4, 5),
  kanji('f', 5, 5),
  kanji('g', 6, 4),
  kanji('h', 7, 4),
  kanji('i', 8, 4),
  kanji('j', 9, 4),
]

describe('estimateJlptLevel', () => {
  it('returns null before any kanji have been introduced', () => {
    expect(estimateJlptLevel(kanjiData, 0)).toBeNull()
  })

  it('looks behind the live frontier rather than at the newest kanji', () => {
    // 10 introduced -> frontier index 9 (jlptLevel 4), lookback of 5 lands on index 4 (jlptLevel 5)
    expect(estimateJlptLevel(kanjiData, 10)).toBe(5)
  })

  it('clamps the lookback to the start of the dataset for small progress', () => {
    expect(estimateJlptLevel(kanjiData, 2)).toBe(5)
  })
})

describe('formatJlptLevel', () => {
  it('formats a known level as an N-tier label', () => {
    expect(formatJlptLevel(4)).toBe('N4')
  })

  it('reports not-yet-placed for a null level', () => {
    expect(formatJlptLevel(null)).toBe('Not yet placed')
  })
})
