import type { GameMap } from '../engine/types'
export const MAP_IDS = ['world', 'europe', 'middle-east', 'north-america'] as const
export type MapId = typeof MAP_IDS[number]

export async function loadMap(id: MapId): Promise<GameMap> {
  const mod = await import(`./maps/${id}.json`)
  return (mod.default ?? mod) as GameMap
}
