const LEVEL_LABELS = { 5: 'N5', 4: 'N4', 3: 'N3', 2: 'N2', 1: 'N1' }

/**
 * Estimates the user's current JLPT level from how far into the lesson
 * path they've progressed.
 *
 * Looks a few kanji behind the live frontier rather than the newest,
 * shakiest ones — a kanji introduced minutes ago hasn't been through a
 * single review yet, so basing the label on it would make the estimate
 * jump around from session to session. Looking slightly behind gives a
 * more conservative, stable number.
 */
export function estimateJlptLevel(kanjiData, introducedCount) {
  if (introducedCount <= 0 || kanjiData.length === 0) return null

  const sorted = [...kanjiData].sort((a, b) => a.lessonOrder - b.lessonOrder)
  const lookbackIndex = Math.max(0, Math.min(sorted.length - 1, introducedCount - 1 - 5))
  return sorted[lookbackIndex].jlptLevel
}

export function formatJlptLevel(jlptLevel) {
  return jlptLevel == null ? 'Not yet placed' : (LEVEL_LABELS[jlptLevel] ?? `Level ${jlptLevel}`)
}
