# Async Link Rules and Unified Search System Update

## Overview
This document summarizes the comprehensive frontend updates made to synchronize with backend changes for:
1. **Link Rules System** - Added async operations for rule application
2. **Document Links System** - Enhanced with manual/automatic filtering and rich related documents
3. **Unified Search System** - Smart DB/Elasticsearch routing with advanced search capabilities

---

## 🔄 Major Backend Changes Implemented

### 1. Link Rules - Async Operations

**New Async Endpoints:**
- `POST /api/link-rules/{ruleId}/apply` - Apply rule to all documents (async)
- `POST /api/link-rules/apply-to-document/{documentId}` - Apply all rules to a document (async)
- `POST /api/link-rules/reapply-all` - Reapply all enabled rules (async)
- `PUT /api/link-rules/{ruleId}/toggle?enabled={boolean}` - Enable/disable rule

**Enhanced Filtering:**
- `GET /api/link-rules?page=0&size=20&enabled=true&linkType=RELATED&name=client`
  - Supports pagination, filtering by enabled status, link type, and name search

### 2. Document Links - Enhanced Endpoints

**New Endpoints:**
- `GET /api/document-links/document/{documentId}/manual` - Get manual links only
- `GET /api/document-links/document/{documentId}/automatic` - Get automatic links only

**Enhanced Related Documents:**
- `GET /api/document-links/document/{documentId}/related` now supports:
  - Search by name/title/description
  - Filter by link type
  - Filter by manual/automatic (`isManual` parameter)
  - Date range filtering (`fromDate`, `toDate`)
  - MIME type filtering
  - Full pagination support

### 3. Unified Search - Smart Routing

**New Smart Search Endpoint:**
- `GET /api/v1/search?q=contract&categoryId=1&page=0&size=20`
  - Smart routing logic:
    - Text query present → Elasticsearch (full-text search)
    - No text, only categoryId → Database (faster structured query)
    - Multiple categoryIds supported

**Advanced Search:**
- `POST /api/v1/search/advanced`
  - Category-based metadata filtering
  - Complex metadata queries with operators
  - Date range filters
  - Tag filters with AND/OR logic
  - MIME type and file extension filters

---

## 📝 Frontend Changes Summary

### Updated Files

#### 1. **Types** (`frontend/src/types/api.ts`)

**New Enums:**
```typescript
export enum ConditionLogic {
  AND = 'AND',
  OR = 'OR'
}

export enum ConditionOperator {
  EQUAL = 'EQUAL',
  NOT_EQUAL = 'NOT_EQUAL',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  CONTAINS = 'CONTAINS',
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH',
  IN = 'IN',
  NOT_IN = 'NOT_IN'
}

export enum FilterOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  CONTAINS = 'CONTAINS',
  RANGE = 'RANGE',
  GT = 'GT',
  LT = 'LT',
  // ... more operators
}
```

**Updated Link Rule Types:**
```typescript
export interface LinkRuleRequestDto {
  name: string;
  description?: string;
  linkType: string;
  conditionsLogic: ConditionLogic;
  conditions: LinkRuleConditionRequestDto[];
  enabled?: boolean;
  bidirectional?: boolean;
}

export interface LinkRuleResponseDto {
  id: number;
  name: string;
  description?: string;
  linkType: string;
  conditions: LinkRuleConditionResponseDto[];
  enabled: boolean;
  bidirectional: boolean;
  createdBy: UserDto;
  createdAt: string;
  updatedAt: string;
  activeLinksCount?: number;
}
```

**Updated Document Link Types:**
```typescript
export interface DocumentLinkResponseDto {
  id: number;
  sourceDocumentId: number;
  sourceDocumentName: string;
  sourceDocumentTitle: string;
  targetDocumentId: number;
  targetDocumentName: string;
  targetDocumentTitle: string;
  linkType: string;
  description?: string;
  isManual: boolean; // Changed from isAutomatic - INVERTED LOGIC!
  ruleId?: number;
  ruleName?: string;
  createdBy: string;
  createdAt: string;
}

export interface RelatedDocumentResponseDto {
  documentId: number;
  versionId: number;
  documentName: string;
  documentTitle: string;
  documentDescription?: string;
  // ... document details
  // Link information
  linkType: string;
  description?: string;
  isManual: boolean;
  ruleName?: string;
  ruleId?: number;
  linkedAt: string;
  // Nested types for metadata, filing category, permissions
  metadata: RelatedDocumentMetadataDto[];
  filingCategory?: RelatedDocumentFilingCategoryDto;
  userPermissions?: RelatedDocumentUserPermissionsDto;
}
```

