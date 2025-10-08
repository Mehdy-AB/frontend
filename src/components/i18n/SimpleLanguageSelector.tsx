'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Check } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

interface SimpleLanguageSelectorProps {
  className?: string
  variant?: 'dropdown' | 'buttons' | 'compact'
  showFlags?: boolean
  showNames?: boolean
}

const locales = ['en', 'fr', 'ar'] as const
type Locale = (typeof locales)[number]

const localeNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  ar: 'العربية'
}

const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  fr: '🇫🇷',
  ar: '🇸🇦'
}

export default function SimpleLanguageSelector({
  className = '',
  variant = 'dropdown',
  showFlags = true,
  showNames = true
}: SimpleLanguageSelectorProps) {
  const { locale, setLocale, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const handleLanguageChange = (newLocale: Locale) => {
    setLocale(newLocale)
    setIsOpen(false)
  }

  if (variant === 'buttons') {
    return (
      <div className={`flex space-x-2 ${className}`}>
        {locales.map((loc) => (
          <button
            key={loc}
            onClick={() => handleLanguageChange(loc)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              locale === loc
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {showFlags && <span className="text-lg">{localeFlags[loc]}</span>}
            {showNames && <span>{localeNames[loc]}</span>}
          </button>
        ))}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1">
            {showFlags && <span className="text-lg">{localeFlags[locale]}</span>}
            {showNames && <span className="hidden sm:inline text-sm">{localeNames[locale]}</span>}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel className="text-xs">Language</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {locales.map((loc) => (
            <DropdownMenuItem
              key={loc}
              onClick={() => handleLanguageChange(loc)}
              className="flex items-center gap-2"
            >
              {showFlags && <span className="text-lg">{localeFlags[loc]}</span>}
              {showNames && <span className="flex-1">{localeNames[loc]}</span>}
              {locale === loc && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Default dropdown variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          {showFlags && <span className="text-lg">{localeFlags[locale]}</span>}
          {showNames && <span>{localeNames[locale]}</span>}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>{t('navigation.language')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLanguageChange(loc)}
            className="flex items-center gap-3"
          >
            {showFlags && <span className="text-lg">{localeFlags[loc]}</span>}
            {showNames && <span className="flex-1">{localeNames[loc]}</span>}
            {locale === loc && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
