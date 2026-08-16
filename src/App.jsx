import { useEffect, useState } from 'react'
import TrackSelect from './components/TrackSelect'
import PlacementTest from './components/PlacementTest'
import ProficiencyTest from './components/ProficiencyTest'
import Session from './components/Session'
import SessionSummary from './components/SessionSummary'
import MyCharacters from './components/MyCharacters'
import Credits from './components/Credits'
import { AppFooter } from './components/layout'
import { getLastTrack, getProgress, getReviewState, saveLastTrack, saveProgress, saveReviewState } from './lib/storage'
import { deserializeReviewState, serializeReviewState } from './lib/reviewQueue'

const EMPTY_PROGRESS = { introduced: [], placementComplete: false, placementStartIndex: 0 }

// Simple screen switching, same as go-teacher — a router isn't warranted
// for a handful of linear screens.
export default function App() {
  const [screen, setScreen] = useState('landing')
  const [track, setTrack] = useState(null)
  const [lastTrackPref, setLastTrackPref] = useState(null)
  const [returnScreen, setReturnScreen] = useState('landing')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(null)
  const [reviewState, setReviewState] = useState({})
  const [sessionStats, setSessionStats] = useState(null)

  useEffect(() => {
    getLastTrack().then(setLastTrackPref)
  }, [])

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

  // Shared by every track-scoped entry point (normal start, proficiency
  // test, my characters, practice) — loads that track's saved state and
  // remembers it as the user's preference for the landing screen.
  function loadTrack(nextTrack, pickScreen) {
    setTrack(nextTrack)
    setLoading(true)
    saveLastTrack(nextTrack)
    setLastTrackPref(nextTrack)
    Promise.all([getProgress(nextTrack), getReviewState(nextTrack)]).then(([storedProgress, storedReviewState]) => {
      const nextProgress = storedProgress ?? EMPTY_PROGRESS
      setProgress(nextProgress)
      setReviewState(deserializeReviewState(storedReviewState))
      setLoading(false)
      setScreen(typeof pickScreen === 'function' ? pickScreen(nextProgress) : pickScreen)
    })
  }

  const handleSelectTrack = (t) => loadTrack(t, (p) => (p.placementComplete ? 'session' : 'placement'))
  const handleProficiencyTest = (t) => loadTrack(t, 'proficiency')
  const handleViewCharacters = (t) => loadTrack(t, 'board')
  const handlePractice = (t) => loadTrack(t, 'practice')

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
      case 'proficiency':
        return (
          <ProficiencyTest
            track={track}
            progress={progress}
            onComplete={(nextProgress, nextReviewState) => {
              persist(nextProgress, nextReviewState)
              setScreen('session')
            }}
            onExit={goHome}
          />
        )
      case 'session':
      case 'practice':
        return (
          <Session
            track={track}
            mode={screen === 'practice' ? 'practice' : 'daily'}
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
        return (
          <SessionSummary
            track={track}
            stats={sessionStats}
            progress={progress}
            onDone={goHome}
            onViewBoard={() => setScreen('board')}
          />
        )
      case 'board':
        return <MyCharacters track={track} progress={progress} onBack={goHome} />
      case 'credits':
        return <Credits onBack={() => setScreen(returnScreen)} />
      default:
        return (
          <TrackSelect
            lastTrack={lastTrackPref}
            onSelectTrack={handleSelectTrack}
            onProficiencyTest={handleProficiencyTest}
            onViewCharacters={handleViewCharacters}
            onPractice={handlePractice}
          />
        )
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
