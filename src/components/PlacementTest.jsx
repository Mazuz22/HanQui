import { useMemo, useState } from 'react'
import { TaskScreen } from './layout'
import QuizQuestion from './QuizQuestion'
import { buildProbeSet, estimateStartIndex } from '../lib/placementTest'
import { generateQuestion } from '../lib/quizGenerator'
import { recordReview } from '../lib/reviewQueue'
import { TRACKS } from '../lib/tracks'

const PROBE_SIZE = 18

/**
 * A real 4-option quiz over a small, evenly-spaced sample of the lesson
 * path — not a self-report "do you know this?" scan — used once to
 * estimate where a new user should start. See lib/placementTest.js for the
 * scoring logic.
 */
export default function PlacementTest({ track, onComplete, onExit }) {
  const { data, itemNoun } = TRACKS[track]
  const orderedChars = useMemo(() => data.map((k) => k.char), [data])
  const probeSet = useMemo(() => buildProbeSet(orderedChars, PROBE_SIZE), [orderedChars])
  const [probeIndex, setProbeIndex] = useState(0)
  const [results, setResults] = useState([])

  const currentChar = probeSet[probeIndex]
  const currentRecord = data.find((k) => k.char === currentChar)
  const question = useMemo(() => generateQuestion(currentChar, data, 'kanjiToMeaning'), [currentChar, data])

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
      reviewState[char] = recordReview(null, true, null, now)
    }
    onComplete({ introduced, placementComplete: true, placementStartIndex: startIndex }, reviewState)
  }

  return (
    <TaskScreen onBack={onExit} backLabel="← Cancel" progress={`${probeIndex + 1} / ${probeSet.length}`}>
      <p className="placement-intro">
        Quick check — pick the meaning of each {itemNoun}. Guessing is fine, this just finds where to start you.
      </p>
      <QuizQuestion
        key={currentChar}
        track={track}
        question={question}
        kanjiRecord={currentRecord}
        onComplete={handleAnswer}
      />
    </TaskScreen>
  )
}
