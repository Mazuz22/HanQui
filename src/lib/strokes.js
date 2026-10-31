/**
 * Stroke data (hanzi-writer-data, Arphic PL) for the course's characters
 * only — scripts/build-course-data.mjs copies each needed character's JSON
 * into public/strokes/, so the app never pulls the whole 9,000-character
 * set and works from any static host. Cached per character: the Learn,
 * Write and Sheet tabs all ask for the same few characters.
 */
const cache = new Map()

export function loadStrokes(char) {
  if (!cache.has(char)) {
    const url = `${import.meta.env.BASE_URL}strokes/${encodeURIComponent(char)}.json`
    const request = fetch(url).then((response) => {
      if (!response.ok) throw new Error(`No stroke data for ${char}`)
      return response.json()
    })
    // A failed fetch (offline, missing file) shouldn't poison the cache forever.
    request.catch(() => cache.delete(char))
    cache.set(char, request)
  }
  return cache.get(char)
}

// Hanzi Writer's charDataLoader signature: (char, onLoad, onError).
export function hanziWriterLoader(char, onLoad, onError) {
  loadStrokes(char).then(onLoad, onError)
}
