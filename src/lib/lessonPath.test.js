import { describe, expect, it } from 'vitest'
import { getNextNewChars } from './lessonPath'

function kanji(char, lessonOrder) {
  return { char, lessonOrder }
}

describe('getNextNewChars', () => {
  it('returns chars in ascending lesson order regardless of input order', () => {
    const data = [kanji('乙', 1), kanji('甲', 0), kanji('丙', 2)]
    expect(getNextNewChars(data, [], 3)).toEqual(['甲', '乙', '丙'])
  })

  it('excludes already-introduced chars', () => {
    const data = [kanji('甲', 0), kanji('乙', 1), kanji('丙', 2)]
    expect(getNextNewChars(data, ['甲'], 3)).toEqual(['乙', '丙'])
  })

  it('respects the requested count', () => {
    const data = [kanji('甲', 0), kanji('乙', 1), kanji('丙', 2)]
    expect(getNextNewChars(data, [], 2)).toEqual(['甲', '乙'])
  })

  it('accepts either a Set or an array for the introduced set', () => {
    const data = [kanji('甲', 0), kanji('乙', 1)]
    expect(getNextNewChars(data, new Set(['甲']), 2)).toEqual(['乙'])
  })
})
