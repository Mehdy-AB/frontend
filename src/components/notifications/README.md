# Notification System

A comprehensive notification system for the AebDMS application that provides info, error, warning, and success messages with automatic dismissal after 5 seconds.

## Features

- ✅ Four notification types: `info`, `error`, `warning`, `success`
- ✅ Automatic dismissal after 5 seconds (configurable)
- ✅ Smooth animations (slide in/out, fade, scale)
- ✅ Manual dismissal with close button
- ✅ Multiple notifications support
- ✅ Context-based state management
- ✅ TypeScript support
- ✅ Responsive design
- ✅ RTL support ready

## Quick Start

### 1. Basic Usage

```tsx
import { useNotifications } from '@/hooks/useNotifications'

function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useNotifications()

  const handleAction = () => {
    showSuccess('Success!', 'Operation completed successfully.')
  }

  return <button onClick={handleAction}>Click me</button>
}
```

### 2. API Integration

```tsx
const handleCreateFolder = async () => {
  try {
    const result = await apiClient.folders.create(folderData)
    showSuccess('Folder Created', 'Your folder has been created successfully!')
  } catch (error) {
    showError('Creation Failed', 'Failed to create folder. Please try again.')
  }
}
```

### 3. Form Validation

```tsx
const handleFormSubmit = (formData) => {
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
```

## API Reference

### useNotifications Hook

```tsx
const {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showNotification,
  removeNotification,
  clearAllNotifications
} = useNotifications()
```

#### Methods

- `showSuccess(title: string, message?: string, duration?: number)` - Show success notification
- `showError(title: string, message?: string, duration?: number)` - Show error notification
- `showWarning(title: string, message?: string, duration?: number)` - Show warning notification
- `showInfo(title: string, message?: string, duration?: number)` - Show info notification
- `showNotification(type, title, message?, duration?)` - Show notification with custom type
- `removeNotification(id: string)` - Remove specific notification
- `clearAllNotifications()` - Remove all notifications

#### Parameters

- `title` (required): The main notification title
- `message` (optional): Additional description text
- `duration` (optional): Auto-dismiss time in milliseconds (default: 5000ms)

### Notification Types

- `info` - Blue theme, info icon
- `success` - Green theme, check circle icon
- `warning` - Yellow theme, warning triangle icon
- `error` - Red theme, alert circle icon

## Styling

The notification system uses Tailwind CSS classes and is fully customizable. The notifications appear in the top-right corner of the screen with:

- Smooth slide-in animation from the right
- Fade and scale effects
- Color-coded backgrounds and borders
- Responsive design
- Close button for manual dismissal

## Integration

The notification system is already integrated into the app layout. The `NotificationProvider` wraps the entire application, and the `NotificationContainer` is rendered at the root level.

## Examples

See the following files for complete examples:
- `NotificationDemo.tsx` - Interactive demo with all notification types
- `UsageExample.tsx` - Real-world usage patterns and code examples

## Customization

To customize the notification appearance, modify the classes in `NotificationItem.tsx`:

```tsx
// Change colors, animations, or positioning
const getBackgroundColor = () => {
  switch (notification.type) {
    case 'success':
      return 'bg-green-50 border-green-200' // Customize success colors
    // ... other cases
  }
}
```

## Best Practices

1. **Keep titles short and descriptive**
2. **Use messages for additional context**
3. **Don't overuse notifications** - they should provide value
4. **Use appropriate types** - success for confirmations, error for failures, warning for validation, info for general updates
5. **Consider duration** - longer for important messages, shorter for quick confirmations
