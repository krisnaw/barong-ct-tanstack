import * as React from 'react'
import { en } from '~/lib/i18n/messages/en'
import { id } from '~/lib/i18n/messages/id'
import type { Locale, Messages } from '~/lib/i18n/types'

const STORAGE_KEY = 'barong-locale'

const catalogs: Record<Locale, Messages> = { en, id }

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Messages
}

const LocaleContext = React.createContext<LocaleContextValue | null>(null)

function isLocale(value: string | null): value is Locale {
  return value === 'en' || value === 'id'
}

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return isLocale(stored) ? stored : 'en'
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>('en')

  React.useEffect(() => {
    const stored = readStoredLocale()
    setLocaleState(stored)
    document.documentElement.lang = stored
  }, [])

  function setLocale(next: Locale) {
    setLocaleState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
    document.documentElement.lang = next
  }

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        t: catalogs[locale],
      }}
    >
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = React.useContext(LocaleContext)
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider')
  }
  return ctx
}

export function useTranslations() {
  return useLocale().t
}

export type { Locale, Messages }
