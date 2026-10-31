/**
 * Pronunciation through the browser's own speech engine — Safari on iOS
 * ships a Mandarin voice (Tingting/Lili), so this needs no audio files and
 * no network. iOS only allows speech from inside a tap handler, which is
 * the only place this is ever called from.
 */
function pickVoice() {
  const voices = window.speechSynthesis?.getVoices() ?? []
  return (
    voices.find((voice) => voice.lang === 'zh-CN') ??
    voices.find((voice) => voice.lang?.startsWith('zh') && !/HK|TW/.test(voice.lang)) ??
    null
  )
}

export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speak(text, { rate = 0.8 } = {}) {
  if (!canSpeak()) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'
  utterance.rate = rate
  const voice = pickVoice()
  if (voice) utterance.voice = voice
  window.speechSynthesis.speak(utterance)
}
