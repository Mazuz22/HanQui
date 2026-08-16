import { useMemo, useState } from 'react'
import { TaskScreen } from './layout'
import QuizQuestion from './QuizQuestion'
import { generateQuestion } from '../lib/quizGenerator'
import { recordReview } from '../lib/reviewQueue'
import { TRACKS } from '../lib/tracks'

/**
 * A fast alternative to the adaptive placement test, for someone who
 * already knows a lot of the curriculum and would rather blast through it
 * than sit through a slow lesson-by-lesson ramp. Walks the lesson path in
 * order starting right after the user's current progress, auto-advancing
 * on every correct answer with no pause, and stops at the very first
 * mistake — everything answered correctly up to that point gets marked
 * known. Available both as a first-time alternative to placement and as a
 * later "catch me up" tool, since it always resumes from wherever
 * `progress.introduced` currently ends (which is always a prefix of the
 * lesson order — see lib/lessonPath.js's getNextNewChars).
 */
export default function ProficiencyTest({ track, progress, reviewState, onComplete, onExit }) {
  const { data } = TRACKS[track]
  const orderedChars = useMemo(
    () => [...data].sort((a, b) => a.lessonOrder - b.lessonOrder).map((k) => k.char),
    [data],
  )
  const startIndex = progress?.introduced?.length ?? 0

  const [index, setIndex] = useState(startIndex)
  const [confirmed, setConfirmed] = useState([])
  const [confirmedReviewState, setConfirmedReviewState] = useState({})
  const [missed, setMissed] = useState(false)

  const exhausted = index >= orderedChars.length
  const done = missed || exhausted
  const currentChar = done ? null : orderedChars[index]
  const currentRecord = currentChar ? data.find((k) => k.char === currentChar) : null
  const question = useMemo(
    () => (currentChar ? generateQuestion(currentChar, data, 'kanjiToMeaning') : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentChar],
  )

  // Each confirmed character gets a real FSRS card seeded from its actual
  // answer speed, same grading as a normal quiz — a fast confident answer
  // here means fast confident recall, just like anywhere else in the app.
  function handleAnswer(wasCorrect, elapsedMs) {
    if (wasCorrect) {
      setConfirmed((prev) => [...prev, currentChar])
      setConfirmedReviewState((prev) => ({ ...prev, [currentChar]: recordReview(null, true, elapsedMs, new Date()) }))
      setIndex((prev) => prev + 1)
    } else {
      setMissed(true)
    }
  }

  function handleFinish() {
    const introduced = [...(progress?.introduced ?? []), ...confirmed]
    onComplete(
      { introduced, placementComplete: true, placementStartIndex: progress?.placementStartIndex ?? 0 },
      { ...reviewState, ...confirmedReviewState },
    )
  }

  if (done) {
    return (
      <TaskScreen onBack={onExit} backLabel="← Home">
        <div className="proficiency-result stagger">
          <h1 className="proficiency-result-title">
            {confirmed.length > 0 ? `You know ${confirmed.length} more` : "Let's find your level"}
          </h1>
          <p className="proficiency-result-note">
            {exhausted
              ? "You've reached the end of the curriculum — everything is marked known."
              : "That one tripped you up — everything before it is now marked known and ready for review."}
          </p>
          <button type="button" className="primary-button" onClick={handleFinish}>
            Continue
          </button>
        </div>
      </TaskScreen>
    )
  }

  return (
    <TaskScreen onBack={onExit} backLabel="← Exit" progress={`${confirmed.length} known`}>
      <QuizQuestion
        key={currentChar}
        track={track}
        question={question}
        kanjiRecord={currentRecord}
        onComplete={handleAnswer}
        autoAdvanceOnCorrect
      />
    </TaskScreen>
  )
}
