/**
 * A single persistent Credits link, present around the whole app shell
 * rather than duplicated into every screen's own chrome — the data this app
 * ships under CC BY-SA needs to stay attributable from anywhere.
 */
export default function AppFooter({ onCredits }) {
  return (
    <footer className="app-footer">
      <button type="button" className="link-button" onClick={onCredits}>
        Credits
      </button>
    </footer>
  )
}
