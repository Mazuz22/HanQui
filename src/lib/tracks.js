import kanjiData from '../assets/kanji-data.json'
import hanziData from '../assets/hanzi-data.json'
import wordsData from '../assets/words-data.json'

/**
 * Everything track-specific lives here, in one place — the engine (lesson
 * ordering, placement, quiz generation, FSRS review) is entirely
 * track-agnostic and only ever sees the generic record shape (char,
 * meanings, strokeCount, level, frequencyRank, components, lessonOrder).
 * The things that genuinely differ between tracks are which dataset to
 * use, how to display a reading, and the nouns used in shared copy.
 */
export const TRACKS = {
  kanji: {
    id: 'kanji',
    name: 'Kanji',
    language: 'Japanese',
    data: kanjiData,
    unitNoun: 'kanji',
    itemNoun: 'character',
    formatReading: (record) => [...record.onyomi, ...record.kunyomi].join('、'),
  },
  hanzi: {
    id: 'hanzi',
    name: 'Hanzi',
    language: 'Chinese',
    data: hanziData,
    unitNoun: 'hanzi',
    itemNoun: 'character',
    formatReading: (record) => record.pinyin.join(', '),
  },
  words: {
    id: 'words',
    name: 'Kanji Words',
    language: 'Japanese (2-kanji)',
    data: wordsData,
    unitNoun: 'words',
    itemNoun: 'word',
    formatReading: (record) => record.reading,
  },
}
