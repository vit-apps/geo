import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { MapRenderer } from './MapRenderer'
import type { GameMap } from '../engine/types'

const map: GameMap = {
  id: 't', nameKey: 'map.t', viewBox: [0, 0, 100, 100],
  regions: [
    { id: 'a', nameKey: 'region.a', centroid: [10, 10], bbox: [0, 0, 20, 20], svgPath: 'M0 0 L20 0 L20 20 Z' },
    { id: 'tiny', nameKey: 'region.tiny', centroid: [50, 50], bbox: [49, 49, 51, 51], svgPath: 'M49 49 L51 49 L51 51 Z' },
  ],
}

describe('MapRenderer', () => {
  it('renders one path per region keyed by id', () => {
    render(<MapRenderer map={map} />)
    expect(document.querySelector('[data-region-id="a"]')).toBeTruthy()
    expect(document.querySelector('[data-region-id="tiny"]')).toBeTruthy()
  })

  it('tapping a region (incl. a tiny one) emits its id via the hit area', () => {
    const onTap = vi.fn()
    render(<MapRenderer map={map} onRegionTap={onTap} />)
    const hit = document.querySelector('[data-hit-id="tiny"]')!
    fireEvent.click(hit)
    expect(onTap).toHaveBeenCalledWith('tiny')
  })

  it('applies the visual-state class from props', () => {
    render(<MapRenderer map={map} visuals={{ a: 'correct' }} />)
    const el = document.querySelector('[data-region-id="a"]')!
    expect(el.getAttribute('class')).toContain('correct')
  })
})
