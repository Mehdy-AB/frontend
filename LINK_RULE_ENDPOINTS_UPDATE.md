# Link Rule Endpoints Update

## Overview
This document describes the updates made to the frontend to match the changes in the backend link rule controllers and endpoints. The link rule system has been updated to provide better document linking capabilities with both manual and automatic linking features.

## Backend Endpoint Changes

### Updated Link Rule Controller Structure

The backend now has a unified `LinkRuleController` with the following endpoint structure:

#### Manual Document Linking
- `POST /api/v1/link-rules/manual-link` - Create manual links between documents
- `GET /api/v1/link-rules/document/{documentId}/links` - Get all links for a document
- `GET /api/v1/link-rules/document/{documentId}/incoming-links` - Get incoming links
- `GET /api/v1/link-rules/document/{documentId}/outgoing-links` - Get outgoing links
- `DELETE /api/v1/link-rules/link/{linkId}` - Delete a document link

#### Automatic Link Rules
- `POST /api/v1/link-rules/auto-rule` - Create automatic link rules
- `GET /api/v1/link-rules/rules` - Get all link rules with pagination
- `GET /api/v1/link-rules/rules/active` - Get active link rules
- `GET /api/v1/link-rules/rules/category/{categoryId}` - Get rules by category
- `GET /api/v1/link-rules/rules/{ruleId}` - Get specific link rule
- `PUT /api/v1/link-rules/rules/{ruleId}/enable` - Enable a link rule
- `PUT /api/v1/link-rules/rules/{ruleId}/disable` - Disable a link rule
- `DELETE /api/v1/link-rules/rules/{ruleId}` - Delete a link rule

## Frontend Implementation

### 1. Updated Type Definitions (`frontend/src/types/api.ts`)

#### Manual Link Types
```typescript
export interface ManualLinkRequestDto {
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
  createdBy: string;
  createdAt: string;
  ruleId?: number;
  ruleName?: string;
  isAutomatic: boolean;
}
```

#### Automatic Link Rule Types
```typescript
export interface LinkConditionDto {
  sourceMetadataKey: string;
  targetMetadataKey: string;
  operator: string;
  value?: string;
  minValue?: number;
  maxValue?: number;
  caseSensitive?: boolean;
}

export interface AutoLinkRuleRequestDto {
  sourceCategoryId: number;
  targetCategoryId: number;
  ruleName: string;
  description?: string;
  linkType: string;
  conditions: LinkConditionDto[];
  enabled?: boolean;
}

export interface LinkRule {
  id: number;
  sourceCategoryId: number;
  targetCategoryId: number;
  ruleName: string;
  description?: string;
  linkType: string;
  conditions: string;
  threshold?: number;
  enabled: boolean;
  automatic: boolean;
  createdBy: string;
  lastExecutedAt?: string;
  executionCount: number;
}
```

### 2. API Client Updates (`frontend/src/api/client.ts`)

#### Manual Link Methods
```typescript
// Create a manual link between documents
async createManualLink(request: ManualLinkRequestDto): Promise<DocumentLinkResponseDto>

// Get all links for a document
async getDocumentLinks(documentId: number): Promise<DocumentLinkResponseDto[]>

// Get incoming links for a document
async getIncomingLinks(documentId: number): Promise<DocumentLinkResponseDto[]>

// Get outgoing links for a document
async getOutgoingLinks(documentId: number): Promise<DocumentLinkResponseDto[]>

// Delete a document link
async deleteDocumentLink(linkId: number): Promise<void>
```

#### Automatic Link Rule Methods
```typescript
// Create an automatic link rule
async createAutoLinkRule(request: AutoLinkRuleRequestDto): Promise<LinkRule>

// Get all link rules with pagination
async getAllLinkRules(page: number = 0, size: number = 20, sortBy: string = 'ruleName', sortDir: string = 'asc'): Promise<PageResponse<LinkRule>>

// Get active link rules
async getActiveLinkRules(): Promise<LinkRule[]>

// Get link rules by category
async getLinkRulesByCategory(categoryId: number): Promise<LinkRule[]>

// Get link rule by ID
async getLinkRule(ruleId: number): Promise<LinkRule>

// Enable a link rule
async enableLinkRule(ruleId: number): Promise<void>

// Disable a link rule
async disableLinkRule(ruleId: number): Promise<void>

// Delete a link rule
async deleteLinkRule(ruleId: number): Promise<void>
```

