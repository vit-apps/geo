import { describe, it, expect } from 'vitest'
import { MAP_IDS, loadMap } from './mapIndex'

describe('generated maps', () => {
  it.each(MAP_IDS)('%s has valid regions', async (id) => {
    const map = await loadMap(id)
    expect(map.regions.length).toBeGreaterThan(0)
    const ids = new Set<string>()
    for (const r of map.regions) {
      expect(r.svgPath.length).toBeGreaterThan(0)   // non-empty path
      expect(ids.has(r.id)).toBe(false)             // no duplicate ids
      ids.add(r.id)
      // centroid within bbox (tolerant)
      expect(r.centroid[0]).toBeGreaterThanOrEqual(r.bbox[0] - 1)
      expect(r.centroid[0]).toBeLessThanOrEqual(r.bbox[2] + 1)
    }
  })
})
