'use client'

import dynamicImport from 'next/dynamic'

// Prevent prerendering of this page
export const dynamic = 'force-dynamic'

const SignInContent = dynamicImport(() => import('./SignInContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="flex items-center space-x-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <span className="text-muted-foreground">Loading...</span>
      </div>
    </div>
  )
})

export default function SignIn() {
  return <SignInContent />
}
