import { useTranslation } from 'react-i18next'
export interface HomeProps {
  onChooseMap: () => void
  onStats: () => void
  onToggleLocale: () => void
  locale: string
}
export function Home({ onChooseMap, onStats, onToggleLocale, locale }: HomeProps) {
  const { t } = useTranslation()
  return (
    <div className="home-screen">
      <h1>{t('app.title')}</h1>
      <button data-testid="nav-map" onClick={onChooseMap}>{t('common.start')}</button>
      <button data-testid="nav-stats" onClick={onStats}>{t('stats.title')}</button>
      <button data-testid="toggle-locale" onClick={onToggleLocale}>
        {t('settings.language')}: {locale}
      </button>
    </div>
  )
}
