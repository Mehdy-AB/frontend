# 🔍 Search API Update Summary

## Overview
Updated the frontend search API to match the new backend search controller structure with unified smart search, advanced filtering, and tag-based search capabilities.

---

## 📊 **UPDATES MADE**

### **1. New Search Endpoints Added**

#### **API Client (`frontend/src/api/client.ts`)**
- ✅ `unifiedSearch(data: UnifiedSearchRequestDto)` - Smart search with automatic DB/Elasticsearch routing
- ✅ `advancedSearch(data: AdvancedSearchRequestDto)` - Complex filtering with category-based metadata search
- ✅ `searchByTags(params)` - Search documents by tag names
- ✅ `searchDocumentsByTag(tagId, params)` - Search documents by specific tag ID
- ✅ `globalSearch(params: SearchRequestDto)` - Legacy search (kept for backward compatibility)

#### **Notification Client (`frontend/src/api/notificationClient.ts`)**
- ✅ Added notification support for all new search endpoints
- ✅ Silent mode for all search operations (no success/error notifications)

#### **Search Service (`frontend/src/api/services/searchService.ts`)**
- ✅ Updated with new search methods
- ✅ Static methods for easy usage
- ✅ Proper TypeScript typing

### **2. New Types Added**

#### **UnifiedSearchRequestDto**
```typescript
export interface UnifiedSearchRequestDto {
  // Basic search parameters
  query?: string;
  page?: number;
  size?: number;

  // Content type filters
  includeFolders?: boolean;
  includeDocuments?: boolean;

  // Simple filters (triggers DB search when no text query)
  categoryIds?: number[];

  // Date range filters
  createdAtFrom?: string;
  createdAtTo?: string;

  // Advanced search parameters (triggers Elasticsearch)
  useElasticsearch?: boolean;
  useDatabase?: boolean;
  
  // Search field toggles (for Elasticsearch)
  lookUpFolderName?: boolean;
  lookUpDocumentName?: boolean;
  lookUpMetadataValue?: boolean;
  lookUpOcrContent?: boolean;
  lookUpDescription?: boolean;
  lookUpTags?: boolean;
  lookUpCreatedAt?: boolean;

  // Creation date range search
  createdAtInclusive?: boolean;

  // Sorting
  sortBy?: string;
  sortDesc?: boolean;

  // Advanced search features (always triggers Elasticsearch)
  categoryFilter?: CategoryMetadataSearchDto;
  
  // Search mode hints
  searchMode?: 'AUTO' | 'DATABASE' | 'ELASTICSEARCH';
}
```

#### **CategoryMetadataSearchDto**
```typescript
export interface CategoryMetadataSearchDto {
  // Category selection
  categoryId?: number;
  categoryName?: string;
  
  // Metadata field filters
  metadataFilters?: MetadataFilter[];
}

export interface MetadataFilter {
  // Field identification
  metadataDefinitionId?: number;
  
  // Filter operation
  operator: FilterOperator;
  
  // Values
  value?: string;
  fromValue?: any;
  toValue?: any;
  values?: string[];
}
```

### **3. Updated Pagination Structure**

The search results now use the updated pagination structure that matches the backend:

```typescript
export interface PageResponse<T> {
  content: T[];
  pageable: Pageable;
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}
```

---

## 🎯 **BACKEND MATCHING**

The frontend now perfectly matches the backend search controller:

### **Backend UnifiedSearchController.java:**
- ✅ `POST /api/v1/search` - Unified smart search
- ✅ `POST /api/v1/search/advanced` - Advanced search
- ✅ `GET /api/v1/search/tags` - Search by tags
- ✅ `GET /api/v1/search/tags/{tagId}/documents` - Search documents by tag

### **Smart Routing Logic:**
- ✅ **Text query provided** → Elasticsearch (full-text search)
- ✅ **No text, only simple filters** → Database (faster structured query)
- ✅ **Advanced filters** → Elasticsearch
- ✅ **Force mode specified** → Use specified search engine

