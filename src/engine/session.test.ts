import { describe, it, expect } from 'vitest'
import { createSession } from './session'
import { makeLocatePrompt } from './modes/locateMode'
import type { GameMap, SessionConfig } from './types'

function fakeMap(ids: string[]): GameMap {
  return {
    id: 'test', nameKey: 'map.test', viewBox: [0, 0, 10, 10],
    regions: ids.map((id) => ({
      id, nameKey: `region.${id}`, centroid: [1, 1],
      bbox: [0, 0, 2, 2], svgPath: 'M0 0 L1 1 Z',
    })),
  }
}

describe('session with LocateMode', () => {
  it('never prompts a region outside the active set', () => {
    const map = fakeMap(['a', 'b', 'c', 'd', 'e', 'f'])
    const cfg: SessionConfig = { map, regionIds: ['a', 'b'], scoring: 'no-fail' }
    let now = 0
    const s = createSession(cfg, () => (now += 1000))
    for (let i = 0; i < 10 && !s.isComplete(); i++) {
      const p = s.nextPrompt()
      if (!p) break
      expect(['a', 'b']).toContain(p.regionId)
      s.submitAnswer(p.regionId) // always correct
    }
    expect(s.score().asked).toBeGreaterThan(0)
  })

  it('a correct answer matches the prompt region; wrong one does not', () => {
    const map = fakeMap(['a', 'b'])
    const s = createSession({ map, regionIds: ['a', 'b'], scoring: 'no-fail' }, () => Date.now())
    const p = s.nextPrompt()!
    const other = p.regionId === 'a' ? 'b' : 'a'
    const r = s.submitAnswer(other)
    expect(r.correct).toBe(false)
    expect(r.expectedRegionId).toBe(p.regionId)
  })

  it('mastering the whole small set completes the session', () => {
    const map = fakeMap(['a', 'b'])
    let now = 0
    const s = createSession({ map, regionIds: ['a', 'b'], scoring: 'no-fail' }, () => (now += 1000))
    let guard = 0
    while (!s.isComplete() && guard++ < 100) {
      const p = s.nextPrompt()
      if (!p) break
      s.submitAnswer(p.regionId) // all correct -> boxes climb
    }
    expect(s.isComplete()).toBe(true)
    // mastery() exposes the per-region store for persistence
    const m = s.mastery()
    expect(m['a'].box).toBeGreaterThanOrEqual(3)
    expect(m['b'].box).toBeGreaterThanOrEqual(3)
  })
})

describe('robustness fixes', () => {
  it('submitAnswer before nextPrompt throws a clear error', () => {
    const map = fakeMap(['a', 'b'])
    const s = createSession({ map, regionIds: ['a', 'b'], scoring: 'no-fail' }, () => Date.now())
    expect(() => s.submitAnswer('a')).toThrow('submitAnswer called before nextPrompt')
  })

  it('makeLocatePrompt throws a clear error for unknown regionId', () => {
    const map = fakeMap(['a', 'b'])
    expect(() => makeLocatePrompt(map, 'z')).toThrow('regionId "z" not found in map')
  })

  it('mutating mastery() return value does not corrupt the live store', () => {
    const map = fakeMap(['a', 'b'])
    let now = 0
    const s = createSession({ map, regionIds: ['a', 'b'], scoring: 'no-fail' }, () => (now += 1000))
    s.nextPrompt()
    s.submitAnswer('a') // one answer so box has a value
    const m1 = s.mastery()
    m1['a'].box = 999  // mutate the returned copy
    const m2 = s.mastery()
    expect(m2['a'].box).not.toBe(999) // live store must be unaffected
  })
})
