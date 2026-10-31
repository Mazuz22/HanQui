import { canSpeak, speak } from '../../lib/speech'

export default function SpeakButton({ text, label = 'Play pronunciation' }) {
  if (!canSpeak()) return null
  return (
    <button type="button" className="speak-button" onClick={() => speak(text)} aria-label={label}>
      🔊
    </button>
  )
}
