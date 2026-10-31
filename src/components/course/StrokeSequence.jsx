import CharSvg from './CharSvg'

/**
 * The textbook-style stroke-order strip: one cell per stroke, each showing
 * the character built up to that stroke with the new stroke in colour and
 * a dot where the brush goes down.
 */
export default function StrokeSequence({ data, compact = false }) {
  if (!data) return null
  return (
    <ol className={`stroke-sequence${compact ? ' stroke-sequence-compact' : ''}`}>
      {data.strokes.map((_, i) => (
        <li key={i} className="stroke-step">
          <CharSvg data={data} upTo={i + 1} highlight={i} ghost />
          <span className="stroke-step-number">{i + 1}</span>
        </li>
      ))}
    </ol>
  )
}
