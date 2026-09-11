import { useState } from 'react'
import { CaretDownIcon } from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { cn } from '~/lib/utils'

const languages = [
  { value: 'en', label: 'English', short: 'EN' },
  { value: 'id', label: 'Indonesia', short: 'ID' },
] as const

type Language = (typeof languages)[number]['value']

export function LanguageToggle() {
  const [language, setLanguage] = useState<Language>('en')
  const current =
    languages.find((item) => item.value === language) ?? languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Language, ${current.label}`}
        className={cn(
          'inline-flex cursor-pointer items-center gap-1 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:text-foreground',
        )}
      >
        <span className="font-medium tracking-wide">{current.short}</span>
        <CaretDownIcon aria-hidden className="size-3.5" weight="bold" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36" sideOffset={8}>
        <DropdownMenuRadioGroup
          onValueChange={(value) => setLanguage(value as Language)}
          value={language}
        >
          {languages.map((item) => (
            <DropdownMenuRadioItem key={item.value} value={item.value}>
              {item.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
