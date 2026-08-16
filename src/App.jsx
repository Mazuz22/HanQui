import { useState } from 'react'
import TrackSelect from './components/TrackSelect'
import PlacementTest from './components/PlacementTest'
import Session from './components/Session'
import SessionSummary from './components/SessionSummary'
import Credits from './components/Credits'
import { AppFooter } from './components/layout'
import { getProgress, getReviewState, saveProgress, saveReviewState } from './lib/storage'
import { deserializeReviewState, serializeReviewState } from './lib/reviewQueue'

// Simple screen switching, same as go-teacher — a router isn't warranted
// for a handful of linear screens.
export default function App() {
  const [screen, setScreen] = useState('landing')
  const [track, setTrack] = useState(null)
  const [returnScreen, setReturnScreen] = useState('landing')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(null)
  const [reviewState, setReviewState] = useState({})
  const [sessionStats, setSessionStats] = useState(null)

  function persist(nextProgress, nextReviewState) {
    setProgress(nextProgress)
    setReviewState(nextReviewState)
    saveProgress(track, nextProgress)
    saveReviewState(track, serializeReviewState(nextReviewState))
  }

  function openCredits() {
    setReturnScreen(screen)
    setScreen('credits')
  }

  function handleSelectTrack(nextTrack) {
    setTrack(nextTrack)
    setLoading(true)
    Promise.all([getProgress(nextTrack), getReviewState(nextTrack)]).then(([storedProgress, storedReviewState]) => {
      setProgress(storedProgress)
      setReviewState(deserializeReviewState(storedReviewState))
      setLoading(false)
      setScreen(storedProgress?.placementComplete ? 'session' : 'placement')
    })
  }

  function goHome() {
    setTrack(null)
    setScreen('landing')
  }

  function render() {
    if (loading) return <div className="app-loading">Loading…</div>

    switch (screen) {
      case 'placement':
        return (
          <PlacementTest
            track={track}
            onComplete={(nextProgress, nextReviewState) => {
              persist(nextProgress, nextReviewState)
              setScreen('session')
            }}
            onExit={goHome}
          />
        )
      case 'session':
        return (
          <Session
            track={track}
            progress={progress}
            reviewState={reviewState}
            onPersist={persist}
            onComplete={(stats, nextProgress, nextReviewState) => {
              persist(nextProgress, nextReviewState)
              setSessionStats(stats)
              setScreen('summary')
            }}
            onExit={goHome}
          />
        )
      case 'summary':
        return <SessionSummary track={track} stats={sessionStats} progress={progress} onDone={goHome} />
      case 'credits':
        return <Credits onBack={() => setScreen(returnScreen)} />
      default:
        return <TrackSelect onSelectTrack={handleSelectTrack} />
    }
  }

  return (
    <div className="app-shell">
      <div className="screen" key={`${screen}-${track ?? ''}`}>
        {render()}
      </div>
      {screen !== 'credits' && <AppFooter onCredits={openCredits} />}
    </div>
  )
}
