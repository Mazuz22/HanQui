import { State } from './reviewQueue'

/**
 * Classifies how solidly a character is known from its FSRS review card,
 * for display purposes only (sorting/badging on the My Characters page and
 * the advancement board) — this never feeds back into scheduling, which
 * relies entirely on FSRS's own due-date math regardless of this label.
 *
 * 'shaky' covers: no card yet (introduced but never actually quizzed —
 * possible if a session was exited right after an intro step), still in
 * FSRS's short-term Learning/Relearning phase (hasn't graduated to a real
 * long-interval review yet), or has been forgotten at least once (any
 * lapse). Everything else — graduated to Review state, never lapsed — is
 * 'solid'. Deliberately binary rather than a finer scale: the point is a
 * quick visual "still needs work" signal, not a precise score.
 */
export function masteryLevel(card) {
  if (!card) return 'shaky'
  if (card.lapses > 0) return 'shaky'
  if (card.state !== State.Review) return 'shaky'
  return 'solid'
}
