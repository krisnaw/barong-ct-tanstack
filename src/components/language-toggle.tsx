import { CaretDownIcon } from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { useLocale, type Locale } from '~/lib/i18n'
import { cn } from '~/lib/utils'

const languages = [
  { value: 'en' as const, short: 'EN' },
  { value: 'id' as const, short: 'ID' },
]

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale()
  const current =
    languages.find((item) => item.value === locale) ?? languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${t.lang.label}, ${
          locale === 'en' ? t.lang.english : t.lang.indonesia
        }`}
        className={cn(
          'inline-flex cursor-pointer items-center gap-1 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:text-foreground',
        )}
      >
        <span className="font-medium tracking-wide">{current.short}</span>
        <CaretDownIcon aria-hidden className="size-3.5" weight="bold" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36" sideOffset={8}>
        <DropdownMenuRadioGroup
          onValueChange={(value) => setLocale(value as Locale)}
          value={locale}
        >
          <DropdownMenuRadioItem value="en">
            {t.lang.english}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="id">
            {t.lang.indonesia}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
