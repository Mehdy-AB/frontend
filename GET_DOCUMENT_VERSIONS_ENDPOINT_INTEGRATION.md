# Get Document Versions Endpoint Integration

## Overview
This document describes the integration of the new `getDocumentVersions` endpoint from the backend into the frontend application. This endpoint provides a simple way to retrieve all versions of a specific document.

## Backend Endpoint
```java
@GetMapping("/{id}/versions")
public ResponseEntity<List<DocumentVersionResponseDto>> getDocumentVersions(
        @AuthenticationPrincipal Jwt jwt,
        @NonNull @PathVariable("id") Long id) {
    
    List<DocumentVersionResponseDto> versions = documentService.getDocumentVersions(id, jwt.getSubject());
    return ResponseEntity.ok(versions);
}
```

## Frontend Integration

### 1. Types (`frontend/src/types/api.ts`)
Added the `DocumentVersionResponse` interface:

```typescript
export interface DocumentVersionResponse {
  id: number;
  documentId: number;
  versionNumber: number;
  minioKey: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
}
```

### 2. API Client (`frontend/src/api/client.ts`)
Added the `getDocumentVersionsList` method:

```typescript
/**
 * Get document versions list
 */
async getDocumentVersionsList(id: number): Promise<DocumentVersionResponse[]> {
  const response: AxiosResponse<DocumentVersionResponse[]> = await this.client.get(`/api/v1/document/${id}/versions`);
  return response.data;
}
```

**Note:** The method is named `getDocumentVersionsList` to avoid conflicts with the existing `getDocumentVersions` method that returns search results.

### 3. Notification Client (`frontend/src/api/notificationClient.ts`)
Added notification support:

```typescript
async getDocumentVersionsList(id: number, options?: ApiNotificationOptions) {
  return this.withNotification(
    () => apiClient.getDocumentVersionsList(id),
    { silent: true, ...options }
  )
}
```

### 4. Document Service (`frontend/src/api/services/documentService.ts`)
Added service layer method:

```typescript
/**
 * Get document versions list
 */
static async getDocumentVersionsList(id: number, options?: any): Promise<DocumentVersionResponse[]> {
  return notificationApiClient.getDocumentVersionsList(id, options);
}
```

### 5. Component Integration (`frontend/src/components/document/VersionManagementModal.tsx`)
Updated the VersionManagementModal to use the new endpoint:

```typescript
const fetchVersions = async () => {
  try {
    setLoading(true);
    setError(null);
    const versions = await notificationApiClient.getDocumentVersionsList(document.documentId);
    
    // Map the DocumentVersionResponse to VersionInfo format
    const versionInfos: VersionInfo[] = versions.map(version => ({
      versionId: version.id,
      versionNumber: version.versionNumber,
      sizeBytes: version.sizeBytes,
      mimeType: version.mimeType,
      createdAt: version.createdAt,
      updatedAt: version.createdAt, // DocumentVersionResponse doesn't have updatedAt, use createdAt
      createdBy: {
        id: '', // DocumentVersionResponse doesn't include user info
        username: '',
        firstName: '',
        lastName: ''
      }
    }));
    
    setVersions(versionInfos);
  } catch (err) {
    console.error('Error fetching versions:', err);
    setError('Failed to load document versions');
    setVersions([]);
  } finally {
    setLoading(false);
  }
};
```

## Usage Examples

### Using the Service Layer (Recommended)
```typescript
import { DocumentService } from '../api/services/documentService';

const versions = await DocumentService.getDocumentVersionsList(documentId);
versions.forEach(version => {
  console.log(`Version ${version.versionNumber}: ${version.mimeType} (${version.sizeBytes} bytes)`);
});
```

### Using Direct API Client
```typescript
import { apiClient } from '../api/client';

const versions = await apiClient.getDocumentVersionsList(documentId);
```

### Using Notification Client
```typescript
import { notificationApiClient } from '../api/notificationClient';

// Silent operation (no notifications)
const versions = await notificationApiClient.getDocumentVersionsList(documentId, { silent: true });

// With error notifications
const versions = await notificationApiClient.getDocumentVersionsList(documentId, {
  errorMessage: 'Failed to load document versions'
});
```

## Comparison with Existing Methods

### New Method: `getDocumentVersionsList`
- **Purpose**: Get simple list of document versions
- **Returns**: `DocumentVersionResponse[]`
- **Endpoint**: `/api/v1/document/{id}/versions`
- **Use Case**: Version management, file history

### Existing Method: `getDocumentVersions` (Search)
- **Purpose**: Search document versions with query
- **Returns**: `GlobalSearchResultDto`
- **Endpoint**: `/api/v1/search/document/{documentId}/versions`
- **Use Case**: Search functionality, complex queries

## Features

1. **Simple Version List**: Returns a clean list of document versions
2. **Version Information**: Includes version number, size, MIME type, and creation date
3. **Minio Key**: Provides the storage key for file access
4. **Permission Checking**: Backend validates user permissions
5. **Error Handling**: Comprehensive error handling with user feedback
6. **Type Safety**: Full TypeScript support

## Benefits

- **Simplified API**: Clean, focused endpoint for version listing
- **Performance**: Direct database query without search overhead
- **Consistency**: Follows the same patterns as other document endpoints
- **Integration**: Seamlessly integrates with existing version management UI
- **Type Safety**: Strong typing for better development experience

## Data Mapping

The new endpoint returns simplified version data compared to the search endpoint:

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Version ID |
| `documentId` | number | Parent document ID |
| `versionNumber` | number | Version number (1, 2, 3, etc.) |
| `minioKey` | string | Storage key for file access |
| `sizeBytes` | number | File size in bytes |
| `mimeType` | string | File MIME type |
| `createdAt` | string | Creation timestamp |

## Integration Points

The new endpoint integrates with:
- Document version management UI
- File download functionality
- Version history display
- Document metadata management

This provides a more efficient and focused way to retrieve document version information for UI components that need to display version lists without the complexity of search functionality.
