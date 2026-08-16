import { describe, expect, it } from 'vitest'
import { generateQuestion } from './quizGenerator'

function kanji(char, meanings, { jlptLevel = 3, strokeCount = 5 } = {}) {
  return { char, meanings, onyomi: [], kunyomi: [], strokeCount, jlptLevel, frequencyRank: null, components: [] }
}

const dataset = [
  kanji('日', ['Day', 'Sun'], { jlptLevel: 5, strokeCount: 4 }),
  kanji('月', ['Month', 'Moon'], { jlptLevel: 5, strokeCount: 4 }),
  kanji('明', ['Bright', 'Light'], { jlptLevel: 4, strokeCount: 8 }),
  kanji('本', ['Book', 'Origin'], { jlptLevel: 5, strokeCount: 5 }),
  kanji('木', ['Tree', 'Wood'], { jlptLevel: 5, strokeCount: 4 }),
  kanji('林', ['Grove', 'Woods'], { jlptLevel: 2, strokeCount: 8 }),
  kanji('森', ['Forest'], { jlptLevel: 1, strokeCount: 12 }),
  kanji('火', ['Fire'], { jlptLevel: 5, strokeCount: 4 }),
  kanji('水', ['Water'], { jlptLevel: 5, strokeCount: 4 }),
  kanji('金', ['Gold', 'Money'], { jlptLevel: 5, strokeCount: 8 }),
  kanji('土', ['Earth', 'Soil'], { jlptLevel: 5, strokeCount: 3 }),
]

describe('generateQuestion', () => {
  it('never includes a distractor equal to the target', () => {
    const q = generateQuestion('明', dataset, 'kanjiToMeaning')
    const distractorChars = q.options.filter((_, i) => i !== q.correctIndex).map((o) => o.char)
    expect(distractorChars).not.toContain('明')
  })

  it('never includes a distractor sharing a meaning with the target', () => {
    const withDupe = [...dataset, kanji('陽', ['Sun', 'Yang'], { jlptLevel: 5, strokeCount: 4 })]
    const q = generateQuestion('日', withDupe, 'kanjiToMeaning')
    const distractorChars = q.options.filter((_, i) => i !== q.correctIndex).map((o) => o.char)
    expect(distractorChars).not.toContain('陽')
  })

  it('produces exactly 4 options with the correct index pointing at the target', () => {
    const q = generateQuestion('本', dataset, 'kanjiToMeaning')
    expect(q.options).toHaveLength(4)
    expect(q.options[q.correctIndex].char).toBe('本')
  })

  it('kanjiToMeaning direction: prompts with the char, labels options with meanings', () => {
    const q = generateQuestion('森', dataset, 'kanjiToMeaning')
    expect(q.prompt).toBe('森')
    expect(q.options[q.correctIndex].label).toBe('Forest')
  })

  it('meaningToKanji direction: prompts with the meaning, labels options with chars', () => {
    const q = generateQuestion('森', dataset, 'meaningToKanji')
    expect(q.prompt).toBe('Forest')
    expect(q.options[q.correctIndex].char).toBe('森')
    expect(q.options[q.correctIndex].label).toBe('森')
  })

  it('still returns 3 distractors for a target in a thin tier (e.g. N1)', () => {
    const q = generateQuestion('森', dataset, 'kanjiToMeaning')
    expect(q.options).toHaveLength(4)
  })

  it('is deterministic given the same rng sequence', () => {
    const rng = () => 0
    const a = generateQuestion('明', dataset, 'kanjiToMeaning', rng)
    const b = generateQuestion('明', dataset, 'kanjiToMeaning', rng)
    expect(a.options.map((o) => o.char)).toEqual(b.options.map((o) => o.char))
  })
})
