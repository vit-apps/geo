import { useTranslation } from 'react-i18next'
import { MAP_IDS, type MapId } from '../../data/mapIndex'
export interface MapPickerProps {
  onPick: (id: MapId) => void
  onBack: () => void
}
export function MapPicker({ onPick, onBack }: MapPickerProps) {
  const { t } = useTranslation()
  return (
    <div className="map-picker" data-testid="map-picker">
      <button onClick={onBack}>{t('common.back')}</button>
      <div className="map-grid">
        {MAP_IDS.map((id) => (
          <button key={id} data-testid={`map-${id}`} onClick={() => onPick(id)}>
            {t(`map.${id}`)}
          </button>
        ))}
      </div>
    </div>
  )
}
