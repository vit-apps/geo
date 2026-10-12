import type { GameMap } from '../engine/types'
import type { MapId } from './mapIndex'

export interface Level {
  id: string
  nameKey: string
  regionIds: (map: GameMap) => string[]
}

// Beginner: the N largest regions by bbox area. Expert: all regions.
function largestN(map: GameMap, n: number): string[] {
  return [...map.regions]
    .map((r) => ({ id: r.id, area: (r.bbox[2] - r.bbox[0]) * (r.bbox[3] - r.bbox[1]) }))
    .sort((a, b) => b.area - a.area)
    .slice(0, n)
    .map((x) => x.id)
}

const COMMON: Level[] = [
  { id: 'beginner', nameKey: 'level.beginner', regionIds: (m) => largestN(m, 6) },
  { id: 'intermediate', nameKey: 'level.intermediate', regionIds: (m) => largestN(m, Math.min(20, m.regions.length)) },
  { id: 'expert', nameKey: 'level.expert', regionIds: (m) => m.regions.map((r) => r.id) },
]

export function levelsFor(_id: MapId): Level[] {
  return COMMON
}
