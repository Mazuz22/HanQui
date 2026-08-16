import { describe, expect, it } from 'vitest'
import { buildLessonOrder } from './lessonOrder'

// `level` is track-agnostic: lower number = easier, always.
function record(char, { components = [], level = 3, frequencyRank = null, strokeCount = 5 } = {}) {
  return { char, components, level, frequencyRank, strokeCount }
}

describe('buildLessonOrder', () => {
  it('schedules a kanji after all of its components', () => {
    const records = [
      record('日', { level: 1, strokeCount: 4 }),
      record('月', { level: 1, strokeCount: 4 }),
      record('明', { components: ['日', '月'], level: 2, strokeCount: 8 }),
    ]
    const { order } = buildLessonOrder(records)
    const index = (char) => order.indexOf(char)
    expect(index('明')).toBeGreaterThan(index('日'))
    expect(index('明')).toBeGreaterThan(index('月'))
  })

  it('prefers easier levels among equally-ready kanji', () => {
    const records = [
      record('一', { level: 5, strokeCount: 1 }), // hardest tier
      record('二', { level: 1, strokeCount: 2 }), // easiest tier
    ]
    const { order } = buildLessonOrder(records)
    expect(order.indexOf('二')).toBeLessThan(order.indexOf('一'))
  })

  it('does not let an out-of-vocabulary component block scheduling', () => {
    const records = [record('明', { components: ['日', '月'], level: 2 })]
    const { order, cycleBreaks } = buildLessonOrder(records)
    expect(order).toEqual(['明'])
    expect(cycleBreaks).toBe(0)
  })

  it('breaks a dependency cycle and still schedules every kanji exactly once', () => {
    const records = [
      record('甲', { components: ['乙'], level: 3 }),
      record('乙', { components: ['甲'], level: 3 }),
    ]
    const { order, cycleBreaks } = buildLessonOrder(records)
    expect(order.sort()).toEqual(['乙', '甲'])
    expect(cycleBreaks).toBeGreaterThan(0)
  })

  it('produces a deterministic order across repeated runs', () => {
    const records = [
      record('日', { level: 1, strokeCount: 4 }),
      record('月', { level: 1, strokeCount: 4 }),
      record('明', { components: ['日', '月'], level: 2, strokeCount: 8 }),
      record('体', { components: ['人'], level: 1, strokeCount: 7 }),
      record('人', { level: 1, strokeCount: 2 }),
    ]
    const first = buildLessonOrder(records).order
    const second = buildLessonOrder(records).order
    expect(second).toEqual(first)
  })

  it('schedules every input record exactly once', () => {
    const records = [
      record('日', { level: 1 }),
      record('月', { level: 1 }),
      record('明', { components: ['日', '月'], level: 2 }),
      record('体', { components: ['人'], level: 1 }),
      record('人', { level: 1 }),
    ]
    const { order } = buildLessonOrder(records)
    expect(order.length).toBe(records.length)
    expect(new Set(order).size).toBe(records.length)
  })
})
