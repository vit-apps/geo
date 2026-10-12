import { describe, it, expect, beforeAll } from 'vitest'
import { initI18n, t, dirFor } from './index'

beforeAll(async () => { await initI18n('en') })

describe('i18n', () => {
  it('resolves a known key', () => {
    expect(t('map.world')).toBe('World')
  })
  it('missing key falls back to the key string, never blank/throw', () => {
    expect(t('totally.missing.key')).toBe('totally.missing.key')
  })
  it('direction is rtl for he and ltr for en', () => {
    expect(dirFor('he')).toBe('rtl')
    expect(dirFor('en')).toBe('ltr')
  })
})
