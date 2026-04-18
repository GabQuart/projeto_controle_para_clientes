'use client'

import { useRouter } from 'next/navigation'
import { AppLocale, SUPPORTED_LOCALES } from '@/lib/i18n/messages'
import { useLocale, useTranslations } from '@/components/providers/LocaleProvider'

const LOCALE_LABELS: Record<AppLocale, string> = {
  'pt-BR': 'Português',
  en: 'English',
  es: 'Español',
  'zh-CN': '中文',
  ar: 'العربية',
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()
  const t = useTranslations()
  const router = useRouter()

  return (
    <label className="inline-flex w-full min-w-0 items-center justify-between gap-2 self-stretch rounded-full border border-white/10 bg-night/50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-steel sm:w-auto sm:min-w-[172px] sm:self-end sm:justify-end sm:text-xs sm:tracking-[0.18em]">
      <span className="shrink-0 truncate">{t('layout.language')}</span>
      <select
        value={locale}
        onChange={(event) => {
          setLocale(event.target.value as AppLocale)
          router.refresh()
        }}
        className="min-w-0 flex-1 bg-transparent text-right text-[11px] font-semibold text-ink outline-none sm:w-auto sm:min-w-[96px] sm:flex-none sm:text-xs"
      >
        {SUPPORTED_LOCALES.map((supportedLocale) => (
          <option key={supportedLocale} value={supportedLocale} className="bg-slate text-ink">
            {(() => {
              const translated = t(`layout.languageNames.${supportedLocale}`)
              return translated === `layout.languageNames.${supportedLocale}` ? LOCALE_LABELS[supportedLocale] : translated
            })()}
          </option>
        ))}
      </select>
    </label>
  )
}
