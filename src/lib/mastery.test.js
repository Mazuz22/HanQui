import { describe, expect, it } from 'vitest'
import { masteryLevel } from './mastery'
import { recordReview } from './reviewQueue'

describe('masteryLevel', () => {
  it('treats a missing card as shaky', () => {
    expect(masteryLevel(null)).toBe('shaky')
    expect(masteryLevel(undefined)).toBe('shaky')
  })

  it('treats a brand-new card still in the learning phase as shaky', () => {
    const card = recordReview(null, true, null, new Date('2026-01-01T00:00:00Z'))
    expect(card.state).not.toBe(2) // not yet State.Review
    expect(masteryLevel(card)).toBe('shaky')
  })

  it('treats a card graduated to Review with no lapses as solid', () => {
    let now = new Date('2026-01-01T00:00:00Z')
    let card = recordReview(null, true, null, now)
    now = new Date(card.due.getTime() + 1000)
    card = recordReview(card, true, null, now)
    expect(card.state).toBe(2) // State.Review
    expect(card.lapses).toBe(0)
    expect(masteryLevel(card)).toBe('solid')
  })

  it('treats a card that has ever lapsed as shaky, even after recovering', () => {
    let now = new Date('2026-01-01T00:00:00Z')
    let card = recordReview(null, true, null, now)
    now = new Date(card.due.getTime() + 1000)
    card = recordReview(card, true, null, now)

    now = new Date(card.due.getTime() + 1000)
    card = recordReview(card, false, null, now) // forgotten once
    now = new Date(card.due.getTime() + 1000)
    card = recordReview(card, true, null, now) // recovered

    expect(card.lapses).toBeGreaterThan(0)
    expect(masteryLevel(card)).toBe('shaky')
  })
})
