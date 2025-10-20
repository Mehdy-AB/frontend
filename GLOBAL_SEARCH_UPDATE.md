# Global Search System Update

## Overview
This document describes the updates made to the global search system to match the new backend SearchRequestDto structure. The search system now supports advanced metadata filtering, model-based filtering, range searches, and enhanced search capabilities.

## Backend Changes

### New SearchRequestDto Structure

The backend now uses a comprehensive `SearchRequestDto` with the following new fields:

#### **Search Field Toggles**
- `lookUpTags` - Search in document tags
- `lookUpModel` - Search in model/type information
- `lookUpCreatedAt` - Search in creation dates

#### **Model-Based Metadata Filtering**
- `modelMetadataFilter` - Advanced filtering by specific model and metadata fields
- Support for complex metadata field filtering with operators

#### **Metadata Search Parameters**
- `metadataKey` - Search by specific metadata key
- `metadataValue` - Search by specific metadata value
- `metadataKeyValue` - Combined key=value search
- `metadataCategory` - Search by metadata category name
- `metadataType` - Filter by metadata type (text, number, date, etc.)

#### **Range Search Capabilities**
- `metadataRangeField` - Field for range search
- `metadataRangeFrom` / `metadataRangeTo` - Range values
- `metadataRangeInclusive` - Inclusive range option
- `createdAtFrom` / `createdAtTo` - Creation date range
- `createdAtInclusive` - Inclusive date range

#### **Model/Type Filtering**
- `modelType` / `modelTypes` - Filter by document model types
- `mimeType` / `mimeTypes` - Filter by MIME types

#### **Enhanced Sorting**
- `sortBy` - Sort by score, name, createdAt, updatedAt
- `sortDesc` - Descending sort option

## Frontend Implementation

### 1. Updated Type Definitions (`frontend/src/types/api.ts`)

#### New Search Request Types
```typescript
export interface SearchRequestDto {
  // Basic search parameters
  query: string;
  page: number;
  size: number;

  // Search field toggles
  lookUpFolderName?: boolean;
  lookUpDocumentName?: boolean;
  lookUpMetadataKey?: boolean;
  lookUpMetadataValue?: boolean;
  lookUpCategoryName?: boolean;
  lookUpOcrContent?: boolean;
  lookUpDescription?: boolean;
  lookUpTags?: boolean;
  lookUpModel?: boolean;
  lookUpCreatedAt?: boolean;

  // Content type filters
  includeFolders?: boolean;
  includeDocuments?: boolean;

  // Model-based metadata filtering
  modelMetadataFilter?: ModelMetadataFilterDto;
  
  // Legacy ID-based filtering
  modelId?: number;
  modelIds?: number[];
  metadataId?: number;
  metadataIds?: number[];
  categoryId?: number;
  categoryIds?: number[];

  // Metadata search parameters
  metadataKey?: string;
  metadataValue?: string;
  metadataKeyValue?: string;
  metadataCategory?: string;
  metadataType?: string;
  
  // Range search for metadata
  metadataRangeField?: string;
  metadataRangeFrom?: any;
  metadataRangeTo?: any;
  metadataRangeInclusive?: boolean;
  
  // Creation date range search
  createdAtFrom?: string;
  createdAtTo?: string;
  createdAtInclusive?: boolean;
  
  // Model/Type filtering
  modelType?: string;
  modelTypes?: string[];
  mimeType?: string;
  mimeTypes?: string[];

  // Sorting
  sortBy?: string; // "score", "name", "createdAt", "updatedAt"
  sortDesc?: boolean;
}
```

#### Model Metadata Filter Types
```typescript
export interface ModelMetadataFilterDto {
  modelId: number;
  modelName?: string;
  metadataFieldFilters?: Record<string, any>;
  metadataFieldRanges?: Record<string, any>;
  metadataFieldTypes?: Record<string, string>;
  metadataFilters?: MetadataFieldFilter[];
}

export interface MetadataFieldFilter {
  fieldName: string;
  fieldType: string;
  value?: any;
  fromValue?: any;
  toValue?: any;
  operator: string; // "equals", "contains", "startsWith", "endsWith", "range", "gt", "lt", "gte", "lte"
}
```

### 2. API Client Updates (`frontend/src/api/client.ts`)

#### Updated Search Methods
```typescript
// Global search with new SearchRequestDto
async globalSearch(params: SearchRequestDto): Promise<GlobalSearchResultDto>

// Enhanced search with new SearchRequestDto
async enhancedSearch(params: SearchRequestDto): Promise<GlobalSearchResultDto>
```

### 3. Notification Client Updates (`frontend/src/api/notificationClient.ts`)

#### Updated Search Methods
```typescript
// Global search with notifications
async globalSearch(params: SearchRequestDto, options?: ApiNotificationOptions)

// Enhanced search with notifications
async enhancedSearch(params: SearchRequestDto, options?: ApiNotificationOptions)
```

### 4. Document Service Updates (`frontend/src/api/services/documentService.ts`)

#### Updated Search Methods
```typescript
// Global search through service layer
static async globalSearch(params: SearchRequestDto, options?: any): Promise<any>

// Enhanced search through service layer
static async enhancedSearch(params: SearchRequestDto, options?: any): Promise<any>
```

## Usage Examples

