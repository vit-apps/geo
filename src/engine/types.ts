export interface Region {
  id: string            // ISO numeric or FIPS, as string
  nameKey: string       // i18n key, e.g. "region.528"
  centroid: [number, number]   // [x, y] in the map's svg coordinate space
  bbox: [number, number, number, number] // [minX,minY,maxX,maxY] svg space
  svgPath: string       // SVG path 'd' attribute
  capital?: string      // optional i18n key for capital name
}

export interface GameMap {
  id: string            // e.g. "world", "europe", "middle-east", "north-america"
  nameKey: string       // e.g. "map.world"
  viewBox: [number, number, number, number] // svg viewBox
  regions: Region[]
}

export type ScoringKind = 'no-fail' | 'lives' | 'timer'

export interface SessionConfig {
  map: GameMap
  regionIds: string[]   // the active level's region set (subset of map.regions ids)
  scoring: ScoringKind
  livesStart?: number   // required when scoring === 'lives'
}

export interface Prompt {
  regionId: string      // the region the player must act on
  nameKey: string       // convenience: that region's nameKey
}

export interface AnswerResult {
  correct: boolean
  expectedRegionId: string
  tappedRegionId: string
}

export interface ScoreState {
  asked: number
  correct: number
  lives?: number
  elapsedMs?: number
  bestMs?: number
}
