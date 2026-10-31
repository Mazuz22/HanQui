/**
 * One character drawn from its stroke paths as plain SVG — used for the
 * stroke-order strip and the printable practice sheet, where a live Hanzi
 * Writer instance per cell would be wasteful and wouldn't print.
 *
 * hanzi-writer-data paths live in a 1024-unit box with the y-axis pointing
 * up (baseline at 900), hence the flip transform.
 *
 * `upTo` strokes are drawn as ink; `highlight` (an index) is drawn in the
 * accent colour with a dot on its starting point; `ghost` draws every
 * stroke faintly underneath, for tracing.
 */
const FLIP = 'translate(0, 900) scale(1, -1)'

export function TianGrid() {
  return (
    <g className="tian-grid">
      <rect x="4" y="4" width="1016" height="1016" className="tian-border" />
      <line x1="512" y1="4" x2="512" y2="1020" />
      <line x1="4" y1="512" x2="1020" y2="512" />
      <line x1="4" y1="4" x2="1020" y2="1020" className="tian-diagonal" />
      <line x1="1020" y1="4" x2="4" y2="1020" className="tian-diagonal" />
    </g>
  )
}

export default function CharSvg({ data, upTo, highlight = null, ghost = false, grid = true, className = '', label }) {
  const strokes = data?.strokes ?? []
  const count = upTo ?? strokes.length
  const start = highlight != null ? data?.medians?.[highlight]?.[0] : null

  return (
    <svg viewBox="0 0 1024 1024" className={`char-svg ${className}`.trim()} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {grid && <TianGrid />}
      <g transform={FLIP}>
        {ghost && strokes.map((path, i) => <path key={`g${i}`} d={path} className="stroke-ghost" />)}
        {strokes.slice(0, count).map((path, i) => (
          <path key={i} d={path} className={i === highlight ? 'stroke-current' : 'stroke-ink'} />
        ))}
        {start && <circle cx={start[0]} cy={start[1]} r="38" className="stroke-start" />}
      </g>
    </svg>
  )
}
