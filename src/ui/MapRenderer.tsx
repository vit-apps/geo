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

  function handleSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!onRegionTap) return
    const target = e.target as Element
    // Walk up to find a data-hit-id or data-region-id attribute
    let el: Element | null = target
    while (el && el !== e.currentTarget) {
      const hitId = el.getAttribute('data-hit-id') ?? el.getAttribute('data-region-id')
      if (hitId) { onRegionTap(hitId); return }
      el = el.parentElement
    }
  }

  return (
    <svg
      viewBox={map.viewBox.join(' ')}
      className="map-renderer"
      aria-label={map.id}
      style={{ width: '100%', height: '100%', touchAction: 'manipulation' }}
      onClick={handleSvgClick}
    >
      {map.regions.map((r) => {
        const state = visuals?.[r.id] ?? 'idle'
        const dim = activeSet && !activeSet.has(r.id) ? ' dim' : ''
        return (
          <g key={r.id}>
            {/* visible shape */}
            <path d={r.svgPath} data-region-id={r.id} className={`region ${state}${dim}`} />
            {/* transparent wide-stroke hit area so tiny regions are tappable */}
            <path
              d={r.svgPath}
              data-hit-id={r.id}
              className="region-hit"
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
