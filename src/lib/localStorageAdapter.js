/**
 * localStorage-backed implementation of HanQui's persistence interface (see
 * storage.js). Every function is `async` even though localStorage itself is
 * synchronous — a future backend-backed implementation needs to be async,
 * and every call site is already written against that shape, so swapping
 * storage.js's export source later touches nothing else in the app.
 *
 * Progress and review state are stored as opaque JSON blobs; callers are
 * responsible for serializing FSRS cards (see reviewQueue.js's
 * serializeReviewState/deserializeReviewState) before/after passing them
 * through here — this module doesn't know anything about FSRS specifically.
 *
 * Defensive try/catch throughout, same as go-teacher's rank.js: private
 * browsing or a full storage quota shouldn't crash the app, just mean
 * progress isn't remembered.
 */
const PROGRESS_KEY = 'hanqui.progress'
const REVIEW_STATE_KEY = 'hanqui.reviewState'

export async function getProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function saveProgress(progress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
  } catch {
    // Private browsing or a full quota — the app still works, just forgetfully.
  }
}

export async function getReviewState() {
  try {
    const raw = localStorage.getItem(REVIEW_STATE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export async function saveReviewState(reviewState) {
  try {
    localStorage.setItem(REVIEW_STATE_KEY, JSON.stringify(reviewState))
  } catch {
    // Private browsing or a full quota — the app still works, just forgetfully.
  }
}

export async function clearAll() {
  try {
    localStorage.removeItem(PROGRESS_KEY)
    localStorage.removeItem(REVIEW_STATE_KEY)
  } catch {
    /* nothing to do */
  }
}
