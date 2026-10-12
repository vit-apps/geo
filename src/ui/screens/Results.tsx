import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { GameMap, ScoreState } from '../../engine/types'
import type { Level } from '../../data/levels'
import { loadBestMs, saveBestMs } from '../../engine/persistence'

export interface ResultsProps {
  map: GameMap
  level: Level
  score: ScoreState
  onHome: () => void
}
export function Results({ map, level, score, onHome }: ResultsProps) {
  const { t } = useTranslation()
  useEffect(() => {
    if (score.elapsedMs !== undefined) saveBestMs(map.id, level.id, score.elapsedMs)
  }, [map.id, level.id, score.elapsedMs])
  const best = loadBestMs(map.id, level.id)
  const accuracy = score.asked > 0 ? Math.round((score.correct / score.asked) * 100) : 0
  return (
    <div className="results-screen" data-testid="results-screen">
      <h2>{t('results.title')}</h2>
      <div>{t('results.accuracy')}: {accuracy}%</div>
      {best !== undefined && <div>{t('results.best')}: {Math.round(best / 1000)}s</div>}
      <button onClick={onHome}>{t('common.continue')}</button>
    </div>
  )
}
