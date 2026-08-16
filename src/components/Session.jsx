import { useMemo, useState } from 'react'
import { TaskScreen } from './layout'
import QuizQuestion from './QuizQuestion'
import { buildTodaySession } from '../lib/session'
import { generateQuestion } from '../lib/quizGenerator'
import { recordReview } from '../lib/reviewQueue'
import { TRACKS } from '../lib/tracks'

const EMPTY_STATS = { introduced: 0, reviewed: 0, correct: 0, total: 0 }

function IntroCard({ track, record, onContinue }) {
  const reading = TRACKS[track].formatReading(record)
  return (
    <div className="intro-card in">
      <div className="intro-char">{record.char}</div>
      <p className="intro-meaning">{record.meanings.slice(0, 3).join(', ')}</p>
      {reading && <p className="intro-reading">{reading}</p>}
      {record.components.length > 0 && (
        <p className="intro-components">Built from {record.components.join(' + ')}</p>
      )}
      <button type="button" className="primary-button" onClick={onContinue}>
        Got it
      </button>
    </div>
  )
}

/**
 * Walks one day's worth of lesson-path introductions and due reviews (see
 * lib/session.js's buildTodaySession) one step at a time, persisting after
 * every answered step so a closed tab mid-session never loses progress.
 */
export default function Session({ track, progress, reviewState, onPersist, onComplete, onExit }) {
  const { data } = TRACKS[track]
  // Computed once at mount — the session shouldn't reshuffle itself as the
  // user answers questions within it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const steps = useMemo(() => buildTodaySession(data, progress, reviewState, new Date()), [])
  const [stepIndex, setStepIndex] = useState(0)
  const [localProgress, setLocalProgress] = useState(progress)
  const [localReviewState, setLocalReviewState] = useState(reviewState)
  const [stats, setStats] = useState(EMPTY_STATS)

  const step = steps[stepIndex]
  const record = step ? data.find((k) => k.char === step.char) : null
  const question = useMemo(
    () => (step?.type === 'quiz' ? generateQuestion(step.char, data, step.direction) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stepIndex],
  )

  function advance(nextProgress, nextReviewState, nextStats) {
    onPersist(nextProgress, nextReviewState)
    if (stepIndex + 1 < steps.length) {
      setStepIndex(stepIndex + 1)
    } else {
      onComplete(nextStats, nextProgress, nextReviewState)
    }
  }

  function handleIntroContinue() {
    const nextProgress = { ...localProgress, introduced: [...localProgress.introduced, step.char] }
    const nextStats = { ...stats, introduced: stats.introduced + 1 }
    setLocalProgress(nextProgress)
    setStats(nextStats)
    advance(nextProgress, localReviewState, nextStats)
  }

  function handleQuizAnswer(wasCorrect) {
    const nextCard = recordReview(localReviewState[step.char] ?? null, wasCorrect, new Date())
    const nextReviewState = { ...localReviewState, [step.char]: nextCard }
    const nextStats = {
      ...stats,
      reviewed: stats.reviewed + 1,
      correct: stats.correct + (wasCorrect ? 1 : 0),
      total: stats.total + 1,
    }
    setLocalReviewState(nextReviewState)
    setStats(nextStats)
    advance(localProgress, nextReviewState, nextStats)
  }

  if (steps.length === 0) {
    return (
      <TaskScreen onBack={onExit} backLabel="← Home">
        <p className="session-caught-up">You're all caught up — nothing due right now.</p>
        <button
          type="button"
          className="primary-button"
          onClick={() => onComplete(stats, localProgress, localReviewState)}
        >
          Done
        </button>
      </TaskScreen>
    )
  }

  return (
    <TaskScreen onBack={onExit} backLabel="← Exit" progress={`${stepIndex + 1} / ${steps.length}`}>
      {step.type === 'intro' ? (
        <IntroCard track={track} record={record} onContinue={handleIntroContinue} />
      ) : (
        <QuizQuestion
          key={stepIndex}
          track={track}
          question={question}
          kanjiRecord={record}
          onComplete={handleQuizAnswer}
        />
      )}
    </TaskScreen>
  )
}