**New Advanced Search Types:**
```typescript
export interface AdvancedSearchRequestDto {
  query?: string;
  searchScope?: SearchScope;
  page?: number;
  size?: number;
  categoryFilter?: CategoryMetadataSearchDto;
  categoryFilters?: CategoryMetadataSearchDto[];
  categoryFilterLogic?: FilterLogic;
  includeFolders?: boolean;
  includeDocuments?: boolean;
  mimeTypes?: string[];
  fileExtensions?: string[];
  createdAt?: DateRangeFilter;
  updatedAt?: DateRangeFilter;
  folderIds?: number[];
  includeSubfolders?: boolean;
  tags?: string[];
  tagFilterLogic?: FilterLogic;
  searchInOcrContent?: boolean;
  searchInAllVersions?: boolean;
  sortBy?: SortOption;
  sortDirection?: SortDirection;
}
```

#### 2. **API Client** (`frontend/src/api/client.ts`)

**New Link Rule Methods:**
```typescript
// Updated with filters
async getAllLinkRulesPaginated(params: {
  page?: number;
  size?: number;
  enabled?: boolean;
  linkType?: string;
  name?: string;
} = {}): Promise<PageResponse<LinkRuleResponseDto>>

// New async operations
async toggleLinkRule(ruleId: number, enabled: boolean): Promise<void>
async applyLinkRule(ruleId: number): Promise<{...}>
async applyRulesToDocument(documentId: number): Promise<{...}>
async reapplyAllLinkRules(): Promise<{...}>
```

**New Document Link Methods:**
```typescript
async getManualLinks(documentId: number): Promise<DocumentLinkResponseDto[]>
async getAutomaticLinks(documentId: number): Promise<DocumentLinkResponseDto[]>

// Updated with rich filters
async getRelatedDocuments(documentId: number, params: {
  search?: string;
  linkType?: string;
  isManual?: boolean;
  fromDate?: string;
  toDate?: string;
  mimeType?: string;
  page?: number;
  size?: number;
} = {}): Promise<PageResponse<RelatedDocumentResponseDto>>
```

**New Search Methods:**
```typescript
// Unified smart search (GET method)
async unifiedSearch(params: {
  q?: string;
  categoryId?: number;
  categoryIds?: number[];
  folders?: boolean;
  documents?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDesc?: boolean;
} = {}): Promise<GlobalSearchResultDto>

// Advanced search with metadata filtering
async advancedSearch(params: AdvancedSearchRequestDto): Promise<AdvancedSearchResponseDto>
```

#### 3. **Notification Client** (`frontend/src/api/notificationClient.ts`)

All corresponding methods added with notification support:
- Async link rule operations with success messages
- Enhanced document link methods
- Unified and advanced search methods

#### 4. **Document Service** (`frontend/src/api/services/documentService.ts`)

Service layer updated with all new methods:
- Link rule async operations
- Enhanced document link methods
- Unified and advanced search

---

## 🔑 Key Breaking Changes

### ⚠️ CRITICAL: `isAutomatic` → `isManual` (Inverted Logic!)

**Old:**
```typescript
{
  isAutomatic: true  // Link was created by a rule
}
```

**New:**
```typescript
{
  isManual: true     // Link was created manually (NOT by a rule)
}
```

**Migration:**
```typescript
// OLD CODE
if (link.isAutomatic) {
  // Handle automatic link
}

// NEW CODE  
if (!link.isManual) {  // Note the inversion!
  // Handle automatic link
}
```

### Link Rules Structure Change

**Old:**
```typescript
{
  sourceMetadataId: number;
  targetMetadataId: number;
  conditions: string; // Simple string
}
```

**New:**
```typescript
{
  name: string;
  conditionsLogic: "AND" | "OR";
  conditions: Array<{
    sourceMetadataId: number;
    targetMetadataId: number;
    operator: ConditionOperator;
    caseSensitive: boolean;
  }>;
  bidirectional: boolean;
}
```

