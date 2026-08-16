// Per-track display labels for the internal `level` scale (1 = easiest).
// Kanji's scale is a transform of JLPT (N5..N1); Hanzi's is HSK's own
// numbering (HSK1..HSK6) — see each track's build script for the mapping.
const LEVEL_LABELS = {
  kanji: { 1: 'N5', 2: 'N4', 3: 'N3', 4: 'N2', 5: 'N1' },
  hanzi: { 1: 'HSK1', 2: 'HSK2', 3: 'HSK3', 4: 'HSK4', 5: 'HSK5', 6: 'HSK6' },
}

const ESTIMATE_WINDOW = 15

/**
 * Estimates the user's current level from how far into the lesson path
 * they've progressed.
 *
 * The lesson order isn't cleanly blocked by level — it's a topological
 * sort over component dependencies with level as the tie-break, so near a
 * tier boundary it naturally interleaves a run of, say, mostly-N4 with a
 * few early-ready N3 characters before N4 is fully exhausted (an N3
 * character whose components happen to already be known can become
 * "ready" before some later N4 character is). Picking a single character's
 * level at a fixed lookback point is fragile right at that boundary — it
 * can land on one of the few interlopers and call someone "N3" when
 * they've barely seen a handful of N3 characters. Taking the most common
 * level across a trailing window instead smooths that out; ties favor the
 * easier level, matching the existing "stay conservative" stance.
 */
export function estimateLevel(data, introducedCount, windowSize = ESTIMATE_WINDOW) {
  if (introducedCount <= 0 || data.length === 0) return null

  const sorted = [...data].sort((a, b) => a.lessonOrder - b.lessonOrder)
  const end = Math.min(sorted.length, introducedCount)
  const start = Math.max(0, end - windowSize)
  const window = sorted.slice(start, end)

  const counts = new Map()
  for (const { level } of window) counts.set(level, (counts.get(level) ?? 0) + 1)

  let bestLevel = null
  let bestCount = -1
  for (const level of [...counts.keys()].sort((a, b) => a - b)) {
    const count = counts.get(level)
    if (count > bestCount) {
      bestCount = count
      bestLevel = level
    }
  }
  return bestLevel
}

export function formatLevel(level, track) {
  if (level == null) return 'Not yet placed'
  return LEVEL_LABELS[track]?.[level] ?? `Level ${level}`
}
