# New Link Rule System Update

## Overview
This document describes the complete update of the link rule system in the frontend to match the new backend architecture. The old link rule endpoints and types have been removed and replaced with a new, more robust system.

## Backend Architecture Changes

### New Controllers
The backend now has two separate controllers:

1. **LinkRuleController** (`/api/link-rules`) - Manages link rules
2. **DocumentLinkController** (`/api/document-links`) - Manages document links

### New Endpoint Structure

#### Link Rule Endpoints (`/api/link-rules`)
- `POST /api/link-rules` - Create link rule
- `PUT /api/link-rules/{ruleId}` - Update link rule
- `DELETE /api/link-rules/{ruleId}` - Delete link rule
- `GET /api/link-rules/{ruleId}` - Get link rule by ID
- `GET /api/link-rules` - Get all link rules
- `GET /api/link-rules/paginated` - Get all link rules with pagination
- `GET /api/link-rules/active` - Get active link rules
- `GET /api/link-rules/category/{categoryId}` - Get link rules by category
- `GET /api/link-rules/metadata/{metadataId}` - Get link rules by metadata
- `PUT /api/link-rules/{ruleId}/enable` - Enable link rule
- `PUT /api/link-rules/{ruleId}/disable` - Disable link rule

#### Document Link Endpoints (`/api/document-links`)
- `POST /api/document-links` - Create document link
- `DELETE /api/document-links/{linkId}` - Delete document link
- `DELETE /api/document-links/source/{sourceDocumentId}/target/{targetDocumentId}/type/{linkType}` - Delete by details
- `GET /api/document-links/document/{documentId}` - Get all links for document
- `GET /api/document-links/document/{documentId}/outgoing` - Get outgoing links
- `GET /api/document-links/document/{documentId}/incoming` - Get incoming links
- `GET /api/document-links/document/{documentId}/related` - Get related documents

## Frontend Implementation

### 1. Updated Type Definitions (`frontend/src/types/api.ts`)

#### Link Rule Types
```typescript
export interface LinkRuleRequestDto {
  sourceMetadataId: number;
  targetMetadataId: number;
  ruleName: string;
  description?: string;
  linkType: string;
  conditions: string; // EQUAL, SUP, INF
  enabled?: boolean;
}

export interface LinkRuleResponseDto {
  id: number;
  sourceMetadataId: number;
  sourceMetadataName: string;
  sourceCategoryId: number;
  sourceCategoryName: string;
  targetMetadataId: number;
  targetMetadataName: string;
  targetCategoryId: number;
  targetCategoryName: string;
  ruleName: string;
  description?: string;
  linkType: string;
  conditions: string;
  enabled: boolean;
  createdBy: string;
}
```

#### Document Link Types
```typescript
export interface DocumentLinkRequestDto {
  sourceDocumentId: number;
  targetDocumentId: number;
  linkType: string;
  description?: string;
}

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
  createdBy: string;
  createdAt: string;
  ruleId?: number;
  ruleName?: string;
  isAutomatic: boolean;
}
```

### 2. API Client Updates (`frontend/src/api/client.ts`)

#### Link Rule Methods
```typescript
// Create link rule
async createLinkRule(request: LinkRuleRequestDto): Promise<LinkRuleResponseDto>

// Update link rule
async updateLinkRule(ruleId: number, request: LinkRuleRequestDto): Promise<LinkRuleResponseDto>

// Delete link rule
async deleteLinkRule(ruleId: number): Promise<void>

// Get link rule by ID
async getLinkRule(ruleId: number): Promise<LinkRuleResponseDto>

// Get all link rules
async getAllLinkRules(): Promise<LinkRuleResponseDto[]>

// Get all link rules with pagination
async getAllLinkRulesPaginated(page: number = 0, size: number = 20): Promise<PageResponse<LinkRuleResponseDto>>

// Get active link rules
async getActiveLinkRules(): Promise<LinkRuleResponseDto[]>

// Get link rules by category
async getLinkRulesByCategory(categoryId: number): Promise<LinkRuleResponseDto[]>

// Get link rules by metadata
async getLinkRulesByMetadata(metadataId: number): Promise<LinkRuleResponseDto[]>

// Enable link rule
async enableLinkRule(ruleId: number): Promise<void>

// Disable link rule
async disableLinkRule(ruleId: number): Promise<void>
```

#### Document Link Methods
```typescript
// Create document link
async createDocumentLink(request: DocumentLinkRequestDto): Promise<DocumentLinkResponseDto>

// Delete document link
async deleteDocumentLink(linkId: number): Promise<void>

// Delete document link by details
async deleteDocumentLinkByDetails(sourceDocumentId: number, targetDocumentId: number, linkType: string): Promise<void>

// Get all links for a document
async getDocumentLinks(documentId: number): Promise<DocumentLinkResponseDto[]>

// Get outgoing links for a document
async getOutgoingLinks(documentId: number): Promise<DocumentLinkResponseDto[]>

// Get incoming links for a document
async getIncomingLinks(documentId: number): Promise<DocumentLinkResponseDto[]>

// Get related documents for a document
async getRelatedDocuments(documentId: number, page: number = 0, size: number = 20): Promise<PageResponse<any>>
```

