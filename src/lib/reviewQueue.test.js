import { describe, expect, it } from 'vitest'
import {
  deserializeReviewState,
  getDueChars,
  gradeFromCorrectness,
  recordReview,
  serializeReviewState,
} from './reviewQueue'
import { Rating } from 'ts-fsrs'

describe('gradeFromCorrectness', () => {
  it('maps correct answers to Good', () => {
    expect(gradeFromCorrectness(true)).toBe(Rating.Good)
  })

  it('maps incorrect answers to Again', () => {
    expect(gradeFromCorrectness(false)).toBe(Rating.Again)
  })
})

describe('recordReview', () => {
  it('creates a fresh card when none exists yet', () => {
    const now = new Date('2026-01-01T00:00:00Z')
    const card = recordReview(null, true, now)
    expect(card.reps).toBe(1)
    expect(card.due).toBeInstanceOf(Date)
  })

  it('schedules a future due date after a correct answer', () => {
    const now = new Date('2026-01-01T00:00:00Z')
    const card = recordReview(null, true, now)
    expect(card.due.getTime()).toBeGreaterThan(now.getTime())
  })

  it('advances reps on an existing card rather than resetting it', () => {
    const now = new Date('2026-01-01T00:00:00Z')
    const first = recordReview(null, true, now)
    const second = recordReview(first, true, new Date('2026-01-05T00:00:00Z'))
    expect(second.reps).toBe(2)
  })

  it('an incorrect answer increases lapses once a card has graduated to review', () => {
    // FSRS keeps a brand-new card in a short "learning" phase for its first
    // couple of reviews; lapses only start counting once a card has
    // graduated to the long-term review state, so graduate it first.
    let now = new Date('2026-01-01T00:00:00Z')
    let card = recordReview(null, true, now)
    now = new Date(card.due.getTime() + 1000)
    card = recordReview(card, true, now)
    expect(card.state).toBe(2) // State.Review

    now = new Date(card.due.getTime() + 1000)
    const failed = recordReview(card, false, now)
    expect(failed.lapses).toBeGreaterThan(card.lapses)
  })
})

describe('getDueChars', () => {
  it('excludes a card whose due date is still in the future', () => {
    const now = new Date('2026-01-09T12:00:00Z')
    const reviewState = { 未来: recordReview(null, true, now) }
    expect(getDueChars(reviewState, now)).toEqual([])
  })

  it('includes a card once its due date has passed', () => {
    const now = new Date('2026-01-09T12:00:00Z')
    const reviewState = { 早: recordReview(null, true, now) }
    const later = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    expect(getDueChars(reviewState, later)).toContain('早')
  })

  it('sorts multiple due cards oldest-due-first', () => {
    const now = new Date('2026-01-01T00:00:00Z')
    const later = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
    const reviewState = {
      新: recordReview(null, true, new Date(now.getTime() + 60 * 60 * 1000)),
      旧: recordReview(null, true, now),
    }
    expect(getDueChars(reviewState, later)).toEqual(['旧', '新'])
  })
})

describe('serializeReviewState / deserializeReviewState', () => {
  it('round-trips card dates through JSON without losing Date-ness', () => {
    const now = new Date('2026-01-01T00:00:00Z')
    const reviewState = { 日: recordReview(null, true, now) }
    const json = JSON.parse(JSON.stringify(serializeReviewState(reviewState)))
    const restored = deserializeReviewState(json)
    expect(restored.日.due).toBeInstanceOf(Date)
    expect(restored.日.due.getTime()).toBe(reviewState.日.due.getTime())
    expect(restored.日.last_review.getTime()).toBe(reviewState.日.last_review.getTime())
  })
})
