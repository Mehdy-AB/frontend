# File Downloaded Endpoint Integration

## Overview
This document describes the integration of the new `fileDownloaded` endpoint from the backend into the frontend application.

## Backend Endpoint
```java
@PostMapping("/fileDownloaded/{id}")
public ResponseEntity<Void> fileDownloaded(@AuthenticationPrincipal Jwt jwt,
                                          @NonNull @PathVariable("id") Long id,
                                          @RequestParam(value = "version", required = false) Long version)
```

## Frontend Integration

### 1. API Client (`frontend/src/api/client.ts`)
Added the `fileDownloaded` method to the main API client:

```typescript
/**
 * Log file download operation
 */
async fileDownloaded(id: number, params: {
  version?: number;
} = {}): Promise<void> {
  await this.client.post(`/api/v1/document/fileDownloaded/${id}`, null, { params });
}
```

### 2. Notification Client (`frontend/src/api/notificationClient.ts`)
Added the `fileDownloaded` method with notification support:

```typescript
async fileDownloaded(id: number, params?: any, options?: ApiNotificationOptions) {
  return this.withNotification(
    () => apiClient.fileDownloaded(id, params),
    { successMessage: 'Download logged successfully', errorMessage: 'Failed to log download', ...options },
    'download'
  )
}
```

### 3. Document Service (`frontend/src/api/services/documentService.ts`)
Added the `fileDownloaded` method to the document service:

```typescript
/**
 * Log file download operation
 */
static async fileDownloaded(id: number, params: {
  version?: number;
} = {}, options?: any): Promise<void> {
  return notificationApiClient.fileDownloaded(id, params, options);
}
```

### 4. Document Operations Hook (`frontend/src/hooks/useDocumentOperations.ts`)
Updated the `downloadDocument` method to automatically log download operations:

```typescript
const downloadDocument = useCallback(async (document: DocumentViewDto, version?: number) => {
  try {
    const downloadUrl = await notificationApiClient.downloadDocument(document.documentId, { version });
    
    // Log the download operation
    try {
      await notificationApiClient.fileDownloaded(document.documentId, { version });
    } catch (logError) {
      console.warn('Failed to log download operation:', logError);
      // Don't throw here as the download was successful
    }
    
    return downloadUrl;
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}, []);
```

### 5. Version Management Modal (`frontend/src/components/document/VersionManagementModal.tsx`)
Updated the `handleDownloadVersion` method to log download operations:

```typescript
const handleDownloadVersion = async (versionId: number) => {
  try {
    const version = versions.find(v => v.versionId === versionId);
    const downloadUrl = await notificationApiClient.downloadDocument(versionId, { version: version?.versionNumber });
    
    // Log the download operation
    try {
      await notificationApiClient.fileDownloaded(versionId, { version: version?.versionNumber });
    } catch (logError) {
      console.warn('Failed to log download operation:', logError);
      // Don't throw here as the download was successful
    }
    
    // Create a temporary link to download the file
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${document.name}_v${version?.versionNumber}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Error downloading version:', err);
    setError('Failed to download version');
  }
};
```

## Usage Examples

### Direct API Call
```typescript
import { notificationApiClient } from '../api/notificationClient';

// Log a download for the latest version
await notificationApiClient.fileDownloaded(documentId);

// Log a download for a specific version
await notificationApiClient.fileDownloaded(documentId, { version: 2 });
```

### Using Document Service
```typescript
import { DocumentService } from '../api/services/documentService';

// Log a download
await DocumentService.fileDownloaded(documentId, { version: 1 });
```

### Using Document Operations Hook
```typescript
import { useDocumentOperations } from '../hooks/useDocumentOperations';

const { downloadDocument } = useDocumentOperations(documentId);

// This will automatically log the download
const downloadUrl = await downloadDocument(document, version);
```

## Features

1. **Automatic Logging**: Download operations are automatically logged when using the `useDocumentOperations` hook
2. **Version Support**: Supports logging downloads for specific document versions
3. **Error Handling**: Graceful error handling - download logging failures don't affect the actual download
4. **Notification Support**: Integrated with the notification system for user feedback
5. **Audit Trail**: All download operations are logged in the audit system for compliance and tracking

## Benefits

- **Compliance**: All file downloads are tracked for audit purposes
- **Analytics**: Download statistics can be generated from audit logs
- **Security**: Track who downloaded what and when
- **User Experience**: Seamless integration without affecting download functionality
