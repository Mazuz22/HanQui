// Builds src/assets/hanzi-data.json, mirroring build-kanji-data.mjs's
// pipeline for the Hanzi track.
//
// Sources (vendored under scripts/data/raw/):
//   - mmh-dictionary.txt  skishore/makemeahanzi, dictionary.txt @ master.
//                          LGPL-3.0 (derived from Unihan + CJKlib). One JSON
//                          object per line: character, definition, pinyin,
//                          decomposition (an Ideographic Description
//                          Sequence), radical, matches (per-stroke
//                          component mapping — its length is the
//                          character's stroke count, used here since the
//                          file has no separate stroke-count field).
//   - hsk-complete.json    drkameleon/complete-hsk-vocabulary, complete.json
//                          @ main. MIT. Word-level HSK vocabulary; filtered
//                          here to single-character entries carrying a
//                          classic-scale "old-N" (HSK 1-6) tag.
//
// v1 restricts the app's vocabulary to characters that are BOTH tagged with
// an old-standard HSK level AND present in makemeahanzi's dictionary, same
// "every downstream mechanism assumes a tier" rationale as the Kanji track.

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buildLessonOrder } from '../src/lib/lessonOrder.js'

const here = (path) => fileURLToPath(new URL(path, import.meta.url))

// Step 1: load makemeahanzi's per-character dictionary (JSON Lines).
const mmhByChar = new Map()
for (const line of readFileSync(here('data/raw/mmh-dictionary.txt'), 'utf8').split('\n')) {
  if (!line.trim()) continue
  const entry = JSON.parse(line)
  mmhByChar.set(entry.character, entry)
}

// Step 2: load the HSK word list, keep single-character entries with an
// "old-N" tag, and reduce each to its easiest (lowest) old-standard level.
const hskRaw = JSON.parse(readFileSync(here('data/raw/hsk-complete.json'), 'utf8'))
const hskByChar = new Map()
for (const entry of hskRaw) {
  if ([...entry.simplified].length !== 1) continue
  const oldLevels = entry.level.filter((l) => l.startsWith('old-')).map((l) => Number.parseInt(l.split('-')[1], 10))
  if (oldLevels.length === 0) continue
  const level = Math.min(...oldLevels)
  const existing = hskByChar.get(entry.simplified)
  if (!existing || level < existing.level) {
    hskByChar.set(entry.simplified, { level, frequency: entry.frequency, forms: entry.forms })
  }
}

// Step 3: join on character, keeping only entries present in both sources.
const records = []
for (const [char, hsk] of hskByChar) {
  const mmh = mmhByChar.get(char)
  if (!mmh || !mmh.pinyin || mmh.pinyin.length === 0) continue

  const meanings = mmh.definition
    ? mmh.definition.split(/,\s*/).filter(Boolean)
    : (hsk.forms[0]?.meanings ?? []).slice(0, 3)
  if (meanings.length === 0) continue

  records.push({
    char,
    meanings,
    pinyin: mmh.pinyin,
    strokeCount: mmh.matches?.length ?? 0,
    level: hsk.level,
    frequencyRank: hsk.frequency ?? null,
    components: [], // filled in below
    decomposition: mmh.decomposition,
  })
}

const vocabChars = new Set(records.map((r) => r.char))

// Step 4: parse each character's IDS decomposition string into component
// characters, keeping only components that are themselves in-vocabulary —
// same "drop bare radicals and out-of-scope characters" rule as the Kanji
// pipeline's use of kanjivg-radical. IDS structural operators (U+2FF0-
// U+2FFF) and the "unrecognized component" placeholder '？' are skipped.
let orphanedComponentRefs = 0
let totalComponentRefs = 0

for (const record of records) {
  const kept = []
  for (const ch of record.decomposition) {
    const code = ch.codePointAt(0)
    if (code >= 0x2ff0 && code <= 0x2fff) continue // IDS structural operator
    if (ch === '？' || ch === record.char) continue
    totalComponentRefs += 1
    if (vocabChars.has(ch)) kept.push(ch)
    else orphanedComponentRefs += 1
  }
  record.components = kept
  delete record.decomposition
}

// Step 5: compute the lesson-path order and stamp it onto each record.
const { order, cycleBreaks } = buildLessonOrder(records)
const lessonOrderByChar = new Map(order.map((char, index) => [char, index]))
for (const record of records) {
  record.lessonOrder = lessonOrderByChar.get(record.char)
}
records.sort((a, b) => a.lessonOrder - b.lessonOrder)

writeFileSync(here('../src/assets/hanzi-data.json'), JSON.stringify(records, null, 2) + '\n')

console.log(`HanQui hanzi dataset built: ${records.length} hanzi`)
console.log(`  component refs: ${totalComponentRefs} total, ${orphanedComponentRefs} dropped (out-of-vocab)`)
console.log(`  lesson-order cycle breaks: ${cycleBreaks}`)
if (cycleBreaks > records.length * 0.01) {
  console.warn('  cycleBreaks is unusually high relative to dataset size — worth auditing the decomposition data.')
}
