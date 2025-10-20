# Document Tags Endpoints Integration

## Overview
This document describes the complete integration of document tag endpoints from the backend into the frontend. The tag system allows users to create, manage, and associate tags with documents for better organization and searchability.

## Backend Endpoints Covered

### Tag Management Endpoints
- `POST /api/v1/tags` - Create a new tag
- `GET /api/v1/tags/{id}` - Get tag by ID
- `GET /api/v1/tags/name/{name}` - Get tag by name
- `GET /api/v1/tags` - Get all tags
- `GET /api/v1/tags/user/{userId}` - Get tags by user
- `GET /api/v1/tags/my-tags` - Get current user's tags
- `GET /api/v1/tags/available` - Get available tags for current user
- `GET /api/v1/tags/system` - Get system tags
- `GET /api/v1/tags/search` - Search tags by name
- `PUT /api/v1/tags/{id}` - Update tag
- `DELETE /api/v1/tags/{id}` - Delete tag

### Document-Tag Association Endpoints
- `POST /api/v1/tags/documents/{documentId}/tags` - Add tag to document
- `DELETE /api/v1/tags/documents/{documentId}/tags/{tagId}` - Remove tag from document
- `DELETE /api/v1/tags/documents/{documentId}/tags` - Remove all tags from document
- `GET /api/v1/tags/documents/{documentId}/tags` - Get tags by document ID
- `GET /api/v1/tags/{tagId}/documents` - Get document IDs by tag ID

### Statistics Endpoints
- `GET /api/v1/tags/statistics` - Get tag statistics
- `GET /api/v1/tags/{tagId}/statistics` - Get tag statistics by tag ID

## Frontend Implementation

### 1. Type Definitions (`frontend/src/types/api.ts`)

#### Request DTOs
```typescript
export interface CreateTagRequestDto {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateTagRequestDto {
  name: string;
  description?: string;
  color?: string;
}

export interface AddTagToDocumentRequestDto {
  tagId: number;
}
```

#### Response DTOs
```typescript
export interface TagResponseDto {
  id: number;
  name: string;
  description?: string;
  color?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isSystem?: boolean;
  documentCount?: number;
}

export interface DocumentTagResponseDto {
  documentId: number;
  tagId: number;
  tagName: string;
  tagColor?: string;
  createdBy: string;
  createdAt: string;
}
```

### 2. API Client (`frontend/src/api/client.ts`)

#### Tag Management Methods
```typescript
// Create a new tag
async createTag(request: CreateTagRequestDto): Promise<TagResponseDto>

// Get tag by ID
async getTagById(id: number): Promise<TagResponseDto>

// Get tag by name
async getTagByName(name: string): Promise<TagResponseDto>

// Get all tags
async getAllTags(): Promise<TagResponseDto[]>

// Get tags by user
async getTagsByUser(userId: string): Promise<TagResponseDto[]>

// Get current user's tags
async getMyTags(): Promise<TagResponseDto[]>

// Get available tags for current user
async getAvailableTags(): Promise<TagResponseDto[]>

// Get system tags
async getSystemTags(): Promise<TagResponseDto[]>

// Search tags by name
async searchTags(name: string, page: number = 0, size: number = 20): Promise<PageResponse<TagResponseDto>>

// Update tag
async updateTag(id: number, request: UpdateTagRequestDto): Promise<TagResponseDto>

// Delete tag
async deleteTag(id: number): Promise<void>
```

#### Document-Tag Association Methods
```typescript
// Add tag to document
async addTagToDocument(documentId: number, request: AddTagToDocumentRequestDto): Promise<DocumentTagResponseDto>

// Remove tag from document
async removeTagFromDocument(documentId: number, tagId: number): Promise<void>

// Remove all tags from document
async removeAllTagsFromDocument(documentId: number): Promise<void>

// Get tags by document ID
async getTagsByDocumentId(documentId: number): Promise<TagResponseDto[]>

// Get document IDs by tag ID
async getDocumentIdsByTagId(tagId: number): Promise<number[]>
```

#### Statistics Methods
```typescript
// Get tag statistics
async getTagStatistics(): Promise<{ totalTags: number; userTags: number }>

// Get tag statistics by tag ID
async getTagStatisticsById(tagId: number): Promise<{ tagId: number; documentCount: number }>
```

### 3. Notification Client (`frontend/src/api/notificationClient.ts`)

All tag methods are wrapped with notification support:

#### Tag Management with Notifications
```typescript
// Create tag with success/error notifications
async createTag(request: CreateTagRequestDto, options?: ApiNotificationOptions)

// Get operations are silent by default
async getTagById(id: number, options?: ApiNotificationOptions)
async getAllTags(options?: ApiNotificationOptions)
async getMyTags(options?: ApiNotificationOptions)
// ... other get methods

// Update/Delete operations with notifications
async updateTag(id: number, request: UpdateTagRequestDto, options?: ApiNotificationOptions)
async deleteTag(id: number, options?: ApiNotificationOptions)
```

#### Document-Tag Operations with Notifications
```typescript
// Add tag to document
async addTagToDocument(documentId: number, request: AddTagToDocumentRequestDto, options?: ApiNotificationOptions)

// Remove tag from document
async removeTagFromDocument(documentId: number, tagId: number, options?: ApiNotificationOptions)

// Remove all tags from document
async removeAllTagsFromDocument(documentId: number, options?: ApiNotificationOptions)
```

