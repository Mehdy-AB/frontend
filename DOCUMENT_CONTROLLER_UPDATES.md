# Document Controller Updates - New Types and Endpoints

## Overview
This document summarizes the new types and endpoints added to the frontend based on the updated DocumentController in the backend. The updates include ClassA document management, bulk upload functionality, enhanced document search, and additional document management features.

## 🆕 New Types Added

### ClassA Document Types

#### `ClassAUploadRequestDto`
```typescript
interface ClassAUploadRequestDto {
  folderId: number;
  createdBy: string;
  title: string;
  fileName?: string;
  tagsJson?: string;
  categoryId: number;
}
```

#### `ClassAResponseDto`
```typescript
interface ClassAResponseDto {
  id: number;
  name: string;
  title: string;
  description?: string;
  folderId: number;
  createdBy: string;
  ownedBy: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  categoryId: number;
  categoryName: string;
  activeVersionId: number;
  minioKey: string;
  sizeBytes: number;
  mimeType: string;
}
```

#### `ClassADetailResponseDto`
```typescript
interface ClassADetailResponseDto {
  id: number;
  name: string;
  title: string;
  description?: string;
  folderId: number;
  createdBy: string;
  ownedBy: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  categoryId: number;
  categoryName: string;
  categoryDescription?: string;
  activeVersionId: number;
  minioKey: string;
  sizeBytes: number;
  mimeType: string;
  metadataDefinitions: MetadataInfoDto[];
}
```

### Bulk Upload Types

#### `BulkUploadRequestDto`
```typescript
interface BulkUploadRequestDto {
  folderId: number;
  createdBy: string;
  title: string;
  fileName?: string;
  tagsJson?: string;
  categoryId: number;
  files: File[];
  lang: ExtractorLanguage;
  filingCategories: FilingCategoryDocDto[];
}
```

#### `BulkUploadResponseDto`
```typescript
interface BulkUploadResponseDto {
  firstDocument: DocumentResponseDto;
  classADocuments: ClassAResponseDto[];
  totalFiles: number;
  processedFiles: number;
}
```

### Document Search Types

#### `DocumentSearchResultDto`
```typescript
interface DocumentSearchResultDto {
  id: number;
  title: string;
  name: string;
  description?: string;
  type: string;
  ownerName: string;
  mimeType: string;
  sizeBytes: number;
  path: string;
}
```

#### `DocumentSearchResponseDto`
```typescript
interface DocumentSearchResponseDto {
  documents: DocumentSearchResultDto[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
```

### Document Update Types

#### `UpdateDocumentDescriptionRequestDto`
```typescript
interface UpdateDocumentDescriptionRequestDto {
  description: string;
}
```

## 🔗 New API Endpoints Added

### ClassA Document Management

#### 1. **Get ClassA Documents**
```typescript
async getClassADocuments(params: {
  page?: number;
  size?: number;
  categoryId?: number;
  name?: string;
}): Promise<PageResponse<ClassAResponseDto>>
```
- **Endpoint**: `GET /api/v1/document/class-a`
- **Purpose**: Retrieve ClassA documents with pagination and filtering
- **Features**: Filter by category, search by name, pagination support

#### 2. **Get ClassA Document Details**
```typescript
async getClassADocument(id: number): Promise<ClassADetailResponseDto>
```
- **Endpoint**: `GET /api/v1/document/class-a/{id}`
- **Purpose**: Get detailed information about a specific ClassA document
- **Features**: Includes metadata definitions and full category information

#### 3. **Move ClassA to Document**
```typescript
async moveClassAToDocument(id: number, params: {
  title: string;
  lang: ExtractorLanguage;
  filingCategory?: FilingCategoryDocDto;
}): Promise<DocumentResponseDto>
```
- **Endpoint**: `POST /api/v1/document/class-a/{id}/move-to-document`
- **Purpose**: Convert a ClassA document to a regular document
- **Features**: Supports filing category assignment and language specification

#### 4. **Get ClassA Document URL**
```typescript
async getClassADocumentUrl(id: number): Promise<{ url: string }>
```
- **Endpoint**: `GET /api/v1/document/class-a/{id}/view`
- **Purpose**: Get MinIO URL for viewing ClassA document
- **Features**: Returns secure URL for document access

#### 5. **Delete ClassA Document**
```typescript
async deleteClassADocument(id: number): Promise<void>
```
- **Endpoint**: `DELETE /api/v1/document/class-a/{id}`
- **Purpose**: Delete a ClassA document
- **Features**: Permanent deletion with permission checks

