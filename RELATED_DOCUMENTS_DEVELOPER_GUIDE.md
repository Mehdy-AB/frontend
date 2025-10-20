# Related Documents - Developer Guide

## Quick Reference

### Component Files
```
src/
├── components/
│   ├── document/
│   │   ├── MetadataTab.tsx (updated)
│   │   └── RelatedDocumentsSection.tsx (updated)
│   └── modals/
│       └── ManageRelatedDocumentsModal.tsx (new)
```

---

## API Integration

### 1. Get Related Documents (Paginated)
```typescript
const response = await DocumentService.getRelatedDocuments(documentId, {
  search?: string,        // Search term
  linkType?: string,      // Filter by link type
  isManual?: boolean,     // true = manual, false = auto
  fromDate?: string,      // ISO date string
  toDate?: string,        // ISO date string
  mimeType?: string,      // MIME type filter
  page?: number,          // Page number (0-based)
  size?: number           // Page size
});

// Response: PageResponse<RelatedDocumentResponseDto>
{
  content: RelatedDocumentResponseDto[],
  number: number,           // Current page
  totalPages: number,
  totalElements: number,
  last: boolean,
  first: boolean
}
```

### 2. Search Documents
```typescript
const response = await DocumentService.searchDocuments({
  q: string,              // Search query
  page?: number,          // Page number
  size?: number           // Results per page
});

// Response: DocumentSearchResponse
{
  documents: DocumentSearchItem[],
  totalElements: number,
  totalPages: number,
  currentPage: number,
  hasNext: boolean
}
```

### 3. Create Document Link
```typescript
const link = await DocumentService.createDocumentLink({
  sourceDocumentId: number,
  targetDocumentId: number,
  linkType: string,        // 'related', 'reference', etc.
  description?: string     // Optional description
});

// Response: DocumentLinkResponseDto
```

### 4. Delete Document Link
```typescript
await DocumentService.deleteDocumentLink(linkId: number);
```

### 5. Download Document
```typescript
// Get download URL
const url = await DocumentService.downloadDocument(documentId: number);

// Log download
await DocumentService.fileDownloaded(documentId: number);

// Open in new tab
window.open(url, '_blank');
```

---

## Type Definitions

### RelatedDocumentResponseDto
```typescript
interface RelatedDocumentResponseDto {
  // Document info
  documentId: number;
  versionId: number;
  documentName: string;
  documentTitle: string;
  documentDescription?: string;
  path: string;
  folderId: number;
  sizeBytes: number;
  mimeType: string;
  versionNumber: number;
  activeVersion: number;
  documentCreatedAt: string;
  documentUpdatedAt: string;
  isPublic: boolean;
  
  // User info
  createdBy: UserDto;
  ownedBy: UserDto;
  
  // Link info
  linkType: string;
  description?: string;
  isManual: boolean;         // true = manual link, false = auto
  ruleName?: string;         // Only for auto links
  ruleId?: number;           // Only for auto links
  linkedAt: string;          // ISO date string
  
  // Metadata
  metadata: RelatedDocumentMetadataDto[];
  filingCategory?: RelatedDocumentFilingCategoryDto;
  
  // Permissions
  userPermissions?: {
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canManagePermissions: boolean;
  };
}
```

### DocumentSearchItem
```typescript
interface DocumentSearchItem {
  id: number;
  title: string;
  name: string;
  description: string;
  type: string;
  ownerName: string;
  mimeType: string;
  sizeBytes: number;
  path: string;
}
```

### DocumentLinkRequestDto
```typescript
interface DocumentLinkRequestDto {
  sourceDocumentId: number;
  targetDocumentId: number;
  linkType: string;
  description?: string;
}
```

---

## Component Props

### RelatedDocumentsSection
```typescript
interface RelatedDocumentsSectionProps {
  documentId: number;          // Current document ID
  documentName: string;        // Current document name
  canEdit: boolean;            // User can edit links
  onLinkCreated?: () => void;  // Callback after link created
}
```

### ManageRelatedDocumentsModal
```typescript
interface ManageRelatedDocumentsModalProps {
  isOpen: boolean;             // Modal open state
  onClose: () => void;         // Close callback
  onLinkCreated: () => void;   // Link created callback
  sourceDocumentId: number;    // Current document ID
  sourceDocumentName: string;  // Current document name
  canEdit: boolean;            // User can create links
}
```

---

## Utility Functions

### formatFileSize
```typescript
formatFileSize(bytes: number): string
// Example: formatFileSize(2048) => "2 KB"
```

### formatDate
```typescript
formatDate(dateString: string): string
// Example: formatDate("2024-01-15T10:30:00Z") 
//       => "Jan 15, 2024, 10:30 AM"
```

### getLinkTypeColor
```typescript
getLinkTypeColor(linkType: string): string
// Returns Tailwind classes for badge colors
// Example: getLinkTypeColor("related") 
//       => "bg-blue-100 text-blue-800"
```

---

## State Management