---

## 🚀 New Features

### 1. Async Rule Processing
- Rules can now be applied asynchronously
- Background job processing for large datasets
- No blocking operations

### 2. Rich Related Documents
- Full document details in related documents response
- Metadata, permissions, user info included
- Advanced filtering and search capabilities

### 3. Smart Search Routing
- Automatic DB vs Elasticsearch selection
- Optimized for different query types
- Category-based filtering with metadata

### 4. Advanced Search
- Category metadata filtering
- Complex operators (EQUALS, CONTAINS, RANGE, etc.)
- Date range search
- Tag filtering with AND/OR logic

---

## 📊 Usage Examples

### Async Rule Application
```typescript
// Apply a specific rule to all documents
const result = await DocumentService.applyLinkRule(ruleId);
console.log(result); // { message: "...", status: "PROCESSING", ruleId: 123 }

// Apply all rules to a document
await DocumentService.applyRulesToDocument(documentId);

// Reapply all enabled rules
await DocumentService.reapplyAllLinkRules();
```

### Filtered Link Rules
```typescript
// Get enabled rules of a specific type
const rules = await DocumentService.getAllLinkRulesPaginated({
  page: 0,
  size: 20,
  enabled: true,
  linkType: 'RELATED',
  name: 'client'
});
```

### Rich Related Documents
```typescript
// Get related documents with filters
const relatedDocs = await DocumentService.getRelatedDocuments(documentId, {
  search: 'contract',
  linkType: 'RELATED',
  isManual: false, // Get only automatic links
  fromDate: '2024-01-01',
  mimeType: 'application/pdf',
  page: 0,
  size: 20
});
```

### Unified Smart Search
```typescript
// Text search (uses Elasticsearch)
const results = await DocumentService.unifiedSearch({
  q: 'invoice',
  page: 0,
  size: 20
});

// Category filter only (uses Database)
const categoryDocs = await DocumentService.unifiedSearch({
  categoryId: 5,
  documents: true,
  folders: false
});
```

### Advanced Search
```typescript
const advancedResults = await DocumentService.advancedSearch({
  query: 'contract',
  categoryFilter: {
    categoryId: 1,
    metadataFilters: [
      {
        fieldName: 'client',
        operator: FilterOperator.EQUALS,
        value: 'ABC Corp'
      },
      {
        fieldName: 'amount',
        fieldType: 'NUMBER',
        operator: FilterOperator.RANGE,
        fromValue: 1000,
        toValue: 5000
      }
    ]
  },
  tags: ['urgent', 'finance'],
  tagFilterLogic: FilterLogic.AND,
  mimeTypes: ['application/pdf'],
  page: 0,
  size: 20
});
```

---

## ✅ Testing Checklist

- [x] Types updated and linting errors fixed
- [x] API client methods match backend endpoints
- [x] Notification client includes all new methods
- [x] Document service exposes all functionality
- [x] No duplicate method implementations
- [ ] UI components updated to use new methods
- [ ] `isAutomatic` → `isManual` logic updated in components
- [ ] Async rule operations tested
- [ ] Advanced search UI implemented

---

## 🔍 Files Modified

1. `frontend/src/types/api.ts` - Types and interfaces
2. `frontend/src/api/client.ts` - API client endpoints
3. `frontend/src/api/notificationClient.ts` - Notification wrapper
4. `frontend/src/api/services/documentService.ts` - Service layer

---

## 📚 Related Documentation

- See `COMPREHENSIVE_LINK_SEARCH_UPDATE.md` for initial analysis
- Backend changes in link rules controllers
- Backend changes in unified search controller

---

## 🎯 Next Steps

1. **Update UI Components:**
   - Link rule management UI
   - Document linking interface
   - Search components with advanced filters

2. **Handle Breaking Changes:**
   - Update all `isAutomatic` references to `!isManual`
   - Test manual vs automatic link filtering

3. **Test Async Operations:**
   - Verify rule application jobs
   - Add progress indicators for async operations

4. **Implement Advanced Search UI:**
   - Category metadata filter builder
   - Date range pickers
   - Tag filter with AND/OR toggle

---

**Last Updated:** $(date)
**Status:** ✅ Complete - All backend changes synchronized to frontend