### Enhanced Document Management

#### 6. **Update Document Description**
```typescript
async updateDocumentDescription(id: number, request: UpdateDocumentDescriptionRequestDto): Promise<void>
```
- **Endpoint**: `PUT /api/v1/document/{id}/description`
- **Purpose**: Update document description
- **Features**: Validation for required description field

#### 7. **Search Documents**
```typescript
async searchDocuments(params: {
  q: string;
  page?: number;
  size?: number;
}): Promise<DocumentSearchResponseDto>
```
- **Endpoint**: `GET /api/v1/document/search`
- **Purpose**: Search documents by query string
- **Features**: Pagination support, returns search results with metadata

#### 8. **Test OCR Functionality**
```typescript
async testOcr(): Promise<{
  status: string;
  message: string;
  testText?: string;
  tessdataPath?: string;
}>
```
- **Endpoint**: `GET /api/v1/document/test-ocr`
- **Purpose**: Test OCR service configuration
- **Features**: Returns OCR status and configuration details

#### 9. **Log File Download**
```typescript
async logFileDownload(id: number, version?: number): Promise<void>
```
- **Endpoint**: `POST /api/v1/document/fileDownloaded/{id}`
- **Purpose**: Log file download for audit purposes
- **Features**: Optional version parameter, creates audit trail

#### 10. **Set Active Version**
```typescript
async setActiveVersion(documentId: number, versionId: number): Promise<void>
```
- **Endpoint**: `PUT /api/v1/document/{documentId}/activeVersion/{versionId}`
- **Purpose**: Set the active version for a document
- **Features**: Version management for multi-version documents

## 🚀 Key Features

### ClassA Document System
- **Temporary Storage**: ClassA documents are stored separately from main documents
- **Conversion Process**: Can be moved to main document table with proper metadata
- **Category Management**: Supports filing category assignment
- **File Management**: Full CRUD operations for ClassA documents

### Bulk Upload Enhancement
- **Multi-file Support**: Upload multiple files in a single request
- **Smart Routing**: First file goes to documents table, others to ClassA
- **Metadata Handling**: Proper metadata assignment for all files
- **Progress Tracking**: Returns processing statistics

### Enhanced Search
- **Query-based Search**: Full-text search across document properties
- **Pagination**: Efficient handling of large result sets
- **Rich Results**: Returns comprehensive document information
- **Path Information**: Includes document path for navigation

### Audit and Monitoring
- **Download Logging**: Automatic audit trail for file downloads
- **OCR Testing**: Built-in OCR service health checks
- **Version Management**: Active version control for documents

## 📊 Usage Examples

### ClassA Document Management
```typescript
// Get ClassA documents with filters
const classADocs = await apiClient.getClassADocuments({
  page: 0,
  size: 20,
  categoryId: 1,
  name: 'contract'
});

// Move ClassA to regular document
const document = await apiClient.moveClassAToDocument(classAId, {
  title: 'Contract Document',
  lang: ExtractorLanguage.ENG,
  filingCategory: filingCategoryData
});
```

### Document Search
```typescript
// Search documents
const searchResults = await apiClient.searchDocuments({
  q: 'invoice',
  page: 0,
  size: 10
});

console.log(`Found ${searchResults.totalElements} documents`);
```

### Document Management
```typescript
// Update document description
await apiClient.updateDocumentDescription(documentId, {
  description: 'Updated document description'
});

// Set active version
await apiClient.setActiveVersion(documentId, versionId);

// Log download for audit
await apiClient.logFileDownload(documentId, versionId);
```

## 🔧 Backend Compatibility

All new endpoints are designed to work with the updated DocumentController:
- **Base Path**: `/api/v1/document`
- **Authentication**: JWT-based authentication required
- **Permissions**: Proper permission checks implemented
- **Validation**: Request validation using Jakarta validation
- **Error Handling**: Comprehensive error responses

## 📈 Performance Considerations

- **Pagination**: All list endpoints support pagination
- **Filtering**: Efficient database queries with proper indexing
- **Caching**: MinIO URL caching for better performance
- **Async Operations**: Non-blocking operations for better UX
- **Audit Logging**: Lightweight audit trail creation

This update provides comprehensive support for the new ClassA document system, enhanced bulk upload capabilities, improved document search, and additional document management features in the frontend application.

