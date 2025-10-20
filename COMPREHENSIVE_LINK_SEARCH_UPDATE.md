# Comprehensive Link Rules, Document Links, and Search System Update

## Overview
This document describes the comprehensive updates made to synchronize the frontend with major backend changes in:
1. Link Rules System - Complete restructure with advanced conditions
2. Document Links System - Enhanced with manual/automatic distinction  
3. Global Search System - New advanced search with category-based filtering

## Summary of Backend Changes

### 1. Link Rules - Major Restructure
**Old Structure:**
- Simple metadata ID matching
- Basic conditions string
- Single linkType

**New Structure:**
- Complex condition objects with operators
- Support for multiple conditions with AND/OR logic
- Bidirectional linking support
- Rich metadata information in responses
- Active links count statistics

### 2. Document Links - Enhanced Structure
**Changes:**
- `isAutomatic` → `isManual` (inverted logic)
- New `RelatedDocumentResponseDto` with full document details
- New endpoint for automatic links only (`/document/{id}/automatic`)
- Enhanced response with user info, permissions, metadata

### 3. Global Search - Advanced Filtering
**New Features:**
- `AdvancedSearchRequestDto` with category-based filtering
- `CategoryMetadataSearchDto` for metadata field filtering
- Support for complex metadata queries with operators
- Date range filters, MIME type filters, tag filters
- Enhanced sorting and pagination

## Implementation Plan

Due to the extensive nature of these changes, I'll create a comprehensive update document and provide guidance on the implementation approach.

### Files That Need Updates:

#### Types (`frontend/src/types/api.ts`):
1. Remove old `LinkRuleRequestDto`, `LinkRuleResponseDto`
2. Add new link rule types with conditions
3. Update `DocumentLinkResponseDto` (isAutomatic → isManual)
4. Add `RelatedDocumentResponseDto` with nested types
5. Add `AdvancedSearchRequestDto` and `CategoryMetadataSearchDto`
6. Add enums for operators, filter logic, sort options

#### API Client (`frontend/src/api/client.ts`):
1. Update all link rule endpoints
2. Update document link endpoints
3. Add new advanced search endpoints
4. Update method signatures to match new DTOs

#### Notification Client (`frontend/src/api/notificationClient.ts`):
1. Update all link rule methods
2. Update document link methods
3. Add advanced search methods

#### Document Service (`frontend/src/api/services/documentService.ts`):
1. Update all link rule service methods
2. Update document link service methods
3. Add advanced search service methods

### Breaking Changes:

1. **Link Rules:**
   - All existing link rule code will need updates
   - New condition structure requires UI changes
   - Bidirectional flag needs handling

2. **Document Links:**
   - `isAutomatic` → `isManual` requires logic inversion
   - New `RelatedDocumentResponseDto` has different structure
   - Components using document links need updates

3. **Search:**
   - `SearchRequestDto` is now for basic search
   - `AdvancedSearchRequestDto` for category-based search
   - Search components need significant updates

## Recommended Implementation Approach

Given the extensive nature of these changes, I recommend:

### Phase 1: Update Types
1. Add all new type definitions
2. Keep old types temporarily with `@deprecated` comments
3. Create type migration utilities if needed

### Phase 2: Update API Layer
1. Update API client with new endpoints
2. Update notification client
3. Update service layer
4. Add backward compatibility wrappers if needed

### Phase 3: Update Components
1. Update link rule management components
2. Update document link components
3. Update search components
4. Test each component thoroughly

### Phase 4: Cleanup
1. Remove deprecated types
2. Remove backward compatibility code
3. Update documentation
4. Final testing

## Would you like me to:

1. **Proceed with full implementation** - I'll update all files with the new structure
2. **Implement in phases** - Start with types, then API layer, etc.
3. **Create migration utilities** - Helper functions to convert between old and new structures
4. **Focus on specific area** - Link rules, document links, or search first

Please let me know your preference, and I'll proceed accordingly. The changes are extensive but manageable with a systematic approach.

## Quick Reference: Key Type Changes

### Link Rule Request (Old → New)
```typescript
// OLD
{
  sourceMetadataId: number;
  targetMetadataId: number;
  ruleName: string;
  linkType: string;
  conditions: string; // Simple string
}

// NEW
{
  name: string;
  description?: string;
  linkType: string;
  conditionsLogic: "AND" | "OR";
  conditions: Array<{
    sourceMetadataId: number;
    targetMetadataId: number;
    operator: ConditionOperator;
    caseSensitive: boolean;
  }>;
  enabled: boolean;
  bidirectional: boolean;
}
```

### Document Link Response (Old → New)
```typescript
// OLD
{
  isAutomatic: boolean;  // true for automatic links
}

// NEW  
{
  isManual: boolean;     // true for manual links (inverted!)
}
```

### Search Request (Old → New)
```typescript
// OLD - All in one SearchRequestDto
{
  query: string;
  lookUpTags?: boolean;
  // ... many fields
}

// NEW - Separate DTOs
// Basic: SearchRequestDto (simplified)
// Advanced: AdvancedSearchRequestDto (with category filtering)
{
  query: string;
  categoryFilter: {
    categoryId: number;
    metadataFilters: Array<{
      fieldName: string;
      operator: FilterOperator;
      value: any;
    }>;
  };
}
```



