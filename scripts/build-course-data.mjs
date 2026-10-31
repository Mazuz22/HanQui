/**
 * Builds the Semester A course (src/assets/course-data.json) from the
 * hand-checked syllabus file scripts/data/course/semester-a.json, and copies
 * each needed character's stroke data from hanzi-writer-data into
 * public/strokes/ so the app ships only what the course uses.
 *
 * A lesson's characters are, in order: the characters the Chinese
 * Characters book unit teaches, then every character in the Great Wall
 * unit's new words that no earlier lesson has introduced. Review weeks
 * gather every character of the weeks they review.
 *
 * Per-character facts (pinyin, meaning, radical, parts, etymology hint)
 * come from Make Me a Hanzi; the pinyin shown is the reading the unit's
 * words use, where a word supplies one.
 *
 * Run: node scripts/build-course-data.mjs
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const syllabus = JSON.parse(readFileSync(join(root, 'scripts/data/course/semester-a.json'), 'utf8'))
const strokeSource = join(root, 'node_modules/hanzi-writer-data')
const strokeOut = join(root, 'public/strokes')

const dictionary = new Map()
for (const line of readFileSync(join(root, 'scripts/data/raw/mmh-dictionary.txt'), 'utf8').split('\n')) {
  if (!line.trim()) continue
  const entry = JSON.parse(line)
  dictionary.set(entry.character, entry)
}

const isHan = (ch) => /\p{Script=Han}/u.test(ch)

// Every toneless syllable Make Me a Hanzi knows, for splitting joined-up
// pinyin ("dìfang", "yínháng") back into one syllable per character.
const SYLLABLES = new Set()
for (const entry of dictionary.values()) for (const reading of entry.pinyin ?? []) SYLLABLES.add(toneless(reading))

function toneless(text) {
  // Per character, so indices still line up with the toned original.
  return [...text.normalize('NFC')].map((ch) => ch.normalize('NFD')[0]).join('').toLowerCase().replace(/ü|v/g, 'u')
}

// Cut `plain` into exactly `count` known syllables; returns cut indices or null.
function segment(plain, count, start = 0) {
  if (count === 0) return start === plain.length ? [] : null
  for (let end = Math.min(plain.length, start + 6); end > start; end--) {
    if (!SYLLABLES.has(plain.slice(start, end))) continue
    const rest = segment(plain, count - 1, end)
    if (rest) return [end, ...rest]
  }
  return null
}

// One toned syllable per character of a word, e.g. 地方 dìfang → 地 dì.
function syllableReadings(word) {
  const chars = [...word.hanzi].filter(isHan)
  const toned = [...word.pinyin.normalize('NFC').replace(/[^\p{L}]/gu, '')].join('')
  // Erhua: 有空儿 yǒu kòngr — the final r is 儿, not a syllable of its own.
  if (chars.at(-1) === '儿' && chars.length > 1 && /r$/i.test(toned) && !/er$/i.test(toneless(toned))) {
    const inner = syllableReadings({ hanzi: chars.slice(0, -1).join(''), pinyin: toned.slice(0, -1) })
    return inner.size ? inner.set('儿', 'ér') : inner
  }
  const cuts = segment(toneless(toned), chars.length)
  if (!cuts) return new Map()
  const letters = [...toned]
  const out = new Map()
  let from = 0
  chars.forEach((ch, i) => {
    out.set(ch, letters.slice(from, cuts[i]).join('').toLowerCase())
    from = cuts[i]
  })
  return out
}


// A character's own reading, not the one it takes inside a word. The
// book's syllable is right whenever it carries a tone mark (地方 dìfang →
// 地 dì; Make Me a Hanzi only lists de). Two cases need correcting:
// neutral-tone syllables (名字 míngzi → 字 zì, from the dictionary) and
// tone sandhi on 一 and 不 (一下儿 yíxiàr → 一 yī). 子 is fixed too:
// Make Me a Hanzi gives only its neutral-tone suffix reading.
const SANDHI = { 一: 'yī', 不: 'bù', 子: 'zǐ' }
const hasToneMark = (syllable) => /[\u0304\u0301\u030c\u0300]/.test(syllable.normalize('NFD'))

function citationReading(char, entry, wordSyllable) {
  if (SANDHI[char]) return SANDHI[char]
  const readings = entry?.pinyin ?? []
  if (!wordSyllable) return readings[0] ?? ''
  if (hasToneMark(wordSyllable)) return wordSyllable
  return readings.find((r) => toneless(r) === toneless(wordSyllable)) ?? wordSyllable
}

// The decomposition's direct parts, minus the layout operators (⿰⿱…).
function parts(entry) {
  if (!entry?.decomposition) return null
  const list = [...entry.decomposition].filter((ch) => isHan(ch) && ch !== entry.character)
  return list.length ? list.join(' + ') : null
}

// Make Me a Hanzi definitions run long ("good, excellent, fine; proper,
// suitable; well"); the first two senses fit a card and a worksheet line.
function shortMeaning(definition) {
  return definition ? definition.split(';').slice(0, 2).join(';').trim() : ''
}

function strokeCount(char) {
  const file = join(strokeSource, `${char}.json`)
  if (!existsSync(file)) return null
  return JSON.parse(readFileSync(file, 'utf8')).strokes.length
}

const introduced = new Set()
const lessons = []
const missingStrokes = new Set()

for (const week of syllabus.weeks) {
  const vocab = (week.vocab ?? []).map((w) => ({ hanzi: w.hanzi, pinyin: w.pinyin, en: w.en }))
  // Proper names (people, countries, cities) are listed for reading but
  // don't add characters or quiz items — 菲雅 isn't worth drilling.
  const names = (week.names ?? []).map((w) => ({ hanzi: w.hanzi, pinyin: w.pinyin, en: w.en }))
  const readings = new Map()
  for (const word of vocab) for (const [ch, py] of syllableReadings(word)) if (!readings.has(ch)) readings.set(ch, py)

  let chars
  if (week.reviewOf) {
    const reviewed = lessons.filter((l) => week.reviewOf.includes(l.week))
    chars = [...new Set(reviewed.flatMap((l) => l.characters.map((c) => c.char)))]
    for (const l of reviewed) {
      for (const word of l.vocab) if (!vocab.some((v) => v.hanzi === word.hanzi)) vocab.push(word)
      for (const name of l.names) if (!names.some((n) => n.hanzi === name.hanzi)) names.push(name)
      for (const c of l.characters) if (!readings.has(c.char)) readings.set(c.char, c.pinyin)
    }
  } else {
    const fromBook = week.characters ?? []
    const fromWords = vocab.flatMap((w) => [...w.hanzi].filter(isHan))
    chars = [...new Set([...fromBook, ...fromWords])].filter((ch) => fromBook.includes(ch) || !introduced.has(ch))
    for (const ch of chars) introduced.add(ch)
  }

  // A character that is itself one of the unit's words takes the book's
  // own pinyin and gloss (你 → "you"), not the dictionary's.
  const standalone = new Map(vocab.filter((w) => w.hanzi.length === 1).map((w) => [w.hanzi, w]))

  const characters = chars.map((char) => {
    const entry = dictionary.get(char)
    const own = standalone.get(char)
    const count = strokeCount(char)
    if (count == null) missingStrokes.add(char)
    return {
      char,
      pinyin: own?.pinyin ?? citationReading(char, entry, readings.get(char)),
      meaning: week.meanings?.[char] ?? own?.en ?? shortMeaning(entry?.definition),
      strokeCount: count ?? 0,
      radical: entry?.radical && entry.radical !== char ? entry.radical : null,
      parts: parts(entry),
      hint: entry?.etymology?.hint ?? null,
      words: vocab.filter((w) => w.hanzi.includes(char) && w.hanzi !== char).slice(0, 4),
    }
  })

  lessons.push({
    id: `w${week.week}`,
    week: week.week,
    label: `Week ${week.week}`,
    titleZh: week.titleZh,
    titlePinyin: week.titlePinyin ?? '',
    titleEn: week.titleEn,
    sources: week.sources,
    review: Boolean(week.reviewOf),
    vocab,
    names,
    characters,
  })
}

rmSync(strokeOut, { recursive: true, force: true })
mkdirSync(strokeOut, { recursive: true })
const allChars = new Set(lessons.flatMap((l) => l.characters.map((c) => c.char)))
for (const char of allChars) {
  const file = join(strokeSource, `${char}.json`)
  if (existsSync(file)) copyFileSync(file, join(strokeOut, `${char}.json`))
}

writeFileSync(
  join(root, 'src/assets/course-data.json'),
  JSON.stringify({ course: syllabus.course, lessons }, null, 2) + '\n',
)

console.log(`${lessons.length} lessons, ${allChars.size} characters, stroke files copied.`)
for (const l of lessons) console.log(`  ${l.label}: ${l.characters.length} chars, ${l.vocab.length} words — ${l.titleEn}`)
if (missingStrokes.size) console.warn(`No stroke data for: ${[...missingStrokes].join(' ')}`)
