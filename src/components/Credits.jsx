import { TaskScreen } from './layout'

// The kanji dataset is built from open sources, most of them CC BY-SA —
// share-alike licenses that require visible attribution wherever the data
// is used. This page is that attribution, reachable from every screen.
const SOURCES = [
  {
    name: 'KANJIDIC2',
    org: 'Electronic Dictionary Research and Development Group (EDRDG)',
    license: 'CC BY-SA 4.0',
    note: 'Meanings, readings, stroke counts, and JLPT tiers.',
  },
  {
    name: 'JMdict',
    org: 'EDRDG',
    license: 'CC BY-SA 4.0',
    note: 'Japanese vocabulary dictionary, reserved for future example-word use.',
  },
  {
    name: 'KanjiVG',
    org: 'KanjiVG project',
    license: 'CC BY-SA 3.0',
    note: 'Stroke-order data underlying the component decomposition.',
  },
  {
    name: 'kanjivg-radical',
    org: 'yagays',
    license: 'CC BY-SA 4.0',
    note: 'Per-kanji radical/component decomposition, used to order the lesson path.',
  },
  {
    name: 'kanji-data',
    org: 'David Gouveia',
    license: 'MIT',
    note: 'Wrapper dataset combining KANJIDIC2 fields with current-scale JLPT tiers.',
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
