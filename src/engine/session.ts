import type { Prompt, AnswerResult, ScoreState, SessionConfig } from './types'
import { makeScorer, type Scorer } from './scoring'
import { makeLocatePrompt, judge } from './modes/locateMode'
import {
  initMastery, pickNextRegion, updateMastery, type MasteryStore,
} from './scheduler'

export interface Session {
  nextPrompt(): Prompt | null
  submitAnswer(tappedRegionId: string): AnswerResult
  score(): ScoreState
  isComplete(): boolean
  mastery(): MasteryStore
}

const MASTERED_BOX = 3

export function createSession(cfg: SessionConfig, nowFn: () => number = Date.now): Session {
  const store: MasteryStore = {}
  for (const id of cfg.regionIds) store[id] = initMastery()
  const scorer: Scorer = makeScorer(cfg.scoring, { livesStart: cfg.livesStart })
  const startedAt = nowFn()
  let current: Prompt | null = null

  function allMastered(): boolean {
    return cfg.regionIds.every((id) => store[id].box >= MASTERED_BOX)
  }

  function isComplete(): boolean {
    return scorer.isFinished() || allMastered()
  }

  return {
    nextPrompt() {
      if (isComplete()) return null
      const id = pickNextRegion(cfg.regionIds, store, nowFn())
      current = makeLocatePrompt(cfg.map, id)
      return current
    },
    submitAnswer(tappedRegionId: string): AnswerResult {
      if (current === null) throw new Error('submitAnswer called before nextPrompt')
      const expected = current.regionId
      const result = judge(expected, tappedRegionId)
      store[expected] = updateMastery(store[expected], result.correct, nowFn())
      scorer.onAnswer(result.correct)
      return result
    },
    score(): ScoreState {
      const st = scorer.state()
      return {
        asked: st.asked, correct: st.correct, lives: st.lives,
        elapsedMs: nowFn() - startedAt,
      }
    },
    isComplete,
    mastery() {
      return Object.fromEntries(Object.entries(store).map(([k, v]) => [k, { ...v }]))
    },
  }
}
