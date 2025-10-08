'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { locales, localeNames, localeFlags, type Locale } from '../../i18n/config'

interface LanguageSelectorProps {
  className?: string
  variant?: 'dropdown' | 'buttons' | 'compact'
  showFlags?: boolean
  showNames?: boolean
}

export default function LanguageSelector({
  className = '',
  variant = 'dropdown',
  showFlags = true,
  showNames = true
}: LanguageSelectorProps) {
  const t = useTranslations('navigation')
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const handleLanguageChange = (newLocale: Locale) => {
    // Check if we're in a locale-based route
    const isLocaleRoute = pathname.startsWith('/en/') || pathname.startsWith('/fr/') || pathname.startsWith('/ar/')
    
    if (isLocaleRoute) {
      // Remove current locale from pathname
      const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'
      // Add new locale to pathname
      const newPath = `/${newLocale}${pathWithoutLocale}`
      router.push(newPath)
    } else {
      // For non-locale routes, just redirect to the locale-based version
      const newPath = `/${newLocale}${pathname}`
      router.push(newPath)
    }
    
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
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-1 px-2 py-1 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          {showFlags && <span className="text-lg">{localeFlags[locale]}</span>}
          {showNames && <span className="hidden sm:inline">{localeNames[locale]}</span>}
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
              <div className="py-1">
                {locales.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => handleLanguageChange(loc)}
                    className={`flex items-center space-x-3 w-full px-4 py-2 text-sm transition-colors ${
                      locale === loc
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {showFlags && <span className="text-lg">{localeFlags[loc]}</span>}
                    {showNames && <span>{localeNames[loc]}</span>}
                    {locale === loc && (
                      <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // Default dropdown variant
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {showFlags && <span className="text-lg">{localeFlags[locale]}</span>}
        {showNames && <span>{localeNames[locale]}</span>}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('language')}
              </div>
              {locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleLanguageChange(loc)}
                  className={`flex items-center space-x-3 w-full px-4 py-2 text-sm transition-colors ${
                    locale === loc
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {showFlags && <span className="text-lg">{localeFlags[loc]}</span>}
                  {showNames && <span>{localeNames[loc]}</span>}
                  {locale === loc && (
                    <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
