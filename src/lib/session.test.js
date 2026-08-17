import { describe, expect, it } from 'vitest'
import {
  BACKLOG_THRESHOLD,
  MAX_NEW_PER_SESSION,
  MAX_REVIEWS_PER_SESSION,
  PRACTICE_SESSION_SIZE,
  buildPracticeSession,
  buildTodaySession,
} from './session'

const NOW = new Date('2026-01-01T00:00:00Z')

function kanji(char, lessonOrder) {
  return { char, lessonOrder }
}

function dueCard(msBeforeNow = 1000) {
  return { due: new Date(NOW.getTime() - msBeforeNow) }
}

describe('buildTodaySession', () => {
  it('caps due reviews at MAX_REVIEWS_PER_SESSION', () => {
    const kanjiData = Array.from({ length: 30 }, (_, i) => kanji(`k${i}`, i))
    const reviewState = Object.fromEntries(kanjiData.map((k) => [k.char, dueCard()]))
    const progress = { introduced: kanjiData.map((k) => k.char) } // nothing new to introduce
    const session = buildTodaySession(kanjiData, progress, reviewState, NOW)
    expect(session.filter((s) => s.type === 'quiz').length).toBe(MAX_REVIEWS_PER_SESSION)
  })

  it('throttles new introductions once the due backlog exceeds the threshold', () => {
    const dueCount = BACKLOG_THRESHOLD + 5
    const kanjiData = Array.from({ length: dueCount + 10 }, (_, i) => kanji(`k${i}`, i))
    const reviewState = Object.fromEntries(kanjiData.slice(0, dueCount).map((k) => [k.char, dueCard()]))
    const progress = { introduced: kanjiData.slice(0, dueCount).map((k) => k.char) }
    const session = buildTodaySession(kanjiData, progress, reviewState, NOW)
    const introCount = session.filter((s) => s.type === 'intro').length
    expect(introCount).toBeLessThanOrEqual(2)
    expect(introCount).toBeLessThan(MAX_NEW_PER_SESSION)
  })

  it('never introduces an already-introduced char', () => {
    const kanjiData = Array.from({ length: 10 }, (_, i) => kanji(`k${i}`, i))
    const progress = { introduced: ['k0', 'k1', 'k2'] }
    const session = buildTodaySession(kanjiData, progress, {}, NOW)
    const introChars = session.filter((s) => s.type === 'intro').map((s) => s.char)
    expect(introChars).not.toEqual(expect.arrayContaining(['k0', 'k1', 'k2']))
  })

  it('spreads new introductions across the session rather than clustering them at the start', () => {
    const kanjiData = Array.from({ length: 10 }, (_, i) => kanji(`k${i}`, i))
    const reviewChars = kanjiData.slice(5).map((k) => k.char)
    const reviewState = Object.fromEntries(reviewChars.map((char) => [char, dueCard()]))
    const progress = { introduced: reviewChars }
    const session = buildTodaySession(kanjiData, progress, reviewState, NOW)
    const introIndices = session.map((s, i) => (s.type === 'intro' ? i : -1)).filter((i) => i !== -1)
    expect(introIndices[introIndices.length - 1]).toBeGreaterThanOrEqual(session.length / 2)
  })

  it('always follows an intro step with a quiz step for the same char', () => {
    const kanjiData = Array.from({ length: 10 }, (_, i) => kanji(`k${i}`, i))
    const reviewChars = kanjiData.slice(5).map((k) => k.char)
    const reviewState = Object.fromEntries(reviewChars.map((char) => [char, dueCard()]))
    const progress = { introduced: reviewChars }
    const session = buildTodaySession(kanjiData, progress, reviewState, NOW)
    session.forEach((step, i) => {
      if (step.type !== 'intro') return
      expect(session[i + 1]?.type).toBe('quiz')
      expect(session[i + 1]?.char).toBe(step.char)
    })
  })
})

describe('buildPracticeSession', () => {
  it('only includes already-introduced characters, all as quiz steps', () => {
    const progress = { introduced: ['a', 'b', 'c'] }
    const session = buildPracticeSession(progress, {})
    expect(session.every((s) => s.type === 'quiz')).toBe(true)
    expect(session.every((s) => progress.introduced.includes(s.char))).toBe(true)
  })

  it('caps the session at the requested count', () => {
    const progress = { introduced: Array.from({ length: 50 }, (_, i) => `k${i}`) }
    const session = buildPracticeSession(progress, {}, 20)
    expect(session.length).toBe(20)
  })

  it('defaults to PRACTICE_SESSION_SIZE when no count is given', () => {
    const progress = { introduced: Array.from({ length: 50 }, (_, i) => `k${i}`) }
    const session = buildPracticeSession(progress, {})
    expect(session.length).toBe(PRACTICE_SESSION_SIZE)
  })

  it('returns an empty session when nothing has been introduced yet', () => {
    expect(buildPracticeSession({ introduced: [] }, {})).toEqual([])
  })

  it('never includes the same character twice', () => {
    const progress = { introduced: Array.from({ length: 50 }, (_, i) => `k${i}`) }
    const session = buildPracticeSession(progress, {}, 20)
    expect(new Set(session.map((s) => s.char)).size).toBe(session.length)
  })

  it('favors red (unreliably-known) characters over green (mastered) ones', () => {
    // 5 mastered (green, high stability) characters, 45 never-reviewed
    // (red) ones. A small, low-count sample should overwhelmingly land on
    // the red characters despite them being a minority of the pool.
    const green = Array.from({ length: 5 }, (_, i) => `green${i}`)
    const red = Array.from({ length: 45 }, (_, i) => `red${i}`)
    const progress = { introduced: [...green, ...red] }
    const reviewState = Object.fromEntries(green.map((char) => [char, { state: 2, lapses: 0, stability: 100 }]))

    // A fixed, deterministic rng makes this a stable assertion rather than
    // a flaky probabilistic one: rng() always returns the same sequence,
    // so the outcome is reproducible while still exercising real weighting.
    let seed = 1
    const rng = () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }

    const session = buildPracticeSession(progress, reviewState, 10, rng)
    const greenCount = session.filter((s) => s.char.startsWith('green')).length
    expect(greenCount).toBeLessThanOrEqual(2) // far below its ~50% share of a uniform sample
  })
})
