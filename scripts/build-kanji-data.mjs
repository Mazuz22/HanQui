// Builds src/assets/kanji-data.json, the single static dataset HanQui ships.
//
// Sources (vendored under scripts/data/raw/, re-run this script after
// refreshing them):
//   - kanji-data.json   davidluzgouveia/kanji-data, kanji.json @ master
//                        MIT license (wrapper); underlying dictionary
//                        content originates from KANJIDIC2 (EDRDG, CC BY-SA
//                        4.0) — both must be credited on the Credits page.
//   - kanji2element.json  yagays/kanjivg-radical, data/kanji2element.json @
//                        master. CC BY-SA 4.0, derived from KanjiVG
//                        (CC BY-SA 3.0).
//
// v1 restricts the app's vocabulary to kanji carrying a current-scale JLPT
// tag (jlpt_new, N5..N1) — untiered/obscure kanji have no place in a
// leveled curriculum, and every downstream mechanism (ordering, placement,
// level estimate) assumes every kanji has a tier.

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buildLessonOrder } from '../src/lib/lessonOrder.js'

const here = (path) => fileURLToPath(new URL(path, import.meta.url))

// KANJIDIC2's meaning order doesn't always lead with the gloss a learner
// would actually recognize first (安 lists "Relax" before "Cheap"; even
// WaniKani's own primary/secondary marking disagrees with intuition here,
// so there's no single authoritative source to derive this from
// automatically). These are manual, one-off corrections flagged from real
// use — add to this list as more turn up, rather than trying to re-derive
// "popularity" algorithmically for the whole dataset.
const PRIMARY_MEANING_OVERRIDES = {
  安: 'Cheap',
  送: 'Send',
  相: 'Mutual',
  向: 'Facing',
}

const rawKanji = JSON.parse(readFileSync(here('data/raw/kanji-data.json'), 'utf8'))
const kanji2element = JSON.parse(readFileSync(here('data/raw/kanji2element.json'), 'utf8'))

// Step 1: filter to the JLPT-tagged v1 vocabulary and normalize field names.
const vocabEntries = Object.entries(rawKanji).filter(([, v]) => v.jlpt_new != null)

// `level` is the track-agnostic scale the shared engine (lessonOrder,
// quizGenerator, levelEstimate) actually uses — always "lower = easier".
// KANJIDIC2's jlpt_new runs the opposite way (N5=5 easiest .. N1=1
// hardest), so it's inverted here rather than baking the JLPT-specific
// direction into shared, track-agnostic code.
const records = vocabEntries.map(([char, v]) => ({
  char,
  meanings: v.meanings ?? [],
  onyomi: v.readings_on ?? [],
  kunyomi: v.readings_kun ?? [],
  strokeCount: v.strokes,
  level: 6 - v.jlpt_new,
  frequencyRank: v.freq ?? null,
  components: [], // filled in below
}))

for (const record of records) {
  const preferred = PRIMARY_MEANING_OVERRIDES[record.char]
  if (!preferred) continue
  const index = record.meanings.findIndex((m) => m.toLowerCase() === preferred.toLowerCase())
  if (index > 0) {
    record.meanings.splice(index, 1)
    record.meanings.unshift(preferred)
  }
}

const vocabChars = new Set(records.map((r) => r.char))

// Step 2: cross-reference the component-decomposition data, keeping only
// components that are themselves learnable (in-vocabulary) kanji — this
// drops bare radicals (亠, 儿, 卜, ...) and out-of-scope rarities in one
// pass, since anything not JLPT-tagged simply isn't in vocabChars.
//
// A component is only kept as a *lesson-ordering prerequisite* if it's the
// same tier or easier than the kanji it's part of. KanjiVG's decomposition
// is purely visual/structural, so it happily marks something like 何
// (N5, "what") as containing 丁 (N1, a rare component) — technically true
// stroke-wise, but 丁 isn't something a learner needs first to grasp 何.
// Letting a harder component gate an easier kanji dragged 何 all the way to
// lesson position 1055 in practice, well past hundreds of genuinely harder
// characters — exactly the "why haven't I even seen 何 yet" complaint this
// filter exists to prevent.
let orphanedComponentRefs = 0
let harderComponentRefs = 0
let totalComponentRefs = 0
const levelByChar = new Map(records.map((r) => [r.char, r.level]))

for (const record of records) {
  const rawComponents = kanji2element[record.char] ?? []
  const kept = []
  for (const component of rawComponents) {
    totalComponentRefs += 1
    if (component.length !== 1 || component === record.char || !vocabChars.has(component)) {
      orphanedComponentRefs += 1
    } else if (levelByChar.get(component) > record.level) {
      harderComponentRefs += 1
    } else {
      kept.push(component)
    }
  }
  record.components = kept
}

// Step 3: compute the lesson-path order and stamp it onto each record.
const { order, cycleBreaks } = buildLessonOrder(records)
const lessonOrderByChar = new Map(order.map((char, index) => [char, index]))
for (const record of records) {
  record.lessonOrder = lessonOrderByChar.get(record.char)
}
records.sort((a, b) => a.lessonOrder - b.lessonOrder)

writeFileSync(here('../src/assets/kanji-data.json'), JSON.stringify(records, null, 2) + '\n')

console.log(`HanQui kanji dataset built: ${records.length} kanji`)
console.log(
  `  component refs: ${totalComponentRefs} total, ${orphanedComponentRefs} dropped (radicals / out-of-vocab), ` +
    `${harderComponentRefs} dropped (harder than parent)`,
)
console.log(`  lesson-order cycle breaks: ${cycleBreaks}`)
if (cycleBreaks > records.length * 0.01) {
  console.warn('  cycleBreaks is unusually high relative to dataset size — worth auditing the decomposition data.')
}
