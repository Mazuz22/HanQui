import { useEffect, useRef, useState } from 'react'
import HanziWriter from 'hanzi-writer'
import { hanziWriterLoader } from '../../lib/strokes'
import { TianGrid } from './CharSvg'

// Hanzi Writer paints its own SVG, so it needs literal colours rather than
// CSS variables — read them off the page once so the stage matches the theme.
function themeColors() {
  const style = getComputedStyle(document.documentElement)
  const read = (name, fallback) => style.getPropertyValue(name).trim() || fallback
  return {
    ink: read('--text', '#f2ede1'),
    accent: read('--accent', '#c9613f'),
    outline: read('--card-border', '#3a3729'),
    positive: read('--positive', '#4fc2a8'),
  }
}

/**
 * A live Hanzi Writer canvas in one of three modes:
 * - `animate`: plays the stroke order (tap to replay).
 * - `trace`: write over a visible outline, with hints after 2 misses.
 * - `recall`: write from memory, no outline; hints only after 3 misses.
 *
 * Touch drawing works on iPhone because the stage's CSS sets
 * `touch-action: none`, so a stroke isn't swallowed as a page scroll.
 *
 * `onDone({ mistakes })` fires when a trace/recall quiz is completed.
 */
export default function HanziStage({ char, mode = 'animate', onDone, size }) {
  const outerRef = useRef(null)
  const hostRef = useRef(null)
  const writerRef = useRef(null)
  const [status, setStatus] = useState('loading')
  const [measured, setMeasured] = useState(null)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  // Fit the stage to its container (phone widths vary), capped for desktop.
  useEffect(() => {
    if (size) return undefined
    const outer = outerRef.current
    const update = () => setMeasured(Math.min(320, Math.floor(outer.clientWidth)) || null)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(outer)
    return () => observer.disconnect()
  }, [size])

  const side = size ?? measured

  useEffect(() => {
    const host = hostRef.current
    if (!host || !side) return undefined
    host.innerHTML = ''
    const colors = themeColors()
    let cancelled = false
    setStatus('loading')

    const writer = HanziWriter.create(host, char, {
      width: side,
      height: side,
      padding: Math.round(side * 0.06),
      charDataLoader: hanziWriterLoader,
      onLoadCharDataSuccess: () => !cancelled && setStatus('ready'),
      onLoadCharDataError: () => !cancelled && setStatus('missing'),
      strokeColor: colors.ink,
      radicalColor: colors.accent,
      outlineColor: colors.outline,
      drawingColor: colors.accent,
      highlightColor: colors.positive,
      drawingWidth: Math.max(10, Math.round(side / 22)),
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 280,
      showCharacter: false,
      showOutline: mode !== 'recall',
    })
    writerRef.current = writer

    if (mode === 'animate') {
      writer.animateCharacter()
    } else {
      writer.quiz({
        showHintAfterMisses: mode === 'trace' ? 2 : 3,
        highlightOnComplete: true,
        onComplete: ({ totalMistakes }) => {
          if (cancelled) return
          setStatus('done')
          onDoneRef.current?.({ mistakes: totalMistakes })
        },
      })
    }

    return () => {
      cancelled = true
      writer.cancelQuiz?.()
      host.innerHTML = ''
    }
  }, [char, mode, side])

  function replay() {
    if (mode === 'animate') writerRef.current?.animateCharacter()
  }

  return (
    <div ref={outerRef} className={`hanzi-stage hanzi-stage-${mode}`}>
      <div className="hanzi-stage-frame" style={side ? { width: side, height: side } : undefined}>
        <svg viewBox="0 0 1024 1024" className="hanzi-stage-grid" aria-hidden="true">
          <TianGrid />
        </svg>
        <div ref={hostRef} className="hanzi-stage-canvas" onClick={replay} lang="zh-CN" />
      </div>
      {status === 'missing' && <p className="hanzi-stage-note">No stroke data for {char}.</p>}
    </div>
  )
}
