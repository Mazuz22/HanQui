import { describe, expect, it } from 'vitest'
import { masteryLevel } from './mastery'
import { recordReview } from './reviewQueue'

describe('masteryLevel', () => {
  it('treats a missing card as red', () => {
    expect(masteryLevel(null)).toBe('red')
    expect(masteryLevel(undefined)).toBe('red')
  })

  it('treats a brand-new card still in the learning phase as red', () => {
    const card = recordReview(null, true, null, new Date('2026-01-01T00:00:00Z'))
    expect(card.state).not.toBe(2) // not yet State.Review
    expect(masteryLevel(card)).toBe('red')
  })

  it('treats a card that has ever lapsed as red, even after recovering', () => {
    let now = new Date('2026-01-01T00:00:00Z')
    let card = recordReview(null, true, null, now)
    now = new Date(card.due.getTime() + 1000)
    card = recordReview(card, true, null, now)

    now = new Date(card.due.getTime() + 1000)
    card = recordReview(card, false, null, now) // forgotten once
    now = new Date(card.due.getTime() + 1000)
    card = recordReview(card, true, null, now) // recovered

    expect(card.lapses).toBeGreaterThan(0)
    expect(masteryLevel(card)).toBe('red')
  })

  it('treats a freshly-graduated card with low stability as yellow', () => {
    let now = new Date('2026-01-01T00:00:00Z')
    let card = recordReview(null, true, null, now)
    now = new Date(card.due.getTime() + 1000)
    card = recordReview(card, true, null, now)
    expect(card.state).toBe(2) // State.Review
    expect(card.lapses).toBe(0)
    expect(card.stability).toBeLessThan(30)
    expect(masteryLevel(card)).toBe('yellow')
  })

  it('treats a card with a couple of fast (Easy-graded) answers as green', () => {
    let now = new Date('2026-01-01T00:00:00Z')
    let card = recordReview(null, true, 1000, now) // well under the fast-answer bar
    now = new Date(card.due.getTime() + 1000)
    card = recordReview(card, true, 1000, now)
    expect(card.state).toBe(2) // State.Review
    expect(card.stability).toBeGreaterThanOrEqual(30)
    expect(masteryLevel(card)).toBe('green')
  })
})
