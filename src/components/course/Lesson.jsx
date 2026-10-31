import { useState } from 'react'
import { TaskScreen } from '../layout'
import LearnTab from './LearnTab'
import StrokesTab from './StrokesTab'
import WriteTab from './WriteTab'
import CourseQuiz from './CourseQuiz'
import PracticeSheet from './PracticeSheet'

const TABS = [
  { id: 'learn', zh: '学', en: 'Learn' },
  { id: 'strokes', zh: '笔顺', en: 'Strokes' },
  { id: 'write', zh: '写', en: 'Write' },
  { id: 'quiz', zh: '测', en: 'Quiz' },
  { id: 'sheet', zh: '纸', en: 'Sheet' },
]

/**
 * One week of the course: the textbook units it covers, then five tabs that
 * walk the week's characters from first look to written from memory —
 * learn (meaning, sound, animated strokes, the unit's words), the stroke
 * order on paper, writing with a finger, a quiz, and a printable sheet.
 */
export default function Lesson({ lesson, progress, onProgress, onBack }) {
  const [tab, setTab] = useState('learn')

  return (
    <TaskScreen onBack={onBack} backLabel="← Course" progress={lesson.label}>
      <div className="lesson-head no-print">
        <h1 className="lesson-title" lang="zh-CN">
          {lesson.titleZh}
        </h1>
        <p className="lesson-pinyin" lang="zh-CN">
          {lesson.titlePinyin}
        </p>
        <p className="lesson-en">{lesson.titleEn}</p>
        <ul className="lesson-sources">
          {lesson.sources.map((source) => (
            <li key={source}>{source}</li>
          ))}
        </ul>
      </div>

      <nav className="lesson-tabs no-print" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`lesson-tab${tab === t.id ? ' lesson-tab-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="lesson-tab-zh" lang="zh-CN">
              {t.zh}
            </span>
            <span className="lesson-tab-en">{t.en}</span>
          </button>
        ))}
      </nav>

      <div className="lesson-body" key={tab}>
        {tab === 'learn' && <LearnTab lesson={lesson} onProgress={onProgress} />}
        {tab === 'strokes' && <StrokesTab lesson={lesson} />}
        {tab === 'write' && <WriteTab lesson={lesson} progress={progress} onProgress={onProgress} />}
        {tab === 'quiz' && <CourseQuiz lesson={lesson} progress={progress} onProgress={onProgress} />}
        {tab === 'sheet' && <PracticeSheet lesson={lesson} />}
      </div>
    </TaskScreen>
  )
}
