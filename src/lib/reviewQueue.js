/**
 * Wraps `ts-fsrs` (an implementation of the FSRS spaced-repetition
 * algorithm) so the rest of the app never touches the library's scheduling
 * math directly.
 *
 * HanQui's quiz is 4-option multiple choice, which only tells us right or
 * wrong — not how confident the answer was. So the mapping from a quiz
 * result to an FSRS rating is deliberately binary: correct -> Good,
 * incorrect -> Again. `Hard`/`Easy` are unused in v1; a future
 * response-time-based split could add them without touching this shape.
 */
import { Rating, createEmptyCard, fsrs } from 'ts-fsrs'

const scheduler = fsrs()

export function gradeFromCorrectness(wasCorrect) {
  return wasCorrect ? Rating.Good : Rating.Again
}

/** Creates a card if none exists yet, then advances it by one review. */
export function recordReview(card, wasCorrect, now = new Date()) {
  const current = card ?? createEmptyCard(now)
  const { card: updated } = scheduler.next(current, now, gradeFromCorrectness(wasCorrect))
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
