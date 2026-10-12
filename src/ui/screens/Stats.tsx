import { useTranslation } from 'react-i18next'
import type { MapId } from '../../data/mapIndex'
import { loadMastery } from '../../engine/persistence'

export interface StatsProps { mapId: MapId; onBack: () => void }
export function Stats({ mapId, onBack }: StatsProps) {
  const { t } = useTranslation()
  const store = loadMastery(mapId)
  const entries = Object.entries(store)
  return (
    <div className="stats-screen" data-testid="stats-screen">
      <button onClick={onBack}>{t('common.back')}</button>
      <h2>{t('stats.title')}</h2>
      <div className="mastery-grid">
        {entries.length === 0 && <span>{/* empty first-run: nothing yet */}</span>}
        {entries.map(([id, m]) => (
          <span key={id} className={`mastery-cell box-${m.box}`} title={`${id}: box ${m.box}`} />
        ))}
      </div>
    </div>
  )
}
