import { estimateJlptLevel, formatJlptLevel } from '../lib/levelEstimate'

// Plain progress bar plus a level estimate — deliberately no streaks, XP, or
// lives. The quiz itself is the game; this is just an honest readout of
// where things stand.
export default function SessionSummary({ stats, progress, kanjiData, onDone }) {
  const introducedCount = progress?.introduced?.length ?? 0
  const totalCount = kanjiData.length
  const percent = totalCount > 0 ? Math.round((introducedCount / totalCount) * 100) : 0
  const level = estimateJlptLevel(kanjiData, introducedCount)

  return (
    <div className="session-summary stagger">
      <h1 className="session-summary-title">Session complete</h1>

      {stats && (
        <p className="session-summary-stats">
          {stats.introduced > 0 && `${stats.introduced} new · `}
          {stats.total} reviewed · {stats.correct}/{stats.total} correct
        </p>
      )}

      <div className="progress-bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="progress-bar-label">
        {introducedCount} / {totalCount} kanji · {formatJlptLevel(level)}
      </p>

      <button type="button" className="primary-button" onClick={onDone}>
        Done
      </button>
    </div>
  )
}