### 3. Notification Client Updates (`frontend/src/api/notificationClient.ts`)

All link rule methods are wrapped with appropriate notifications:

#### Manual Link Operations
```typescript
// Create manual link with success/error notifications
async createManualLink(request: ManualLinkRequestDto, options?: ApiNotificationOptions)

// Get operations are silent by default
async getDocumentLinks(documentId: number, options?: ApiNotificationOptions)
async getIncomingLinks(documentId: number, options?: ApiNotificationOptions)
async getOutgoingLinks(documentId: number, options?: ApiNotificationOptions)

// Delete operations with notifications
async deleteDocumentLink(linkId: number, options?: ApiNotificationOptions)
```

#### Automatic Link Rule Operations
```typescript
// Create auto link rule with notifications
async createAutoLinkRule(request: AutoLinkRuleRequestDto, options?: ApiNotificationOptions)

// Get operations are silent
async getAllLinkRules(page: number, size: number, sortBy: string, sortDir: string, options?: ApiNotificationOptions)
async getActiveLinkRules(options?: ApiNotificationOptions)
async getLinkRulesByCategory(categoryId: number, options?: ApiNotificationOptions)
async getLinkRule(ruleId: number, options?: ApiNotificationOptions)

// Enable/Disable operations with notifications
async enableLinkRule(ruleId: number, options?: ApiNotificationOptions)
async disableLinkRule(ruleId: number, options?: ApiNotificationOptions)

// Delete operations with notifications
async deleteLinkRule(ruleId: number, options?: ApiNotificationOptions)
```

### 4. Document Service Updates (`frontend/src/api/services/documentService.ts`)

All link rule methods are exposed through the document service:

```typescript
export class DocumentService {
  // Manual Link Operations
  static async createManualLink(request: ManualLinkRequestDto, options?: any): Promise<DocumentLinkResponseDto>
  static async getDocumentLinks(documentId: number, options?: any): Promise<DocumentLinkResponseDto[]>
  static async getIncomingLinks(documentId: number, options?: any): Promise<DocumentLinkResponseDto[]>
  static async getOutgoingLinks(documentId: number, options?: any): Promise<DocumentLinkResponseDto[]>
  static async deleteDocumentLink(linkId: number, options?: any): Promise<void>

  // Automatic Link Rule Operations
  static async createAutoLinkRule(request: AutoLinkRuleRequestDto, options?: any): Promise<LinkRule>
  static async getAllLinkRules(page: number, size: number, sortBy: string, sortDir: string, options?: any): Promise<PageResponse<LinkRule>>
  static async getActiveLinkRules(options?: any): Promise<LinkRule[]>
  static async getLinkRulesByCategory(categoryId: number, options?: any): Promise<LinkRule[]>
  static async getLinkRule(ruleId: number, options?: any): Promise<LinkRule>
  static async enableLinkRule(ruleId: number, options?: any): Promise<void>
  static async disableLinkRule(ruleId: number, options?: any): Promise<void>
  static async deleteLinkRule(ruleId: number, options?: any): Promise<void>
}
```

## Usage Examples

### 1. Creating Manual Links
```typescript
import { DocumentService } from '../api/services/documentService';
import { ManualLinkRequestDto } from '../types/api';

// Create a manual link between documents
const linkRequest: ManualLinkRequestDto = {
  sourceDocumentId: 123,
  targetDocumentId: 456,
  linkType: "RELATED",
  description: "These documents are related"
};

const createdLink = await DocumentService.createManualLink(linkRequest);
console.log('Link created:', createdLink);
```

### 2. Managing Document Links
```typescript
// Get all links for a document
const allLinks = await DocumentService.getDocumentLinks(documentId);

// Get incoming links (documents that link to this one)
const incomingLinks = await DocumentService.getIncomingLinks(documentId);

// Get outgoing links (documents this one links to)
const outgoingLinks = await DocumentService.getOutgoingLinks(documentId);

// Delete a specific link
await DocumentService.deleteDocumentLink(linkId);
```

