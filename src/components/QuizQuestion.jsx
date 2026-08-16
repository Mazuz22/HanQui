import { useEffect, useState } from 'react'
import { TRACKS } from '../lib/tracks'

const FAST_ADVANCE_MS = 220

/**
 * A single 4-option multiple-choice question. Owns its own "answered" state
 * so switching questions (the parent remounts this via a `key` on the
 * target char) resets it for free — no external reset wiring needed.
 *
 * Feedback is strictly deterministic: correct/incorrect plus the target's
 * reading, revealed only after answering and never itself quizzed.
 *
 * `autoAdvanceOnCorrect` (used by the proficiency test's speed-run mode)
 * skips the reveal-and-click-Continue step on a correct answer — the
 * correct option still flashes green so there's a beat of confirmation,
 * then `onComplete` fires on its own. A wrong answer always stops and
 * shows the normal reveal, in both modes, since that's the one moment
 * worth pausing on regardless of how fast the rest of the run is.
 */
export default function QuizQuestion({ track, question, kanjiRecord, onComplete, autoAdvanceOnCorrect = false }) {
  const [selected, setSelected] = useState(null)

  const answered = selected !== null
  const wasCorrect = answered && selected === question.correctIndex
  const fastPath = autoAdvanceOnCorrect && wasCorrect

  useEffect(() => {
    if (!fastPath) return undefined
    const timer = setTimeout(() => onComplete(true), FAST_ADVANCE_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fastPath])

  function handleSelect(index) {
    if (answered) return
    setSelected(index)
  }

  const reading = kanjiRecord ? TRACKS[track].formatReading(kanjiRecord) : ''

  return (
    <div className="quiz-question">
      <p className="quiz-direction-label">
        {question.direction === 'kanjiToMeaning' ? 'What does this mean?' : 'Which character means this?'}
      </p>
      <div className={question.direction === 'kanjiToMeaning' ? 'quiz-prompt quiz-prompt-char' : 'quiz-prompt quiz-prompt-meaning'}>
        {question.prompt}
      </div>

      <div className="quiz-options">
        {question.options.map((option, index) => {
          const isCorrectOption = index === question.correctIndex
          const isSelected = index === selected
          let stateClass = ''
          if (answered) {
            if (isCorrectOption) stateClass = 'quiz-option-correct'
            else if (isSelected) stateClass = 'quiz-option-incorrect'
            else stateClass = 'quiz-option-muted'
          }
          return (
            <button
              key={option.char}
              type="button"
              className={`quiz-option ${stateClass}`.trim()}
              onClick={() => handleSelect(index)}
              disabled={answered}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      {answered && !fastPath && (
        <div className="quiz-feedback in">
          <p className={wasCorrect ? 'quiz-feedback-positive' : 'quiz-feedback-negative'}>
            {wasCorrect ? 'Correct' : 'Not quite'}
          </p>
          {kanjiRecord && (
            <p className="quiz-reading">
              {kanjiRecord.char} · {reading || '—'}
            </p>
          )}
          <button type="button" className="primary-button quiz-continue" onClick={() => onComplete(wasCorrect)}>
            Continue
          </button>
        </div>
      )}
    </div>
  )
}
