import { TRACKS } from '../lib/tracks'

// The app's root screen — pick a track. Both Kanji and Hanzi are live;
// each keeps its own independent progress (see lib/storage.js's per-track
// keys) and can be studied in parallel. Once the user has a last-studied
// track, its card is put forward (bigger, primary) and the other shrinks
// to a secondary option — a quiet way of remembering their preference
// without gating anything.
export default function TrackSelect({ lastTrack, onSelectTrack, onProficiencyTest, onViewCharacters, onPractice }) {
  return (
    <div className="track-select stagger">
      <h1 className="track-select-title">HanQui</h1>
      <p className="track-select-subtitle">Learn to read kanji and hanzi, one lesson at a time.</p>

      <div className="track-cards">
        {Object.values(TRACKS).map((track) => {
          const sizeClass = !lastTrack ? 'track-card-active' : lastTrack === track.id ? 'track-card-preferred' : 'track-card-secondary'
          return (
            <div key={track.id} className={`track-card ${sizeClass}`}>
              <button type="button" className="track-card-button" onClick={() => onSelectTrack(track.id)}>
                <span className="track-card-char">字</span>
                <span className="track-card-label">{track.name}</span>
                <span className="track-card-note">{track.language}</span>
              </button>
              <div className="track-card-links">
                <button type="button" className="link-button" onClick={() => onProficiencyTest(track.id)}>
                  Proficiency test
                </button>
                <button type="button" className="link-button" onClick={() => onViewCharacters(track.id)}>
                  My characters
                </button>
                <button type="button" className="link-button" onClick={() => onPractice(track.id)}>
                  Practice
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
