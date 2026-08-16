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

  it('looks behind the live frontier rather than at the newest character', () => {
    // 10 introduced -> frontier index 9 (level 2), lookback of 5 lands on index 4 (level 1)
    expect(estimateLevel(kanjiData, 10)).toBe(1)
  })

  it('clamps the lookback to the start of the dataset for small progress', () => {
    expect(estimateLevel(kanjiData, 2)).toBe(1)
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
