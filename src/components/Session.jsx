import { useMemo, useState } from 'react'
import { TaskScreen } from './layout'
import QuizQuestion from './QuizQuestion'
import { buildPracticeSession, buildTodaySession } from '../lib/session'
import { generateQuestion } from '../lib/quizGenerator'
import { recordReview } from '../lib/reviewQueue'
import { TRACKS } from '../lib/tracks'

const EMPTY_STATS = { introduced: 0, reviewed: 0, correct: 0, total: 0, newChars: [] }

function IntroCard({ track, record, onContinue }) {
  const reading = TRACKS[track].formatReading(record)
  const isMulti = [...record.char].length > 1
  return (
    <div className="intro-card in">
      <div className={isMulti ? 'intro-char intro-char-multi' : 'intro-char'}>{record.char}</div>
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
 * Walks a set of steps one at a time, persisting after every answered step
 * so a closed tab mid-session never loses progress.
 *
 * Two modes, both sharing this same walk/persist/stats machinery:
 * - 'daily' (default): lib/session.js's buildTodaySession — one day's worth
 *   of lesson-path introductions and FSRS-due reviews.
 * - 'practice': buildPracticeSession — a free, on-demand quiz over
 *   characters already known, not gated by due dates. Answers still update
 *   FSRS state, since practicing is genuine review signal.
 */
export default function Session({ track, mode = 'daily', progress, reviewState, onPersist, onComplete, onExit }) {
  const { data } = TRACKS[track]
  function buildSteps() {
    return mode === 'practice' ? buildPracticeSession(progress) : buildTodaySession(data, progress, reviewState, new Date())
  }
  // Computed once at mount (lazy useState initializer) — the session
  // shouldn't reshuffle itself as the user answers questions within it.
  const [steps] = useState(buildSteps)
  const [stepIndex, setStepIndex] = useState(0)
  const [localProgress, setLocalProgress] = useState(progress)
  const [localReviewState, setLocalReviewState] = useState(reviewState)
  const [stats, setStats] = useState(EMPTY_STATS)

  // Practice quizzes only known characters, so its distractors should too —
  // an unlearned character as a wrong option is never a real temptation,
  // it's just a free giveaway that doesn't exercise recall at all. Daily
  // sessions keep the full dataset, since their distractors need to cover
  // brand-new introductions too.
  const quizPool = useMemo(
    () => (mode === 'practice' ? data.filter((k) => progress.introduced.includes(k.char)) : data),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const step = steps[stepIndex]
  const record = step ? data.find((k) => k.char === step.char) : null
  const question = useMemo(
    () => (step?.type === 'quiz' ? generateQuestion(step.char, quizPool, step.direction) : null),
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
    const nextStats = { ...stats, introduced: stats.introduced + 1, newChars: [...stats.newChars, step.char] }
    setLocalProgress(nextProgress)
    setStats(nextStats)
    advance(nextProgress, localReviewState, nextStats)
  }

  function handleQuizAnswer(wasCorrect, elapsedMs) {
    const nextCard = recordReview(localReviewState[step.char] ?? null, wasCorrect, elapsedMs, new Date())
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
        <p className="session-caught-up">
          {mode === 'practice'
            ? 'Nothing to practice yet — learn some characters first.'
            : "You're all caught up — nothing due right now."}
        </p>
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
