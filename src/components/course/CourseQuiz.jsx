import { useMemo, useState } from 'react'
import { buildQuiz } from '../../lib/courseQuiz'
import { canSpeak, speak } from '../../lib/speech'
import { lessonRecord, recordQuiz } from '../../lib/courseProgress'
import { ALL_QUIZ_ITEMS } from '../../lib/course'

const PROMPTS = {
  meaning: 'What does this mean?',
  hanzi: 'Which one means this?',
  pinyin: 'Which one is read like this?',
  listen: 'Which one did you hear?',
}

export default function CourseQuiz({ lesson, progress, onProgress }) {
  const [attempt, setAttempt] = useState(0)
  const questions = useMemo(
    () => buildQuiz(lesson, ALL_QUIZ_ITEMS, { canListen: canSpeak() }),
    // A new attempt reshuffles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lesson, attempt],
  )
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [correct, setCorrect] = useState(0)
  const best = lessonRecord(progress, lesson.id).quizBest

  if (questions.length === 0) return <p className="empty-note">Nothing to quiz in this lesson yet.</p>

  if (index >= questions.length) {
    const score = Math.round((correct / questions.length) * 100)
    return (
      <div className="quiz-done in">
        <p className="quiz-done-score">{score}%</p>
        <p className="quiz-done-detail">
          {correct} of {questions.length} right · best {Math.max(best, score)}%
        </p>
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setAttempt(attempt + 1)
            setIndex(0)
            setCorrect(0)
            setSelected(null)
          }}
        >
          Try again
        </button>
      </div>
    )
  }

  const question = questions[index]
  const answered = selected !== null
  const charOptions = question.kind !== 'meaning'

  function choose(i) {
    if (answered) return
    setSelected(i)
    if (i === question.correctIndex) setCorrect(correct + 1)
  }

  function next() {
    const nextIndex = index + 1
    if (nextIndex >= questions.length) {
      const finalCorrect = correct
      onProgress((p) => recordQuiz(p, lesson.id, Math.round((finalCorrect / questions.length) * 100)))
    }
    setIndex(nextIndex)
    setSelected(null)
  }

  return (
    <div className="quiz-question" key={index}>
      <p className="quiz-direction-label">
        {PROMPTS[question.kind]} <span className="quiz-count">{index + 1}/{questions.length}</span>
      </p>

      {question.kind === 'listen' ? (
        <button type="button" className="listen-prompt" onClick={() => speak(question.target.hanzi)}>
          🔊 Play
        </button>
      ) : (
        <div
          className={`quiz-prompt ${question.kind === 'meaning' ? 'quiz-prompt-char' : 'quiz-prompt-meaning'}${question.kind === 'meaning' && [...question.target.hanzi].length > 1 ? ' quiz-prompt-char-multi' : ''}`}
          lang={question.kind === 'hanzi' ? 'en' : 'zh-CN'}
        >
          {question.kind === 'meaning' ? question.target.hanzi : question.kind === 'pinyin' ? question.target.pinyin : question.target.en}
        </div>
      )}

      <div className="quiz-options">
        {question.options.map((option, i) => {
          let cls = 'quiz-option'
          if (charOptions) cls += [...option.label].length > 1 ? ' quiz-option-char-multi' : ' quiz-option-char'
          if (answered) {
            if (i === question.correctIndex) cls += ' quiz-option-correct'
            else if (i === selected) cls += ' quiz-option-incorrect'
            else cls += ' quiz-option-muted'
          }
          return (
            <button key={option.key} type="button" className={cls} disabled={answered} onClick={() => choose(i)} lang={charOptions ? 'zh-CN' : 'en'}>
              {option.label}
            </button>
          )
        })}
      </div>

      {answered && (
        <div className="quiz-feedback in">
          <p className={selected === question.correctIndex ? 'quiz-feedback-positive' : 'quiz-feedback-negative'}>
            {selected === question.correctIndex ? 'Correct' : 'Not quite'}
          </p>
          <p className="quiz-reading" lang="zh-CN">
            {question.target.hanzi} · {question.target.pinyin} · <span lang="en">{question.target.en}</span>
          </p>
          <button type="button" className="primary-button quiz-continue" onClick={next}>
            Continue
          </button>
        </div>
      )}
    </div>
  )
}