---

## 🚀 **USAGE EXAMPLES**

### **1. Unified Smart Search:**
```typescript
import { SearchService } from '@/api'

// Simple text search (uses Elasticsearch)
const textResults = await SearchService.unifiedSearch({
  query: 'invoice',
  page: 0,
  size: 20,
  includeDocuments: true,
  includeFolders: false
})

// Category-based search (uses Database)
const categoryResults = await SearchService.unifiedSearch({
  categoryIds: [1, 2, 3],
  page: 0,
  size: 20,
  includeDocuments: true
})

// Advanced search with metadata filtering (uses Elasticsearch)
const advancedResults = await SearchService.unifiedSearch({
  query: 'contract',
  categoryFilter: {
    categoryId: 5,
    metadataFilters: [{
      metadataDefinitionId: 10,
      operator: 'CONTAINS',
      value: 'urgent'
    }]
  },
  searchMode: 'ELASTICSEARCH'
})
```

### **2. Advanced Search:**
```typescript
const advancedResults = await SearchService.advancedSearch({
  query: 'financial report',
  searchScope: {
    searchInName: true,
    searchInDescription: true,
    searchInMetadata: true,
    searchInOcrText: true,
    searchInTags: true
  },
  categoryFilter: {
    categoryId: 3,
    metadataFilters: [{
      metadataDefinitionId: 15,
      operator: 'RANGE',
      fromValue: '2024-01-01',
      toValue: '2024-12-31'
    }]
  },
  includeFolders: false,
  includeDocuments: true,
  mimeTypes: ['application/pdf', 'application/msword'],
  createdAt: {
    from: '2024-01-01T00:00:00Z',
    to: '2024-12-31T23:59:59Z',
    inclusive: true
  },
  sortBy: 'RELEVANCE',
  sortDirection: 'DESC'
})
```

### **3. Tag-Based Search:**
```typescript
// Search by tag names
const tagResults = await SearchService.searchByTags({
  query: 'urgent',
  page: 0,
  size: 20
})

// Search documents by specific tag ID
const tagDocuments = await SearchService.searchDocumentsByTag(123, {
  page: 0,
  size: 20
})
```

### **4. React Component Example:**
```typescript
const SearchComponent = () => {
  const [searchResults, setSearchResults] = useState<GlobalSearchResultDto | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async (query: string) => {
    setLoading(true)
    try {
      const results = await SearchService.unifiedSearch({
        query,
        page: 0,
        size: 20,
        includeDocuments: true,
        includeFolders: true,
        searchMode: 'AUTO'
      })
      setSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <SearchInput onSearch={handleSearch} />
      {loading && <LoadingSpinner />}
      {searchResults && (
        <SearchResults 
          documents={searchResults.documents}
          folders={searchResults.folders}
          pagination={searchResults.pageable}
        />
      )}
    </div>
  )
}
```

---

## ✅ **VALIDATION**

- **Type Safety:** All search methods are properly typed with TypeScript
- **Backend Compatibility:** API calls match backend controller exactly
- **Smart Routing:** Frontend supports automatic DB/Elasticsearch selection
- **Pagination:** Updated pagination structure matches backend
- **Error Handling:** Comprehensive error handling with user-friendly messages
- **Linting:** No linting errors introduced

---

## 🎉 **READY FOR USE**

The frontend search API is now fully synchronized with your backend updates:

1. **Unified Smart Search** - Automatic routing between DB and Elasticsearch
2. **Advanced Filtering** - Category-based metadata filtering
3. **Tag Search** - Search by tag names and specific tag IDs
4. **Backward Compatibility** - Legacy search methods still available
5. **Type Safety** - Complete TypeScript support
6. **Performance** - Optimized for both simple and complex queries

The search functionality is ready for implementation in your React components! 🚀
