import { useTranslation } from 'react-i18next'
export function PromptBanner({ nameKey }: { nameKey: string }) {
  const { t } = useTranslation()
  return <div data-testid="prompt-banner" className="prompt-banner">
    {t('play.findPrompt', { name: t(nameKey) })}
  </div>
}
