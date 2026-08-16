import { describe, expect, it } from 'vitest'
import { buildProbeSet, estimateStartIndex } from './placementTest'

describe('buildProbeSet', () => {
  it('spans the full ordered list, including the first and last kanji', () => {
    const chars = Array.from({ length: 100 }, (_, i) => `k${i}`)
    const probe = buildProbeSet(chars, 18)
    expect(probe[0]).toBe('k0')
    expect(probe[probe.length - 1]).toBe('k99')
  })

  it('returns evenly-spaced, deduplicated samples', () => {
    const chars = Array.from({ length: 100 }, (_, i) => `k${i}`)
    const probe = buildProbeSet(chars, 18)
    expect(new Set(probe).size).toBe(probe.length)
    expect(probe.length).toBeLessThanOrEqual(18)
  })

  it('does not request more samples than kanji exist', () => {
    const chars = ['a', 'b', 'c']
    const probe = buildProbeSet(chars, 18)
    expect(probe.length).toBeLessThanOrEqual(3)
    expect(new Set(probe).size).toBe(probe.length)
  })

  it('returns an empty probe set for an empty lesson order', () => {
    expect(buildProbeSet([], 18)).toEqual([])
  })
})

describe('estimateStartIndex', () => {
  it('lands near the end when every probe answer is correct', () => {
    const results = Array.from({ length: 10 }, (_, i) => ({ lessonOrderIndex: i * 10, correct: true }))
    expect(estimateStartIndex(results)).toBe(91) // last lessonOrderIndex (90) + 1
  })

  it('returns 0 when every probe answer is incorrect', () => {
    const results = Array.from({ length: 10 }, (_, i) => ({ lessonOrderIndex: i * 10, correct: false }))
    expect(estimateStartIndex(results)).toBe(0)
  })

  it('does not prematurely truncate on a single mid-sequence miss', () => {
    const pattern = [true, true, true, false, true, true, true, true]
    const results = pattern.map((correct, i) => ({ lessonOrderIndex: i * 10, correct }))
    const estimate = estimateStartIndex(results)
    // Should scan past the isolated dip and credit the later correct answers too.
    expect(estimate).toBeGreaterThan(40)
  })

  it('stops at the first sustained run of misses', () => {
    const pattern = [true, true, true, true, true, false, false, false, false, false]
    const results = pattern.map((correct, i) => ({ lessonOrderIndex: i * 10, correct }))
    expect(estimateStartIndex(results)).toBe(51)
  })

  it('always returns a non-negative index', () => {
    const pattern = [false, true, false, true, false]
    const results = pattern.map((correct, i) => ({ lessonOrderIndex: i * 10, correct }))
    expect(estimateStartIndex(results)).toBeGreaterThanOrEqual(0)
  })
})
