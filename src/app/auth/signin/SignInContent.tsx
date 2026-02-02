'use client'

import { signIn, getSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Shield, Lock, FileText, Users, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import LanguageSelector from '../../../components/i18n/LanguageSelector'

export default function SignInContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const router = useRouter()
  const searchParams = useSearchParams()

  // Safe translation hook with fallback
  let t: (key: string) => string
  try {
    t = useTranslations('auth')
  } catch (error) {
    // Fallback translations if context is not available
    t = (key: string) => {
      const fallbacks: Record<string, string> = {
        'signInFailed': 'Sign in failed. Please check your credentials.',
        'unexpectedError': 'An unexpected error occurred.',
        'signingIn': 'Signing in...',
        'signIn': 'Sign In',
        'username': 'Username',
        'password': 'Password',
        'welcomeBack': 'Welcome Back',
        'signInDescription': 'Sign in to access your documents and continue your work',
        'enterCredentials': 'Enter your credentials to access your account',
        'forgotPassword': 'Forgot your password?',
        'contactAdmin': 'Need help? Contact your system administrator'
      }
      return fallbacks[key] || key
    }
  }

  useEffect(() => {
    // Check if user is already signed in
    const checkSession = async () => {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session check timeout')), 3000)
        )

        const sessionPromise = getSession()
        const session = await Promise.race([sessionPromise, timeoutPromise]) as any

        if (session) {
          // Use replace to avoid adding to history stack
          router.replace('/')
          // Also use window.location as fallback for immediate redirect
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              window.location.href = '/'
            }, 100)
          }
        }
      } catch (err) {
        console.error('Error checking session:', err)
        // If session check fails, just show the sign-in form
      } finally {
        setIsCheckingSession(false)
      }
    }

    // Only check session if we're on the sign-in page
    if (typeof window !== 'undefined' && window.location.pathname === '/auth/signin') {
      checkSession()
    } else {
      setIsCheckingSession(false)
    }
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        username: formData.username,
        password: formData.password,
        redirect: false
      })

      if (result?.error) {
        setError(t('signInFailed'))
      } else if (result?.ok) {
        // Get callback URL from query params, fallback to home
        const callbackUrl = searchParams.get('callbackUrl') || '/'
        const redirectUrl = callbackUrl.startsWith('/') ? callbackUrl : '/'

        // Use replace to avoid adding to history stack
        router.replace(redirectUrl)
        // Also use window.location for immediate redirect
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.location.href = redirectUrl
          }, 100)
        }
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
            <div className="flex justify-center items-center space-x-3">
                <img
                  src="/logo.svg"
                  alt="Logo"
                  className="h-80 w-80"
                />
              </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-foreground leading-tight">
              Secure Document Management
              <span className="text-primary"> Made Simple</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Access your documents, collaborate with your team, and manage your files with enterprise-grade security and authentication.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-white/50 rounded-lg border border-white/20">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Enterprise Security</h3>
                <p className="text-sm text-muted-foreground">Protected by secure authentication</p>
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
              <CardTitle className="text-2xl font-bold">{t('welcomeBack')}</CardTitle>
              <CardDescription className="text-base">
                {t('signInDescription')}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">{t('username')}</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter your username"
                    required
                    disabled={isLoading}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t('password')}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      required
                      disabled={isLoading}
                      className="h-12 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !formData.username || !formData.password}
                  size="lg"
                  className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>{t('signingIn')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>{t('signIn')}</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </form>

              {/* Security Notice */}
              <div className="mt-8 p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-start space-x-3">
                  <Lock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-foreground">Secure Authentication</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your credentials are handled securely. We use industry-standard encryption and never store your password.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              {t('contactAdmin')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
