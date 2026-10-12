import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'
import { initI18n } from './i18n'

beforeAll(async () => { await initI18n('en') })

describe('App', () => {
  it('renders home and can navigate to the map picker', async () => {
    render(<App />)
    expect(screen.getByText(/GeoMap/i)).toBeTruthy()
    // a "choose map" control exists
    const btn = screen.getByTestId('nav-map')
    fireEvent.click(btn)
    expect(await screen.findByTestId('map-picker')).toBeTruthy()
  })
})