### RelatedDocumentsSection State
```typescript
const [relatedDocuments, setRelatedDocuments] = useState<RelatedDocumentResponseDto[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [isLoadingMore, setIsLoadingMore] = useState(false);
const [isManageModalOpen, setIsManageModalOpen] = useState(false);
const [error, setError] = useState<string | null>(null);
const [currentPage, setCurrentPage] = useState(0);
const [totalPages, setTotalPages] = useState(0);
const [totalElements, setTotalElements] = useState(0);
const pageSize = 5;
```

### ManageRelatedDocumentsModal State
```typescript
// Tab state
const [activeTab, setActiveTab] = useState<'manual' | 'auto'>('manual');

// Manual tab
const [manualSearchQuery, setManualSearchQuery] = useState('');
const [manualSearchResults, setManualSearchResults] = useState<DocumentSearchItem[]>([]);
const [selectedDocument, setSelectedDocument] = useState<DocumentSearchItem | null>(null);
const [linkType, setLinkType] = useState('related');
const [description, setDescription] = useState('');
const [isSearching, setIsSearching] = useState(false);
const [isLinking, setIsLinking] = useState(false);

// Auto tab
const [autoLinks, setAutoLinks] = useState<RelatedDocumentResponseDto[]>([]);
const [isLoadingAutoLinks, setIsLoadingAutoLinks] = useState(false);
const [autoLinksPage, setAutoLinksPage] = useState(0);
const [autoLinksTotalPages, setAutoLinksTotalPages] = useState(0);

// Filters
const [searchFilters, setSearchFilters] = useState({
  linkType: '',
  fromDate: '',
  toDate: '',
  mimeType: ''
});

// Error
const [error, setError] = useState<string | null>(null);
```

---

## Event Handlers

### Load Related Documents
```typescript
const loadRelatedDocuments = async (page: number, append: boolean = false) => {
  try {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    
    const response = await DocumentService.getRelatedDocuments(documentId, {
      page,
      size: pageSize
    });
    
    if (append) {
      setRelatedDocuments(prev => [...prev, ...response.content]);
    } else {
      setRelatedDocuments(response.content);
    }
    
    setCurrentPage(response.number);
    setTotalPages(response.totalPages);
    setTotalElements(response.totalElements);
  } catch (error) {
    setError('Failed to load related documents');
  } finally {
    setIsLoading(false);
    setIsLoadingMore(false);
  }
};
```

### Create Link
```typescript
const handleCreateLink = async () => {
  if (!selectedDocument) return;
  
  setIsLinking(true);
  
  try {
    await DocumentService.createDocumentLink({
      sourceDocumentId: sourceDocumentId,
      targetDocumentId: selectedDocument.id,
      linkType: linkType,
      description: description.trim() || undefined
    });
    
    onLinkCreated();
    handleClose();
  } catch (error) {
    setError('Failed to create link');
  } finally {
    setIsLinking(false);
  }
};
```

### Debounced Search
```typescript
useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (manualSearchQuery.trim()) {
      handleManualSearch(manualSearchQuery);
    } else {
      setManualSearchResults([]);
    }
  }, 300);

  return () => clearTimeout(timeoutId);
}, [manualSearchQuery]);
```

---

## Styling Guide

### Color Schemes

#### Link Type Badges
```typescript
const linkTypeColors = {
  'related': 'bg-blue-100 text-blue-800',
  'reference': 'bg-green-100 text-green-800',
  'attachment': 'bg-purple-100 text-purple-800',
  'version': 'bg-orange-100 text-orange-800',
  'parent': 'bg-indigo-100 text-indigo-800',
  'child': 'bg-pink-100 text-pink-800',
  'similar': 'bg-yellow-100 text-yellow-800',
  'default': 'bg-gray-100 text-gray-800'
};
```

#### Link Mode Indicators
```typescript
// Manual link
className="bg-blue-100 text-blue-800"

// Auto link
className="bg-green-100 text-green-800"
```

### Icon Sizes
```typescript
// Compact view (section)
h-3 w-3  or  h-3.5 w-3.5

// Modal view
h-4 w-4  or  h-5 w-5

// Empty states
h-5 w-5  or  h-6 w-6
```

---

## Performance Optimizations

### 1. Debouncing
```typescript
// Search debounce: 300ms
useEffect(() => {
  const timeoutId = setTimeout(() => {
    handleSearch(query);
  }, 300);
  return () => clearTimeout(timeoutId);
}, [query]);
```

### 2. Pagination
```typescript
// Compact view: 5 items per page
const pageSize = 5;

// Modal view: 10 items per page
const modalPageSize = 10;
```

### 3. Conditional Rendering
```typescript
// Only render visible documents
{relatedDocuments.map(doc => (
  <DocumentCard key={doc.documentId} document={doc} />
))}

// Load more on demand
{currentPage < totalPages - 1 && (
  <LoadMoreButton onClick={loadMore} />
)}
```

### 4. Memoization Opportunities
```typescript
// Memoize expensive computations
const filteredDocuments = useMemo(() => 
  documents.filter(doc => matchesFilters(doc)), 
  [documents, filters]
);

// Memoize callbacks
const handleView = useCallback((id: number) => {
  window.open(`/documents/${id}`, '_blank');
}, []);
```

