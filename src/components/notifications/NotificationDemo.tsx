'use client'

import React from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { Button } from '@/components/ui/button'

export default function NotificationDemo() {
  const { showSuccess, showError, showWarning, showInfo } = useNotifications()

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Notification System Demo</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={() => showSuccess('Success!', 'Operation completed successfully.')}
          className="bg-green-600 hover:bg-green-700"
        >
          Show Success
        </Button>
        
        <Button
          onClick={() => showError('Error!', 'Something went wrong. Please try again.')}
          className="bg-red-600 hover:bg-red-700"
        >
          Show Error
        </Button>
        
        <Button
          onClick={() => showWarning('Warning!', 'Please check your input before proceeding.')}
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          Show Warning
        </Button>
        
        <Button
          onClick={() => showInfo('Information', 'Here is some useful information for you.')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Show Info
        </Button>
      </div>
      
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Usage Example:</h3>
        <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`import { useNotifications } from '@/hooks/useNotifications'

const { showSuccess, showError, showWarning, showInfo } = useNotifications()

// Show different types of notifications
showSuccess('Success!', 'Operation completed successfully.')
showError('Error!', 'Something went wrong.')
showWarning('Warning!', 'Please check your input.')
showInfo('Information', 'Here is some useful info.')`}
        </pre>
      </div>
    </div>
  )
}
