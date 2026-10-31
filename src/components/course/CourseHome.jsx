import { TaskScreen } from '../layout'
import { COURSE, LESSONS } from '../../lib/course'
import { lessonCompletion, lessonRecord } from '../../lib/courseProgress'

/** The semester as a list of weeks, each showing how far she has got. */
export default function CourseHome({ progress, onOpenLesson, onBack }) {
  return (
    <TaskScreen onBack={onBack} backLabel="← Home" progress={COURSE.semester}>
      <div className="course-head">
        <h1 className="course-title">{COURSE.title}</h1>
        <p className="course-note">{COURSE.note}</p>
      </div>
      <ol className="course-weeks">
        {LESSONS.map((lesson) => {
          const done = Math.round(lessonCompletion(progress, lesson) * 100)
          const quiz = lessonRecord(progress, lesson.id).quizBest
          return (
            <li key={lesson.id}>
              <button
                type="button"
                className={`course-week${lesson.review ? ' course-week-review' : ''}`}
                onClick={() => onOpenLesson(lesson.id)}
              >
                <span className="course-week-label">{lesson.label}</span>
                <span className="course-week-title" lang="zh-CN">
                  {lesson.titleZh}
                </span>
                <span className="course-week-en">{lesson.titleEn}</span>
                <span className="course-week-chars" lang="zh-CN">
                  {lesson.characters
                    .slice(0, 12)
                    .map((c) => c.char)
                    .join('')}
                  {lesson.characters.length > 12 ? '…' : ''}
                </span>
                <span className="course-week-meter" aria-label={`${done}% written`}>
                  <span style={{ width: `${done}%` }} />
                </span>
                <span className="course-week-stats">
                  {lesson.characters.length} characters · {done}% written{quiz ? ` · quiz ${quiz}%` : ''}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </TaskScreen>
  )
}
