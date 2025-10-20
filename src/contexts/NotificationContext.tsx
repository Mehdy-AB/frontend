'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
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

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      id,
      duration: 1000, // Default 1 second
      ...notification,
    }

    setNotifications(prev => {
      const updated = [newNotification, ...prev] // New notifications appear at the top
      // Keep only the first 3 notifications (max in row)
      return updated.slice(0, 3)
    })

    // Auto remove notification after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
  }, [removeNotification])

  const clearAllNotifications = useCallback(() => {
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
      <div className="fixed top-4 right-4 z-50 space-y-2 w-80">
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
                relative p-4 rounded-lg shadow-lg border-l-4 backdrop-blur-sm
                ${notification.type === 'success' ? 'bg-green-50 border-green-500 text-green-900' : ''}
                ${notification.type === 'error' ? 'bg-red-50 border-red-500 text-red-900' : ''}
                ${notification.type === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-900' : ''}
                ${notification.type === 'info' ? 'bg-blue-50 border-blue-500 text-blue-900' : ''}
              `}
            >
              {/* Progress Bar */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: (notification.duration || 1000) / 1000, ease: "linear" }}
                className={`
                  absolute top-0 left-0 w-full h-1 origin-left
                  ${notification.type === 'success' ? 'bg-green-500' : ''}
                  ${notification.type === 'error' ? 'bg-red-500' : ''}
                  ${notification.type === 'warning' ? 'bg-yellow-500' : ''}
                  ${notification.type === 'info' ? 'bg-blue-500' : ''}
                `}
              />
              
              <div className="flex items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{notification.title}</h3>
                  {notification.message && (
                    <p className="text-sm mt-1 opacity-90">{notification.message}</p>
                  )}
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="ml-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ×
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