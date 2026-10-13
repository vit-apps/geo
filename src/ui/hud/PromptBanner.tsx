import { useTranslation } from 'react-i18next'
export function PromptBanner({ nameKey, regionId }: { nameKey: string; regionId?: string }) {
  const { t } = useTranslation()
  return <div data-testid="prompt-banner" className="prompt-banner" data-region-id={regionId}>
    {t('play.findPrompt', { name: t(nameKey) })}
  </div>
}
