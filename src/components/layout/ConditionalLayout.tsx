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
  
  // Check if user is authenticated
  const isAuthenticated = status === 'authenticated' && session
  
  // If not authenticated and not on auth page, middleware should redirect
  // Add a fallback redirect with timeout in case middleware fails
  useEffect(() => {
    if (!isAuthenticated && !isAuthPage && status === 'unauthenticated') {
      // Set a timeout to force redirect if middleware doesn't handle it
      const timeout = setTimeout(() => {
        // Force redirect using window.location for reliability
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/')) {
          window.location.href = '/auth/signin'
        }
      }, 1000) // 1 second fallback
      
      return () => {
        clearTimeout(timeout)
      }
    }
  }, [isAuthenticated, isAuthPage, status])

  // If it's an auth page, render without header/sidebar
  if (isAuthPage) {
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
  if (!isAuthenticated && !isAuthPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span className="text-muted-foreground">Redirecting to sign in...</span>
        </div>
      </div>
    )
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
