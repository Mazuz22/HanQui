/**
 * Selects the probe set shown during placement and estimates a starting
 * point in the lesson path from how the user did on it.
 *
 * The probe set is sampled evenly across the *already-computed* lesson
 * order rather than a separately hand-picked list — that's the only way to
 * guarantee it spans N5-easiest through N1-hardest while still respecting
 * component-dependency order, with nothing extra to keep in sync when the
 * lesson order itself changes.
 */
export function buildProbeSet(orderedChars, count = 18) {
  if (orderedChars.length === 0) return []

  const effectiveCount = Math.min(count, orderedChars.length)
  const last = orderedChars.length - 1
  const seen = new Set()
  const probe = []

  for (let i = 0; i < effectiveCount; i++) {
    const index = effectiveCount === 1 ? 0 : Math.round((i * last) / (effectiveCount - 1))
    const char = orderedChars[index]
    if (seen.has(char)) continue
    seen.add(char)
    probe.push(char)
  }

  return probe
}

/**
 * Walks placement results in ascending lesson-order position and returns
 * the lesson-path index the user should start at.
 *
 * Uses a trailing 3-item window requiring at least 2/3 correct to keep
 * advancing a "confident" pointer, rather than stopping at the very first
 * wrong answer — a single lucky guess or careless slip shouldn't cap where
 * someone starts, but a *sustained* run of misses should. The first point
 * where the window average drops below 2/3 ends the scan; everything up to
 * (and including) the last confident point is treated as already known.
 */
export function estimateStartIndex(probeResults) {
  if (probeResults.length === 0) return 0

  let lastConfident = -1
  for (let i = 0; i < probeResults.length; i++) {
    const window = probeResults.slice(Math.max(0, i - 2), i + 1)
    const correctCount = window.filter((r) => r.correct).length
    if (correctCount / window.length >= 2 / 3) {
      lastConfident = i
    } else {
      break
    }
  }

  return lastConfident === -1 ? 0 : probeResults[lastConfident].lessonOrderIndex + 1
}
