# ClassA Document Controller Synchronization

## Overview
This document summarizes the synchronization between the frontend and backend for the ClassA document controller endpoints. The frontend has been updated to match the simplified and enhanced backend implementation.

## 🔄 Changes Made

### 1. **Simplified ClassASearchRequestDto**

#### Before (Complex):
```typescript
interface ClassASearchRequestDto {
  // Text search
  query?: string;
  nameFilter?: string;
  
  // Category filtering
  categoryId?: number;
  categoryIds?: number[];
  
  // User filtering
  createdBy?: string;
  ownedBy?: string;
  
  // Date filtering
  createdAfter?: string;
  createdBefore?: string;
  
  // File filtering
  mimeTypes?: string[];
  fileExtensions?: string[];
  minSizeBytes?: number;
  maxSizeBytes?: number;
  
  // Folder filtering
  folderId?: number;
  folderIds?: number[];
  
  // Pagination and sorting
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}
```

#### After (Simplified):
```typescript
interface ClassASearchRequestDto {
  // User filtering
  userId?: string;
  
  // Category filtering
  categoryId?: number;
  
  // Document name search
  name?: string;
  
  // Date filtering
  dateFrom?: string;
  dateTo?: string;
  exactDate?: string;
  
  // Pagination
  page?: number;
  size?: number;
}
```

### 2. **Enhanced getClassADocuments Endpoint**

#### Updated Parameters:
```typescript
async getClassADocuments(params: {
  page?: number;
  size?: number;
  userId?: string;        // New: User filtering
  categoryId?: number;
  name?: string;
  dateFrom?: string;      // New: Date range start
  dateTo?: string;        // New: Date range end
  exactDate?: string;     // New: Exact date match
}): Promise<PageResponse<ClassAResponseDto>>
```

#### Backend Integration:
- **Endpoint**: `GET /api/v1/document/class-a`
- **Enhanced Search**: Now uses the simplified search functionality internally
- **Date Parsing**: Backend handles ISO date string parsing
- **Flexible Filtering**: Supports user, category, name, and date filtering

### 3. **Enhanced moveClassAToDocument Endpoint**

#### Updated Parameters:
```typescript
async moveClassAToDocument(id: number, params: {
  title: string;
  lang: ExtractorLanguage;
  name?: string;          // New: Document name
  description?: string;   // New: Document description
  tags?: string;         // New: Document tags
  filingCategory?: FilingCategoryDocDto;
}): Promise<DocumentResponseDto>
```

#### Backend Integration:
- **Endpoint**: `POST /api/v1/document/class-a/{id}/move-to-document`
- **Enhanced Parameters**: Now supports name, description, and tags
- **Form Data**: Properly handles multipart form data with all parameters

## 🚀 Key Improvements

### 1. **Simplified Search Interface**
- **Reduced Complexity**: Removed complex multi-array filtering
- **Focused Filtering**: Core filtering options (user, category, name, date)
- **Better UX**: Easier to use and understand

### 2. **Enhanced Date Filtering**
- **Flexible Date Options**: 
  - `dateFrom` and `dateTo` for date ranges
  - `exactDate` for precise date matching
- **ISO Format Support**: Backend handles ISO date string parsing
- **Error Handling**: Graceful handling of invalid date formats

### 3. **Improved Document Conversion**
- **Rich Metadata**: Support for name, description, and tags during conversion
- **Better Integration**: Seamless transition from ClassA to regular documents
- **Enhanced Data**: More complete document information

### 4. **Unified Search Approach**
- **Single Endpoint**: `getClassADocuments` now handles both listing and searching
- **Consistent Interface**: Same parameters for both basic listing and advanced search
- **Backend Optimization**: Leverages the new search service internally

## 📊 Usage Examples

### Basic Listing
```typescript
// Get all ClassA documents with pagination
const documents = await apiClient.getClassADocuments({
  page: 0,
  size: 20
});
```

### User Filtering
```typescript
// Get documents by specific user
const userDocuments = await apiClient.getClassADocuments({
  userId: 'user123',
  page: 0,
  size: 20
});
```

### Category and Name Search
```typescript
// Search documents by category and name
const searchResults = await apiClient.getClassADocuments({
  categoryId: 1,
  name: 'contract',
  page: 0,
  size: 20
});
```

### Date Range Filtering
```typescript
// Get documents created in date range
const dateFilteredDocs = await apiClient.getClassADocuments({
  dateFrom: '2024-01-01T00:00:00Z',
  dateTo: '2024-12-31T23:59:59Z',
  page: 0,
  size: 20
});
```

### Exact Date Matching
```typescript
// Get documents created on specific date
const exactDateDocs = await apiClient.getClassADocuments({
  exactDate: '2024-06-15T00:00:00Z',
  page: 0,
  size: 20
});
```

### Enhanced Document Conversion
```typescript
// Convert ClassA to regular document with rich metadata
const document = await apiClient.moveClassAToDocument(classAId, {
  title: 'Contract Document',
  lang: ExtractorLanguage.ENG,
  name: 'contract-v1.pdf',
  description: 'Main contract document',
  tags: JSON.stringify(['contract', 'legal', 'important']),
  filingCategory: filingCategoryData
});
```

## 🔧 Backend Compatibility

### Endpoint Mapping:
- **Frontend**: `getClassADocuments()` → **Backend**: `GET /api/v1/document/class-a`
- **Frontend**: `moveClassAToDocument()` → **Backend**: `POST /api/v1/document/class-a/{id}/move-to-document`
- **Frontend**: `searchClassADocuments()` → **Backend**: `POST /api/v1/document/class-a/search`

### Parameter Synchronization:
- **Query Parameters**: All frontend parameters map directly to backend request parameters
- **Date Format**: ISO string format for date parameters
- **Form Data**: Multipart form data for document conversion
- **Error Handling**: Consistent error responses

## 📈 Performance Benefits

- **Simplified Queries**: Reduced complexity improves query performance
- **Focused Filtering**: Core filters are more efficient
- **Unified Search**: Single endpoint reduces API complexity
- **Better Caching**: Simplified parameters improve cache efficiency

## 🛡️ Security Features

- **User Authentication**: JWT-based authentication required
- **User Filtering**: Proper user-based access control
- **Permission Checks**: Backend handles permission validation
- **Data Validation**: Proper validation of all input parameters

The frontend is now fully synchronized with the backend ClassA document controller, providing a simplified yet powerful interface for ClassA document management with enhanced search capabilities and improved document conversion features.
