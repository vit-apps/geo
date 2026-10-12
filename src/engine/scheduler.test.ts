import { describe, it, expect } from 'vitest'
import { initMastery, pickNextRegion, updateMastery, type MasteryStore } from './scheduler'

describe('scheduler', () => {
  it('first-run: empty store picks a never-seen region, no crash', () => {
    const store: MasteryStore = {}
    const id = pickNextRegion(['a', 'b', 'c'], store, 1000)
    expect(['a', 'b', 'c']).toContain(id)
  })

  it('promotes on correct and demotes to box 1 on wrong', () => {
    let m = initMastery()
    m = updateMastery(m, true, 10)
    expect(m.box).toBe(2)
    expect(m.correct).toBe(1)
    m = updateMastery(m, false, 20)
    expect(m.box).toBe(1)
    expect(m.seen).toBe(2)
  })

  it('caps box at 5', () => {
    let m = initMastery()
    for (let i = 0; i < 10; i++) m = updateMastery(m, true, i)
    expect(m.box).toBe(5)
  })

  it('prefers a lower-box region over a higher-box one', () => {
    const store: MasteryStore = {
      a: { box: 5, seen: 5, correct: 5, lastSeenMs: 100 },
      b: { box: 1, seen: 1, correct: 0, lastSeenMs: 100 },
    }
    expect(pickNextRegion(['a', 'b'], store, 200)).toBe('b')
  })

  it('among equal boxes prefers the older lastSeen', () => {
    const store: MasteryStore = {
      a: { box: 2, seen: 2, correct: 2, lastSeenMs: 500 },
      b: { box: 2, seen: 2, correct: 2, lastSeenMs: 100 },
    }
    expect(pickNextRegion(['a', 'b'], store, 1000)).toBe('b')
  })
})