---

## Error Handling

### Display Errors
```typescript
{error && (
  <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
    <AlertCircle className="h-3 w-3" />
    <span>{error}</span>
  </div>
)}
```

### Clear Errors
```typescript
const clearError = () => {
  setTimeout(() => setError(null), 3000);
};
```

### Error Messages
```typescript
const errorMessages = {
  LOAD_FAILED: 'Failed to load related documents',
  SEARCH_FAILED: 'Failed to search documents',
  CREATE_FAILED: 'Failed to create link',
  DELETE_FAILED: 'Failed to unlink document',
  DOWNLOAD_FAILED: 'Failed to download document'
};
```

---

## Testing Guide

### Unit Tests
```typescript
describe('RelatedDocumentsSection', () => {
  it('loads related documents on mount', async () => {
    // Test implementation
  });
  
  it('displays load more button when more pages exist', () => {
    // Test implementation
  });
  
  it('handles permission-based action visibility', () => {
    // Test implementation
  });
});
```

### Integration Tests
```typescript
describe('ManageRelatedDocumentsModal', () => {
  it('creates manual link successfully', async () => {
    // Test implementation
  });
  
  it('filters auto links by date range', async () => {
    // Test implementation
  });
  
  it('debounces search input', async () => {
    // Test implementation
  });
});
```

---

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Features Used:
- CSS Grid
- Flexbox
- Custom Properties (CSS Variables)
- ES6+ JavaScript
- Async/Await
- Promise API

---

## Accessibility

### ARIA Labels
```typescript
<button 
  aria-label="View document"
  title="View Document"
>
  <Eye className="h-3 w-3" />
</button>
```

### Keyboard Navigation
- Tab: Navigate between interactive elements
- Enter: Activate buttons/links
- Escape: Close modal

### Focus Management
```typescript
// Auto-focus search input when modal opens
useEffect(() => {
  if (isOpen && searchInputRef.current) {
    searchInputRef.current.focus();
  }
}, [isOpen]);
```

---

## Future Enhancements

### Planned Features:
1. Bulk link operations
2. Drag-and-drop linking
3. Link strength/confidence scores
4. Visual graph view
5. Export links to CSV
6. Link templates
7. Undo/Redo functionality
8. Real-time collaboration
9. Advanced analytics
10. AI-suggested links

### API Improvements:
1. GraphQL support
2. Real-time updates via WebSocket
3. Bulk operations API
4. Link validation API
5. Analytics endpoints

---

## Migration Guide

### From Old LinkDocumentModal to ManageRelatedDocumentsModal

#### Before:
```typescript
<LinkDocumentModal
  isOpen={isLinkModalOpen}
  onClose={() => setIsLinkModalOpen(false)}
  onLinkCreated={handleLinkCreated}
  sourceDocumentId={documentId}
  sourceDocumentName={documentName}
/>
```

#### After:
```typescript
<ManageRelatedDocumentsModal
  isOpen={isManageModalOpen}
  onClose={() => setIsManageModalOpen(false)}
  onLinkCreated={handleLinkCreated}
  sourceDocumentId={documentId}
  sourceDocumentName={documentName}
  canEdit={canEdit}
/>
```

### Breaking Changes:
- Added `canEdit` prop (required)
- Renamed modal state variable for clarity
- Modal now has two tabs instead of single view

---

## Troubleshooting

### Common Issues:

#### 1. Documents Not Loading
```typescript
// Check API endpoint
console.log('Fetching:', documentId);

// Verify response
console.log('Response:', response);

// Check permissions
console.log('Can Edit:', document.userPermissions?.canEdit);
```

#### 2. Search Not Working
```typescript
// Verify debounce
console.log('Search query:', manualSearchQuery);

// Check API call
console.log('Search results:', manualSearchResults);
```

#### 3. Links Not Creating
```typescript
// Validate selected document
console.log('Selected:', selectedDocument);

// Check link type
console.log('Link type:', linkType);

// Verify API request
console.log('Request:', linkRequest);
```

---

## Performance Benchmarks

### Target Metrics:
- Initial load: < 500ms
- Search debounce: 300ms
- Page change: < 200ms
- Modal open: < 100ms

### Optimization Tips:
1. Use pagination (don't load all at once)
2. Debounce search inputs
3. Lazy load images/previews
4. Cache API responses
5. Minimize re-renders

---

## Security Considerations

### Permission Checks:
```typescript
// Always verify on server side
if (!document.userPermissions?.canEdit) {
  return <PermissionDenied />;
}

// Client-side checks for UX only
{canEdit && <EditButton />}
```

### Input Sanitization:
```typescript
// Sanitize description input
const sanitizedDescription = description.trim();

// Validate document IDs
if (!Number.isInteger(documentId) || documentId <= 0) {
  throw new Error('Invalid document ID');
}
```

---

## Support & Contact

For questions or issues:
- GitHub Issues: [project-repo]/issues
- Documentation: /docs/related-documents
- Email: dev-support@example.com





