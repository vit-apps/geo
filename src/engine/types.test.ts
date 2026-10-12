import { describe, it, expect } from 'vitest'
import type { Region, GameMap } from './types'

describe('engine types', () => {
  it('a GameMap holds regions with ids and paths', () => {
    const r: Region = {
      id: '528', nameKey: 'region.528',
      centroid: [10, 20], bbox: [0, 0, 20, 40], svgPath: 'M0 0 L1 1 Z'
    }
    const m: GameMap = {
      id: 'world', nameKey: 'map.world',
      viewBox: [0, 0, 100, 100], regions: [r]
    }
    expect(m.regions[0].id).toBe('528')
    expect(m.regions[0].svgPath.length).toBeGreaterThan(0)
  })
})
