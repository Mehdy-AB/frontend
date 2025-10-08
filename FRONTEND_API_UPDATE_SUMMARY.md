# Frontend API Update Summary

This document summarizes all the updates made to synchronize the frontend API with the backend changes.

## Updated Files

### 1. Types (`frontend/src/types/api.ts`)

#### Document Types
- ✅ Added `title` field to `DocumentResponseDto`
- ✅ Added `DocumentVersionUploadRequestDto` interface
- ✅ Added `EditDocumentTitleRequestDto` interface
- ✅ Updated `DocumentUploadRequestDto` to include `title` parameter

#### Search Types
- ✅ Updated `GlobalSearchResultDto` structure to match backend
- ✅ Enhanced `SearchDocumentsRes` with version information fields
- ✅ Added `DocumentVersionInfo` interface for version details

#### Favorite Types
- ✅ Added `FolderFavorite` interface for folder favorites
- ✅ Maintained existing `Favorite` interface for document favorites

### 2. API Client (`frontend/src/api/client.ts`)

#### Document Endpoints
- ✅ Updated `uploadDocument()` - Added `title` parameter
- ✅ Added `editDocumentTitle()` - Edit document title
- ✅ Added `uploadDocumentVersion()` - Upload new document version

#### Search Endpoints
- ✅ Added `enhancedSearch()` - Enhanced search with version support
- ✅ Added `searchInVersions()` - Search in document versions
- ✅ Added `getDocumentVersions()` - Get all versions of a document

#### Audit Log Endpoints
- ✅ Updated `getAuditLogsBySearchTerm()` - Search audit logs by term (replaced getAuditLogsByAction)

#### Favorite Endpoints
- ✅ Added `addFolderToFavorites()` - Add folder to favorites
- ✅ Added `removeFolderFromFavorites()` - Remove folder from favorites
- ✅ Added `isFolderFavorite()` - Check if folder is favorite
- ✅ Added `getMyFolderFavorites()` - Get user's folder favorites
- ✅ Added `getFolderFavoritesByFolder()` - Get favorites for specific folder
- ✅ Added `getMyFolderFavoritesCount()` - Get folder favorites count
- ✅ Added `getMyRepo()` - Get all favorites (documents + folders)
- ✅ Added `getMyRepoCount()` - Get count of all favorites
- ✅ Added `checkFavoriteStatus()` - Bulk status check for multiple items

### 3. Notification Client (`frontend/src/api/notificationClient.ts`)

All endpoints from the API client have been wrapped with notification support:

#### Document Endpoints
- ✅ `uploadDocument()` - With title parameter
- ✅ `editDocumentTitle()` - Edit title notification
- ✅ `uploadDocumentVersion()` - Version upload notification

#### Search Endpoints
- ✅ `enhancedSearch()` - Silent (no notifications)
- ✅ `searchInVersions()` - Silent
- ✅ `getDocumentVersions()` - Silent

#### Audit Log Endpoints
- ✅ `getAuditLogsBySearchTerm()` - Silent

#### Favorite Endpoints (All with appropriate notifications)
- ✅ `addFolderToFavorites()`
- ✅ `removeFolderFromFavorites()`
- ✅ `isFolderFavorite()`
- ✅ `getMyFolderFavorites()`
- ✅ `getFolderFavoritesByFolder()`
- ✅ `getMyFolderFavoritesCount()`
- ✅ `getMyRepo()`
- ✅ `getMyRepoCount()`
- ✅ `checkFavoriteStatus()`

### 4. Service Layer

#### Created/Updated Services

**DocumentService** (`frontend/src/api/services/documentService.ts`)
- ✅ Updated `uploadDocument()` - Added title parameter
- ✅ Added `editDocumentTitle()` method
- ✅ Added `uploadDocumentVersion()` method

**SearchService** (`frontend/src/api/services/searchService.ts`) - NEW
- ✅ `enhancedSearch()` - Enhanced search with version support
- ✅ `searchInVersions()` - Search in document versions
- ✅ `getDocumentVersions()` - Get document versions
- ✅ `globalSearch()` - Legacy global search

**FavoriteService** (`frontend/src/api/services/favoriteService.ts`)
- ✅ Added all folder favorite methods
- ✅ Added combined favorites methods
- ✅ Added bulk status check method

