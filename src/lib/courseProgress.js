/**
 * Course progress lives apart from the track engine's FSRS state: it's a
 * plain per-lesson record of what has been done, so the course list can
 * show where she is in the semester.
 *
 * Shape: { lessons: { [lessonId]: { seen: [char], written: [char], quizBest: number } } }
 */
const KEY = 'hanqui.course.semesterA'

export function getCourseProgress() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : { lessons: {} }
  } catch {
    return { lessons: {} }
  }
}

export function saveCourseProgress(progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress))
  } catch {
    // Private browsing or a full quota — the app still works, just forgetfully.
  }
}

export function lessonRecord(progress, lessonId) {
  return progress.lessons[lessonId] ?? { seen: [], written: [], quizBest: 0 }
}

function addUnique(list, item) {
  return list.includes(item) ? list : [...list, item]
}

export function markSeen(progress, lessonId, char) {
  const record = lessonRecord(progress, lessonId)
  return { ...progress, lessons: { ...progress.lessons, [lessonId]: { ...record, seen: addUnique(record.seen, char) } } }
}

export function markWritten(progress, lessonId, char) {
  const record = lessonRecord(progress, lessonId)
  return { ...progress, lessons: { ...progress.lessons, [lessonId]: { ...record, written: addUnique(record.written, char) } } }
}

export function recordQuiz(progress, lessonId, score) {
  const record = lessonRecord(progress, lessonId)
  return {
    ...progress,
    lessons: { ...progress.lessons, [lessonId]: { ...record, quizBest: Math.max(record.quizBest, score) } },
  }
}

/** 0–1: the share of a lesson's characters she has both looked at and written. */
export function lessonCompletion(progress, lesson) {
  const chars = lesson.characters.map((c) => c.char)
  if (chars.length === 0) return 0
  const record = lessonRecord(progress, lesson.id)
  const done = chars.filter((char) => record.seen.includes(char) && record.written.includes(char)).length
  return done / chars.length
}
