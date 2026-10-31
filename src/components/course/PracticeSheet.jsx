import { useEffect, useState } from 'react'
import { loadStrokes } from '../../lib/strokes'
import CharSvg from './CharSvg'
import StrokeSequence from './StrokeSequence'

const CELLS_PER_ROW = 8
const TRACE_CELLS = 3

/**
 * A 田字格 practice sheet for one lesson, the kind handed out in class:
 * per character, a model with pinyin and meaning, its stroke-order strip,
 * then a row that starts with faint characters to trace and ends in empty
 * boxes to write from memory.
 *
 * On screen it is a preview; "Print / Save PDF" calls window.print(), and
 * the print stylesheet strips the app chrome and switches to black ink on
 * white. On iPhone that opens the share sheet's print view, from where
 * the sheet can be printed or saved to Files as a PDF.
 */
export default function PracticeSheet({ lesson }) {
  const [strokeData, setStrokeData] = useState({})

  useEffect(() => {
    let cancelled = false
    Promise.all(
      lesson.characters.map((c) =>
        loadStrokes(c.char)
          .then((data) => [c.char, data])
          .catch(() => [c.char, null]),
      ),
    ).then((entries) => {
      if (!cancelled) setStrokeData(Object.fromEntries(entries))
    })
    return () => {
      cancelled = true
    }
  }, [lesson])

  return (
    <div className="practice-sheet">
      <div className="practice-sheet-actions no-print">
        <button type="button" className="primary-button" onClick={() => window.print()}>
          Print / Save PDF
        </button>
        <p className="practice-sheet-hint">On iPhone: tap, then Share → Save to Files, or Print.</p>
      </div>

      <header className="sheet-header">
        <h2 className="sheet-title" lang="zh-CN">
          {lesson.label} · {lesson.titleZh}
        </h2>
        <p className="sheet-subtitle">
          {lesson.titleEn} — 姓名 Name: ____________ 日期 Date: ________
        </p>
      </header>

      {lesson.characters.map((c) => {
        const data = strokeData[c.char]
        return (
          <section key={c.char} className="sheet-char" lang="zh-CN">
            <div className="sheet-char-head">
              <div className="sheet-model">
                <CharSvg data={data} label={c.char} />
              </div>
              <div className="sheet-char-info">
                <p className="sheet-pinyin">{c.pinyin}</p>
                <p className="sheet-meaning" lang="en">
                  {c.meaning}
                </p>
                <p className="sheet-strokes" lang="en">
                  {c.strokeCount} strokes{c.radical ? ` · radical ${c.radical}` : ''}
                </p>
              </div>
              <div className="sheet-sequence">
                <StrokeSequence data={data} compact />
              </div>
            </div>
            <div className="sheet-row">
              {Array.from({ length: CELLS_PER_ROW }, (_, i) => (
                <div key={i} className="sheet-cell">
                  <CharSvg data={i < TRACE_CELLS ? data : null} upTo={0} ghost={i < TRACE_CELLS} />
                </div>
              ))}
            </div>
            <div className="sheet-row">
              {Array.from({ length: CELLS_PER_ROW }, (_, i) => (
                <div key={i} className="sheet-cell">
                  <CharSvg data={null} />
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
