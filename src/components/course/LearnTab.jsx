import { useEffect, useState } from 'react'
import HanziStage from './HanziStage'
import SpeakButton from './SpeakButton'
import { markSeen } from '../../lib/courseProgress'

/**
 * Character by character: the animated stroke order (tap to replay), its
 * sound, meaning and parts, and the unit's words that use it — then the
 * unit's whole word list underneath, each word playable.
 */
export default function LearnTab({ lesson, onProgress }) {
  const [index, setIndex] = useState(0)
  const chars = lesson.characters
  const current = chars[index]

  useEffect(() => {
    if (current) onProgress((p) => markSeen(p, lesson.id, current.char))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.char])

  if (!current) return <p className="empty-note">This lesson has no characters yet.</p>

  return (
    <div className="learn-tab">
      <div className="char-card">
        <div className="char-card-stage">
          <HanziStage char={current.char} mode="animate" />
          <p className="char-card-tap">Tap the character to replay its strokes</p>
        </div>
        <div className="char-card-info" lang="zh-CN">
          <p className="char-card-pinyin">
            {current.pinyin} <SpeakButton text={current.char} />
          </p>
          <p className="char-card-meaning" lang="en">
            {current.meaning}
          </p>
          <dl className="char-facts" lang="en">
            <div>
              <dt>Strokes</dt>
              <dd>{current.strokeCount}</dd>
            </div>
            {current.radical && (
              <div>
                <dt>Radical</dt>
                <dd lang="zh-CN">{current.radical}</dd>
              </div>
            )}
            {current.parts && (
              <div>
                <dt>Parts</dt>
                <dd lang="zh-CN">{current.parts}</dd>
              </div>
            )}
          </dl>
          {current.hint && (
            <p className="char-card-hint" lang="en">
              {current.hint}
            </p>
          )}
          {current.words.length > 0 && (
            <ul className="char-words">
              {current.words.map((word) => (
                <li key={word.hanzi}>
                  <span className="char-word-hanzi">{word.hanzi}</span>
                  <span className="char-word-pinyin">{word.pinyin}</span>
                  <span className="char-word-en" lang="en">
                    {word.en}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="char-nav">
        <button type="button" className="secondary-button" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          ← Prev
        </button>
        <span className="char-nav-count">
          {index + 1} / {chars.length}
        </span>
        <button
          type="button"
          className="secondary-button"
          disabled={index === chars.length - 1}
          onClick={() => setIndex(index + 1)}
        >
          Next →
        </button>
      </div>

      <div className="char-strip" lang="zh-CN">
        {chars.map((c, i) => (
          <button
            key={c.char}
            type="button"
            className={`char-strip-item${i === index ? ' char-strip-active' : ''}`}
            onClick={() => setIndex(i)}
          >
            {c.char}
          </button>
        ))}
      </div>

      {lesson.vocab.length > 0 && (
        <section className="vocab-list">
          <h2 className="section-label">Words in this unit</h2>
          <ul>
            {lesson.vocab.map((word) => (
              <li key={word.hanzi} className="vocab-item">
                <span className="vocab-hanzi" lang="zh-CN">
                  {word.hanzi}
                </span>
                <span className="vocab-pinyin">{word.pinyin}</span>
                <span className="vocab-en">{word.en}</span>
                <SpeakButton text={word.hanzi} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {lesson.names?.length > 0 && (
        <section className="vocab-list">
          <h2 className="section-label">Names in this unit</h2>
          <ul>
            {lesson.names.map((word) => (
              <li key={word.hanzi} className="vocab-item">
                <span className="vocab-hanzi" lang="zh-CN">
                  {word.hanzi}
                </span>
                <span className="vocab-pinyin">{word.pinyin}</span>
                <span className="vocab-en">{word.en}</span>
                <SpeakButton text={word.hanzi} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
