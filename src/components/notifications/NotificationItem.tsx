'use client'

import React, { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { useNotification } from '@/contexts/NotificationContext'
import { Notification } from '@/contexts/NotificationContext'

interface NotificationItemProps {
  notification: Notification
}

export default function NotificationItem({ notification }: NotificationItemProps) {
  const { removeNotification } = useNotification()
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      removeNotification(notification.id)
    }, 300) // Match animation duration
  }

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const getTextColor = () => {
    switch (notification.type) {
      case 'success':
        return 'text-green-800'
      case 'error':
        return 'text-red-800'
      case 'warning':
        return 'text-yellow-800'
      case 'info':
      default:
        return 'text-blue-800'
    }
  }

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
        ${getBackgroundColor()}
        border rounded-lg shadow-lg p-4 relative
      `}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium ${getTextColor()}`}>
            {notification.title}
          </h4>
          {notification.message && (
            <p className={`text-sm mt-1 ${getTextColor()} opacity-90`}>
              {notification.message}
            </p>
          )}
        </div>
        
        <button
          onClick={handleClose}
          className={`
            flex-shrink-0 ml-2 p-1 rounded-full 
            hover:bg-black hover:bg-opacity-10 
            transition-colors duration-200
            ${getTextColor()} opacity-70 hover:opacity-100
          `}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