### 4. Document Service (`frontend/src/api/services/documentService.ts`)

All tag methods are exposed through the document service:

```typescript
export class DocumentService {
  // Tag Management
  static async createTag(request: CreateTagRequestDto, options?: any): Promise<TagResponseDto>
  static async getTagById(id: number, options?: any): Promise<TagResponseDto>
  static async getAllTags(options?: any): Promise<TagResponseDto[]>
  static async getMyTags(options?: any): Promise<TagResponseDto[]>
  static async updateTag(id: number, request: UpdateTagRequestDto, options?: any): Promise<TagResponseDto>
  static async deleteTag(id: number, options?: any): Promise<void>

  // Document-Tag Operations
  static async addTagToDocument(documentId: number, request: AddTagToDocumentRequestDto, options?: any): Promise<DocumentTagResponseDto>
  static async removeTagFromDocument(documentId: number, tagId: number, options?: any): Promise<void>
  static async getTagsByDocumentId(documentId: number, options?: any): Promise<TagResponseDto[]>

  // Statistics
  static async getTagStatistics(options?: any): Promise<{ totalTags: number; userTags: number }>
  static async getTagStatisticsById(tagId: number, options?: any): Promise<{ tagId: number; documentCount: number }>
}
```

## Usage Examples

### 1. Creating a New Tag
```typescript
import { DocumentService } from '../api/services/documentService';
import { CreateTagRequestDto } from '../types/api';

const createTagRequest: CreateTagRequestDto = {
  name: "Important",
  description: "Mark important documents",
  color: "#ff0000"
};

const newTag = await DocumentService.createTag(createTagRequest);
console.log('Created tag:', newTag);
```

### 2. Getting User's Tags
```typescript
// Get current user's tags
const myTags = await DocumentService.getMyTags();

// Get all available tags
const availableTags = await DocumentService.getAvailableTags();

// Get system tags
const systemTags = await DocumentService.getSystemTags();
```

### 3. Adding Tags to Documents
```typescript
// Add a tag to a document
const addTagRequest: AddTagToDocumentRequestDto = {
  tagId: 123
};

const result = await DocumentService.addTagToDocument(documentId, addTagRequest);
console.log('Tag added to document:', result);
```

### 4. Managing Document Tags
```typescript
// Get all tags for a document
const documentTags = await DocumentService.getTagsByDocumentId(documentId);

// Remove a specific tag from a document
await DocumentService.removeTagFromDocument(documentId, tagId);

// Remove all tags from a document
await DocumentService.removeAllTagsFromDocument(documentId);
```

### 5. Searching Tags
```typescript
// Search tags by name
const searchResults = await DocumentService.searchTags("important", 0, 10);
console.log('Found tags:', searchResults.content);
```

### 6. Getting Statistics
```typescript
// Get overall tag statistics
const stats = await DocumentService.getTagStatistics();
console.log(`Total tags: ${stats.totalTags}, User tags: ${stats.userTags}`);

// Get statistics for a specific tag
const tagStats = await DocumentService.getTagStatisticsById(tagId);
console.log(`Tag ${tagStats.tagId} is used in ${tagStats.documentCount} documents`);
```

### 7. Using Direct API Client
```typescript
import { apiClient } from '../api/client';

// Direct API calls without notifications
const tag = await apiClient.getTagById(123);
const allTags = await apiClient.getAllTags();
```

### 8. Using Notification Client
```typescript
import { notificationApiClient } from '../api/notificationClient';

// With custom notification messages
const tag = await notificationApiClient.createTag(createTagRequest, {
  successMessage: 'Tag created successfully!',
  errorMessage: 'Failed to create tag'
});

// Silent operation (no notifications)
const tags = await notificationApiClient.getAllTags({ silent: true });
```

## Key Features

### 1. **Complete Tag Management**
- Create, read, update, delete tags
- Support for tag colors and descriptions
- System vs user-created tags
- Tag ownership tracking

### 2. **Document-Tag Associations**
- Add/remove tags from documents
- Bulk operations (remove all tags)
- Query documents by tags
- Query tags by documents

### 3. **Search and Discovery**
- Search tags by name with pagination
- Get available tags for current user
- System tags for common categories
- Tag statistics and usage tracking

### 4. **User Experience**
- Comprehensive notification system
- Silent operations for GET requests
- Customizable success/error messages
- Consistent API patterns

### 5. **Type Safety**
- Full TypeScript support
- Proper request/response typing
- Compile-time validation
- IDE autocomplete support

## Integration Points

The tag system integrates with:
- Document management interfaces
- Search and filtering components
- Tag selection widgets
- Document detail views
- User dashboard
- Statistics and analytics

## Benefits

### 1. **Enhanced Organization**
- Categorize documents with custom tags
- Color-coded tag system
- Hierarchical tag organization
- Bulk tag operations

### 2. **Improved Searchability**
- Find documents by tags
- Tag-based filtering
- Search within tags
- Cross-reference capabilities

### 3. **User Productivity**
- Quick document categorization
- Visual tag identification
- Efficient tag management
- Streamlined workflows

### 4. **System Integration**
- Seamless API integration
- Consistent error handling
- Real-time notifications
- Type-safe operations

This comprehensive tag system provides a robust foundation for document organization and management within the DMS application.





