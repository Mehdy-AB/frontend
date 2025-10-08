# Upload Document Version Update

## Overview
This document describes the changes made to remove the `filingCategoryDto` parameter from the `uploadDocumentVersion` endpoint across the frontend application.

## Changes Made

### 1. API Client (`frontend/src/api/client.ts`)
**Before:**
```typescript
async uploadDocumentVersion(
  file: File,
  documentId: number,
  lang: ExtractorLanguage,
  filingCategoryDto?: FilingCategoryDocDto[]
): Promise<DocumentResponseDto>
```

**After:**
```typescript
async uploadDocumentVersion(
  file: File,
  documentId: number,
  lang: ExtractorLanguage
): Promise<DocumentResponseDto>
```

**Changes:**
- Removed `filingCategoryDto` parameter
- Removed FormData logic for filing categories
- Simplified the method signature

### 2. Notification Client (`frontend/src/api/notificationClient.ts`)
**Before:**
```typescript
async uploadDocumentVersion(file: File, documentId: number, lang: any, filingCategoryDto: any[], options?: ApiNotificationOptions)
```

**After:**
```typescript
async uploadDocumentVersion(file: File, documentId: number, lang: any, options?: ApiNotificationOptions)
```

**Changes:**
- Removed `filingCategoryDto` parameter
- Updated method call to API client

### 3. Document Service (`frontend/src/api/services/documentService.ts`)
**Before:**
```typescript
static async uploadDocumentVersion(
  file: File,
  documentId: number,
  lang: ExtractorLanguage,
  filingCategoryDto?: FilingCategoryDocDto[],
  options?: any
): Promise<DocumentResponseDto>
```

**After:**
```typescript
static async uploadDocumentVersion(
  file: File,
  documentId: number,
  lang: ExtractorLanguage,
  options?: any
): Promise<DocumentResponseDto>
```

**Changes:**
- Removed `filingCategoryDto` parameter
- Updated method call to notification client

### 4. Version Management Modal (`frontend/src/components/document/VersionManagementModal.tsx`)
**Before:**
```typescript
await notificationApiClient.uploadDocumentVersion(
  selectedFile,
  document.documentId,
  { lang: 'eng' }, // Default language
  [] // Empty filing categories for now
);
```

**After:**
```typescript
await notificationApiClient.uploadDocumentVersion(
  selectedFile,
  document.documentId,
  { lang: 'eng' } // Default language
);
```

**Changes:**
- Removed empty filing categories array parameter

### 5. Additional Fix: Document Description Method
**Added missing method to API client:**
```typescript
async updateDocumentDescription(id: number, data: any): Promise<void> {
  await this.client.put(`/api/v1/document/${id}/description`, data);
}
```

**Updated notification client to use correct method:**
```typescript
async editDocumentDescription(id: number, description: string, options?: ApiNotificationOptions) {
  return this.withNotification(
    () => apiClient.updateDocumentDescription(id, { description }),
    { successMessage: 'Document description updated successfully', errorMessage: 'Failed to update document description', ...options },
    'update'
  )
}
```

## Impact

### Benefits
1. **Simplified API**: Removed unnecessary parameter that was not being used
2. **Cleaner Code**: Reduced complexity in method signatures and implementations
3. **Consistency**: Aligned frontend with backend endpoint changes
4. **Maintainability**: Easier to maintain without unused parameters

### Files Modified
- `frontend/src/api/client.ts`
- `frontend/src/api/notificationClient.ts`
- `frontend/src/api/services/documentService.ts`
- `frontend/src/components/document/VersionManagementModal.tsx`

### Backward Compatibility
- This is a breaking change for any code that was passing `filingCategoryDto` to `uploadDocumentVersion`
- All existing calls have been updated to remove the parameter
- No migration needed as the parameter was optional and typically passed as empty array

## Usage Examples

### Before (Old Usage)
```typescript
// This would no longer work
await notificationApiClient.uploadDocumentVersion(
  file,
  documentId,
  { lang: 'eng' },
  [] // filingCategoryDto - removed
);
```

### After (New Usage)
```typescript
// Simplified usage
await notificationApiClient.uploadDocumentVersion(
  file,
  documentId,
  { lang: 'eng' }
);
```

### Using Document Service
```typescript
import { DocumentService } from '../api/services/documentService';

await DocumentService.uploadDocumentVersion(
  file,
  documentId,
  { lang: 'eng' }
);
```

### Using Direct API Client
```typescript
import { apiClient } from '../api/client';

await apiClient.uploadDocumentVersion(
  file,
  documentId,
  { lang: 'eng' }
);
```

## Testing
- All linting errors have been resolved
- Method signatures are consistent across all layers
- No breaking changes to other functionality
- Document description method has been properly implemented

This update simplifies the document version upload process by removing the unused filing category parameter, making the API cleaner and more maintainable.
