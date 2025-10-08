'use client'

import React, { useEffect } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { notificationApiClient } from '@/api/notificationClient'

interface NotificationApiProviderProps {
  children: React.ReactNode
}

export default function NotificationApiProvider({ children }: NotificationApiProviderProps) {
  const { showSuccess, showError } = useNotifications()

  useEffect(() => {
    // Set up the notification callback for the API client
    notificationApiClient.setNotificationCallback((type, title, message) => {
      if (type === 'success') {
        showSuccess(title, message)
      } else if (type === 'error') {
        showError(title, message)
      }
    })
  }, [showSuccess, showError])

  return <>{children}</>
}
