/**
 * Combines the review queue and the lesson path into what the user actually
 * sees in one sitting.
 *
 * Reviews are capped so a big backlog doesn't turn into an hour-long
 * session, and new introductions are throttled once that backlog builds up
 * — piling fresh material on top of an already-overdue review queue just
 * makes both worse. New kanji are introduced as an intro+quiz pair (seeing
 * it once before being asked about it) and those pairs are spread evenly
 * across the review steps rather than clumped at the start or end, so a
 * session doesn't feel front-loaded with lecture and back-loaded with drill.
 */
import { getDueChars } from './reviewQueue'
import { getNextNewChars } from './lessonPath'

export const MAX_REVIEWS_PER_SESSION = 15
export const MAX_NEW_PER_SESSION = 5
export const BACKLOG_THRESHOLD = 20
export const PRACTICE_SESSION_SIZE = 20

export function buildTodaySession(kanjiData, progress, reviewState, now = new Date(), rng = Math.random) {
  const due = getDueChars(reviewState, now)
  const dueCapped = due.slice(0, MAX_REVIEWS_PER_SESSION)

  const newCount = due.length > BACKLOG_THRESHOLD ? Math.min(2, MAX_NEW_PER_SESSION) : MAX_NEW_PER_SESSION
  const newChars = getNextNewChars(kanjiData, progress.introduced, newCount)

  const reviewUnits = dueCapped.map((char) => [
    { type: 'quiz', char, direction: rng() < 0.5 ? 'kanjiToMeaning' : 'meaningToKanji' },
  ])
  const newUnits = newChars.map((char) => [
    { type: 'intro', char },
    { type: 'quiz', char, direction: 'kanjiToMeaning' },
  ])

  return interleaveUnits(reviewUnits, newUnits)
}

/**
 * A free, on-demand review session over characters the user already
 * knows — not gated by FSRS due dates, unlike buildTodaySession. Answers
 * still feed back into the FSRS review state (see Session.jsx), so
 * practicing is genuine review signal, not a no-op quiz.
 */
export function buildPracticeSession(progress, count = PRACTICE_SESSION_SIZE, rng = Math.random) {
  const introduced = progress?.introduced ?? []
  const shuffled = shuffle(introduced, rng)
  return shuffled.slice(0, Math.min(count, shuffled.length)).map((char) => ({
    type: 'quiz',
    char,
    direction: rng() < 0.5 ? 'kanjiToMeaning' : 'meaningToKanji',
  }))
}

function shuffle(items, rng) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Spreads `insertUnits` evenly across `baseUnits` (each a small run of steps
// that must stay adjacent) rather than clustering them at either end.
function interleaveUnits(baseUnits, insertUnits) {
  if (insertUnits.length === 0) return baseUnits.flat()
  if (baseUnits.length === 0) return insertUnits.flat()

  const result = []
  const step = baseUnits.length / insertUnits.length
  let insertIndex = 0
  let nextInsertAt = step / 2

  for (let i = 0; i < baseUnits.length; i++) {
    while (insertIndex < insertUnits.length && i >= nextInsertAt) {
      result.push(...insertUnits[insertIndex])
      insertIndex += 1
      nextInsertAt += step
    }
    result.push(...baseUnits[i])
  }
  while (insertIndex < insertUnits.length) {
    result.push(...insertUnits[insertIndex])
    insertIndex += 1
  }
  return result
}