### 3. Creating Automatic Link Rules
```typescript
import { AutoLinkRuleRequestDto, LinkConditionDto } from '../types/api';

// Create an automatic link rule
const ruleRequest: AutoLinkRuleRequestDto = {
  sourceCategoryId: 1,
  targetCategoryId: 2,
  ruleName: "Contract-Invoice Link Rule",
  description: "Automatically link contracts to their invoices",
  linkType: "REFERENCES",
  conditions: [
    {
      sourceMetadataKey: "contractNumber",
      targetMetadataKey: "contractNumber",
      operator: "EQUALS",
      value: "",
      caseSensitive: false
    }
  ],
  enabled: true
};

const createdRule = await DocumentService.createAutoLinkRule(ruleRequest);
console.log('Rule created:', createdRule);
```

### 4. Managing Link Rules
```typescript
// Get all link rules with pagination
const rulesPage = await DocumentService.getAllLinkRules(0, 20, 'ruleName', 'asc');

// Get active rules only
const activeRules = await DocumentService.getActiveLinkRules();

// Get rules for a specific category
const categoryRules = await DocumentService.getLinkRulesByCategory(categoryId);

// Enable/disable rules
await DocumentService.enableLinkRule(ruleId);
await DocumentService.disableLinkRule(ruleId);

// Delete a rule
await DocumentService.deleteLinkRule(ruleId);
```

### 5. Using Direct API Client
```typescript
import { apiClient } from '../api/client';

// Direct API calls without notifications
const links = await apiClient.getDocumentLinks(documentId);
const rules = await apiClient.getAllLinkRules(0, 20);
```

### 6. Using Notification Client
```typescript
import { notificationApiClient } from '../api/notificationClient';

// With custom notification messages
const link = await notificationApiClient.createManualLink(linkRequest, {
  successMessage: 'Document link created successfully!',
  errorMessage: 'Failed to create document link'
});

// Silent operation (no notifications)
const links = await notificationApiClient.getDocumentLinks(documentId, { silent: true });
```

## Key Features

### 1. **Manual Document Linking**
- Create direct links between documents
- Support for different link types (RELATED, SUPERSEDES, REFERENCES, CONTAINS)
- Rich link information with document names and titles
- Track link creation and ownership

### 2. **Automatic Link Rules**
- Create rules based on metadata conditions
- Support for various operators (EQUALS, CONTAINS, RANGE, etc.)
- Category-based rule targeting
- Enable/disable rules dynamically
- Track rule execution statistics

### 3. **Link Management**
- View all links for a document
- Separate incoming and outgoing link views
- Delete unwanted links
- Rich link metadata and history

### 4. **Rule Management**
- Paginated rule listing with sorting
- Category-based rule filtering
- Rule enable/disable functionality
- Rule deletion and cleanup
- Execution statistics tracking

### 5. **User Experience**
- Comprehensive notification system
- Silent operations for GET requests
- Customizable success/error messages
- Consistent API patterns

## Benefits

### 1. **Enhanced Document Relationships**
- Automatic discovery of related documents
- Manual curation of document links
- Rich relationship metadata
- Historical relationship tracking

### 2. **Improved Organization**
- Category-based automatic linking
- Flexible rule conditions
- Dynamic rule management
- Efficient document discovery

### 3. **Better User Experience**
- Intuitive link management
- Visual relationship display
- Efficient rule configuration
- Streamlined workflows

### 4. **System Integration**
- Seamless API integration
- Consistent error handling
- Real-time notifications
- Type-safe operations

## Migration Notes

### Removed Endpoints
The following old endpoints have been removed and replaced:
- Old manual link endpoints with different URL patterns
- Old automatic link rule endpoints with different structures
- Admin-only cache management endpoints

### New Features
- Unified link rule controller
- Enhanced link response DTOs
- Improved rule condition system
- Better pagination and sorting

This update provides a more robust and feature-rich document linking system that enables both manual and automatic document relationship management within the DMS application.





