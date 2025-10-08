# AebDMS Frontend API Client

This directory contains the complete API client for the AebDMS frontend application, generated from the Spring Boot backend.

## Structure

```
src/api/
├── client.ts                    # Main API client with axios configuration
├── services/                    # Individual service classes
│   ├── userService.ts          # User management endpoints
│   ├── roleService.ts          # Role management endpoints
│   ├── groupService.ts         # Group management endpoints
│   ├── documentService.ts      # Document management endpoints
│   ├── folderService.ts        # Folder management endpoints
│   ├── filingCategoryService.ts # Filing categories and metadata lists
│   └── searchService.ts        # Search functionality
├── index.ts                    # Main exports
└── README.md                   # This file
```

## Usage

### Basic Usage

```typescript
import { UserService, DocumentService, FolderService } from '@/api';

// Get all users
const users = await UserService.getAllUsers({ page: 0, size: 20 });

// Upload a document
const document = await DocumentService.uploadDocument(
  file,
  folderId,
  ExtractorLanguage.ENG,
  filingCategories
);

// Create a folder
const folder = await FolderService.createFolder({
  name: 'New Folder',
  description: 'Folder description',
  parentId: 1
});
```

### Using the Main API Client

```typescript
import { apiClient } from '@/api';

// Direct API calls
const users = await apiClient.getAllUsers();
const document = await apiClient.uploadDocument(file, folderId, lang, categories);
```

## Available Endpoints

### User Management (`/api/v1/admin/users`)
- `createUser(data)` - Create new user
- `getUserById(id)` - Get user by ID
- `getAllUsers(params)` - Get all users with pagination
- `updateUser(id, data)` - Update user
- `deleteUser(id)` - Delete user

### Role Management (`/api/v1/admin/roles`)
- `createRole(data)` - Create new role
- `getRoleById(id)` - Get role by ID
- `getAllRoles(params)` - Get all roles
- `updateRole(id, data)` - Update role
- `deleteRole(id)` - Delete role
- `getRoleUsers(roleName, params)` - Get users by role
- `assignRoleToUser(roleName, userId)` - Assign role to user
- `removeRoleFromUser(roleName, userId)` - Remove role from user
- `assignPermissionToRole(roleName, permission)` - Assign permission to role
- `removePermissionFromRole(roleName, permission)` - Remove permission from role
- `getAllPermissions()` - Get all available permissions
- `assignPermissionToUser(userId, permission)` - Assign permission to user
- `removePermissionFromUser(userId, permission)` - Remove permission from user

### Group Management (`/api/v1/admin/groups`)
- `createGroup(data)` - Create new group
- `getGroupById(id)` - Get group by ID
- `getGroupByPath(path)` - Get group by path
- `getAllGroups(params)` - Get all groups
- `updateGroup(id, data)` - Update group
- `deleteGroup(id)` - Delete group
- `addUserToGroup(groupId, userId)` - Add user to group
- `removeUserFromGroup(groupId, userId)` - Remove user from group
- `getGroupMembers(groupId, params)` - Get group members
- `addRoleToGroup(groupId, role)` - Add role to group
- `removeRoleFromGroup(groupId, role)` - Remove role from group
- `getGroupRoles(groupId, params)` - Get group roles
- `addPermissionToGroup(groupId, permission)` - Add permission to group
- `removePermissionFromGroup(groupId, permission)` - Remove permission from group
- `getGroupPermissions(groupId, params)` - Get group permissions

### Document Management (`/api/v1/document`)
- `uploadDocument(file, folderId, lang, filingCategories)` - Upload document
- `renameDocument(id, name)` - Rename document
- `moveDocument(id, to)` - Move document
- `downloadDocument(id, params)` - Download document
- `getDocumentShared(id, params)` - Get document shared permissions
- `createOrUpdateDocumentShared(folderId, data)` - Create/update document shared permission
- `deleteDocumentShared(folderId, granteeId)` - Delete document shared permission
- `deleteDocument(id)` - Delete document

