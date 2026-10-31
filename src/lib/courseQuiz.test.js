import { describe, expect, it } from 'vitest'
import { buildQuiz, quizItems } from './courseQuiz'

function seeded(seed = 1) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const lesson = {
  vocab: [
    { hanzi: '你好', pinyin: 'nǐ hǎo', en: 'hello' },
    { hanzi: '我', pinyin: 'wǒ', en: 'I, me' },
    { hanzi: '是', pinyin: 'shì', en: 'to be' },
  ],
  characters: [
    { char: '你', pinyin: 'nǐ', meaning: 'you' },
    { char: '好', pinyin: 'hǎo', meaning: 'good' },
    { char: '我', pinyin: 'wǒ', meaning: 'I, me' },
  ],
}
const others = [
  { hanzi: '他', pinyin: 'tā', en: 'he' },
  { hanzi: '们', pinyin: 'men', en: 'plural suffix' },
]

describe('quizItems', () => {
  it('merges words and characters without duplicates', () => {
    expect(quizItems(lesson).map((i) => i.hanzi)).toEqual(['你好', '我', '是', '你', '好'])
  })
})

describe('buildQuiz', () => {
  const all = [...quizItems(lesson), ...others]
  const quiz = buildQuiz(lesson, all, { count: 8, rng: seeded(7) })

  it('asks at most one question per item', () => {
    expect(quiz).toHaveLength(5)
    expect(new Set(quiz.map((q) => q.target.hanzi)).size).toBe(5)
  })

  it('gives four distinct options with the answer at correctIndex', () => {
    for (const q of quiz) {
      expect(q.options).toHaveLength(4)
      expect(new Set(q.options.map((o) => o.label)).size).toBe(4)
      expect(q.options[q.correctIndex].key).toBe(q.target.hanzi)
    }
  })

  it('leaves out listening questions when the device cannot speak', () => {
    const silent = buildQuiz(lesson, all, { canListen: false, rng: seeded(3) })
    expect(silent.some((q) => q.kind === 'listen')).toBe(false)
  })
})
