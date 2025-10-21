# Link Rule Functions Update

## Overview
This document summarizes the comprehensive updates made to the rule link fetch functions in the frontend API client. The updates include new async endpoints, enhanced filtering, document link management, and improved TypeScript types.

## 🔄 Updated API Client Functions

### Enhanced Link Rule Functions

#### 1. **Advanced Search and Filtering**
```typescript
// Enhanced search with advanced filtering
async searchLinkRules(params: {
  page?: number;
  size?: number;
  enabled?: boolean;
  linkType?: string;
  name?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}): Promise<PageResponse<LinkRuleResponseDto>>
```

#### 2. **Statistics and Analytics**
```typescript
// Get comprehensive link rule statistics
async getLinkRuleStatistics(): Promise<LinkRuleStatistics>

// Get active link rules only
async getActiveLinkRules(): Promise<LinkRuleResponseDto[]>
```

#### 3. **Bulk Operations**
```typescript
// Bulk enable/disable multiple rules
async bulkToggleLinkRules(ruleIds: number[], enabled: boolean): Promise<BulkToggleResponse>

// Duplicate a link rule
async duplicateLinkRule(ruleId: number, newName: string): Promise<LinkRuleResponseDto>
```

#### 4. **Rule Testing**
```typescript
// Test a link rule against sample documents
async testLinkRule(ruleId: number, sampleSize?: number): Promise<LinkRuleTestResponse>
```

### Document Link Management Functions

#### 1. **Comprehensive Document Link Retrieval**
```typescript
// Get all links for a document with advanced filtering
async getDocumentLinks(documentId: number, params: DocumentLinkSearchParams): Promise<PageResponse<DocumentLinkResponseDto>>

// Get manual links only
async getManualDocumentLinks(documentId: number): Promise<DocumentLinkResponseDto[]>

// Get automatic links only
async getAutomaticDocumentLinks(documentId: number): Promise<DocumentLinkResponseDto[]>
```

#### 2. **Directional Link Queries**
```typescript
// Get outgoing links with pagination
async getOutgoingDocumentLinks(documentId: number, params: DocumentLinkSearchParams): Promise<PageResponse<DocumentLinkResponseDto>>

// Get incoming links with pagination
async getIncomingDocumentLinks(documentId: number, params: DocumentLinkSearchParams): Promise<PageResponse<DocumentLinkResponseDto>>
```

#### 3. **Related Documents with Advanced Filtering**
```typescript
// Get related documents with comprehensive filtering
async getRelatedDocuments(documentId: number, params: RelatedDocumentSearchParams): Promise<PageResponse<RelatedDocumentResponseDto>>
```

#### 4. **Document Link CRUD Operations**
```typescript
// Create manual document link
async createManualDocumentLink(request: DocumentLinkRequestDto): Promise<DocumentLinkResponseDto>

// Update document link
async updateDocumentLink(linkId: number, request: Partial<DocumentLinkRequestDto>): Promise<DocumentLinkResponseDto>

// Delete by ID
async deleteDocumentLink(linkId: number): Promise<void>

// Delete by details
async deleteDocumentLinkByDetails(sourceDocumentId: number, targetDocumentId: number, linkType: string): Promise<void>

// Bulk delete
async bulkDeleteDocumentLinks(linkIds: number[]): Promise<BulkDeleteResponse>
```

### Cache Management Functions

#### 1. **Cache Statistics and Monitoring**
```typescript
// Get cache statistics
async getLinkRuleCacheStatistics(): Promise<LinkRuleCacheStatistics>
```

#### 2. **Cache Management**
```typescript
// Clear cache for specific rule
async clearRuleCache(ruleId: number): Promise<{ message: string }>

// Clear cache for specific document
async clearDocumentCache(documentId: number): Promise<{ message: string }>

// Clear all link rule caches
async clearAllLinkRuleCaches(): Promise<{ message: string }>
```

