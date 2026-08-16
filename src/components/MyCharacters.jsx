import { TaskScreen } from './layout'
import CharacterGrid from './CharacterGrid'
import { TRACKS } from '../lib/tracks'

export default function MyCharacters({ track, progress, reviewState, onBack }) {
  const { data, unitNoun } = TRACKS[track]
  const introduced = progress?.introduced ?? []

  return (
    <TaskScreen
      onBack={onBack}
      backLabel="← Back"
      brief={`${introduced.length} / ${data.length} ${unitNoun} known`}
    >
      <div className="char-grid-page">
        <CharacterGrid track={track} chars={introduced} reviewState={reviewState} />
      </div>
    </TaskScreen>
  )
}