**AuditLogService** (`frontend/src/api/services/auditLogService.ts`) - NEW
- ✅ `getAllAuditLogs()` - Get all audit logs
- ✅ `getAuditLogsByUser()` - Get logs by user
- ✅ `getAuditLogsByEntity()` - Get logs by entity
- ✅ `getAuditLogsBySearchTerm()` - Search audit logs
- ✅ `getAuditLogsByDateRange()` - Get logs by date range
- ✅ `getUserActivityStatistics()` - Get user activity stats
- ✅ `getEntityTypeStatistics()` - Get entity type stats

## Backend API Endpoints Coverage

### Document Controller (`/api/v1/document`)
- ✅ `POST /` - Upload document (with title)
- ✅ `PUT /rename/{id}` - Rename document
- ✅ `PUT /title/{id}` - Edit document title
- ✅ `POST /version` - Upload document version
- ✅ `PUT /move/{id}/{to}` - Move document
- ✅ `GET /download/{id}` - Download document
- ✅ `GET /{id}` - Get document
- ✅ `GET /{id}/share` - Get document permissions
- ✅ `POST /{folderId}/share` - Create/update permissions
- ✅ `DELETE /{folderId}/share/{granteeId}` - Delete permission
- ✅ `DELETE /{id}` - Delete document

### Folder Controller (`/api/v1/folder`)
- ✅ `POST /` - Create folder
- ✅ `GET /{id}` - Get folder
- ✅ `GET /path` - Get folder by path
- ✅ `GET /` - Get repository
- ✅ `GET /shared` - Get shared folders
- ✅ `PUT /rename/{id}` - Rename folder
- ✅ `PUT /move/{id}/{to}` - Move folder
- ✅ `GET /to-move/{id}` - Get allowed folders to move
- ✅ `GET /{id}/share` - Get folder permissions
- ✅ `POST /{folderId}/share` - Create/update permissions
- ✅ `DELETE /{folderId}/share/{granteeId}` - Delete permission
- ✅ `DELETE /{id}` - Delete folder

### Enhanced Search Controller (`/api/v1/search`)
- ✅ `GET /enhanced` - Enhanced search with versions
- ✅ `GET /versions` - Search in versions
- ✅ `GET /document/{documentId}/versions` - Get document versions
- ✅ `GET /` - Global search (legacy)

### Favorite Controller (`/api/v1/favorites`)
- ✅ `POST /document/{documentId}` - Add document to favorites
- ✅ `DELETE /document/{documentId}` - Remove document from favorites
- ✅ `GET /document/{documentId}/check` - Check if document is favorite
- ✅ `GET /my-favorites` - Get my document favorites
- ✅ `GET /user/{userId}` - Get user's favorites
- ✅ `GET /document/{documentId}` - Get document favorites
- ✅ `GET /my-favorites/count` - Get my favorites count
- ✅ `GET /user/{userId}/count` - Get user favorites count
- ✅ `GET /document/{documentId}/count` - Get document favorites count
- ✅ `GET /` - Get all favorites (admin)
- ✅ `POST /folder/{folderId}` - Add folder to favorites
- ✅ `DELETE /folder/{folderId}` - Remove folder from favorites
- ✅ `GET /folder/{folderId}/check` - Check if folder is favorite
- ✅ `GET /my-folder-favorites` - Get my folder favorites
- ✅ `GET /folder/{folderId}` - Get folder favorites
- ✅ `GET /my-folder-favorites/count` - Get my folder favorites count
- ✅ `GET /my-repo` - Get all favorites (combined)
- ✅ `GET /my-repo/count` - Get all favorites count
- ✅ `POST /check-status` - Check favorite status (bulk)

### Comment Controller (`/api/v1/comments`)
- ✅ All endpoints already implemented

### Recycle Bin Controller (`/api/v1/recycle-bin`)
- ✅ All endpoints already implemented

