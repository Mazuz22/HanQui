import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { clearAll, getProgress, getReviewState, saveProgress, saveReviewState } from './localStorageAdapter'

// vitest's default (Node) environment has no localStorage global, so a tiny
// in-memory stand-in is installed here rather than pulling in jsdom for one
// module — same "no mocking library, plain reassignable global" approach
// go-teacher's tests already use for browser-only APIs.
class MemoryStorage {
  #store = new Map()
  getItem(key) {
    return this.#store.has(key) ? this.#store.get(key) : null
  }
  setItem(key, value) {
    this.#store.set(key, String(value))
  }
  removeItem(key) {
    this.#store.delete(key)
  }
}

beforeEach(() => {
  globalThis.localStorage = new MemoryStorage()
})

afterEach(() => {
  delete globalThis.localStorage
})

describe('progress round trip', () => {
  it('returns null when nothing has been saved yet', async () => {
    expect(await getProgress()).toBeNull()
  })

  it('returns exactly what was saved', async () => {
    const progress = { introduced: ['日', '一'], placementComplete: true, placementStartIndex: 12 }
    await saveProgress(progress)
    expect(await getProgress()).toEqual(progress)
  })
})

describe('review state round trip', () => {
  it('returns an empty object when nothing has been saved yet', async () => {
    expect(await getReviewState()).toEqual({})
  })

  it('returns exactly what was saved', async () => {
    const reviewState = { 日: { due: '2026-01-01T00:00:00.000Z', reps: 1 } }
    await saveReviewState(reviewState)
    expect(await getReviewState()).toEqual(reviewState)
  })
})

describe('clearAll', () => {
  it('removes both progress and review state', async () => {
    await saveProgress({ introduced: ['日'], placementComplete: true, placementStartIndex: 1 })
    await saveReviewState({ 日: { reps: 1 } })
    await clearAll()
    expect(await getProgress()).toBeNull()
    expect(await getReviewState()).toEqual({})
  })
})

describe('storage failures', () => {
  it('does not throw when localStorage is unavailable', async () => {
    globalThis.localStorage = {
      getItem() {
        throw new Error('unavailable')
      },
      setItem() {
        throw new Error('unavailable')
      },
      removeItem() {
        throw new Error('unavailable')
      },
    }
    await expect(saveProgress({ introduced: [] })).resolves.toBeUndefined()
    await expect(getProgress()).resolves.toBeNull()
    await expect(clearAll()).resolves.toBeUndefined()
  })
})
