'use client'

import { NextIntlClientProvider } from 'next-intl'
import { ReactNode } from 'react'
import { useLocale } from 'next-intl'

interface IntlProviderProps {
  children: ReactNode
  messages: any
}

export default function IntlProvider({ children, messages }: IntlProviderProps) {
  const locale = useLocale()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}

