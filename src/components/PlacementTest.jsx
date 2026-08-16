import { useMemo, useState } from 'react'
import { TaskScreen } from './layout'
import QuizQuestion from './QuizQuestion'
import { buildProbeSet, estimateStartIndex } from '../lib/placementTest'
import { generateQuestion } from '../lib/quizGenerator'
import { recordReview } from '../lib/reviewQueue'

const PROBE_SIZE = 18

/**
 * A real 4-option quiz over a small, evenly-spaced sample of the lesson
 * path — not a self-report "do you know this?" scan — used once to
 * estimate where a new user should start. See lib/placementTest.js for the
 * scoring logic.
 */
export default function PlacementTest({ kanjiData, onComplete, onExit }) {
  const orderedChars = useMemo(() => kanjiData.map((k) => k.char), [kanjiData])
  const probeSet = useMemo(() => buildProbeSet(orderedChars, PROBE_SIZE), [orderedChars])
  const [probeIndex, setProbeIndex] = useState(0)
  const [results, setResults] = useState([])

  const currentChar = probeSet[probeIndex]
  const currentRecord = kanjiData.find((k) => k.char === currentChar)
  const question = useMemo(() => generateQuestion(currentChar, kanjiData, 'kanjiToMeaning'), [currentChar, kanjiData])

  function handleAnswer(wasCorrect) {
    const nextResults = [...results, { lessonOrderIndex: currentRecord.lessonOrder, correct: wasCorrect }]

    if (probeIndex + 1 < probeSet.length) {
      setResults(nextResults)
      setProbeIndex(probeIndex + 1)
      return
    }

    const startIndex = estimateStartIndex(nextResults)
    const now = new Date()
    const introduced = orderedChars.slice(0, startIndex)
    const reviewState = {}
    for (const char of introduced) {
      reviewState[char] = recordReview(null, true, now)
    }
    onComplete({ introduced, placementComplete: true, placementStartIndex: startIndex }, reviewState)
  }

  return (
    <TaskScreen onBack={onExit} backLabel="← Cancel" progress={`${probeIndex + 1} / ${probeSet.length}`}>
      <p className="placement-intro">
        Quick check — pick the meaning of each kanji. Guessing is fine, this just finds where to start you.
      </p>
      <QuizQuestion key={currentChar} question={question} kanjiRecord={currentRecord} onComplete={handleAnswer} />
    </TaskScreen>
  )
}
