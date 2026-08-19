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
 *
 * `onComplete(wasCorrect, elapsedMs)` — elapsed time is measured from when
 * the question first rendered to the moment an option was tapped, not when
 * `onComplete` actually fires (which, on the fast path, is deliberately
 * ~`FAST_ADVANCE_MS` later for the visual flash — that delay is UI
 * polish, not part of the user's genuine thinking time, so it must not
 * leak into the timing signal callers use to grade recall confidence).
 */
export default function QuizQuestion({ track, question, kanjiRecord, onComplete, autoAdvanceOnCorrect = false }) {
  const [startedAt] = useState(() => Date.now())
  const [selected, setSelected] = useState(null)
  const [elapsedMs, setElapsedMs] = useState(null)

  const answered = selected !== null
  const wasCorrect = answered && selected === question.correctIndex
  const fastPath = autoAdvanceOnCorrect && wasCorrect

  useEffect(() => {
    if (!fastPath) return undefined
    const timer = setTimeout(() => onComplete(true, elapsedMs), FAST_ADVANCE_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fastPath])

  function handleSelect(index) {
    if (answered) return
    setElapsedMs(Date.now() - startedAt)
    setSelected(index)
  }

  const reading = kanjiRecord ? TRACKS[track].formatReading(kanjiRecord) : ''
  const itemNoun = TRACKS[track].itemNoun
  const isCharPrompt = question.direction === 'kanjiToMeaning'
  const promptClass = isCharPrompt
    ? `quiz-prompt quiz-prompt-char${[...question.prompt].length > 1 ? ' quiz-prompt-char-multi' : ''}`
    : 'quiz-prompt quiz-prompt-meaning'

  return (
    <div className="quiz-question">
      <p className="quiz-direction-label">
        {isCharPrompt ? 'What does this mean?' : `Which ${itemNoun} means this?`}
      </p>
      <div className={promptClass}>{question.prompt}</div>

      <div className="quiz-options">
        {question.options.map((option, index) => {
          const isCorrectOption = index === question.correctIndex
          const isSelected = index === selected
          let stateClass = ''
          if (!isCharPrompt) {
            stateClass = [...option.label].length > 1 ? 'quiz-option-char-multi' : 'quiz-option-char'
          }
          if (answered) {
            if (isCorrectOption) stateClass += ' quiz-option-correct'
            else if (isSelected) stateClass += ' quiz-option-incorrect'
            else stateClass += ' quiz-option-muted'
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
          <button
            type="button"
            className="primary-button quiz-continue"
            onClick={() => onComplete(wasCorrect, elapsedMs)}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  )
}