## 🆕 New TypeScript Types

### Enhanced Link Rule Types
```typescript
interface LinkRuleStatistics {
  totalRules: number;
  activeRules: number;
  inactiveRules: number;
  totalLinks: number;
  rulesByType: Record<string, number>;
}

interface BulkToggleRequest {
  ruleIds: number[];
  enabled: boolean;
}

interface LinkRuleTestResponse {
  ruleId: number;
  testResults: LinkRuleTestResult[];
  summary: {
    totalMatches: number;
    averageScore: number;
    executionTime: number;
  };
}
```

### Document Link Enhanced Types
```typescript
interface DocumentLinkSearchParams {
  page?: number;
  size?: number;
  linkType?: string;
  isManual?: boolean;
  search?: string;
  fromDate?: string;
  toDate?: string;
  mimeType?: string;
}

interface RelatedDocumentSearchParams extends DocumentLinkSearchParams {
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}
```

### Async Operation Types
```typescript
interface AsyncOperationResponse {
  message: string;
  status: string;
  operationId?: string;
  estimatedCompletionTime?: number;
}

interface LinkRuleApplicationResponse extends AsyncOperationResponse {
  ruleId: number;
  documentsProcessed?: number;
  linksCreated?: number;
}
```

## 🚀 Key Features Added

### 1. **Advanced Filtering and Search**
- Multi-parameter filtering (enabled status, link type, name search)
- Sorting capabilities (by field and direction)
- Pagination support for all list endpoints
- Date range filtering for related documents
- MIME type filtering

### 2. **Bulk Operations**
- Bulk enable/disable rules
- Bulk delete document links
- Bulk rule execution
- Comprehensive error handling for bulk operations

### 3. **Rule Testing and Analytics**
- Test rules against sample documents
- Get match scores and execution times
- Comprehensive statistics and analytics
- Performance monitoring

### 4. **Enhanced Document Link Management**
- Separate manual and automatic link queries
- Directional link queries (incoming/outgoing)
- Advanced related document search
- Full CRUD operations for document links

### 5. **Cache Management**
- Cache statistics and monitoring
- Selective cache clearing
- Performance optimization tools

## 📊 Usage Examples

### Search Link Rules with Advanced Filtering
```typescript
const rules = await apiClient.searchLinkRules({
  page: 0,
  size: 20,
  enabled: true,
  linkType: 'RELATED',
  name: 'client',
  sortBy: 'createdAt',
  sortDirection: 'desc'
});
```

### Get Related Documents with Filters
```typescript
const relatedDocs = await apiClient.getRelatedDocuments(documentId, {
  page: 0,
  size: 10,
  linkType: 'RELATED',
  isManual: false,
  search: 'contract',
  fromDate: '2024-01-01',
  toDate: '2024-12-31',
  mimeType: 'application/pdf'
});
```

### Test a Link Rule
```typescript
const testResults = await apiClient.testLinkRule(ruleId, 50);
console.log(`Found ${testResults.summary.totalMatches} matches`);
console.log(`Average score: ${testResults.summary.averageScore}`);
```

### Bulk Operations
```typescript
// Bulk enable rules
const result = await apiClient.bulkToggleLinkRules([1, 2, 3], true);
console.log(`Successfully enabled: ${result.success.length} rules`);
console.log(`Failed: ${result.failed.length} rules`);
```

## 🔧 Backend Compatibility

All functions are designed to work with the updated backend endpoints:
- `/api/link-rules/*` - Link rule management
- `/api/document-links/*` - Document link management
- Async operations for rule application
- Enhanced filtering and pagination support

## 📈 Performance Improvements

- Pagination support for all list endpoints
- Efficient filtering at the database level
- Caching mechanisms for frequently accessed data
- Bulk operations to reduce API calls
- Async operations for long-running tasks

This update provides a comprehensive and robust set of functions for managing link rules and document links in the frontend application.
