'use client'

import React from 'react'
import { useNotifications } from '@/hooks/useNotifications'

// Example of how to use notifications in your existing components
export default function UsageExample() {
  const { showSuccess, showError, showWarning, showInfo } = useNotifications()

  // Example: API call with notifications
  const handleCreateFolder = async () => {
    try {
      // Your API call here
      // const result = await apiClient.folders.create(folderData)
      
      // Show success notification
      showSuccess('Folder Created', 'Your folder has been created successfully!')
    } catch (error) {
      // Show error notification
      showError('Creation Failed', 'Failed to create folder. Please try again.')
    }
  }

  // Example: Form validation with warning
  const handleFormSubmit = (formData: any) => {
    if (!formData.name) {
      showWarning('Missing Information', 'Please provide a folder name.')
      return
    }
    
    if (formData.name.length < 3) {
      showWarning('Invalid Input', 'Folder name must be at least 3 characters long.')
      return
    }
    
    // Proceed with form submission
    showInfo('Processing', 'Creating your folder...')
    handleCreateFolder()
  }

  // Example: File upload with progress notifications
  const handleFileUpload = async (file: File) => {
    showInfo('Upload Started', `Uploading ${file.name}...`)
    
    try {
      // Your upload logic here
      // await uploadFile(file)
      
      showSuccess('Upload Complete', `${file.name} has been uploaded successfully!`)
    } catch (error) {
      showError('Upload Failed', `Failed to upload ${file.name}. Please try again.`)
    }
  }

  // Example: Delete confirmation with notifications
  const handleDeleteItem = async (itemId: string) => {
    try {
      // Your delete logic here
      // await deleteItem(itemId)
      
      showSuccess('Item Deleted', 'The item has been deleted successfully.')
    } catch (error) {
      showError('Delete Failed', 'Failed to delete the item. Please try again.')
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Notification Usage Examples</h2>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">1. API Calls with Notifications</h3>
          <p className="text-sm text-gray-600 mb-2">
            Show success/error notifications based on API response
          </p>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
{`const handleCreateFolder = async () => {
  try {
    const result = await apiClient.folders.create(folderData)
    showSuccess('Folder Created', 'Your folder has been created successfully!')
  } catch (error) {
    showError('Creation Failed', 'Failed to create folder. Please try again.')
  }
}`}
          </pre>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">2. Form Validation</h3>
          <p className="text-sm text-gray-600 mb-2">
            Show warning notifications for validation errors
          </p>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
{`const handleFormSubmit = (formData) => {
  if (!formData.name) {
    showWarning('Missing Information', 'Please provide a folder name.')
    return
  }
  // Continue with submission...
}`}
          </pre>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">3. File Operations</h3>
          <p className="text-sm text-gray-600 mb-2">
            Show info notifications for progress and success/error for completion
          </p>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
{`const handleFileUpload = async (file) => {
  showInfo('Upload Started', \`Uploading \${file.name}...\`)
  
  try {
    await uploadFile(file)
    showSuccess('Upload Complete', \`\${file.name} uploaded successfully!\`)
  } catch (error) {
    showError('Upload Failed', \`Failed to upload \${file.name}.\`)
  }
}`}
          </pre>
        </div>
      </div>
    </div>
  )
}
