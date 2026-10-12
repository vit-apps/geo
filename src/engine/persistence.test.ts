import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadMastery, saveMastery, loadBestMs, saveBestMs,
  loadSettings, saveSettings, __setStorage,
} from './persistence'

class FakeStorage {
  m = new Map<string, string>()
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null }
  setItem(k: string, v: string) { this.m.set(k, v) }
  removeItem(k: string) { this.m.delete(k) }
}

beforeEach(() => __setStorage(new FakeStorage() as unknown as Storage))

describe('persistence', () => {
  it('first-run mastery load returns empty object, no throw', () => {
    expect(loadMastery('world')).toEqual({})
  })

  it('round-trips mastery', () => {
    saveMastery('world', { '528': { box: 2, seen: 3, correct: 2, lastSeenMs: 9 } })
    expect(loadMastery('world')['528'].box).toBe(2)
  })

  it('corrupt JSON falls back to empty, no throw', () => {
    const bad = new FakeStorage()
    bad.setItem('geo:mastery:world', '{not json')
    __setStorage(bad as unknown as Storage)
    expect(loadMastery('world')).toEqual({})
  })

  it('best time is undefined first, then stored', () => {
    expect(loadBestMs('world', 'beginner')).toBeUndefined()
    saveBestMs('world', 'beginner', 12345)
    expect(loadBestMs('world', 'beginner')).toBe(12345)
  })

  it('settings default then persist', () => {
    expect(loadSettings().locale).toBeDefined()
    saveSettings({ locale: 'he', lastMapId: 'europe' })
    expect(loadSettings().locale).toBe('he')
  })
})
