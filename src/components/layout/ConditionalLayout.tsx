'use client'

import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import Sidebar from '@/components/main/Sidebar'
import Header from '@/components/main/Header'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  // Check if current path is an auth page
  const isAuthPage = pathname?.startsWith('/auth/')

  // Check if current path is a public form page (no auth required, no layout)
  const isPublicFormPage = pathname?.startsWith('/forms/')

  // Check if current path is a fullscreen page (no sidebar/header)
  const isFullscreenPage = pathname?.includes('/upload') || pathname?.startsWith('/classa/') || pathname?.includes('/forms/create') || (pathname?.includes('/forms/') && pathname?.includes('/edit'))

  // Check if user is authenticated
  const isAuthenticated = status === 'authenticated' && session

  // If not authenticated and not on auth page, middleware should redirect
  // Add a fallback redirect with timeout in case middleware fails
  useEffect(() => {
    if (!isAuthenticated && !isAuthPage && !isPublicFormPage && status === 'unauthenticated') {
      // Set a timeout to force redirect if middleware doesn't handle it
      const timeout = setTimeout(() => {
        // Force redirect using window.location for reliability
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/') && !window.location.pathname.startsWith('/forms/')) {
          window.location.href = '/auth/signin'
        }
      }, 1000) // 1 second fallback

      return () => {
        clearTimeout(timeout)
      }
    }
  }, [isAuthenticated, isAuthPage, isPublicFormPage, status])

  // If it's an auth page or public form page, render without header/sidebar
  if (isAuthPage || isPublicFormPage) {
    return <>{children}</>
  }

  // Brief loading state while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  // Show brief loading state while redirect is being handled
  if (!isAuthenticated && !isAuthPage && !isPublicFormPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span className="text-muted-foreground">Redirecting to sign in...</span>
        </div>
      </div>
    )
  }

  // Fullscreen pages (like upload) - no sidebar/header
  if (isFullscreenPage) {
    return <>{children}</>
  }

  // For authenticated users on non-auth pages, show full layout
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

