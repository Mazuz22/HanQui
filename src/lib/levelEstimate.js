// Per-track display labels for the internal `level` scale (1 = easiest).
// Kanji's scale is a transform of JLPT (N5..N1); Hanzi's is HSK's own
// numbering (HSK1..HSK6) — see each track's build script for the mapping.
// Words reuses Kanji's N-tier labels since a word's level is derived
// directly from its component kanji's JLPT tiers (see
// build-words-data.mjs) — the same scale, not a separate one.
const LEVEL_LABELS = {
  kanji: { 1: 'N5', 2: 'N4', 3: 'N3', 4: 'N2', 5: 'N1' },
  hanzi: { 1: 'HSK1', 2: 'HSK2', 3: 'HSK3', 4: 'HSK4', 5: 'HSK5', 6: 'HSK6' },
  words: { 1: 'N5', 2: 'N4', 3: 'N3', 4: 'N2', 5: 'N1' },
}

// 60% used to be the bar for "this tier is done, report the next harder
// one" — but that reported someone as N3 while a quarter of N4 was still
// unlearned, which reads as premature to a learner who doesn't feel N4 is
// behind them yet. 85% means a tier has to be nearly finished, not just
// majority-covered, before the label moves on to the next one.
const COMPLETION_THRESHOLD = 0.85

/**
 * Estimates the user's current level from how much of each tier has
 * actually been covered, not from where the lesson-path frontier happens
 * to be.
 *
 * The lesson order isn't cleanly blocked by level — it's a topological
 * sort over component dependencies with level only a tie-break, so a
 * harder-tier character whose components are already known can get
 * scheduled well before an easier-tier character that's still blocked on
 * one of its own. That means a real chunk of an "earlier" tier can still
 * be unlearned even after the frontier has moved well past it — reporting
 * "the level of whatever was scheduled around here" (a single sample, or
 * even a windowed mode of recent lessons) can call someone N3 while
 * nearly half the N4 tier is still unlearned, which is exactly what
 * happened: 188 known kanji got reported as N3 with only 55% of all N4
 * kanji actually introduced yet.
 *
 * Instead: walk tiers from easiest to hardest and report the first one
 * where less than COMPLETION_THRESHOLD of that tier's total characters
 * have actually been learned — "the tier you're still filling in," not
 * "the tier of the most recent lesson."
 */
export function estimateLevel(data, introducedCount, threshold = COMPLETION_THRESHOLD) {
  if (introducedCount <= 0 || data.length === 0) return null

  const sorted = [...data].sort((a, b) => a.lessonOrder - b.lessonOrder)
  const known = sorted.slice(0, Math.min(sorted.length, introducedCount))

  const totalByLevel = new Map()
  for (const { level } of data) totalByLevel.set(level, (totalByLevel.get(level) ?? 0) + 1)

  const knownByLevel = new Map()
  for (const { level } of known) knownByLevel.set(level, (knownByLevel.get(level) ?? 0) + 1)

  const levels = [...totalByLevel.keys()].sort((a, b) => a - b)
  for (const level of levels) {
    const coverage = (knownByLevel.get(level) ?? 0) / totalByLevel.get(level)
    if (coverage < threshold) return level
  }
  return levels[levels.length - 1] ?? null
}

export function formatLevel(level, track) {
  if (level == null) return 'Not yet placed'
  return LEVEL_LABELS[track]?.[level] ?? `Level ${level}`
}
