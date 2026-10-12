import './map.css'
import type { GameMap } from '../engine/types'

export type RegionVisual = 'idle' | 'highlighted' | 'correct' | 'wrong' | 'revealed'
export interface MapRendererProps {
  map: GameMap
  visuals?: Record<string, RegionVisual>
  onRegionTap?: (regionId: string) => void
  activeIds?: string[]
}

export function MapRenderer({ map, visuals, onRegionTap, activeIds }: MapRendererProps) {
  const activeSet = activeIds ? new Set(activeIds) : null
  return (
    <svg
      viewBox={map.viewBox.join(' ')}
      className="map-renderer"
      role="img"
      style={{ width: '100%', height: '100%', touchAction: 'manipulation' }}
    >
      {map.regions.map((r) => {
        const state = visuals?.[r.id] ?? 'idle'
        const dim = activeSet && !activeSet.has(r.id) ? ' dim' : ''
        const tap = () => onRegionTap?.(r.id)
        return (
          <g key={r.id}>
            {/* visible shape */}
            <path d={r.svgPath} data-region-id={r.id} className={`region ${state}${dim}`} />
            {/* transparent wide-stroke hit area so tiny regions are tappable */}
            <path
              d={r.svgPath}
              data-hit-id={r.id}
              className="region-hit"
              onClick={tap}
              fill="transparent"
              stroke="transparent"
              strokeWidth={8}
              pointerEvents="all"
            />
          </g>
        )
      })}
    </svg>
  )
}
