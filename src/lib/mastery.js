import { State } from './reviewQueue'

// FSRS's `stability` is its own predicted number of days until retention
// drops to ~90% — i.e. "how long before you'd likely forget this," which is
// exactly what "known well" should mean. It already accounts for answer
// speed: a fast, confident answer grades Easy (see reviewQueue.js's
// gradeFromAnswer) and roughly triples stability per review, while a
// normal-paced Good answer grows it much more slowly — so a card can reach
// this bar either quickly via a couple of fast answers, or more gradually
// via several correct-but-unhurried ones. Both are genuine mastery, just
// arrived at differently.
const MASTERED_STABILITY_DAYS = 30

/**
 * Classifies how solidly a character is known from its FSRS review card,
 * for display purposes only (sorting/badging on the My Characters page,
 * the advancement board, and weighting Practice's sampling) — this never
 * feeds back into scheduling, which relies entirely on FSRS's own due-date
 * math regardless of this label.
 *
 * Three tiers:
 * - 'red': no card yet (introduced but never actually quizzed — possible
 *   if a session was exited right after an intro step), still in FSRS's
 *   short-term Learning/Relearning phase, or has ever lapsed (forgotten
 *   at least once). Not reliably known.
 * - 'yellow': graduated to FSRS's long-term Review state with no lapses,
 *   but not yet stable for long — known, but still fragile.
 * - 'green': graduated, never lapsed, and predicted stable for at least
 *   MASTERED_STABILITY_DAYS — genuinely well known.
 */
export function masteryLevel(card) {
  if (!card) return 'red'
  if (card.lapses > 0) return 'red'
  if (card.state !== State.Review) return 'red'
  if (card.stability >= MASTERED_STABILITY_DAYS) return 'green'
  return 'yellow'
}
