// Builds src/assets/words-data.json — 2-kanji compound vocabulary words, a
// third track sitting alongside single-character Kanji study.
//
// Source (vendored under scripts/data/raw/):
//   - jmdict-eng-common-*.json  scriptin/jmdict-simplified, the English
//                                "common words only" JMdict build.
//                                CC BY-SA 4.0 (JMdict/EDRDG's own license).
//
// Only words whose PRIMARY listed kanji spelling is (a) marked common by
// JMdict, (b) exactly two characters, both CJK ideographs, and (c) both
// already present in the Kanji track's own vocabulary are included — that
// keeps every word decomposable into kanji the learner has or will study,
// and lets the intro screen show "Built from X + Y" for free, reusing the
// same `components` field the single-kanji pipeline uses (though — unlike
// single kanji — a word's components live in a different track's dataset
// entirely, so buildLessonOrder can't see them as real dependency edges;
// they end up ordered by level/frequency/strokes alone, same graceful
// fallback the pipeline already has for any unrecognized component).

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buildLessonOrder } from '../src/lib/lessonOrder.js'

const here = (path) => fileURLToPath(new URL(path, import.meta.url))

const kanjiData = JSON.parse(readFileSync(here('../src/assets/kanji-data.json'), 'utf8'))
const kanjiByChar = new Map(kanjiData.map((k) => [k.char, k]))

// The vendored filename carries a version/date suffix — find it rather
// than hardcoding, so refreshing the source doesn't require an edit here.
const jmdictFile = readdirSync(here('data/raw')).find((f) => f.startsWith('jmdict-eng-common'))
const jmdict = JSON.parse(readFileSync(here(`data/raw/${jmdictFile}`), 'utf8'))

const isCJK = (ch) => {
  const code = ch.codePointAt(0)
  return code >= 0x4e00 && code <= 0x9fff
}

const records = []
for (const word of jmdict.words) {
  // Only the word's primary (first-listed) kanji spelling — alternate
  // spellings tend to be less standard, and JMdict already lists the most
  // common orthography first.
  const primary = word.kanji[0]
  if (!primary?.common) continue

  const chars = [...primary.text]
  if (chars.length !== 2) continue
  if (!chars.every(isCJK)) continue
  if (!chars.every((c) => kanjiByChar.has(c))) continue
  if (chars[0] === chars[1]) continue // reduplicated forms aren't real 2-part compounds

  const meanings = (word.sense[0]?.gloss ?? [])
    .filter((g) => g.lang === 'eng')
    .map((g) => g.text)
    .slice(0, 4)
  if (meanings.length === 0) continue

  const kanaEntry =
    word.kana.find((k) => k.common && (k.appliesToKanji.includes('*') || k.appliesToKanji.includes(primary.text))) ??
    word.kana[0]

  const [c1, c2] = chars
  const k1 = kanjiByChar.get(c1)
  const k2 = kanjiByChar.get(c2)

  records.push({
    char: primary.text,
    meanings,
    reading: kanaEntry?.text ?? '',
    strokeCount: k1.strokeCount + k2.strokeCount,
    level: Math.max(k1.level, k2.level),
    frequencyRank: null,
    components: [c1, c2],
  })
}

// A handful of JMdict entries share the same primary kanji spelling under
// different senses/parts of speech — keep the first (its top sense).
const seen = new Set()
const deduped = records.filter((r) => {
  if (seen.has(r.char)) return false
  seen.add(r.char)
  return true
})

const { order, cycleBreaks } = buildLessonOrder(deduped)
const lessonOrderByChar = new Map(order.map((char, index) => [char, index]))
for (const record of deduped) {
  record.lessonOrder = lessonOrderByChar.get(record.char)
}
deduped.sort((a, b) => a.lessonOrder - b.lessonOrder)

writeFileSync(here('../src/assets/words-data.json'), JSON.stringify(deduped, null, 2) + '\n')

console.log(`HanQui words dataset built: ${deduped.length} compound words`)
console.log(`  lesson-order cycle breaks: ${cycleBreaks}`)
if (cycleBreaks > deduped.length * 0.01) {
  console.warn('  cycleBreaks is unusually high relative to dataset size — worth auditing.')
}
