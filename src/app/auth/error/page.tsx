'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { AlertTriangle, ArrowLeft, Home, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import LanguageSelector from '../../../components/i18n/LanguageSelector'
import { Suspense } from 'react'

// Prevent prerendering of this page
export const dynamic = 'force-dynamic'

const errorMessages: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'Access denied. You do not have permission to sign in.',
  Verification: 'The verification token has expired or has already been used.',
  Default: 'An error occurred during authentication.',
}

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  
  // Safe translation hook with fallback
  let t: (key: string) => string
  try {
    t = useTranslations('auth')
  } catch (error) {
    // Fallback translations if context is not available
    t = (key: string) => {
      const fallbacks: Record<string, string> = {
        'authError': 'Authentication Error',
        'tryAgain': 'Try Again',
        'goToHome': 'Go to Home',
        'contactAdmin': 'Contact your system administrator'
      }
      return fallbacks[key] || key
    }
  }

  const errorMessage = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      {/* Language Selector */}
      <div className="absolute top-6 right-6">
        <LanguageSelector variant="compact" />
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-2 text-center pb-8">
            <div className="mx-auto h-16 w-16 bg-destructive/10 rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold text-destructive">Authentication Error</CardTitle>
            <CardDescription className="text-base">
              {errorMessage}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error Code:</strong> {error || 'Unknown error'}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button asChild className="w-full" size="lg">
                <Link href="/auth/signin" className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>Try Again</span>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full" size="lg">
                <Link href="/" className="flex items-center space-x-2">
                  <Home className="h-4 w-4" />
                  <span>Go to Home</span>
                </Link>
              </Button>
            </div>

            {/* Help Section */}
            <div className="mt-8 p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-foreground">Need Help?</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    If this error persists, please contact your system administrator or IT support team.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Error occurred during authentication process
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-6 w-6 animate-pulse text-destructive" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