### 1. Basic Search
```typescript
import { DocumentService } from '../api/services/documentService';
import { SearchRequestDto } from '../types/api';

// Basic search
const searchRequest: SearchRequestDto = {
  query: "important document",
  page: 0,
  size: 20,
  lookUpDocumentName: true,
  lookUpOcrContent: true,
  includeDocuments: true
};

const results = await DocumentService.globalSearch(searchRequest);
```

### 2. Advanced Metadata Search
```typescript
// Search with metadata filtering
const advancedSearch: SearchRequestDto = {
  query: "contract",
  page: 0,
  size: 20,
  lookUpDocumentName: true,
  lookUpMetadataValue: true,
  metadataKey: "status",
  metadataValue: "active",
  metadataCategory: "legal",
  includeDocuments: true,
  sortBy: "createdAt",
  sortDesc: true
};

const results = await DocumentService.globalSearch(advancedSearch);
```

### 3. Range Search
```typescript
// Search with date range
const rangeSearch: SearchRequestDto = {
  query: "report",
  page: 0,
  size: 20,
  lookUpDocumentName: true,
  createdAtFrom: "2024-01-01T00:00:00Z",
  createdAtTo: "2024-12-31T23:59:59Z",
  createdAtInclusive: true,
  includeDocuments: true
};

const results = await DocumentService.globalSearch(rangeSearch);
```

### 4. Model-Based Filtering
```typescript
// Search with model metadata filtering
const modelSearch: SearchRequestDto = {
  query: "invoice",
  page: 0,
  size: 20,
  lookUpDocumentName: true,
  modelMetadataFilter: {
    modelId: 123,
    modelName: "Invoice",
    metadataFilters: [
      {
        fieldName: "client",
        fieldType: "string",
        value: "Acme Corp",
        operator: "equals"
      },
      {
        fieldName: "amount",
        fieldType: "number",
        fromValue: 1000,
        toValue: 5000,
        operator: "range"
      }
    ]
  },
  includeDocuments: true
};

const results = await DocumentService.globalSearch(modelSearch);
```

### 5. MIME Type Filtering
```typescript
// Search with MIME type filtering
const mimeSearch: SearchRequestDto = {
  query: "presentation",
  page: 0,
  size: 20,
  lookUpDocumentName: true,
  mimeTypes: ["application/pdf", "application/vnd.ms-powerpoint"],
  includeDocuments: true,
  sortBy: "score",
  sortDesc: false
};

const results = await DocumentService.globalSearch(mimeSearch);
```

### 6. Tag-Based Search
```typescript
// Search with tag filtering
const tagSearch: SearchRequestDto = {
  query: "urgent",
  page: 0,
  size: 20,
  lookUpTags: true,
  lookUpDocumentName: true,
  includeDocuments: true
};

const results = await DocumentService.globalSearch(tagSearch);
```

### 7. Using Direct API Client
```typescript
import { apiClient } from '../api/client';

// Direct API calls without notifications
const results = await apiClient.globalSearch(searchRequest);
const enhancedResults = await apiClient.enhancedSearch(searchRequest);
```

### 8. Using Notification Client
```typescript
import { notificationApiClient } from '../api/notificationClient';

// With custom notification messages
const results = await notificationApiClient.globalSearch(searchRequest, {
  successMessage: 'Search completed successfully!',
  errorMessage: 'Search failed'
});

// Silent operation (no notifications)
const silentResults = await notificationApiClient.globalSearch(searchRequest, { silent: true });
```

## Key Features

### 1. **Enhanced Search Capabilities**
- Tag-based search with `lookUpTags`
- Model/type search with `lookUpModel`
- Creation date search with `lookUpCreatedAt`
- Advanced metadata filtering

### 2. **Model-Based Filtering**
- Filter by specific document models
- Complex metadata field filtering
- Support for various operators (equals, contains, range, etc.)
- Type-safe metadata filtering

### 3. **Range Search Support**
- Metadata range searches
- Date range filtering
- Numeric range searches
- Inclusive/exclusive range options

### 4. **Advanced Filtering**
- MIME type filtering
- Model type filtering
- Metadata category filtering
- Legacy ID-based filtering support

### 5. **Enhanced Sorting**
- Sort by relevance score
- Sort by name, creation date, update date
- Ascending/descending sort options

## Migration Notes

### Breaking Changes
- **Method Signatures**: All search methods now use `SearchRequestDto` instead of individual parameters
- **HTTP Method**: Changed from GET to POST for search endpoints
- **Parameter Structure**: New structured parameter format

### Backward Compatibility
- Legacy ID-based filtering is still supported
- Basic search functionality remains the same
- Existing search implementations will need updates

### New Capabilities
- Model-based metadata filtering
- Range search capabilities
- Enhanced sorting options
- Tag and model search support

## Benefits

### 1. **More Powerful Search**
- Advanced metadata filtering
- Model-based search capabilities
- Range search support
- Enhanced sorting options

### 2. **Better Performance**
- Structured search requests
- Optimized backend processing
- Efficient filtering capabilities

### 3. **Enhanced User Experience**
- More precise search results
- Better filtering options
- Improved search relevance

### 4. **Developer Experience**
- Type-safe search parameters
- Structured request format
- Better error handling

This update provides a much more powerful and flexible search system that can handle complex search requirements while maintaining backward compatibility with existing functionality.




