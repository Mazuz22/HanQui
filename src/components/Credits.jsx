import { TaskScreen } from './layout'

// Both datasets are built from open sources, several of them share-alike
// licensed — CC BY-SA and LGPL both require visible attribution wherever
// the data is used. This page is that attribution, reachable from every
// screen.
const SOURCES = [
  {
    name: 'kanji-data',
    org: 'David Gouveia',
    license: 'MIT',
    note: 'Kanji meanings, readings, stroke counts, and current-scale JLPT tiers (derived from KANJIDIC2, EDRDG, CC BY-SA 4.0).',
  },
  {
    name: 'kanjivg-radical',
    org: 'yagays',
    license: 'CC BY-SA 4.0',
    note: 'Per-kanji radical/component decomposition, used to order the Kanji lesson path (derived from KanjiVG, CC BY-SA 3.0).',
  },
  {
    name: 'Make Me a Hanzi',
    org: 'Shaunak Kishore',
    license: 'LGPL 3.0',
    note: 'Hanzi definitions, pinyin, stroke counts, and component decomposition (derived from Unihan + CJKlib).',
  },
  {
    name: 'complete-hsk-vocabulary',
    org: 'drkameleon',
    license: 'MIT',
    note: 'HSK level tagging and frequency ranking for the Hanzi track.',
  },
  {
    name: 'ts-fsrs',
    org: 'Open Spaced Repetition',
    license: 'MIT',
    note: 'Spaced-repetition scheduling for the review queue.',
  },
]

export default function Credits({ onBack }) {
  return (
    <TaskScreen onBack={onBack} backLabel="← Back" brief="Credits">
      <ul className="credits-list">
        {SOURCES.map((source) => (
          <li key={source.name} className="credits-item">
            <p className="credits-name">
              {source.name} <span className="badge">{source.license}</span>
            </p>
            <p className="credits-org">{source.org}</p>
            <p className="credits-note">{source.note}</p>
          </li>
        ))}
      </ul>
    </TaskScreen>
  )
}
