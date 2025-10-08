'use client'

import { signIn, getSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Shield, Lock, FileText, Users, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import LanguageSelector from '../../../components/i18n/LanguageSelector'

export default function SignInContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const router = useRouter()
  
  // Safe translation hook with fallback
  let t: (key: string) => string
  try {
    t = useTranslations('auth')
  } catch (error) {
    // Fallback translations if context is not available
    t = (key: string) => {
      const fallbacks: Record<string, string> = {
        'signInFailed': 'Sign in failed. Please try again.',
        'unexpectedError': 'An unexpected error occurred.',
        'signingIn': 'Signing in...',
        'signInWithKeycloak': 'Sign in with Keycloak'
      }
      return fallbacks[key] || key
    }
  }

  useEffect(() => {
    // Check if user is already signed in
    const checkSession = async () => {
      try {
        const session = await getSession()
        if (session) {
          router.push('/')
        }
      } catch (err) {
        console.error('Error checking session:', err)
      } finally {
        setIsCheckingSession(false)
      }
    }
    checkSession()
  }, [router])

  const handleSignIn = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const result = await signIn('keycloak', { 
        callbackUrl: '/',
        redirect: false 
      })
      
      if (result?.error) {
        setError(t('signInFailed'))
      } else if (result?.ok) {
        router.push('/')
      }
    } catch (err) {
      setError(t('unexpectedError'))
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      {/* Language Selector */}
      <div className="absolute top-6 right-6">
        <LanguageSelector variant="compact" />
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:block space-y-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className=" flex items-center justify-center">
                <img 
                  src="/logo.svg" 
                  alt="Logo" 
                  className="h-40 w-40"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">DATAVEX</h1>
                <p className="text-muted-foreground"> Fast. Secure. Reliable DMS.</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-foreground leading-tight">
              Secure Document Management
              <span className="text-primary"> Made Simple</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Access your documents, collaborate with your team, and manage your files with enterprise-grade security through Keycloak authentication.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-white/50 rounded-lg border border-white/20">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Enterprise Security</h3>
                <p className="text-sm text-muted-foreground">Protected by Keycloak SSO</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-white/50 rounded-lg border border-white/20">
              <Users className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Team Collaboration</h3>
                <p className="text-sm text-muted-foreground">Share and manage documents together</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-white/50 rounded-lg border border-white/20">
              <Lock className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Access Control</h3>
                <p className="text-sm text-muted-foreground">Granular permissions and roles</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Sign In Form */}
        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-2 text-center pb-8">
              <div className="mx-auto h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
              <CardDescription className="text-base">
                Sign in to access your documents and continue your work
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <Button
                  onClick={handleSignIn}
                  disabled={isLoading}
                  size="lg"
                  className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Sign in with Keycloak</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    You'll be redirected to Keycloak for secure authentication
                  </p>
                </div>
              </div>

              {/* Security Notice */}
              <div className="mt-8 p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-start space-x-3">
                  <Lock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-foreground">Secure Authentication</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your credentials are handled securely through Keycloak. We never store your password.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Need help? Contact your system administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
