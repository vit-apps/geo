import type { ScoreState } from '../../engine/types'
export function ScoreHud({ score }: { score: ScoreState }) {
  return <div data-testid="score-hud" className="score-hud">
    <span>{score.correct}/{score.asked}</span>
    {score.lives !== undefined && <span> ❤ {score.lives}</span>}
  </div>
}
