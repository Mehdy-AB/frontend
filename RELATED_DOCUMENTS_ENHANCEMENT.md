# Related Documents Enhancement Summary

## Overview
Enhanced the Related Documents section in MetadataTab with pagination, advanced search, and a comprehensive management modal with Manual/Auto linking tabs.

## Changes Made

### 1. Updated `RelatedDocumentsSection.tsx`
**Location:** `src/components/document/RelatedDocumentsSection.tsx`

#### New Features:
- **Pagination Support**: Displays 5 documents per page with "Load More" functionality
- **Compact Display**: More space-efficient card layout for related documents
- **Permission-Based Actions**: View and Download buttons only appear if user has permissions
- **Expand Button**: Added Maximize icon button next to +Link button to open management modal
- **Better Loading States**: Added Loader2 icon for loading and loading more states

#### API Integration:
- Uses `DocumentService.getRelatedDocuments()` with pagination parameters
- Supports infinite scroll with "Load More" button
- Parameters: `{ page, size: 5 }`

#### UI Improvements:
- Smaller, more compact document cards
- Hover effects for action buttons
- Permission-based action visibility
- Total count display in header badge

### 2. Created `ManageRelatedDocumentsModal.tsx`
**Location:** `src/components/modals/ManageRelatedDocumentsModal.tsx`

#### Features:

##### Two Tabs System:
1. **Manual Linking Tab**
   - Document search with debounced query (300ms)
   - Real-time search results with highlighting
   - Link type selector (8 predefined types)
   - Optional description field
   - Selected document summary display
   - Create link functionality

2. **Auto Linking Tab**
   - Display of automatically created links via rules
   - Advanced filters:
     - Link Type filter
     - MIME Type filter
     - Date Range filter (From/To dates)
   - Pagination with "Load More"
   - Rule name display for each auto link
   - View and Download actions (permission-based)

#### Search Functionality:
- **Manual Tab**: Uses `DocumentService.searchDocuments()`
  - Query-based search
  - Filters out source document
  - Displays 20 results max
  - Shows document metadata (owner, size, MIME type)

- **Auto Tab**: Uses `DocumentService.getRelatedDocuments()` with filters
  - `isManual: false` parameter
  - Supports filtering by:
    - `linkType`
    - `fromDate`
    - `toDate`
    - `mimeType`
  - 10 results per page

#### UI Components:
- Full-screen modal with backdrop
- Tabbed interface with visual indicators
- Filter panel for auto links
- Search results list with selection
- Action buttons (View, Download)
- Error message display
- Loading states

### 3. API Endpoints Used

#### Document Service Methods:
```typescript
// Get related documents with pagination and filters
DocumentService.getRelatedDocuments(documentId, {
  search?: string;
  linkType?: string;
  isManual?: boolean;
  fromDate?: string;
  toDate?: string;
  mimeType?: string;
  page?: number;
  size?: number;
})

// Search documents for linking
DocumentService.searchDocuments({
  q: string;
  page?: number;
  size?: number;
})

// Create manual link
DocumentService.createDocumentLink({
  sourceDocumentId: number;
  targetDocumentId: number;
  linkType: string;
  description?: string;
})

// Delete link
DocumentService.deleteDocumentLink(linkId: number)

// Download document
DocumentService.downloadDocument(documentId: number)

// Log file download
DocumentService.fileDownloaded(documentId: number)
```

### 4. Type Updates Used

#### From `api.ts`:
- `RelatedDocumentResponseDto`: Enhanced document type with permissions and metadata
- `DocumentLinkRequestDto`: Request type for creating links
- `DocumentSearchItem`: Search result item type
- `SearchRequestDto`: Search parameters type

#### Key Fields:
```typescript
RelatedDocumentResponseDto {
  documentId: number;
  documentName: string;
  linkType: string;
  isManual: boolean;
  ruleName?: string;
  linkedAt: string;
  userPermissions?: {
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canManagePermissions: boolean;
  };
  // ... other document metadata
}
```

## User Experience Improvements

### Before:
- Limited display space for related documents
- No pagination (all documents loaded at once)
- Basic link creation only
- No filtering or search capabilities
- No distinction between manual and auto links

### After:
- Compact, efficient display (5 per page)
- Load more on demand (infinite scroll)
- Comprehensive modal for management
- Advanced search and filtering
- Clear separation of manual vs auto links
- Permission-based actions
- Rule information for auto links
- Date range and type filtering

## Link Types Supported
1. Related Document
2. Reference
3. Attachment
4. Version
5. Parent Document
6. Child Document
7. Similar Document
8. Alternative Version

## Permissions Handling
- View button: Only shown if `canView` permission
- Download button: Only shown if `canView` permission
- Unlink button: Only shown if `canEdit` and link is manual
- Create link: Only available if `canEdit`

## Filter Options (Auto Tab)
1. **Link Type**: Dropdown with all link types
2. **MIME Type**: Text input for MIME type filtering
3. **From Date**: Date picker for start date
4. **To Date**: Date picker for end date
5. **Apply Filters**: Button to execute filtered search
6. **Clear All**: Reset all filters

## Performance Optimizations
- Debounced search (300ms delay)
- Pagination (5 items for compact view, 10 for modal)
- Lazy loading with "Load More"
- Conditional rendering based on permissions
- Optimized re-renders with proper state management

## Error Handling
- Network errors displayed with AlertCircle icon
- User-friendly error messages
- Failed operations don't break UI
- Graceful fallbacks for missing data

## Accessibility Features
- Proper button titles/tooltips
- Keyboard navigation support
- Clear visual feedback for interactions
- Loading states with spinners
- Disabled states during operations

## Next Steps / Future Enhancements
1. Add bulk link operations
2. Export related documents list
3. Link visualization (graph view)
4. Advanced search with Elasticsearch integration
5. Link strength/relevance scoring
6. Undo/Redo for link operations
7. Link templates/presets
8. Batch link creation from CSV





