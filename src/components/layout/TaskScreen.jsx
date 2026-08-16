import ScreenHeader from './ScreenHeader'

/**
 * "Instruction, then interactive content, then an optional footer action."
 * Used for the placement test, a lesson/review session, and Credits.
 */
export default function TaskScreen({ onBack, backLabel, progress, brief, children, footer }) {
  return (
    <div className="task-screen">
      <ScreenHeader onBack={onBack} backLabel={backLabel} progress={progress} />
      {brief && <div className="task-brief">{brief}</div>}
      {children}
      {footer && <div className="screen-footer">{footer}</div>}
    </div>
  )
}
