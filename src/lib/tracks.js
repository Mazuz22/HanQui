import kanjiData from '../assets/kanji-data.json'
import hanziData from '../assets/hanzi-data.json'

/**
 * Everything track-specific lives here, in one place — the engine (lesson
 * ordering, placement, quiz generation, FSRS review) is entirely
 * track-agnostic and only ever sees the generic record shape (char,
 * meanings, strokeCount, level, frequencyRank, components, lessonOrder).
 * The two things that genuinely differ between Kanji and Hanzi are which
 * dataset to use and how to display a character's reading.
 */
export const TRACKS = {
  kanji: {
    id: 'kanji',
    name: 'Kanji',
    language: 'Japanese',
    data: kanjiData,
    unitNoun: 'kanji',
    formatReading: (record) => [...record.onyomi, ...record.kunyomi].join('、'),
  },
  hanzi: {
    id: 'hanzi',
    name: 'Hanzi',
    language: 'Chinese',
    data: hanziData,
    unitNoun: 'hanzi',
    formatReading: (record) => record.pinyin.join(', '),
  },
}
