import { estimateLevel, formatLevel } from '../lib/levelEstimate'
import { TRACKS } from '../lib/tracks'
import CharacterGrid from './CharacterGrid'

// Plain progress bar plus a level estimate — deliberately no streaks, XP, or
// lives. The quiz itself is the game; this is just an honest readout of
// where things stand. The advancement board (below) shows every character
// learned so far, with this session's new ones highlighted.
export default function SessionSummary({ track, stats, progress, onDone, onViewBoard }) {
  const { data, unitNoun } = TRACKS[track]
  const introduced = progress?.introduced ?? []
  const introducedCount = introduced.length
  const totalCount = data.length
  const percent = totalCount > 0 ? Math.round((introducedCount / totalCount) * 100) : 0
  const level = estimateLevel(data, introducedCount)

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
        {introducedCount} / {totalCount} {unitNoun} · {formatLevel(level, track)}
      </p>

      <div className="advancement-board">
        <p className="advancement-board-label">Your advancement board</p>
        <div className="char-grid-scroll">
          <CharacterGrid track={track} chars={introduced} highlightChars={stats?.newChars ?? []} />
        </div>
        <button type="button" className="link-button" onClick={onViewBoard}>
          View all my characters →
        </button>
      </div>

      <button type="button" className="primary-button" onClick={onDone}>
        Done
      </button>
    </div>
  )
}