### 3. Notification Client Updates (`frontend/src/api/notificationClient.ts`)

All methods are wrapped with appropriate notifications:

#### Link Rule Operations
```typescript
// Create link rule with notifications
async createLinkRule(request: LinkRuleRequestDto, options?: ApiNotificationOptions)

// Update link rule with notifications
async updateLinkRule(ruleId: number, request: LinkRuleRequestDto, options?: ApiNotificationOptions)

// Delete link rule with notifications
async deleteLinkRule(ruleId: number, options?: ApiNotificationOptions)

// Get operations are silent
async getLinkRule(ruleId: number, options?: ApiNotificationOptions)
async getAllLinkRules(options?: ApiNotificationOptions)
async getAllLinkRulesPaginated(page: number, size: number, options?: ApiNotificationOptions)
async getActiveLinkRules(options?: ApiNotificationOptions)
async getLinkRulesByCategory(categoryId: number, options?: ApiNotificationOptions)
async getLinkRulesByMetadata(metadataId: number, options?: ApiNotificationOptions)

// Enable/Disable operations with notifications
async enableLinkRule(ruleId: number, options?: ApiNotificationOptions)
async disableLinkRule(ruleId: number, options?: ApiNotificationOptions)
```

#### Document Link Operations
```typescript
// Create document link with notifications
async createDocumentLink(request: DocumentLinkRequestDto, options?: ApiNotificationOptions)

// Delete operations with notifications
async deleteDocumentLink(linkId: number, options?: ApiNotificationOptions)
async deleteDocumentLinkByDetails(sourceDocumentId: number, targetDocumentId: number, linkType: string, options?: ApiNotificationOptions)

// Get operations are silent
async getDocumentLinks(documentId: number, options?: ApiNotificationOptions)
async getOutgoingLinks(documentId: number, options?: ApiNotificationOptions)
async getIncomingLinks(documentId: number, options?: ApiNotificationOptions)
async getRelatedDocuments(documentId: number, page: number, size: number, options?: ApiNotificationOptions)
```

### 4. Document Service Updates (`frontend/src/api/services/documentService.ts`)

All methods are exposed through the document service:

```typescript
export class DocumentService {
  // Link Rule Operations
  static async createLinkRule(request: LinkRuleRequestDto, options?: any): Promise<LinkRuleResponseDto>
  static async updateLinkRule(ruleId: number, request: LinkRuleRequestDto, options?: any): Promise<LinkRuleResponseDto>
  static async deleteLinkRule(ruleId: number, options?: any): Promise<void>
  static async getLinkRule(ruleId: number, options?: any): Promise<LinkRuleResponseDto>
  static async getAllLinkRules(options?: any): Promise<LinkRuleResponseDto[]>
  static async getAllLinkRulesPaginated(page: number, size: number, options?: any): Promise<PageResponse<LinkRuleResponseDto>>
  static async getActiveLinkRules(options?: any): Promise<LinkRuleResponseDto[]>
  static async getLinkRulesByCategory(categoryId: number, options?: any): Promise<LinkRuleResponseDto[]>
  static async getLinkRulesByMetadata(metadataId: number, options?: any): Promise<LinkRuleResponseDto[]>
  static async enableLinkRule(ruleId: number, options?: any): Promise<void>
  static async disableLinkRule(ruleId: number, options?: any): Promise<void>

  // Document Link Operations
  static async createDocumentLink(request: DocumentLinkRequestDto, options?: any): Promise<DocumentLinkResponseDto>
  static async deleteDocumentLink(linkId: number, options?: any): Promise<void>
  static async deleteDocumentLinkByDetails(sourceDocumentId: number, targetDocumentId: number, linkType: string, options?: any): Promise<void>
  static async getDocumentLinks(documentId: number, options?: any): Promise<DocumentLinkResponseDto[]>
  static async getOutgoingLinks(documentId: number, options?: any): Promise<DocumentLinkResponseDto[]>
  static async getIncomingLinks(documentId: number, options?: any): Promise<DocumentLinkResponseDto[]>
  static async getRelatedDocuments(documentId: number, page: number, size: number, options?: any): Promise<PageResponse<any>>
}
```

## Usage Examples

