import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import he from './he.json'

export const SUPPORTED = ['en', 'he'] as const
export function dirFor(locale: string): 'ltr' | 'rtl' {
  return locale === 'he' ? 'rtl' : 'ltr'
}

export async function initI18n(locale: string): Promise<void> {
  await i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, he: { translation: he } },
    lng: locale,
    fallbackLng: 'en',
    returnNull: false,
    parseMissingKeyHandler: (key) => key, // show the key, never blank
    interpolation: { escapeValue: false },
  })
}
export function t(key: string, opts?: Record<string, unknown>): string {
  return i18n.t(key, opts)
}
