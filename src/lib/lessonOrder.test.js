import { describe, expect, it } from 'vitest'
import { buildLessonOrder } from './lessonOrder'

function record(char, { components = [], jlptLevel = 3, frequencyRank = null, strokeCount = 5 } = {}) {
  return { char, components, jlptLevel, frequencyRank, strokeCount }
}

describe('buildLessonOrder', () => {
  it('schedules a kanji after all of its components', () => {
    const records = [
      record('日', { jlptLevel: 5, strokeCount: 4 }),
      record('月', { jlptLevel: 5, strokeCount: 4 }),
      record('明', { components: ['日', '月'], jlptLevel: 4, strokeCount: 8 }),
    ]
    const { order } = buildLessonOrder(records)
    const index = (char) => order.indexOf(char)
    expect(index('明')).toBeGreaterThan(index('日'))
    expect(index('明')).toBeGreaterThan(index('月'))
  })

  it('prefers easier JLPT tiers among equally-ready kanji', () => {
    const records = [
      record('一', { jlptLevel: 1, strokeCount: 1 }), // N1, hardest
      record('二', { jlptLevel: 5, strokeCount: 2 }), // N5, easiest
    ]
    const { order } = buildLessonOrder(records)
    expect(order.indexOf('二')).toBeLessThan(order.indexOf('一'))
  })

  it('does not let an out-of-vocabulary component block scheduling', () => {
    const records = [record('明', { components: ['日', '月'], jlptLevel: 4 })]
    const { order, cycleBreaks } = buildLessonOrder(records)
    expect(order).toEqual(['明'])
    expect(cycleBreaks).toBe(0)
  })

  it('breaks a dependency cycle and still schedules every kanji exactly once', () => {
    const records = [
      record('甲', { components: ['乙'], jlptLevel: 3 }),
      record('乙', { components: ['甲'], jlptLevel: 3 }),
    ]
    const { order, cycleBreaks } = buildLessonOrder(records)
    expect(order.sort()).toEqual(['乙', '甲'])
    expect(cycleBreaks).toBeGreaterThan(0)
  })

  it('produces a deterministic order across repeated runs', () => {
    const records = [
      record('日', { jlptLevel: 5, strokeCount: 4 }),
      record('月', { jlptLevel: 5, strokeCount: 4 }),
      record('明', { components: ['日', '月'], jlptLevel: 4, strokeCount: 8 }),
      record('体', { components: ['人'], jlptLevel: 5, strokeCount: 7 }),
      record('人', { jlptLevel: 5, strokeCount: 2 }),
    ]
    const first = buildLessonOrder(records).order
    const second = buildLessonOrder(records).order
    expect(second).toEqual(first)
  })

  it('schedules every input record exactly once', () => {
    const records = [
      record('日', { jlptLevel: 5 }),
      record('月', { jlptLevel: 5 }),
      record('明', { components: ['日', '月'], jlptLevel: 4 }),
      record('体', { components: ['人'], jlptLevel: 5 }),
      record('人', { jlptLevel: 5 }),
    ]
    const { order } = buildLessonOrder(records)
    expect(order.length).toBe(records.length)
    expect(new Set(order).size).toBe(records.length)
  })
})