### 1. Creating Link Rules
```typescript
import { DocumentService } from '../api/services/documentService';
import { LinkRuleRequestDto } from '../types/api';

// Create a link rule
const ruleRequest: LinkRuleRequestDto = {
  sourceMetadataId: 1,
  targetMetadataId: 2,
  ruleName: "Contract-Invoice Link Rule",
  description: "Automatically link contracts to their invoices",
  linkType: "REFERENCES",
  conditions: "EQUAL",
  enabled: true
};

const createdRule = await DocumentService.createLinkRule(ruleRequest);
console.log('Rule created:', createdRule);
```

### 2. Managing Link Rules
```typescript
// Get all link rules
const allRules = await DocumentService.getAllLinkRules();

// Get active rules only
const activeRules = await DocumentService.getActiveLinkRules();

// Get rules for a specific category
const categoryRules = await DocumentService.getLinkRulesByCategory(categoryId);

// Get rules for specific metadata
const metadataRules = await DocumentService.getLinkRulesByMetadata(metadataId);

// Enable/disable rules
await DocumentService.enableLinkRule(ruleId);
await DocumentService.disableLinkRule(ruleId);

// Update a rule
const updatedRule = await DocumentService.updateLinkRule(ruleId, ruleRequest);

// Delete a rule
await DocumentService.deleteLinkRule(ruleId);
```

### 3. Creating Document Links
```typescript
import { DocumentLinkRequestDto } from '../types/api';

// Create a document link
const linkRequest: DocumentLinkRequestDto = {
  sourceDocumentId: 123,
  targetDocumentId: 456,
  linkType: "RELATED",
  description: "These documents are related"
};

const createdLink = await DocumentService.createDocumentLink(linkRequest);
console.log('Link created:', createdLink);
```

### 4. Managing Document Links
```typescript
// Get all links for a document
const allLinks = await DocumentService.getDocumentLinks(documentId);

// Get incoming links (documents that link to this one)
const incomingLinks = await DocumentService.getIncomingLinks(documentId);

// Get outgoing links (documents this one links to)
const outgoingLinks = await DocumentService.getOutgoingLinks(documentId);

// Get related documents with pagination
const relatedDocs = await DocumentService.getRelatedDocuments(documentId, 0, 20);

// Delete a specific link
await DocumentService.deleteDocumentLink(linkId);

// Delete link by details
await DocumentService.deleteDocumentLinkByDetails(sourceDocumentId, targetDocumentId, linkType);
```

### 5. Using Direct API Client
```typescript
import { apiClient } from '../api/client';

// Direct API calls without notifications
const rules = await apiClient.getAllLinkRules();
const links = await apiClient.getDocumentLinks(documentId);
```

### 6. Using Notification Client
```typescript
import { notificationApiClient } from '../api/notificationClient';

// With custom notification messages
const rule = await notificationApiClient.createLinkRule(ruleRequest, {
  successMessage: 'Link rule created successfully!',
  errorMessage: 'Failed to create link rule'
});

// Silent operation (no notifications)
const rules = await notificationApiClient.getAllLinkRules({ silent: true });
```

## Key Features

### 1. **Separated Concerns**
- **Link Rules**: Define automatic linking behavior based on metadata
- **Document Links**: Manage actual relationships between documents

### 2. **Enhanced Metadata Support**
- Rules based on metadata fields rather than categories
- Support for different condition types (EQUAL, SUP, INF)
- Rich metadata information in responses

### 3. **Improved Link Management**
- Separate endpoints for different link operations
- Support for both automatic and manual links
- Rich link information with document details

### 4. **Better Rule Management**
- Create, update, delete, enable/disable rules
- Filter rules by category or metadata
- Pagination support for large rule sets

### 5. **Enhanced User Experience**
- Comprehensive notification system
- Silent operations for GET requests
- Customizable success/error messages
- Consistent API patterns

## Migration Notes

### Removed Features
- Old manual link endpoints with different URL patterns
- Old automatic link rule endpoints with different structures
- Old DTOs: `ManualLinkRequest`, `ManualLinkResponse`, `RelatedDocumentResponse`, `LinkRuleCacheStatistics`
- Old service: `LinkRuleService` (deleted)

### New Features
- Separate controllers for rules and links
- Metadata-based rule conditions
- Enhanced response DTOs with more information
- Better separation of concerns
- Improved error handling and notifications

### Breaking Changes
- All old link rule endpoints have been removed
- Old DTOs are no longer available
- Service method signatures have changed
- URL patterns have changed

## Benefits

### 1. **Better Architecture**
- Clear separation between rules and links
- More maintainable code structure
- Better error handling and validation

### 2. **Enhanced Functionality**
- Metadata-based rule conditions
- Richer response information
- Better link management capabilities

### 3. **Improved Performance**
- Optimized endpoints for specific operations
- Better pagination support
- Reduced API calls for common operations

### 4. **Better User Experience**
- More intuitive API structure
- Better error messages and notifications
- Consistent response formats

This update provides a more robust, maintainable, and feature-rich link rule system that better serves the needs of the DMS application.



