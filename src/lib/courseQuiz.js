/**
 * Builds a lesson quiz from the week's words and characters. Four question
 * kinds, all 4-option multiple choice:
 *   meaning  — see the hanzi, pick the English
 *   hanzi    — see the English, pick the hanzi
 *   pinyin   — see the pinyin, pick the hanzi
 *   listen   — hear it, pick the hanzi (only when the device can speak)
 * Distractors come from the same lesson first, topped up from the rest of
 * the course when a lesson is too small to supply three.
 */
const KINDS = ['meaning', 'hanzi', 'pinyin', 'listen']

export function quizItems(lesson) {
  const items = new Map()
  for (const word of lesson.vocab) items.set(word.hanzi, { hanzi: word.hanzi, pinyin: word.pinyin, en: word.en })
  for (const c of lesson.characters) {
    if (!items.has(c.char)) items.set(c.char, { hanzi: c.char, pinyin: c.pinyin, en: c.meaning })
  }
  return [...items.values()].filter((item) => item.en)
}

function shuffle(list, rng) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function buildQuiz(lesson, allItems, { count = 10, canListen = true, rng = Math.random } = {}) {
  const pool = quizItems(lesson)
  const kinds = canListen ? KINDS : KINDS.filter((k) => k !== 'listen')
  const targets = shuffle(pool, rng).slice(0, count)

  return targets.map((target, n) => {
    const kind = kinds[n % kinds.length]
    const field = kind === 'meaning' ? 'en' : 'hanzi'
    const distinct = (item) => item.hanzi !== target.hanzi && item[field] !== target[field] && item.pinyin !== target.pinyin
    const local = shuffle(pool.filter(distinct), rng)
    const wider = shuffle(allItems.filter((item) => distinct(item) && !local.some((l) => l.hanzi === item.hanzi)), rng)
    const distractors = []
    for (const item of [...local, ...wider]) {
      if (distractors.length === 3) break
      if (!distractors.some((d) => d[field] === item[field])) distractors.push(item)
    }
    const options = shuffle([target, ...distractors], rng)
    return {
      kind,
      target,
      options: options.map((item) => ({ key: item.hanzi, label: item[field] })),
      correctIndex: options.indexOf(target),
    }
  })
}
