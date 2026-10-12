import { describe, it, expect } from 'vitest'
import { makeScorer } from './scoring'

describe('scoring strategies', () => {
  it('no-fail never finishes on wrong answers', () => {
    const s = makeScorer('no-fail', {})
    for (let i = 0; i < 20; i++) s.onAnswer(false)
    expect(s.isFinished()).toBe(false)
    expect(s.state().asked).toBe(20)
  })

  it('lives finishes at zero and floors there', () => {
    const s = makeScorer('lives', { livesStart: 3 })
    s.onAnswer(false); s.onAnswer(false)
    expect(s.isFinished()).toBe(false)
    expect(s.state().lives).toBe(1)
    s.onAnswer(false)
    expect(s.state().lives).toBe(0)
    expect(s.isFinished()).toBe(true)
    s.onAnswer(false) // extra wrong does not go negative
    expect(s.state().lives).toBe(0)
  })

  it('timer scorer does not finish from mistakes', () => {
    const s = makeScorer('timer', {})
    for (let i = 0; i < 5; i++) s.onAnswer(false)
    expect(s.isFinished()).toBe(false)
  })
})
