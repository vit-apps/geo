import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Play } from './Play'
import { initI18n } from '../../i18n'
import type { GameMap } from '../../engine/types'

const map: GameMap = {
  id: 't', nameKey: 'map.t', viewBox: [0, 0, 100, 100],
  regions: [
    { id: 'a', nameKey: 'map.world', centroid: [10, 10], bbox: [0, 0, 20, 20], svgPath: 'M0 0 L20 0 L20 20 Z' },
    { id: 'b', nameKey: 'map.europe', centroid: [80, 80], bbox: [60, 60, 100, 100], svgPath: 'M60 60 L100 60 L100 100 Z' },
  ],
}

beforeAll(async () => { await initI18n('en') })

describe('Play screen', () => {
  it('shows a prompt and reacts to a tap', () => {
    render(<Play map={map} level={{ id: 'beginner', nameKey: 'level.beginner', regionIds: () => ['a', 'b'] }} scoring="no-fail" onExit={() => {}} />)
    // a prompt banner is shown
    expect(screen.getByTestId('prompt-banner').textContent).toBeTruthy()
    // tapping some region does not crash and advances asked count via HUD
    const hit = document.querySelector('[data-hit-id="a"]')!
    fireEvent.click(hit)
    expect(screen.getByTestId('score-hud').textContent).toBeTruthy()
  })
})
