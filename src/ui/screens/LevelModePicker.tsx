import { useTranslation } from 'react-i18next'
import type { ScoringKind } from '../../engine/types'
import type { Level } from '../../data/levels'

const SCORING: ScoringKind[] = ['no-fail', 'lives', 'timer']
export interface LevelModePickerProps {
  levels: Level[]
  onStart: (level: Level, scoring: ScoringKind) => void
  onBack: () => void
}
export function LevelModePicker({ levels, onStart, onBack }: LevelModePickerProps) {
  const { t } = useTranslation()
  return (
    <div className="level-mode-picker" data-testid="level-mode-picker">
      <button onClick={onBack}>{t('common.back')}</button>
      {levels.map((lv) => (
        <div key={lv.id} className="level-row">
          <span>{t(lv.nameKey)}</span>
          {SCORING.map((sc) => (
            <button key={sc} onClick={() => onStart(lv, sc)}>{t(`mode.${sc}`)}</button>
          ))}
        </div>
      ))}
    </div>
  )
}
