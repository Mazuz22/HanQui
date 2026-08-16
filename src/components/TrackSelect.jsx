import { TRACKS } from '../lib/tracks'

// The app's root screen — pick a track. Both Kanji and Hanzi are live;
// each keeps its own independent progress (see lib/storage.js's per-track
// keys) and can be studied in parallel.
export default function TrackSelect({ onSelectTrack }) {
  return (
    <div className="track-select stagger">
      <h1 className="track-select-title">HanQui</h1>
      <p className="track-select-subtitle">Learn to read kanji and hanzi, one lesson at a time.</p>

      <div className="track-cards">
        {Object.values(TRACKS).map((track) => (
          <button
            key={track.id}
            type="button"
            className="track-card track-card-active"
            onClick={() => onSelectTrack(track.id)}
          >
            <span className="track-card-char">字</span>
            <span className="track-card-label">{track.name}</span>
            <span className="track-card-note">{track.language}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
