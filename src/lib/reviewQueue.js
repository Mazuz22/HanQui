/**
 * Wraps `ts-fsrs` (an implementation of the FSRS spaced-repetition
 * algorithm) so the rest of the app never touches the library's scheduling
 * math directly.
 *
 * HanQui's quiz is 4-option multiple choice, which doesn't give an explicit
 * confidence rating the way flipping a physical flashcard and self-grading
 * does — but *how long* someone takes to answer is a real, ungamed proxy
 * for it: a fast correct answer means genuine recall, a slow correct
 * answer means they got there by elimination or a shaky guess. Wrong is
 * always Again regardless of speed. The thresholds below are a starting
 * heuristic (a 4-option MC question with a bit of reading involved), not
 * measured against real usage data — they're deliberately named constants
 * so they're easy to retune.
 */
import { Rating, State, createEmptyCard, fsrs } from 'ts-fsrs'

const scheduler = fsrs()

const FAST_ANSWER_MS = 2500 // confident, near-instant recall
const SLOW_ANSWER_MS = 7000 // anything past this reads as hesitant, not just careful

export { State }

/**
 * `elapsedMs` is null for reviews that were never actually timed — e.g.
 * placement seeding, which marks characters known in bulk rather than
 * through an individual answer — and falls back to a neutral Good rather
 * than assuming the best (Easy) or worst (Hard) case.
 */
export function gradeFromAnswer(wasCorrect, elapsedMs) {
  if (!wasCorrect) return Rating.Again
  if (elapsedMs == null) return Rating.Good
  if (elapsedMs <= FAST_ANSWER_MS) return Rating.Easy
  if (elapsedMs <= SLOW_ANSWER_MS) return Rating.Good
  return Rating.Hard
}

/** Creates a card if none exists yet, then advances it by one review. */
export function recordReview(card, wasCorrect, elapsedMs, now = new Date()) {
  const current = card ?? createEmptyCard(now)
  const { card: updated } = scheduler.next(current, now, gradeFromAnswer(wasCorrect, elapsedMs))
  return updated
}

/** Chars whose card is due, oldest-due-first. */
export function getDueChars(reviewState, now = new Date()) {
  return Object.entries(reviewState)
    .filter(([, card]) => card.due <= now)
    .sort((a, b) => a[1].due.getTime() - b[1].due.getTime())
    .map(([char]) => char)
}

// FSRS cards carry Date fields (`due`, `last_review`) that JSON.stringify
// silently turns into strings and JSON.parse leaves as strings — these
// helpers make that round trip explicit instead of relying on implicit
// coercion, which would quietly break every date comparison above.
export function serializeReviewState(reviewState) {
  const serialized = {}
  for (const [char, card] of Object.entries(reviewState)) {
    serialized[char] = {
      ...card,
      due: card.due.toISOString(),
      last_review: card.last_review ? card.last_review.toISOString() : null,
    }
  }
  return serialized
}

export function deserializeReviewState(serialized) {
  const reviewState = {}
  for (const [char, card] of Object.entries(serialized)) {
    reviewState[char] = {
      ...card,
      due: new Date(card.due),
      last_review: card.last_review ? new Date(card.last_review) : undefined,
    }
  }
  return reviewState
}
