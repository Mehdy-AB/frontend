'use client'

import React from 'react'
import { useNotification } from '@/contexts/NotificationContext'
import NotificationItem from './NotificationItem'

export default function NotificationContainer() {
  const { notifications } = useNotification()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
        />
      ))}
    </div>
  )
}
