# API Notification Integration

This document explains how the notification system has been integrated with all API calls in the AebDMS application.

## Overview

All API calls now automatically show success and error notifications to provide immediate feedback to users. The system is designed to be:

- **Automatic**: No need to manually add notifications to each API call
- **Consistent**: All API calls follow the same notification patterns
- **Configurable**: You can customize or disable notifications per call
- **Non-intrusive**: GET operations are silent by default

## Architecture

### 1. Notification API Client (`src/api/notificationClient.ts`)

A wrapper around the original API client that adds notification functionality:

```typescript
import { notificationApiClient } from '@/api/notificationClient'

// All API calls now support notifications
await notificationApiClient.createFolder(folderData)
await notificationApiClient.createUser(userData)
await notificationApiClient.uploadDocument(file, folderId, lang, categories)
```

### 2. Notification Provider (`src/components/providers/NotificationApiProvider.tsx`)

Connects the API client with the notification context:

```typescript
// Automatically set up in the app layout
<NotificationProvider>
  <NotificationApiProvider>
    <App />
  </NotificationApiProvider>
</NotificationProvider>
```

### 3. Service Layer Integration

All service files have been updated to use the notification API client:

- `src/api/services/folderService.ts`
- `src/api/services/documentService.ts`
- `src/api/services/userService.ts`
- `src/api/services/roleService.ts`
- `src/api/services/groupService.ts`
- `src/api/services/filingCategoryService.ts`
- `src/api/services/searchService.ts`

## Usage

### Basic Usage

```typescript
import { notificationApiClient } from '@/api/notificationClient'

// Success notification will show automatically
await notificationApiClient.createFolder({
  name: 'New Folder',
  description: 'A test folder',
  parentId: 1,
  typeShareAccess: 'PRIVATE'
})

// Error notification will show if the call fails
await notificationApiClient.createUser({
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  enabled: true
})
```

### Customizing Notifications

You can customize notifications per API call:

```typescript
// Custom success/error messages
await notificationApiClient.createFolder(folderData, {
  successMessage: 'Your folder was created successfully!',
  errorMessage: 'Failed to create folder. Please try again.'
})

// Disable notifications for a specific call
await notificationApiClient.getAllUsers(params, { silent: true })

// Disable only success notifications
await notificationApiClient.createUser(userData, { showSuccess: false })

// Disable only error notifications
await notificationApiClient.createUser(userData, { showError: false })
```

### Notification Options

```typescript
interface ApiNotificationOptions {
  showSuccess?: boolean      // Show success notification (default: true)
  showError?: boolean        // Show error notification (default: true)
  successMessage?: string    // Custom success message
  errorMessage?: string      // Custom error message
  silent?: boolean          // Disable all notifications (default: false)
}
```

## Default Behavior

### Success Notifications
- **Create operations**: "Item created successfully"
- **Update operations**: "Item updated successfully"
- **Delete operations**: "Item deleted successfully"
- **Upload operations**: "File uploaded successfully"
- **Move operations**: "Item moved successfully"
- **Rename operations**: "Item renamed successfully"
- **Assignment operations**: "Assignment completed successfully"
- **Removal operations**: "Removal completed successfully"

### Error Notifications
- All operations show "Failed to [operation] item" by default
- Custom error messages can be provided per call

### Silent Operations
- **GET operations**: Silent by default (no notifications)
- **Search operations**: Silent by default
- **Data loading**: Silent by default

## Integration Points

### 1. Modal Components
All modal components now use the notification API client:

```typescript
// CreateFolderModal.tsx
await notificationApiClient.createFolder(folderData)

// FileUploadModal.tsx
await notificationApiClient.uploadDocument(file, folderId, lang, categories)

// RenameFolderModal.tsx
await notificationApiClient.renameFolder(folderId, newName)
```

### 2. Page Components
All page components have been updated:

```typescript
// folders/page.tsx
await notificationApiClient.getRepository(params)
await notificationApiClient.deleteFolder(folderId)

// administration/page.tsx
await notificationApiClient.createUser(userData)
await notificationApiClient.assignRoleToUser(roleName, userId)
```

### 3. Service Layer
All service methods now support notification options:

```typescript
// FolderService.createFolder()
static async createFolder(data: CreateFolderDto, options?: any): Promise<FolderResDto> {
  return notificationApiClient.createFolder(data, options);
}

// DocumentService.uploadDocument()
static async uploadDocument(
  file: File,
  folderId: number,
  lang: ExtractorLanguage,
  filingCategoryDto: FilingCategoryDocDto[],
  options?: any
): Promise<DocumentResponseDto> {
  return notificationApiClient.uploadDocument(file, folderId, lang, filingCategoryDto, options);
}
```

## Testing

### Test Component
Use the `ApiNotificationTest` component to test the notification system:

```typescript
import { ApiNotificationTest } from '@/components/notifications'

// Add to any page to test API notifications
<ApiNotificationTest />
```

### Manual Testing
1. **Success notifications**: Perform any create/update/delete operation
2. **Error notifications**: Try operations with invalid data
3. **Silent operations**: GET operations should not show notifications
4. **Custom messages**: Use the options parameter to customize messages

## Migration Guide

### From Original API Client
```typescript
// Before
import { apiClient } from '@/api/client'
await apiClient.createFolder(folderData)

// After
import { notificationApiClient } from '@/api/notificationClient'
await notificationApiClient.createFolder(folderData)
```

### From Service Layer
```typescript
// Before
import { FolderService } from '@/api/services/folderService'
await FolderService.createFolder(folderData)

// After (no changes needed - services updated automatically)
import { FolderService } from '@/api/services/folderService'
await FolderService.createFolder(folderData) // Now shows notifications
```

## Best Practices

1. **Use appropriate notification types**:
   - Success for confirmations
   - Error for failures
   - Silent for data loading

2. **Customize messages for better UX**:
   ```typescript
   await notificationApiClient.createFolder(folderData, {
     successMessage: `Folder "${folderData.name}" created successfully!`
   })
   ```

3. **Handle errors gracefully**:
   ```typescript
   try {
     await notificationApiClient.createUser(userData)
   } catch (error) {
     // Error notification already shown automatically
     // Handle additional error logic here if needed
   }
   ```

4. **Use silent mode for background operations**:
   ```typescript
   // Loading data in background
   const users = await notificationApiClient.getAllUsers(params, { silent: true })
   ```

## Troubleshooting

### Notifications Not Showing
1. Check that `NotificationProvider` is in the app layout
2. Verify `NotificationApiProvider` is wrapping your components
3. Ensure you're using `notificationApiClient` instead of `apiClient`

### Too Many Notifications
1. Use `silent: true` for GET operations
2. Use `showSuccess: false` to disable success notifications
3. Use `showError: false` to disable error notifications

### Custom Messages Not Working
1. Check the `ApiNotificationOptions` interface
2. Ensure you're passing options as the second parameter
3. Verify the operation type supports custom messages

## Future Enhancements

- [ ] Add notification queuing for multiple simultaneous operations
- [ ] Add progress notifications for long-running operations
- [ ] Add notification history/logging
- [ ] Add notification preferences per user
- [ ] Add notification sound support
