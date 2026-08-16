import { useEffect, useState } from 'react'
import kanjiData from './assets/kanji-data.json'
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
  const [returnScreen, setReturnScreen] = useState('landing')
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(null)
  const [reviewState, setReviewState] = useState({})
  const [sessionStats, setSessionStats] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getProgress(), getReviewState()]).then(([storedProgress, storedReviewState]) => {
      if (cancelled) return
      setProgress(storedProgress)
      setReviewState(deserializeReviewState(storedReviewState))
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  function persist(nextProgress, nextReviewState) {
    setProgress(nextProgress)
    setReviewState(nextReviewState)
    saveProgress(nextProgress)
    saveReviewState(serializeReviewState(nextReviewState))
  }

  function openCredits() {
    setReturnScreen(screen)
    setScreen('credits')
  }

  function handleSelectKanji() {
    setScreen(progress?.placementComplete ? 'session' : 'placement')
  }

  function render() {
    if (loading) return <div className="app-loading">Loading…</div>

    switch (screen) {
      case 'placement':
        return (
          <PlacementTest
            kanjiData={kanjiData}
            onComplete={(nextProgress, nextReviewState) => {
              persist(nextProgress, nextReviewState)
              setScreen('session')
            }}
            onExit={() => setScreen('landing')}
          />
        )
      case 'session':
        return (
          <Session
            kanjiData={kanjiData}
            progress={progress}
            reviewState={reviewState}
            onPersist={persist}
            onComplete={(stats, nextProgress, nextReviewState) => {
              persist(nextProgress, nextReviewState)
              setSessionStats(stats)
              setScreen('summary')
            }}
            onExit={() => setScreen('landing')}
          />
        )
      case 'summary':
        return (
          <SessionSummary
            stats={sessionStats}
            progress={progress}
            kanjiData={kanjiData}
            onDone={() => setScreen('landing')}
          />
        )
      case 'credits':
        return <Credits onBack={() => setScreen(returnScreen)} />
      default:
        return <TrackSelect onSelectKanji={handleSelectKanji} />
    }
  }

  return (
    <div className="app-shell">
      <div className="screen" key={screen}>
        {render()}
      </div>
      {screen !== 'credits' && !loading && <AppFooter onCredits={openCredits} />}
    </div>
  )
}
