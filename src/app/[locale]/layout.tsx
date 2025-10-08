import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales } from '../../i18n/config'
import SessionProviderWrapper from '../../components/providers/SessionProviderWrapper'
import '../globals.css'

interface RootLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function RootLayout({
  children,
  params
}: RootLayoutProps) {
  const { locale } = await params
  
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound()

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages()

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>
        <SessionProviderWrapper>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  )
}

