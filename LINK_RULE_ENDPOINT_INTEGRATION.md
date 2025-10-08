# Link Rule Endpoint Integration

## Overview
This document describes the integration of the new link rule endpoints from the backend into the frontend application. The link rule system allows for manual and automatic linking between documents with various relationship types.

## Backend Endpoints
The link rule endpoints are available at `/api/v1/link-rules` and include:

### Manual Links
- `POST /manual-links` - Create a manual link
- `GET /documents/{documentId}/manual-links` - Get all manual links for a document
- `GET /documents/{documentId}/manual-links/outgoing` - Get outgoing manual links
- `GET /documents/{documentId}/manual-links/incoming` - Get incoming manual links
- `PUT /manual-links/{linkId}` - Update a manual link
- `DELETE /manual-links/{linkId}` - Delete a manual link

### Related Documents
- `GET /documents/{documentId}/related` - Get all related documents (manual + automatic)

### Admin Operations
- `POST /admin/revalidate` - Trigger manual revalidation of all rules
- `POST /admin/rules/{ruleId}/revalidate` - Revalidate a specific rule
- `GET /admin/cache/statistics` - Get cache statistics
- `DELETE /admin/documents/{documentId}/cache` - Clear cache for a document
- `DELETE /admin/rules/{ruleId}/cache` - Clear cache for a rule

## Frontend Integration

### 1. Types (`frontend/src/types/api.ts`)
Added comprehensive TypeScript interfaces:

```typescript
export interface ManualLinkRequest {
  sourceDocumentId: number;
  targetDocumentId: number;
  linkType: string; // e.g., "RELATED", "SUPERSEDES", "REFERENCES", "CONTAINS"
  description?: string;
}

export interface ManualLinkResponse {
  id: number;
  sourceDocumentId: number;
  targetDocumentId: number;
  linkType: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RelatedDocumentResponse {
  documentId: number;
  documentName: string;
  documentTitle: string;
  linkType: string;
  score: number; // Relevance score (1.0 for manual links)
  isManual: boolean; // true for manual links, false for automatic
  ruleName?: string; // Only for automatic links
  linkedAt: string;
}

export interface LinkRuleCacheStatistics {
  totalCachedLinks: number;
  activeRules: number;
  lastRevalidation: string;
  cacheHitRate: number;
}
```

### 2. API Client (`frontend/src/api/client.ts`)
Added all link rule endpoints to the main API client:

```typescript
// Manual Links
async createManualLink(data: ManualLinkRequest): Promise<ManualLinkResponse>
async getDocumentManualLinks(documentId: number): Promise<ManualLinkResponse[]>
async getOutgoingManualLinks(documentId: number): Promise<ManualLinkResponse[]>
async getIncomingManualLinks(documentId: number): Promise<ManualLinkResponse[]>
async updateManualLink(linkId: number, data: ManualLinkRequest): Promise<ManualLinkResponse>
async deleteManualLink(linkId: number): Promise<void>

// Related Documents
async getRelatedDocuments(documentId: number): Promise<RelatedDocumentResponse[]>

// Admin Operations
async triggerLinkRuleRevalidation(): Promise<void>
async revalidateLinkRule(ruleId: number): Promise<void>
async getLinkRuleCacheStatistics(): Promise<LinkRuleCacheStatistics>
async clearDocumentLinkCache(documentId: number): Promise<void>
async clearRuleLinkCache(ruleId: number): Promise<void>
```

### 3. Notification Client (`frontend/src/api/notificationClient.ts`)
Added notification support for all link rule endpoints with appropriate success/error messages:

```typescript
// All endpoints include notification support with:
// - Success messages for create/update/delete operations
// - Silent mode for read operations
// - Error handling with user-friendly messages
```

### 4. Link Rule Service (`frontend/src/api/services/linkRuleService.ts`)
Created a dedicated service class with static methods for easy usage:

```typescript
export class LinkRuleService {
  static async createManualLink(data: ManualLinkRequest, options?: any): Promise<ManualLinkResponse>
  static async getDocumentManualLinks(documentId: number, options?: any): Promise<ManualLinkResponse[]>
  static async getOutgoingManualLinks(documentId: number, options?: any): Promise<ManualLinkResponse[]>
  static async getIncomingManualLinks(documentId: number, options?: any): Promise<ManualLinkResponse[]>
  static async updateManualLink(linkId: number, data: ManualLinkRequest, options?: any): Promise<ManualLinkResponse>
  static async deleteManualLink(linkId: number, options?: any): Promise<void>
  static async getRelatedDocuments(documentId: number, options?: any): Promise<RelatedDocumentResponse[]>
  static async triggerRevalidation(options?: any): Promise<void>
  static async revalidateRule(ruleId: number, options?: any): Promise<void>
  static async getCacheStatistics(options?: any): Promise<LinkRuleCacheStatistics>
  static async clearDocumentCache(documentId: number, options?: any): Promise<void>
  static async clearRuleCache(ruleId: number, options?: any): Promise<void>
}
```

## Usage Examples

### Creating a Manual Link
```typescript
import { LinkRuleService } from '../api/services/linkRuleService';

const linkData = {
  sourceDocumentId: 123,
  targetDocumentId: 456,
  linkType: 'RELATED',
  description: 'These documents are related to the same project'
};

const newLink = await LinkRuleService.createManualLink(linkData);
```

### Getting Related Documents
```typescript
import { LinkRuleService } from '../api/services/linkRuleService';

const relatedDocs = await LinkRuleService.getRelatedDocuments(documentId);
relatedDocs.forEach(doc => {
  console.log(`${doc.documentName} - ${doc.linkType} (${doc.isManual ? 'Manual' : 'Auto'})`);
});
```

### Using Direct API Client
```typescript
import { apiClient } from '../api/client';

// Create manual link
const link = await apiClient.createManualLink({
  sourceDocumentId: 123,
  targetDocumentId: 456,
  linkType: 'SUPERSEDES'
});

// Get related documents
const related = await apiClient.getRelatedDocuments(123);
```

### Using Notification Client
```typescript
import { notificationApiClient } from '../api/notificationClient';

// With notifications
await notificationApiClient.createManualLink(linkData, {
  successMessage: 'Document link created successfully!',
  errorMessage: 'Failed to create document link'
});

// Silent operation
const links = await notificationApiClient.getDocumentManualLinks(documentId, { silent: true });
```

## Link Types
The system supports various link types:
- `RELATED` - Documents are related to each other
- `SUPERSEDES` - One document supersedes another
- `REFERENCES` - One document references another
- `CONTAINS` - One document contains another
- Custom types can be defined as needed

## Features

1. **Manual Links**: Create, read, update, and delete manual document links
2. **Automatic Links**: System automatically creates links based on configured rules
3. **Related Documents**: Get combined view of manual and automatic links
4. **Link Types**: Support for various relationship types
5. **Admin Operations**: Cache management and rule revalidation
6. **Notifications**: Integrated notification system for user feedback
7. **Type Safety**: Full TypeScript support with proper interfaces

## Benefits

- **Document Relationships**: Establish and manage relationships between documents
- **Automatic Discovery**: System automatically finds related documents
- **Flexible Linking**: Support for various relationship types
- **Performance**: Cached results for fast retrieval
- **Admin Control**: Administrative tools for cache and rule management
- **User Experience**: Seamless integration with notification system

## Integration Points

The link rule system integrates with:
- Document management system
- Audit logging system
- Elasticsearch for automatic link discovery
- Cache system for performance optimization
- Notification system for user feedback

This integration provides a comprehensive solution for managing document relationships in the DMS system.