### Audit Log Controller (`/api/v1/admin/audit-logs`)
- ✅ `GET /` - Get all audit logs
- ✅ `GET /user/{userId}` - Get logs by user
- ✅ `GET /entity/{entityType}/{entityId}` - Get logs by entity
- ✅ `GET /search` - Search audit logs
- ✅ `GET /date-range` - Get logs by date range
- ✅ `GET /statistics/user-activity` - Get user activity stats
- ✅ `GET /statistics/entity-types` - Get entity type stats

### User Controller (`/api/v1/admin/users`)
- ✅ All endpoints already implemented

### Role Controller (`/api/v1/admin/roles`)
- ✅ All endpoints already implemented

### Group Controller (`/api/v1/admin/groups`)
- ✅ All endpoints already implemented

### Filing Category Controller (`/api/v1/filing-categories`)
- ✅ All endpoints already implemented

### List Controller (`/api/v1/filing-categories/list`)
- ✅ All endpoints already implemented

## Usage Examples

### Document Operations
```typescript
// Upload document with title
await DocumentService.uploadDocument(
  file, 
  folderId, 
  "Document Title", 
  ExtractorLanguage.ENG, 
  filingCategories
);

// Edit document title
await DocumentService.editDocumentTitle(documentId, { title: "New Title" });

// Upload document version
await DocumentService.uploadDocumentVersion(
  file, 
  documentId, 
  ExtractorLanguage.ENG, 
  filingCategories
);
```

### Enhanced Search
```typescript
// Enhanced search with version support
const results = await SearchService.enhancedSearch("query", {
  page: 0,
  size: 20,
  includeDocuments: true,
  includeFolders: true,
  lookUpOcrContent: true
});

// Search in document versions
const versionResults = await SearchService.searchInVersions("query", {
  lookUpDocumentName: true,
  lookUpOcrContent: true
});

// Get document versions
const versions = await SearchService.getDocumentVersions(documentId, "query");
```

### Folder Favorites
```typescript
// Add folder to favorites
await favoriteService.addFolderToFavorites(folderId);

// Check if folder is favorite
const { isFavorite } = await favoriteService.isFolderFavorite(folderId);

// Get all favorites (documents + folders)
const allFavorites = await favoriteService.getMyRepo({ page: 0, size: 20 });

// Check multiple items status
const status = await favoriteService.checkFavoriteStatus({
  documentIds: [1, 2, 3],
  folderIds: [10, 20, 30]
});
```

### Audit Logs
```typescript
// Search audit logs
const logs = await AuditLogService.getAuditLogsBySearchTerm("search term", {
  page: 0,
  size: 20
});

// Get user activity statistics
const stats = await AuditLogService.getUserActivityStatistics(
  startDate,
  endDate
);
```

## Breaking Changes

1. **Document Upload**: Now requires `title` parameter
   - Before: `uploadDocument(file, folderId, lang, filingCategories)`
   - After: `uploadDocument(file, folderId, title, lang, filingCategories)`

2. **Audit Log Search**: Changed from action-based to search term
   - Before: `getAuditLogsByAction(action, params)`
   - After: `getAuditLogsBySearchTerm(searchTerm, params)`

## Migration Guide

### Updating Document Upload Calls
```typescript
// Old
await DocumentService.uploadDocument(file, folderId, lang, categories);

// New
await DocumentService.uploadDocument(file, folderId, "Document Title", lang, categories);
```

### Updating Audit Log Searches
```typescript
// Old
await auditLogService.getAuditLogsByAction("CREATE", params);

// New
await AuditLogService.getAuditLogsBySearchTerm("CREATE", params);
```

## Testing Checklist

- [ ] Test document upload with title
- [ ] Test document title editing
- [ ] Test document version upload
- [ ] Test enhanced search functionality
- [ ] Test version search
- [ ] Test folder favorites (add/remove/check)
- [ ] Test combined favorites retrieval
- [ ] Test bulk favorite status check
- [ ] Test audit log search
- [ ] Test audit log statistics

## Notes

- All GET operations are silent (no notifications)
- All POST/PUT/DELETE operations show success/error notifications
- All services use the notification client wrapper for consistent UX
- All types match the backend DTOs exactly
- Backward compatibility maintained where possible

## Completion Status

✅ All backend endpoints have been implemented in the frontend
✅ All types match the backend DTOs
✅ All services follow the same pattern
✅ Notification support added for all operations
✅ No linter errors

