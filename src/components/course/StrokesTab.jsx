import { useEffect, useState } from 'react'
import { loadStrokes } from '../../lib/strokes'
import StrokeSequence from './StrokeSequence'

/**
 * Every character's stroke order laid out step by step, the way the
 * characters book prints it: the new stroke in colour, a dot where the
 * brush lands.
 */
export default function StrokesTab({ lesson }) {
  return (
    <div className="strokes-tab">
      <p className="tab-intro">Each box adds one stroke. The dot marks where the stroke starts.</p>
      {lesson.characters.map((c) => (
        <StrokeRow key={c.char} item={c} />
      ))}
    </div>
  )
}

function StrokeRow({ item }) {
  const [data, setData] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    loadStrokes(item.char).then(setData, () => setFailed(true))
  }, [item.char])

  return (
    <section className="stroke-row">
      <h3 className="stroke-row-head" lang="zh-CN">
        <span className="stroke-row-char">{item.char}</span>
        <span className="stroke-row-pinyin">{item.pinyin}</span>
        <span className="stroke-row-count" lang="en">
          {item.strokeCount} strokes
        </span>
      </h3>
      {failed ? <p className="empty-note">No stroke data.</p> : <StrokeSequence data={data} />}
    </section>
  )
}
