'use client'

import { signOut } from 'next-auth/react'
import { useState } from 'react'

interface SignOutButtonProps {
  className?: string
  children?: React.ReactNode
  variant?: 'button' | 'link'
}

export default function SignOutButton({ 
  className = '',
  children,
  variant = 'button'
}: SignOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut({ 
        callbackUrl: '/auth/signin',
        redirect: true 
      })
    } catch (error) {
      console.error('Sign out error:', error)
      setIsLoading(false)
    }
  }

  if (variant === 'link') {
    return (
      <button
        onClick={handleSignOut}
        disabled={isLoading}
        className={`text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 ${className}`}
      >
        {isLoading ? 'Signing out...' : (children || 'Sign out')}
      </button>
    )
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isLoading}
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Signing out...
        </>
      ) : (
        children || 'Sign out'
      )}
    </button>
  )
}

