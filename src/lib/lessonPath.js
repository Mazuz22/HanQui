/** Picks which not-yet-introduced kanji come next in the lesson path. */
export function getNextNewChars(kanjiData, introduced, count) {
  const introducedSet = introduced instanceof Set ? introduced : new Set(introduced)
  return [...kanjiData]
    .sort((a, b) => a.lessonOrder - b.lessonOrder)
    .filter((kanji) => !introducedSet.has(kanji.char))
    .slice(0, count)
    .map((kanji) => kanji.char)
}
