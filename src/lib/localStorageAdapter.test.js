import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  clearAll,
  getLastTrack,
  getProgress,
  getReviewState,
  saveLastTrack,
  saveProgress,
  saveReviewState,
} from './localStorageAdapter'

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
    expect(await getProgress('kanji')).toBeNull()
  })

  it('returns exactly what was saved', async () => {
    const progress = { introduced: ['日', '一'], placementComplete: true, placementStartIndex: 12 }
    await saveProgress('kanji', progress)
    expect(await getProgress('kanji')).toEqual(progress)
  })
})

describe('review state round trip', () => {
  it('returns an empty object when nothing has been saved yet', async () => {
    expect(await getReviewState('kanji')).toEqual({})
  })

  it('returns exactly what was saved', async () => {
    const reviewState = { 日: { due: '2026-01-01T00:00:00.000Z', reps: 1 } }
    await saveReviewState('kanji', reviewState)
    expect(await getReviewState('kanji')).toEqual(reviewState)
  })
})

describe('per-track isolation', () => {
  it('keeps kanji and hanzi progress independent', async () => {
    await saveProgress('kanji', { introduced: ['日'], placementComplete: true, placementStartIndex: 1 })
    await saveProgress('hanzi', { introduced: ['你'], placementComplete: true, placementStartIndex: 2 })
    expect((await getProgress('kanji')).introduced).toEqual(['日'])
    expect((await getProgress('hanzi')).introduced).toEqual(['你'])
  })
})

describe('clearAll', () => {
  it('removes both progress and review state for the given track', async () => {
    await saveProgress('kanji', { introduced: ['日'], placementComplete: true, placementStartIndex: 1 })
    await saveReviewState('kanji', { 日: { reps: 1 } })
    await clearAll('kanji')
    expect(await getProgress('kanji')).toBeNull()
    expect(await getReviewState('kanji')).toEqual({})
  })
})

describe('last-track preference', () => {
  it('returns null when nothing has been saved yet', async () => {
    expect(await getLastTrack()).toBeNull()
  })

  it('returns exactly what was saved', async () => {
    await saveLastTrack('hanzi')
    expect(await getLastTrack()).toBe('hanzi')
  })

  it('is global, not per-track', async () => {
    await saveProgress('kanji', { introduced: ['日'], placementComplete: true, placementStartIndex: 1 })
    await saveLastTrack('kanji')
    expect(await getLastTrack()).toBe('kanji')
    await saveLastTrack('hanzi')
    expect(await getLastTrack()).toBe('hanzi')
    expect((await getProgress('kanji')).introduced).toEqual(['日']) // untouched
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
    await expect(saveProgress('kanji', { introduced: [] })).resolves.toBeUndefined()
    await expect(getProgress('kanji')).resolves.toBeNull()
    await expect(clearAll('kanji')).resolves.toBeUndefined()
  })
})
