import { TaskScreen } from './layout'
import CharacterGrid from './CharacterGrid'
import { TRACKS } from '../lib/tracks'

export default function MyCharacters({ track, progress, onBack }) {
  const { data, unitNoun } = TRACKS[track]
  const introduced = progress?.introduced ?? []

  return (
    <TaskScreen
      onBack={onBack}
      backLabel="← Back"
      brief={`${introduced.length} / ${data.length} ${unitNoun} known`}
    >
      <div className="char-grid-page">
        <CharacterGrid track={track} chars={introduced} />
      </div>
    </TaskScreen>
  )
}
