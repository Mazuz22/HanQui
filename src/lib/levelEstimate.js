// Per-track display labels for the internal `level` scale (1 = easiest).
// Kanji's scale is a transform of JLPT (N5..N1); Hanzi's is HSK's own
// numbering (HSK1..HSK6) — see each track's build script for the mapping.
const LEVEL_LABELS = {
  kanji: { 1: 'N5', 2: 'N4', 3: 'N3', 4: 'N2', 5: 'N1' },
  hanzi: { 1: 'HSK1', 2: 'HSK2', 3: 'HSK3', 4: 'HSK4', 5: 'HSK5', 6: 'HSK6' },
}

/**
 * Estimates the user's current level from how far into the lesson path
 * they've progressed.
 *
 * Looks a few characters behind the live frontier rather than the newest,
 * shakiest ones — a character introduced minutes ago hasn't been through a
 * single review yet, so basing the label on it would make the estimate
 * jump around from session to session. Looking slightly behind gives a
 * more conservative, stable number.
 */
export function estimateLevel(data, introducedCount) {
  if (introducedCount <= 0 || data.length === 0) return null

  const sorted = [...data].sort((a, b) => a.lessonOrder - b.lessonOrder)
  const lookbackIndex = Math.max(0, Math.min(sorted.length - 1, introducedCount - 1 - 5))
  return sorted[lookbackIndex].level
}

export function formatLevel(level, track) {
  if (level == null) return 'Not yet placed'
  return LEVEL_LABELS[track]?.[level] ?? `Level ${level}`
}
