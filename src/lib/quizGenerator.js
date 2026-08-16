/**
 * Builds a 4-option multiple-choice question for a single kanji, in either
 * direction (kanji -> meaning, or meaning -> kanji).
 *
 * Distractors are picked by proximity to the target on JLPT tier and stroke
 * count, weighted so tier dominates (a stroke-count-close kanji from a very
 * different tier is still a worse distractor than a further-stroke-count
 * kanji from the same tier) — this keeps wrong options plausible rather
 * than obviously off, without needing a hand-curated "confusable pairs"
 * list. Kanji sharing a meaning with the target are excluded outright so a
 * "wrong" answer is never also technically correct. No pre-filter by tier
 * means the same scoring naturally widens to adjacent tiers when the
 * target's own tier is thin (relevant near N1, the smallest tier).
 */
export function generateQuestion(char, kanjiData, direction, rng = Math.random) {
  const target = kanjiData.find((k) => k.char === char)
  if (!target) throw new Error(`Unknown kanji: ${char}`)

  const pool = kanjiData.filter((k) => k.char !== target.char && !sharesAnyMeaning(k, target))
  const scored = pool
    .map((kanji) => ({
      kanji,
      score: Math.abs(kanji.jlptLevel - target.jlptLevel) * 10 + Math.abs(kanji.strokeCount - target.strokeCount),
    }))
    .sort((a, b) => a.score - b.score)

  const distractors = pickClosest(scored, 3, rng).map((entry) => entry.kanji)
  const options = shuffle([target, ...distractors], rng)

  return {
    direction,
    prompt: direction === 'kanjiToMeaning' ? target.char : target.meanings[0],
    options: options.map((kanji) => ({
      char: kanji.char,
      label: direction === 'kanjiToMeaning' ? kanji.meanings[0] : kanji.char,
    })),
    correctIndex: options.findIndex((kanji) => kanji.char === target.char),
  }
}

function sharesAnyMeaning(a, b) {
  return a.meanings.some((meaning) => b.meanings.includes(meaning))
}

// Takes the `count` closest-scored entries, shuffling within score ties so
// repeated calls on the same target don't always surface the same set.
function pickClosest(scored, count, rng) {
  const groups = new Map()
  for (const entry of scored) {
    if (!groups.has(entry.score)) groups.set(entry.score, [])
    groups.get(entry.score).push(entry)
  }

  const result = []
  for (const score of [...groups.keys()].sort((a, b) => a - b)) {
    for (const entry of shuffle(groups.get(score), rng)) {
      if (result.length >= count) return result
      result.push(entry)
    }
  }
  return result
}

function shuffle(items, rng) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}
