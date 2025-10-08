import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get messages for the default locale
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
