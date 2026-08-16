/**
 * The header every screen in the app uses: a back-action on the left, an
 * optional progress/context readout on the right. Shape copied from
 * go-teacher, where it was extracted after being verified identical across
 * every screen there — reused here as-is rather than re-deriving it.
 */
export default function ScreenHeader({ onBack, backLabel, progress }) {
  return (
    <header className="screen-header">
      <button type="button" className="link-button" onClick={onBack}>
        {backLabel}
      </button>
      {progress != null && <span className="screen-progress">{progress}</span>}
    </header>
  )
}
