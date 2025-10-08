# Document GetOne Endpoint Update

## Overview
This document describes the updates made to the frontend to match the updated return type of the `getOne` endpoint in the backend. The endpoint now returns an enhanced `DocumentResponseDto` with additional fields.

## Backend Endpoint
```java
@GetMapping("/{id}")
public ResponseEntity<DocumentResponseDto> getOne(@AuthenticationPrincipal Jwt jwt,
                                       @NonNull @PathVariable("id") Long id){
    return ResponseEntity.status(HttpStatus.OK)
            .body(documentMapper.toDocumentUploadResponseDto(documentService.findById(id,jwt.getSubject()), jwt.getSubject()));
}
```

## Frontend Updates

### 1. Enhanced DocumentResponseDto (`frontend/src/types/api.ts`)

**New Fields Added:**
- `description?: string` - Document description
- `activeVersion?: number` - Currently active version number
- `filingCategory?: DocumentFilingCategoryResponseDto` - Detailed filing category information

**Updated Interface:**
```typescript
export interface DocumentResponseDto {
  documentId: number;
  versionId: number;
  createdBy: UserDto;
  ownedBy: UserDto;
  name: string;
  title: string;
  description?: string;           // ← NEW
  path: string;
  folderId: number;
  sizeBytes: number;
  mimeType: string;
  versionNumber: number;
  activeVersion?: number;         // ← NEW
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  metadata: string[];
  filingCategory?: DocumentFilingCategoryResponseDto; // ← NEW
  userPermissions: DocumentPermissionResDto;
}
```

### 2. New Supporting Types

**DocumentMetadataResponseDto:**
```typescript
export interface DocumentMetadataResponseDto {
  metadataId: number;
  metadataName: string;
  value: string;
  categoryName: string;
  categoryId: number;
}
```

**DocumentFilingCategoryResponseDto:**
```typescript
export interface DocumentFilingCategoryResponseDto {
  id: number;
  name: string;
  description?: string;
  metadata: DocumentMetadataResponseDto[];
}
```

### 3. DocumentViewDto Update (`frontend/src/types/documentView.ts`)

**Removed Duplicate Field:**
- Removed duplicate `description` field since it's now included in the base `DocumentResponseDto`

**Updated Interface:**
```typescript
export interface DocumentViewDto extends DocumentResponseDto {
  contentUrl: string;
  thumbnailUrl?: string;
  // description removed - now inherited from DocumentResponseDto
  modelConfigurations?: ModelConfiguration[];
  aiModels?: AIModel[];
  relatedDocuments?: RelatedDocument[];
  accessLogs?: AccessLog[];
}
```

### 4. API Client Updates (`frontend/src/api/client.ts`)

**Added New Type Imports:**
```typescript
import {
  // ... existing imports
  DocumentMetadataResponseDto,
  DocumentFilingCategoryResponseDto,
  // ... other imports
} from '../types/api';
```

**Existing Method Unchanged:**
The `getDocument(id: number): Promise<DocumentResponseDto>` method remains the same but now returns the enhanced response type.

## New Features Available

### 1. Document Description
```typescript
const document = await apiClient.getDocument(documentId);
console.log(document.description); // Now available
```

### 2. Active Version Information
```typescript
const document = await apiClient.getDocument(documentId);
console.log(`Active version: ${document.activeVersion}`);
console.log(`Current version: ${document.versionNumber}`);
```

### 3. Detailed Filing Category Information
```typescript
const document = await apiClient.getDocument(documentId);
if (document.filingCategory) {
  console.log(`Category: ${document.filingCategory.name}`);
  console.log(`Description: ${document.filingCategory.description}`);
  
  document.filingCategory.metadata.forEach(meta => {
    console.log(`${meta.metadataName}: ${meta.value}`);
  });
}
```

## Usage Examples

### Basic Document Retrieval
```typescript
import { apiClient } from '../api/client';

const document = await apiClient.getDocument(123);
console.log(`Document: ${document.name}`);
console.log(`Description: ${document.description || 'No description'}`);
console.log(`Active Version: ${document.activeVersion || document.versionNumber}`);
```

### Using Document Service
```typescript
import { DocumentService } from '../api/services/documentService';

const document = await DocumentService.getDocument(123);
// All new fields are available
```

### Using Notification Client
```typescript
import { notificationApiClient } from '../api/notificationClient';

const document = await notificationApiClient.getDocument(123, { silent: true });
// Enhanced response with new fields
```

### Accessing Filing Category Data
```typescript
const document = await apiClient.getDocument(123);

if (document.filingCategory) {
  // Display category information
  console.log(`Category: ${document.filingCategory.name}`);
  
  // Display metadata
  document.filingCategory.metadata.forEach(metadata => {
    console.log(`${metadata.metadataName}: ${metadata.value}`);
  });
}
```

## Benefits

### 1. Enhanced Document Information
- **Description**: Rich document descriptions for better context
- **Active Version**: Clear indication of which version is currently active
- **Filing Category**: Detailed metadata and categorization information

### 2. Better User Experience
- More comprehensive document details
- Better metadata display capabilities
- Enhanced document management features

### 3. Backward Compatibility
- All existing fields remain unchanged
- New fields are optional (marked with `?`)
- Existing code continues to work without modification

### 4. Type Safety
- Full TypeScript support for new fields
- Proper type definitions for nested objects
- Compile-time checking for field access

## Migration Notes

### For Existing Code
- **No Breaking Changes**: Existing code continues to work
- **Optional Fields**: New fields are optional and can be safely ignored
- **Gradual Adoption**: Can be adopted incrementally

### For New Development
- **Use New Fields**: Take advantage of description, activeVersion, and filingCategory
- **Enhanced UI**: Build richer interfaces using the additional data
- **Better UX**: Provide more context and information to users

## Integration Points

The updated endpoint integrates with:
- Document detail views
- Version management interfaces
- Metadata display components
- Filing category management
- Document search and listing

This update provides a more comprehensive and feature-rich document response that enables better document management and user experience in the DMS application.

