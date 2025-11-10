'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export type NotificationType = 'info' | 'error' | 'warning' | 'success'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const removeNotification = useCallback((id: string) => {
    // Clear timeout if exists
    const timeout = timeoutsRef.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timeoutsRef.current.delete(id)
    }
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const duration = notification.duration !== undefined ? notification.duration : 3000
    const newNotification: Notification = {
      id,
      duration,
      ...notification,
    }

    setNotifications(prev => {
      const updated = [newNotification, ...prev] // New notifications appear at the top
      // Keep only the first 3 notifications (max in row)
      const limited = updated.slice(0, 3)
      
      // Clear timeouts for notifications that were removed due to limit
      if (updated.length > 3) {
        const removedIds = updated.slice(3).map(n => n.id)
        removedIds.forEach(id => {
          const timeout = timeoutsRef.current.get(id)
          if (timeout) {
            clearTimeout(timeout)
            timeoutsRef.current.delete(id)
          }
        })
      }
      
      return limited
    })

    // Auto remove notification after duration
    if (duration > 0) {
      const timeoutId = setTimeout(() => {
        removeNotification(id)
      }, duration)
      timeoutsRef.current.set(id, timeoutId)
    }
  }, [removeNotification])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      timeoutsRef.current.clear()
    }
  }, [])

  const clearAllNotifications = useCallback(() => {
    // Clear all timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
    timeoutsRef.current.clear()
    setNotifications([])
  }, [])

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-[9999] space-y-3 max-w-md w-full px-4 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ 
                opacity: 0, 
                x: 100,
                scale: 0.9 
              }}
              animate={{ 
                opacity: 1, 
                x: 0,
                scale: 1,
                transition: {
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }
              }}
              exit={{ 
                opacity: 0, 
                x: 100,
                scale: 0.9,
                transition: {
                  duration: 0.2
                }
              }}
              className={`
                relative p-4 rounded-lg shadow-2xl border-l-4 backdrop-blur-md bg-white pointer-events-auto
                ${notification.type === 'success' ? 'border-green-500 bg-green-50/95' : ''}
                ${notification.type === 'error' ? 'border-red-500 bg-red-50/95' : ''}
                ${notification.type === 'warning' ? 'border-yellow-500 bg-yellow-50/95' : ''}
                ${notification.type === 'info' ? 'border-blue-500 bg-blue-50/95' : ''}
              `}
            >
              {/* Progress Bar */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: (notification.duration || 3000) / 1000, ease: "linear" }}
                className={`
                  absolute bottom-0 left-0 w-full h-0.5 origin-left rounded-b-lg
                  ${notification.type === 'success' ? 'bg-green-500' : ''}
                  ${notification.type === 'error' ? 'bg-red-500' : ''}
                  ${notification.type === 'warning' ? 'bg-yellow-500' : ''}
                  ${notification.type === 'info' ? 'bg-blue-500' : ''}
                `}
              />
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {notification.type === 'success' && (
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {notification.type === 'error' && (
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  {notification.type === 'warning' && (
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  {notification.type === 'info' && (
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900">
                    {notification.title}
                  </h3>
                  {notification.message && (
                    <p className="text-sm mt-1 text-gray-700">
                      {notification.message}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors rounded-md p-1 hover:bg-gray-100"
                  aria-label="Close notification"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}