'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import LoadingSpinner from './LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function ProtectedRoute({ 
  children, 
  fallback 
}: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Use replace to avoid adding to history stack
      router.replace('/auth/signin')
      // Also use window.location as fallback for immediate redirect
      if (typeof window !== 'undefined') {
        const timeout = setTimeout(() => {
          if (!window.location.pathname.startsWith('/auth/')) {
            window.location.href = '/auth/signin'
          }
        }, 500)
        
        return () => clearTimeout(timeout)
      }
    }
  }, [status, router])

  if (status === 'loading') {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Checking authentication..." size="lg" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Redirecting to sign in..." size="lg" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading session..." size="lg" />
      </div>
    )
  }

  return <>{children}</>
}