### Folder Management (`/api/v1/folder`)
- `createFolder(data)` - Create folder
- `getFolder(id, params)` - Get folder by ID
- `getFolderByPath(path, params)` - Get folder by path
- `getRepository(params)` - Get repository (root folders)
- `getSharedFolders(params)` - Get shared folders
- `renameFolder(id, name)` - Rename folder
- `moveFolder(id, to)` - Move folder
- `getFolderShared(id, params)` - Get folder shared permissions
- `createOrUpdateFolderShared(folderId, data)` - Create/update folder shared permission
- `deleteFolderShared(folderId, granteeId, inherits)` - Delete folder shared permission
- `deleteFolder(id)` - Delete folder

### Filing Categories (`/api/v1/filing-categories`)
- `createFilingCategory(data)` - Create filing category
- `getAllFilingCategories(params)` - Get all filing categories
- `getFilingCategoryById(id)` - Get filing category by ID
- `updateFilingCategory(id, data)` - Update filing category
- `deleteFilingCategory(id)` - Delete filing category

### Metadata Lists (`/api/v1/filing-categories/list`)
- `createMetadataList(data)` - Create metadata list
- `getAllMetadataLists(params)` - Get all metadata lists
- `getMetadataListById(id)` - Get metadata list by ID
- `updateMetadataList(id, data)` - Update metadata list
- `deleteMetadataList(id)` - Delete metadata list

### Search (`/api/v1/search`)
- `globalSearch(params)` - Global search across documents and folders

## Types

All TypeScript types are exported from `@/types/api` and include:

- **User Types**: `UserDto`, `FullUserDto`, `UserCreateReq`, `UserUpdateReq`
- **Role Types**: `RoleDto`, `RoleCreateReq`, `RoleUpdateReq`
- **Group Types**: `GroupDto`, `GroupCreateReq`, `GroupUpdateReq`
- **Document Types**: `DocumentResponseDto`, `DocumentUploadRequestDto`, `DocumentPermissionReq`
- **Folder Types**: `FolderResDto`, `CreateFolderDto`, `FolderPermissionReq`
- **Filing Category Types**: `FilingCategoryRequestDto`, `FilingCategoryResponseDto`
- **Search Types**: `GlobalSearchResultDto`, `Filters`
- **Common Types**: `PageResponse`, `PageMeta`, `ApiResponse`
- **Enums**: `GranteeType`, `ExtractorLanguage`, `SortFields`, `SearchFields`, etc.

## Configuration

The API client is configured with:
- Base URL: `http://localhost:8080` (configurable)
- Timeout: 30 seconds
- Automatic error handling
- Request/response interceptors for auth tokens

## Authentication

The API client includes interceptors for authentication. You'll need to implement the token retrieval logic in the request interceptor:

```typescript
// In client.ts, uncomment and modify:
const token = getAuthToken(); // Your token retrieval logic
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

## Error Handling

All API calls include proper error handling with:
- HTTP status code checking
- 404 handling (returns null for single resource endpoints)
- Console error logging
- Promise rejection for other errors

## Examples

### Upload Document with Filing Categories

```typescript
import { DocumentService, ExtractorLanguage } from '@/api';

const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
const filingCategories = [
  {
    id: 1,
    metaDataDto: [
      { id: 1, value: 'Important' }
    ]
  }
];

const document = await DocumentService.uploadDocument(
  file,
  folderId,
  ExtractorLanguage.ENG,
  filingCategories
);
```

### Search with Filters

```typescript
import { SearchService } from '@/api';

const results = await SearchService.globalSearch({
  query: 'important document',
  includeDocuments: true,
  includeFolders: true,
  lookUpOcrContent: true,
  sortBy: 'score',
  sortDesc: true,
  page: 0,
  size: 20
});
```

### Manage User Roles

```typescript
import { RoleService } from '@/api';

// Get all available permissions
const permissions = await RoleService.getAllPermissions();

// Assign role to user
await RoleService.assignRoleToUser('Editor', 'user-id');

// Create role
const role = await RoleService.createRole({
  name: 'Editor',
  description: 'Can edit documents',
  permissions: ['MODEL_WRITE', 'MODEL_UPDATE']
});
```
