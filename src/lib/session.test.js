import { describe, expect, it } from 'vitest'
import { BACKLOG_THRESHOLD, MAX_NEW_PER_SESSION, MAX_REVIEWS_PER_SESSION, buildTodaySession } from './session'

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
