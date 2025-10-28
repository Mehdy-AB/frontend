# Frontend API Services

This directory contains all the API service classes for interacting with the backend AebDMS application. Each service provides methods for CRUD operations and specific functionality related to different entities.

## Overview

The API services are built on top of a centralized `ApiClient` that handles:
- Automatic JWT token management and refresh
- Request/response interceptors
- Error handling
- File upload/download capabilities

## Services

### Core Services

#### `ApiClient` (`client.ts`)
Base HTTP client with automatic authentication and error handling.

#### `AuthService` (`authService.ts`)
Handles authentication operations:
- Login/logout
- Token refresh
- Password management
- Email verification

#### `UserManagementService` (`userManagementService.ts`)
User management operations:
- CRUD operations for users
- User search and filtering
- Status management
- Bulk operations

#### `RoleManagementService` (`roleManagementService.ts`)
Role and permission management:
- CRUD operations for roles
- Permission assignment/removal
- User-role assignments
- Role cloning

#### `GroupManagementService` (`groupManagementService.ts`)
Group management operations:
- CRUD operations for groups
- Group hierarchy management
- User-group assignments
- Role-group assignments

### Document Management Services

#### `DocumentService` (`documentService.ts`)
Document operations:
- Document upload and versioning
- Document CRUD operations
- Permission management
- Sharing functionality
- Search and filtering

#### `FolderService` (`folderService.ts`)
Folder operations:
- Folder CRUD operations
- Folder hierarchy management
- Permission management
- Sharing functionality
- Content management

#### `SearchService` (`searchService.ts`)
Search functionality:
- Unified search (database + Elasticsearch)
- Advanced search with filters
- Search suggestions
- Saved searches
- Search history

### Content Services

#### `TagService` (`tagService.ts`)
Tag management:
- Tag CRUD operations
- Document tagging
- Tag search and filtering
- Usage statistics

#### `LinkRuleService` (`linkRuleService.ts`)
Document linking and rules:
- Link rule management
- Rule execution
- Document link operations
- Cache management

#### `FilingCategoryService` (`filingCategoryService.ts`)
Filing categories and metadata:
- Category management
- Metadata list management
- Field management
- Type definitions

#### `CommentService` (`commentService.ts`)
Comment system:
- Comment CRUD operations
- Thread management
- Entity-specific comments
- Search functionality

### Utility Services

#### `FavoriteService` (`favoriteService.ts`)
Favorites management:
- Add/remove favorites
- Favorite lists
- Export/import functionality

#### `RecycleBinService` (`recycleBinService.ts`)
Recycle bin operations:
- Move to recycle bin
- Restore operations
- Permanent deletion
- Cleanup operations

#### `AuditLogService` (`auditLogService.ts`)
Audit logging:
- Log retrieval
- Search and filtering
- Statistics and trends
- Export functionality

#### `ClassAService` (`classAService.ts`)
Class A document management:
- Specialized document handling
- Category-based operations
- Statistics and reporting

## Usage Examples

### Basic Usage

```typescript
import { 
  userManagementService, 
  documentService, 
  searchService 
} from '@/api/services';

// Get users with pagination
const users = await userManagementService.getUsers(0, 20);

// Upload a document
const document = await documentService.uploadDocument({
  file: fileObject,
  folderId: 123,
  createdBy: 'user-id',
  lang: 'eng',
  title: 'My Document'
});

// Search documents
const results = await searchService.unifiedSearch({
  query: 'important document',
  page: 0,
  size: 10
});
```

### Error Handling

```typescript
import { apiClient } from '@/api/client';

try {
  const result = await userManagementService.getUserById('user-id');
  console.log(result);
} catch (error) {
  if (error.response?.status === 401) {
    // Token expired, will be automatically refreshed
    console.log('Authentication required');
  } else if (error.response?.status === 403) {
    console.log('Permission denied');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### File Operations

```typescript
import { documentService } from '@/api/services';

// Upload file
const formData = new FormData();
formData.append('file', file);
formData.append('folderId', '123');
formData.append('createdBy', 'user-id');
formData.append('lang', 'eng');
formData.append('title', 'Document Title');

const document = await documentService.uploadDocument(formData);

// Download file
const blob = await documentService.downloadDocument(documentId);
const url = URL.createObjectURL(blob);
```

### Search with Filters

```typescript
import { searchService } from '@/api/services';

const results = await searchService.advancedSearch({
  query: 'contract',
  ownerId: 'user-id',
  createdAt: {
    from: '2024-01-01',
    to: '2024-12-31'
  },
  metadataOperations: [
    {
      metadataId: 1,
      operator: 'EQUAL',
      value: 'signed'
    }
  ],
  page: 0,
  size: 20,
  sortBy: 'createdAt',
  sortDirection: 'desc'
});
```

## Type Safety

All services are fully typed with TypeScript interfaces defined in `types/api.ts`. This provides:

- IntelliSense support
- Compile-time error checking
- Auto-completion
- Type safety for request/response data

## Authentication

The API client automatically handles JWT token management:

1. **Token Storage**: Tokens are stored in memory and synced with NextAuth session
2. **Automatic Refresh**: Expired tokens are automatically refreshed
3. **Request Interception**: All requests include the current access token
4. **Error Handling**: 401 errors trigger token refresh or redirect to login

## Pagination

Most list endpoints support pagination with consistent parameters:

```typescript
interface PaginationParams {
  page: number;        // Page number (0-based)
  size: number;        // Items per page
  sortBy?: string;     // Sort field
  sortDirection?: 'asc' | 'desc'; // Sort direction
}
```

## Error Handling

The API client provides consistent error handling:

- **401 Unauthorized**: Automatic token refresh
- **403 Forbidden**: Permission denied
- **404 Not Found**: Resource not found
- **500 Server Error**: Server-side error

## File Upload/Download

Special methods are provided for file operations:

- `uploadFile()`: Upload files with FormData
- `downloadFile()`: Download files as Blob
- Automatic content-type handling
- Progress tracking support

## Configuration

Environment variables:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXTAUTH_SECRET=your-secret-key
```

## Best Practices

1. **Use TypeScript**: Always use the provided types for better development experience
2. **Handle Errors**: Always wrap API calls in try-catch blocks
3. **Pagination**: Use pagination for large datasets
4. **Caching**: Consider implementing client-side caching for frequently accessed data
5. **Loading States**: Show loading indicators during API calls
6. **Error Messages**: Display user-friendly error messages

## Migration from Keycloak

This API service layer replaces the previous Keycloak-based authentication system with:

- Custom JWT token management
- Backend API integration
- NextAuth.js session management
- Comprehensive permission system

All authentication flows now go through the backend API instead of Keycloak.

