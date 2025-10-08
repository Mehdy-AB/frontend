import { useNotification } from '@/contexts/NotificationContext'
import { NotificationType } from '@/contexts/NotificationContext'

export function useNotifications() {
  const { addNotification, removeNotification, clearAllNotifications } = useNotification()

  const showNotification = (
    type: NotificationType,
    title: string,
    message?: string,
    duration?: number
  ) => {
    addNotification({
      type,
      title,
      message,
      duration,
    })
  }

  const showSuccess = (title: string, message?: string, duration?: number) => {
    showNotification('success', title, message, duration)
  }

  const showError = (title: string, message?: string, duration?: number) => {
    showNotification('error', title, message, duration)
  }

  const showWarning = (title: string, message?: string, duration?: number) => {
    showNotification('warning', title, message, duration)
  }

  const showInfo = (title: string, message?: string, duration?: number) => {
    showNotification('info', title, message, duration)
  }

  return {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
    clearAllNotifications,
  }
}
