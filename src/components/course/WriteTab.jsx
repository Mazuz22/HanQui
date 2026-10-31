import { useState } from 'react'
import HanziStage from './HanziStage'
import SpeakButton from './SpeakButton'
import { lessonRecord, markWritten } from '../../lib/courseProgress'

/**
 * Writing with a finger: first trace over the outline, then write it again
 * from memory with only the pinyin and meaning as a prompt. A character
 * counts as written once the from-memory round is finished.
 */
export default function WriteTab({ lesson, progress, onProgress }) {
  const chars = lesson.characters
  const written = lessonRecord(progress, lesson.id).written
  const firstUnwritten = Math.max(0, chars.findIndex((c) => !written.includes(c.char)))
  const [index, setIndex] = useState(firstUnwritten)
  const [phase, setPhase] = useState('trace')
  const [result, setResult] = useState(null)
  const [round, setRound] = useState(0)

  const current = chars[index]
  if (!current) return <p className="empty-note">This lesson has no characters yet.</p>

  function handleDone({ mistakes }) {
    setResult({ mistakes })
    if (phase === 'recall') onProgress((p) => markWritten(p, lesson.id, current.char))
  }

  function goTo(nextIndex) {
    setIndex(nextIndex)
    setPhase('trace')
    setResult(null)
    setRound((r) => r + 1)
  }

  function advance() {
    if (phase === 'trace') {
      setPhase('recall')
      setResult(null)
      setRound((r) => r + 1)
    } else if (index < chars.length - 1) {
      goTo(index + 1)
    } else {
      goTo(0)
    }
  }

  function retry() {
    setResult(null)
    setRound((r) => r + 1)
  }

  return (
    <div className="write-tab">
      <div className="write-prompt" lang="zh-CN">
        <span className="write-phase">{phase === 'trace' ? '1 · Trace it' : '2 · From memory'}</span>
        <p className="write-pinyin">
          {current.pinyin} <SpeakButton text={current.char} />
        </p>
        <p className="write-meaning" lang="en">
          {current.meaning}
        </p>
      </div>

      <HanziStage key={`${current.char}-${phase}-${round}`} char={current.char} mode={phase} onDone={handleDone} />

      {result ? (
        <div className="write-result in">
          <p className={result.mistakes === 0 ? 'quiz-feedback-positive' : 'write-mistakes'}>
            {result.mistakes === 0 ? 'Clean — no mistakes' : `Done, with ${result.mistakes} slip${result.mistakes === 1 ? '' : 's'}`}
          </p>
          <div className="write-actions">
            <button type="button" className="secondary-button" onClick={retry}>
              Again
            </button>
            <button type="button" className="primary-button" onClick={advance}>
              {phase === 'trace' ? 'Now from memory →' : index < chars.length - 1 ? 'Next character →' : 'Start over'}
            </button>
          </div>
        </div>
      ) : (
        <p className="write-hint">
          {phase === 'trace' ? 'Follow the grey outline, in stroke order.' : 'Write it without the outline — a hint shows after 3 misses.'}
        </p>
      )}

      <div className="char-strip" lang="zh-CN">
        {chars.map((c, i) => (
          <button
            key={c.char}
            type="button"
            className={`char-strip-item${i === index ? ' char-strip-active' : ''}${written.includes(c.char) ? ' char-strip-done' : ''}`}
            onClick={() => goTo(i)}
          >
            {c.char}
          </button>
        ))}
      </div>
    </div>
  )
}
