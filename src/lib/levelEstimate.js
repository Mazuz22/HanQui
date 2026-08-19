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

/**
 * Estimates the user's current level as the tier of the most recently
 * introduced character — "the tier of whatever you just learned."
 *
 * This relies on a real guarantee from the build pipeline, not a
 * coincidence: each track's build script only keeps a component as a
 * lesson-ordering prerequisite when it's the same tier or easier than the
 * character it's part of (see build-kanji-data.mjs / build-hanzi-data.mjs),
 * and buildLessonOrder always schedules the lowest-level ready character
 * first. Together those mean the lesson order's `level` sequence is always
 * non-decreasing — you finish an entire tier before the next one starts,
 * with no harder-tier character ever sneaking in early. So the tier of the
 * most recent lesson *is* an honest, stable answer, not a fragile sample
 * (see lessonOrder.test.js's monotonicity test for the property this
 * depends on).
 *
 * An earlier version instead reported "the first tier below some
 * completion threshold" — but that meant the label jumped to the *next*
 * tier's name the moment the current one crossed the bar, even at 0%
 * coverage of that next tier. 224 known kanji (all of N5, 85%+ of N4, 0%
 * of N3) got reported as N3, which read as premature to a learner who
 * hadn't seen a single N3 character yet. Reporting the frontier's own tier
 * avoids that entirely: the label only changes once you've actually
 * started learning the next one.
 */
export function estimateLevel(data, introducedCount) {
  if (introducedCount <= 0 || data.length === 0) return null

  const sorted = [...data].sort((a, b) => a.lessonOrder - b.lessonOrder)
  const frontierIndex = Math.min(sorted.length, introducedCount) - 1
  return sorted[frontierIndex].level
}

export function formatLevel(level, track) {
  if (level == null) return 'Not yet placed'
  return LEVEL_LABELS[track]?.[level] ?? `Level ${level}`
}
