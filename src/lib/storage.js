/**
 * Every persistence backend HanQui uses implements exactly this shape:
 * getProgress, saveProgress, getReviewState, saveReviewState, clearAll.
 *
 * v1 re-exports the localStorage-backed implementation below. Swapping to a
 * real backend later (see the app's requirements — cross-device sync is
 * planned but deliberately deferred) means changing only this file's export
 * source; no call site elsewhere in the app should import
 * localStorageAdapter directly.
 */
export * from './localStorageAdapter'
