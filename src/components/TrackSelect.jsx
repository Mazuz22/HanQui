// The app's root screen — pick a track. Kanji is the only functional one in
// v1; Hanzi is visibly present but disabled, so a second track reads as
// "coming soon" rather than something the user might think is missing.
export default function TrackSelect({ onSelectKanji }) {
  return (
    <div className="track-select stagger">
      <h1 className="track-select-title">HanQui</h1>
      <p className="track-select-subtitle">Learn to read kanji and hanzi, one lesson at a time.</p>

      <div className="track-cards">
        <button type="button" className="track-card track-card-active" onClick={onSelectKanji}>
          <span className="track-card-char">字</span>
          <span className="track-card-label">Kanji</span>
          <span className="track-card-note">Japanese</span>
        </button>

        <div className="track-card track-card-disabled" aria-disabled="true">
          <span className="track-card-char">字</span>
          <span className="track-card-label">Hanzi</span>
          <span className="badge">Coming soon</span>
        </div>
      </div>
    </div>
  )
}
