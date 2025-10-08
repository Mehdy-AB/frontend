# Document Metadata Endpoint Update

## Overview
This document describes the replacement of the `updateDocumentFilingCategory` endpoint with the new `updateDocumentMetadata` endpoint to match the updated backend API.

## Backend Endpoint Change

### Old Endpoint (Removed)
```java
// This endpoint was replaced
@PutMapping("/{id}/filing-category")
public ResponseEntity<DocumentResponseDto> updateDocumentFilingCategory(...)
```

### New Endpoint
```java
@PutMapping("/{id}/metadata")
public ResponseEntity<Void> updateDocumentMetadata(@AuthenticationPrincipal Jwt jwt,
                                                  @NonNull @PathVariable("id") Long id,
                                                  @Valid @RequestBody UpdateDocumentMetadataRequestDto request) {
    
    documentService.updateDocumentMetadata(id, request, jwt.getSubject());
    return ResponseEntity.status(HttpStatus.OK).build();
}
```

## Frontend Updates

### 1. New Type Definition (`frontend/src/types/api.ts`)

**Added UpdateDocumentMetadataRequestDto:**
```typescript
export interface UpdateDocumentMetadataRequestDto {
  filingCategory: FilingCategoryDocDto;
}
```

**Structure:**
- `filingCategory`: A single `FilingCategoryDocDto` object (not an array)
- Contains `id` and `metaDataDto` array

### 2. API Client Update (`frontend/src/api/client.ts`)

**Replaced Method:**
```typescript
// OLD METHOD (removed)
async updateDocumentFilingCategory(documentId: number, filingCategoryDto: FilingCategoryDocDto[]): Promise<DocumentResponseDto>

// NEW METHOD
async updateDocumentMetadata(documentId: number, request: UpdateDocumentMetadataRequestDto): Promise<void>
```

**Key Changes:**
- **Endpoint URL**: Changed from `/filing-category` to `/metadata`
- **Parameter**: Now takes a single `UpdateDocumentMetadataRequestDto` instead of `FilingCategoryDocDto[]`
- **Return Type**: Returns `void` instead of `DocumentResponseDto`
- **HTTP Method**: Still `PUT`

### 3. Notification Client Update (`frontend/src/api/notificationClient.ts`)

**Updated Method:**
```typescript
async updateDocumentMetadata(documentId: number, request: any, options?: ApiNotificationOptions) {
  return this.withNotification(
    () => apiClient.updateDocumentMetadata(documentId, request),
    { 
      successMessage: 'Document metadata updated successfully', 
      errorMessage: 'Failed to update document metadata', 
      ...options 
    },
    'update'
  )
}
```

**Notification Messages:**
- **Success**: "Document metadata updated successfully"
- **Error**: "Failed to update document metadata"

### 4. Document Service Update (`frontend/src/api/services/documentService.ts`)

**Added Method:**
```typescript
/**
 * Update document metadata
 */
static async updateDocumentMetadata(id: number, request: UpdateDocumentMetadataRequestDto, options?: any): Promise<void> {
  return notificationApiClient.updateDocumentMetadata(id, request, options);
}
```

## Usage Examples

### Basic Usage
```typescript
import { DocumentService } from '../api/services/documentService';
import { UpdateDocumentMetadataRequestDto } from '../types/api';

// Create the request
const request: UpdateDocumentMetadataRequestDto = {
  filingCategory: {
    id: 123,
    metaDataDto: [
      { id: 1, value: "Important Document" },
      { id: 2, value: "Confidential" }
    ]
  }
};

// Update document metadata
await DocumentService.updateDocumentMetadata(documentId, request);
```

### Using API Client Directly
```typescript
import { apiClient } from '../api/client';

const request: UpdateDocumentMetadataRequestDto = {
  filingCategory: {
    id: 123,
    metaDataDto: [
      { id: 1, value: "Updated Value" }
    ]
  }
};

await apiClient.updateDocumentMetadata(documentId, request);
```

### Using Notification Client
```typescript
import { notificationApiClient } from '../api/notificationClient';

const request: UpdateDocumentMetadataRequestDto = {
  filingCategory: {
    id: 123,
    metaDataDto: [
      { id: 1, value: "New Metadata Value" }
    ]
  }
};

// With custom notification options
await notificationApiClient.updateDocumentMetadata(documentId, request, {
  successMessage: 'Metadata updated successfully!',
  errorMessage: 'Failed to update metadata'
});
```

### With Error Handling
```typescript
try {
  const request: UpdateDocumentMetadataRequestDto = {
    filingCategory: {
      id: 123,
      metaDataDto: [
        { id: 1, value: "Updated Value" }
      ]
    }
  };
  
  await DocumentService.updateDocumentMetadata(documentId, request);
  console.log('Metadata updated successfully');
} catch (error) {
  console.error('Failed to update metadata:', error);
}
```

## Migration Guide

### For Existing Code

**Before (Old Method):**
```typescript
// OLD - This will no longer work
const filingCategories: FilingCategoryDocDto[] = [
  {
    id: 123,
    metaDataDto: [
      { id: 1, value: "Value 1" },
      { id: 2, value: "Value 2" }
    ]
  }
];

await apiClient.updateDocumentFilingCategory(documentId, filingCategories);
```

**After (New Method):**
```typescript
// NEW - Updated approach
const request: UpdateDocumentMetadataRequestDto = {
  filingCategory: {
    id: 123,
    metaDataDto: [
      { id: 1, value: "Value 1" },
      { id: 2, value: "Value 2" }
    ]
  }
};

await apiClient.updateDocumentMetadata(documentId, request);
```

### Key Migration Points

1. **Parameter Structure**: Wrap the filing category in a request object
2. **Single Category**: Only one filing category per request (not an array)
3. **Return Type**: Method now returns `void` instead of `DocumentResponseDto`
4. **Method Name**: Changed from `updateDocumentFilingCategory` to `updateDocumentMetadata`

## Benefits

### 1. **Consistency with Backend**
- Matches the exact backend endpoint structure
- Proper request/response handling
- Aligned with REST API conventions

### 2. **Type Safety**
- Strong TypeScript typing for request structure
- Compile-time validation of parameters
- Better IDE support and autocomplete

### 3. **Simplified API**
- Single filing category per request (more logical)
- Clear separation of concerns
- Better error handling

### 4. **Enhanced Notifications**
- Specific success/error messages for metadata updates
- Consistent notification patterns
- Better user feedback

## Integration Points

The updated endpoint integrates with:
- Document metadata management interfaces
- Filing category selection components
- Document editing workflows
- Metadata validation systems
- Audit logging (handled by backend)

## Error Handling

The endpoint handles various error scenarios:
- **404**: Document not found
- **403**: Insufficient permissions
- **400**: Invalid request data
- **500**: Server errors

All errors are properly caught and displayed through the notification system.

This update ensures the frontend is fully aligned with the backend API changes and provides a more robust and type-safe way to update document metadata.
