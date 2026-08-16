/**
 * localStorage-backed implementation of HanQui's persistence interface (see
 * storage.js). Every function is `async` even though localStorage itself is
 * synchronous — a future backend-backed implementation needs to be async,
 * and every call site is already written against that shape, so swapping
 * storage.js's export source later touches nothing else in the app.
 *
 * Progress and review state are stored per track (Kanji and Hanzi each have
 * their own curriculum and their own independent progress) as opaque JSON
 * blobs; callers are responsible for serializing FSRS cards (see
 * reviewQueue.js's serializeReviewState/deserializeReviewState) before/
 * after passing them through here — this module doesn't know anything
 * about FSRS specifically.
 *
 * Defensive try/catch throughout, same as go-teacher's rank.js: private
 * browsing or a full storage quota shouldn't crash the app, just mean
 * progress isn't remembered.
 */
const progressKey = (track) => `hanqui.progress.${track}`
const reviewStateKey = (track) => `hanqui.reviewState.${track}`

export async function getProgress(track) {
  try {
    const raw = localStorage.getItem(progressKey(track))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function saveProgress(track, progress) {
  try {
    localStorage.setItem(progressKey(track), JSON.stringify(progress))
  } catch {
    // Private browsing or a full quota — the app still works, just forgetfully.
  }
}

export async function getReviewState(track) {
  try {
    const raw = localStorage.getItem(reviewStateKey(track))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export async function saveReviewState(track, reviewState) {
  try {
    localStorage.setItem(reviewStateKey(track), JSON.stringify(reviewState))
  } catch {
    // Private browsing or a full quota — the app still works, just forgetfully.
  }
}

export async function clearAll(track) {
  try {
    localStorage.removeItem(progressKey(track))
    localStorage.removeItem(reviewStateKey(track))
  } catch {
    /* nothing to do */
  }
}
