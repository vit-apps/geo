import type { ScoringKind } from './types'

export interface Scorer {
  onAnswer(correct: boolean): void
  isFinished(): boolean
  state(): { lives?: number; asked: number; correct: number }
}

export function makeScorer(kind: ScoringKind, opts: { livesStart?: number }): Scorer {
  let asked = 0, correct = 0
  let lives = kind === 'lives' ? (opts.livesStart ?? 3) : undefined
  return {
    onAnswer(ok: boolean) {
      asked++
      if (ok) correct++
      else if (lives !== undefined) lives = Math.max(0, lives - 1)
    },
    isFinished() {
      return lives !== undefined && lives <= 0
    },
    state() {
      return { lives, asked, correct }
    },
  }
}
