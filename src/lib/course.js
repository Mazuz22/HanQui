import courseData from '../assets/course-data.json'
import { quizItems } from './courseQuiz'

/** Semester A, built by scripts/build-course-data.mjs from the syllabus. */
export const COURSE = courseData.course
export const LESSONS = courseData.lessons

// Every word and character in the course — the quiz tops up distractors
// from here when one lesson is too small to supply three.
export const ALL_QUIZ_ITEMS = (() => {
  const seen = new Map()
  for (const lesson of LESSONS) for (const item of quizItems(lesson)) if (!seen.has(item.hanzi)) seen.set(item.hanzi, item)
  return [...seen.values()]
})()
