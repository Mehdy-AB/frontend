'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Folder, 
  File, 
  MoreVertical, 
  Lock, 
  Globe, 
  Download,
  Share2,
  Edit,
  Trash2,
  Eye,
  User,
  Calendar,
  HardDrive,
  Settings,
  ChevronLeft,
  ChevronRight,
  Star,
  Tag,
  Hash,
  Type
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { notificationApiClient } from '@/api/notificationClient';
import { GlobalSearchResultDto, SearchFoldersRes, SearchDocumentsRes, ElasticSortFields } from '@/types/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotifications } from '../../hooks/useNotifications';
import AdvancedSearchModal from '@/components/modals/AdvancedSearchModal';

// Unified interface for search results
type SearchResultItem = (SearchFoldersRes & { type: 'folder' }) | (SearchDocumentsRes & { type: 'document' });

// Helper functions to access properties safely
const getItemId = (item: SearchResultItem): string => {
  return item.type === 'folder' ? item.folder.id.toString() : item.document.documentId.toString();
};

const getItemName = (item: SearchResultItem): string => {
  return item.type === 'folder' ? item.folder.name : item.document.name;
};

const getItemSize = (item: SearchResultItem): number => {
  return item.type === 'folder' ? (item.folder.size || 0) : (item.document.sizeBytes || 0);
};

const getItemCreatedAt = (item: SearchResultItem): string => {
  return item.type === 'folder' ? item.folder.createdAt : item.document.createdAt;
};

const getItemUpdatedAt = (item: SearchResultItem): string => {
  return item.type === 'folder' ? item.folder.updatedAt : item.document.updatedAt;
};

const getItemMimeType = (item: SearchResultItem): string | undefined => {
  return item.type === 'document' ? item.document.mimeType : undefined;
};

const getItemVersionNumber = (item: SearchResultItem): number | undefined => {
  return item.type === 'document' ? item.document.versionNumber : undefined;
};

export default function SearchResultsPage() {
  const { t } = useLanguage();
  const { showNotification } = useNotifications();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get search parameters from URL
  const query = searchParams.get('query') || '';
  
  // Local search query state for input
  const [localSearchQuery, setLocalSearchQuery] = useState(query);
  
  const [searchResults, setSearchResults] = useState<GlobalSearchResultDto | null>(null);
  const [loading, setLoading] = useState(false); // Only true when there's a query to fetch
  const [tableLoading, setTableLoading] = useState(false); // For table-only loading
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showAdvancedSearchModal, setShowAdvancedSearchModal] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const lookUpFolderName = searchParams.get('lookUpFolderName') === 'true';
  const lookUpDocumentName = searchParams.get('lookUpDocumentName') === 'true';
  const lookUpMetadataKey = searchParams.get('lookUpMetadataKey') === 'true';
  const lookUpMetadataValue = searchParams.get('lookUpMetadataValue') === 'true';
  const lookUpCategoryName = searchParams.get('lookUpCategoryName') === 'true';
  const lookUpOcrContent = searchParams.get('lookUpOcrContent') === 'true';
  const lookUpDescription = searchParams.get('lookUpDescription') === 'true';
  const includeFolders = searchParams.get('includeFolders') === 'true';
  const includeDocuments = searchParams.get('includeDocuments') === 'true';
  const sortBy = (searchParams.get('sortBy') as ElasticSortFields) || 'score';
  const sortDesc = searchParams.get('sortDesc') === 'true';

  // Combine search results for unified display
  const getSearchItems = (): SearchResultItem[] => {
    if (!searchResults) return [];
    
    const folderItems: SearchResultItem[] = searchResults.folders.map(folder => ({
      ...folder,
      type: 'folder' as const
    }));
    
    const documentItems: SearchResultItem[] = searchResults.documents.map(doc => ({
      ...doc,
      type: 'document' as const
    }));
    
    return [...folderItems, ...documentItems];
  };

  // Fetch search results
  const fetchSearchResults = async () => {
    if (!query.trim()) {
      setError('No search query provided');
      setTableLoading(false);
      return;
    }

    try {
      setTableLoading(true);
      setError(null);
      
      const response = await notificationApiClient.globalSearch({
        page: currentPage,
        size: 20,
        query: query,
        lookUpFolderName,
        lookUpDocumentName,
        lookUpMetadataKey,
        lookUpMetadataValue,
        lookUpCategoryName,
        lookUpOcrContent,
        lookUpDescription,
        includeFolders,
        includeDocuments,
        sortBy,
        sortDesc
      });
      
      setSearchResults(response);
    } catch (err) {
      setError('Failed to load search results');
      console.error('Error fetching search results:', err);
    } finally {
      setTableLoading(false);
    }
  };

  // Update local search query when URL query changes
  useEffect(() => {
    setLocalSearchQuery(query);
  }, [query]);

  useEffect(() => {
    // Only fetch if there's a query - use table loading only
    if (query.trim()) {
      fetchSearchResults();
    }
  }, [currentPage, query, lookUpFolderName, lookUpDocumentName, lookUpMetadataKey, lookUpMetadataValue, lookUpCategoryName, lookUpOcrContent, lookUpDescription, includeFolders, includeDocuments, sortBy, sortDesc]);

  // Handle search button click
  const handleSearch = () => {
    if (!localSearchQuery.trim()) {
      showNotification(
        'warning',
        'Search Query Required',
        'Please enter a search term to find folders and documents.',
        5000
      );
      return;
    }
    
    // Update URL with new query
    const newParams = new URLSearchParams(searchParams);
    newParams.set('query', localSearchQuery.trim());
    router.push(`/search?${newParams.toString()}`);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (lookUpFolderName !== true) count++;
    if (lookUpDocumentName !== true) count++;
    if (lookUpMetadataKey !== false) count++;
    if (lookUpMetadataValue !== false) count++;
    if (lookUpCategoryName !== false) count++;
    if (lookUpOcrContent !== false) count++;
    if (lookUpDescription !== true) count++;
    if (includeFolders !== true) count++;
    if (includeDocuments !== true) count++;
    if (sortBy !== 'score') count++;
    if (sortDesc !== false) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.relative')) {
        setOpenDropdownId(null);
      }
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, []);


  // Show empty state when no query
  if (!query.trim()) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Search className="h-6 w-6" />
              Search
            </h1>
            <p className="text-muted-foreground">
              Search for folders and documents
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search..."
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleSearch}
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                Search
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedSearchModal(true)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Advanced
              </Button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Search className="h-16 w-16 text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Start Your Search</h2>
              <p className="text-muted-foreground max-w-md">
                Enter a search term above to find folders and documents. You can search by name, content, or use advanced filters.
              </p>
            </div>
          </div>
        </div>

        {/* Advanced Search Modal */}
        <AdvancedSearchModal
          isOpen={showAdvancedSearchModal}
          onClose={() => setShowAdvancedSearchModal(false)}
          initialQuery={localSearchQuery}
        />
      </div>
    );
  }

  if (error && !tableLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-error text-lg mb-4">{error}</div>
        <Button onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const searchItems = getSearchItems();
  const totalResults = searchResults?.page?.totalElements || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Search className="h-6 w-6" />
            Search Results
          </h1>
          <p className="text-muted-foreground">
            {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
            {activeFiltersCount > 0 && (
              <span className="ml-2">
                • {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} applied
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
            </div>
            <Button
              onClick={handleSearch}
              className="gap-2"
            >
              <Search className="h-4 w-4" />
              Search
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedSearchModal(true)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Advanced
            </Button>
          </div>

          {/* Sort Options */}
          <Select 
            value={`${sortBy}-${sortDesc ? 'desc' : 'asc'}`} 
            onValueChange={(value) => {
              const [field, direction] = value.split('-');
              const newParams = new URLSearchParams(searchParams);
              newParams.set('sortBy', field);
              newParams.set('sortDesc', (direction === 'desc').toString());
              router.push(`/search?${newParams.toString()}`);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score-asc">Relevance (Low to High)</SelectItem>
              <SelectItem value="score-desc">Relevance (High to Low)</SelectItem>
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="name-desc">Name Z-A</SelectItem>
              <SelectItem value="createdAt-desc">Newest First</SelectItem>
              <SelectItem value="createdAt-asc">Oldest First</SelectItem>
              <SelectItem value="updatedAt-desc">Recently Modified</SelectItem>
              <SelectItem value="updatedAt-asc">Least Recently Modified</SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Active Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {!lookUpFolderName && (
                <Badge variant="secondary" className="gap-1">
                  <Folder className="h-3 w-3" />
                  No Folder Names
                </Badge>
              )}
              {!lookUpDocumentName && (
                <Badge variant="secondary" className="gap-1">
                  <File className="h-3 w-3" />
                  No Document Names
                </Badge>
              )}
              {lookUpMetadataKey && (
                <Badge variant="secondary" className="gap-1">
                  <Hash className="h-3 w-3" />
                  Metadata Keys
                </Badge>
              )}
              {lookUpMetadataValue && (
                <Badge variant="secondary" className="gap-1">
                  <Tag className="h-3 w-3" />
                  Metadata Values
                </Badge>
              )}
              {lookUpCategoryName && (
                <Badge variant="secondary" className="gap-1">
                  <User className="h-3 w-3" />
                  Category Names
                </Badge>
              )}
              {lookUpOcrContent && (
                <Badge variant="secondary" className="gap-1">
                  <Type className="h-3 w-3" />
                  OCR Content
                </Badge>
              )}
              {!lookUpDescription && (
                <Badge variant="secondary" className="gap-1">
                  <Type className="h-3 w-3" />
                  No Descriptions
                </Badge>
              )}
              {!includeFolders && (
                <Badge variant="secondary" className="gap-1">
                  <Folder className="h-3 w-3" />
                  Folders Excluded
                </Badge>
              )}
              {!includeDocuments && (
                <Badge variant="secondary" className="gap-1">
                  <File className="h-3 w-3" />
                  Documents Excluded
                </Badge>
              )}
              {sortBy !== 'score' && (
                <Badge variant="secondary">
                  Sort: {sortBy}
                </Badge>
              )}
              {sortDesc && (
                <Badge variant="secondary">
                  Descending
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchItems.length === 0 && !tableLoading && searchResults ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No results found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
            <Button onClick={() => setShowAdvancedSearchModal(true)}>
              Modify Search
            </Button>
          </CardContent>
        </Card>
      ) : (
        viewMode === 'list' ? (
          <SearchResultsTableView 
            items={searchItems} 
            formatFileSize={formatFileSize} 
            formatDate={formatDate}
            openDropdownId={openDropdownId}
            setOpenDropdownId={setOpenDropdownId}
            showLoadingRows={tableLoading}
          />
        ) : (
          <SearchResultsGridView 
            items={searchItems} 
            formatFileSize={formatFileSize} 
            formatDate={formatDate}
            openDropdownId={openDropdownId}
            setOpenDropdownId={setOpenDropdownId}
            showLoadingRows={tableLoading}
          />
        )
      )}

      {/* Loading indicator */}
      {tableLoading && (
        <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
          Loading search results...
        </div>
      )}

      {/* Pagination */}
      {searchResults?.page && searchResults.page.totalPages > 1 && (
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {searchItems.length} of {totalResults} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
              disabled={searchResults?.page?.first}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            {[...Array(Math.min(searchResults?.page?.totalPages || 0, 5))].map((_, i) => {
              const pageNumber = currentPage > 2 ? currentPage - 2 + i : i;
              if (pageNumber >= (searchResults?.page?.totalPages || 0)) return null;
              return (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNumber)}
                  className="w-9"
                >
                  {pageNumber + 1}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, (searchResults?.page?.totalPages || 1) - 1))}
              disabled={searchResults?.page?.last}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Advanced Search Modal */}
      <AdvancedSearchModal
        isOpen={showAdvancedSearchModal}
        onClose={() => setShowAdvancedSearchModal(false)}
        initialQuery={query}
      />
    </div>
  );
}

// Search Results Table View Component
function SearchResultsTableView({ items, formatFileSize, formatDate, openDropdownId, setOpenDropdownId, showLoadingRows = false }: {
  items: SearchResultItem[];
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
  showLoadingRows?: boolean;
}) {
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 text-sm font-medium">Name</th>
              <th className="text-left p-4 text-sm font-medium">Type</th>
              <th className="text-left p-4 text-sm font-medium">Owner</th>
              <th className="text-left p-4 text-sm font-medium">Size</th>
              <th className="text-left p-4 text-sm font-medium">Last Modified</th>
              <th className="text-left p-4 text-sm font-medium">Relevance</th>
              <th className="text-left p-4 text-sm font-medium">Highlight</th>
              <th className="text-left p-4 text-sm font-medium">Visibility</th>
              <th className="text-left p-4 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
        <SearchResultRow 
          key={item.type === 'folder' ? `folder-${getItemId(item)}` : `document-${getItemId(item)}`}
          item={item} 
          formatFileSize={formatFileSize} 
          formatDate={formatDate}
          openDropdownId={openDropdownId}
          setOpenDropdownId={setOpenDropdownId}
        />
            ))}
            {/* Loading skeleton rows */}
            {showLoadingRows && Array.from({ length: 5 }).map((_, index) => (
              <tr key={`skeleton-${index}`} className="border-b">
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-muted animate-pulse rounded"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
                      <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                </td>
                <td className="p-4">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                </td>
                <td className="p-4">
                  <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                </td>
                <td className="p-4">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                </td>
                <td className="p-4">
                  <div className="h-8 w-8 bg-muted animate-pulse rounded"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// Search Results Grid View Component
function SearchResultsGridView({ items, formatFileSize, formatDate, openDropdownId, setOpenDropdownId, showLoadingRows = false }: {
  items: SearchResultItem[];
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
  showLoadingRows?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <SearchResultCard 
          key={item.type === 'folder' ? `folder-${getItemId(item)}` : `document-${getItemId(item)}`}
          item={item} 
          formatFileSize={formatFileSize} 
          formatDate={formatDate}
          openDropdownId={openDropdownId}
          setOpenDropdownId={setOpenDropdownId}
        />
      ))}
      {/* Loading skeleton cards */}
      {showLoadingRows && Array.from({ length: 8 }).map((_, index) => (
        <Card key={`skeleton-${index}`} className="p-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-muted animate-pulse rounded"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-muted animate-pulse rounded"></div>
              <div className="h-3 w-3/4 bg-muted animate-pulse rounded"></div>
            </div>
            <div className="flex justify-between items-center">
              <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
              <div className="h-6 w-6 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Search Result Row Component
function SearchResultRow({ item, formatFileSize, formatDate, openDropdownId, setOpenDropdownId }: { 
  item: SearchResultItem;
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isFolder = item.type === 'folder';
  const itemId = getItemId(item);
  const showMenu = openDropdownId === itemId;
  const size = getItemSize(item);
  const updatedAt = getItemUpdatedAt(item);

  // Get highlighted text for display
  const getHighlightedName = () => {
    if (item.highlight?.name) {
      return <span dangerouslySetInnerHTML={{ __html: item.highlight.name }} />;
    }
    return getItemName(item);
  };

  const getHighlightedDescription = () => {
    if (item.highlight?.description) {
      return <span dangerouslySetInnerHTML={{ __html: item.highlight.description }} />;
    }
    return isFolder ? item.folder.description : item.document.description;
  };

  // Get highlighted metadata fields
  const getHighlightedMetadata = () => {
    const highlights = [];
    
    if (item.highlight?.['metadata.categoryName']) {
      highlights.push(
        <div key="category" className="text-xs text-blue-600">
          <strong>Category:</strong> <span dangerouslySetInnerHTML={{ __html: item.highlight['metadata.categoryName'] }} />
        </div>
      );
    }
    
    if (item.highlight?.['metadata.key']) {
      highlights.push(
        <div key="key" className="text-xs text-green-600">
          <strong>Key:</strong> <span dangerouslySetInnerHTML={{ __html: item.highlight['metadata.key'] }} />
        </div>
      );
    }
    
    if (item.highlight?.['metadata.value']) {
      highlights.push(
        <div key="value" className="text-xs text-purple-600">
          <strong>Value:</strong> <span dangerouslySetInnerHTML={{ __html: item.highlight['metadata.value'] }} />
        </div>
      );
    }
    
    if (item.highlight?.ocrText) {
      highlights.push(
        <div key="ocr" className="text-xs text-orange-600">
          <strong>OCR:</strong> <span dangerouslySetInnerHTML={{ __html: item.highlight.ocrText }} />
        </div>
      );
    }
    
    return highlights.length > 0 ? (
      <div className="mt-1 space-y-1">
        {highlights}
      </div>
    ) : null;
  };

  return (
    <tr className="border-b last:border-b-0 hover:bg-muted/50 group">
      <td className="p-4">
        {isFolder ? (
          <Link href={`/folders/${item.folder.id}`} className="flex cursor-pointer group items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Folder className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-medium text-foreground group-hover:underline group-hover:text-primary">
                {getHighlightedName()}
              </div>
              <div className="text-sm text-muted-foreground group-hover:underline group-hover:text-primary">
                {getHighlightedDescription()}
              </div>
              {getHighlightedMetadata()}
            </div>
          </Link>
        ) : (
          <Link href={`/documents/${item.document.documentId}`} className="flex cursor-pointer group items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <File className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-medium text-foreground group-hover:underline group-hover:text-primary">
                {getHighlightedName()}
              </div>
              <div className="text-sm text-muted-foreground group-hover:underline group-hover:text-primary">
                {getItemMimeType(item)?.split('/')[1].toUpperCase()} • v{getItemVersionNumber(item)}
              </div>
              {getHighlightedMetadata()}
            </div>
          </Link>
        )}
      </td>
      <td className="p-4">
        <Badge variant={isFolder ? "default" : "secondary"}>
          {isFolder ? 'Folder' : 'Document'}
        </Badge>
      </td>
      <td className="p-4">
        <div className="text-sm">{isFolder ? item.folder.ownedBy.firstName : item.document.ownedBy.firstName} {isFolder ? item.folder.ownedBy.lastName : item.document.ownedBy.lastName}</div>
      </td>
      <td className="p-4">
        <div className="text-sm text-muted-foreground">{formatFileSize(size)}</div>
      </td>
      <td className="p-4">
        <div className="text-sm text-muted-foreground">{formatDate(updatedAt)}</div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">{item.score.toFixed(2)}</span>
        </div>
      </td>
      <td className="p-4">
        <div className="text-xs space-y-1 max-w-32">
          {item.highlight?.name && (
            <div className="text-blue-600 truncate">
              <strong>Name:</strong> <span dangerouslySetInnerHTML={{ __html: item.highlight.name }} />
            </div>
          )}
          {item.highlight?.description && (
            <div className="text-green-600 truncate">
              <strong>Desc:</strong> <span dangerouslySetInnerHTML={{ __html: item.highlight.description }} />
            </div>
          )}
          {item.highlight?.['metadata.categoryName'] && (
            <div className="text-purple-600 truncate">
              <strong>Cat:</strong> <span dangerouslySetInnerHTML={{ __html: item.highlight['metadata.categoryName'] }} />
            </div>
          )}
          {item.highlight?.['metadata.key'] && (
            <div className="text-orange-600 truncate">
              <strong>Key:</strong> <span dangerouslySetInnerHTML={{ __html: item.highlight['metadata.key'] }} />
            </div>
          )}
          {item.highlight?.['metadata.value'] && (
            <div className="text-pink-600 truncate">
              <strong>Val:</strong> <span dangerouslySetInnerHTML={{ __html: item.highlight['metadata.value'] }} />
            </div>
          )}
          {item.highlight?.ocrText && (
            <div className="text-cyan-600 truncate">
              <strong>OCR:</strong> <span dangerouslySetInnerHTML={{ __html: item.highlight.ocrText }} />
            </div>
          )}
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1">
          {isFolder ? item.folder.isPublic : item.document.isPublic ? (
            <>
              <Globe className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Public</span>
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Private</span>
            </>
          )}
        </div>
      </td>
      <td className="p-4">
        <div className="relative">
          <button 
            ref={buttonRef}
            onClick={() => setOpenDropdownId(showMenu ? null : itemId)}
            className="p-1 rounded hover:bg-muted transition-opacity"
          >
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          
          {showMenu && (
            <SearchResultMenu 
              item={item} 
              onClose={() => setOpenDropdownId(null)}
              buttonRef={buttonRef}
            />
          )}
        </div>
      </td>
    </tr>
  );
}

// Search Result Card Component
function SearchResultCard({ item, formatFileSize, formatDate, openDropdownId, setOpenDropdownId }: { 
  item: SearchResultItem;
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isFolder = item.type === 'folder';
  const itemId = getItemId(item);
  const showMenu = openDropdownId === itemId;
  const size = getItemSize(item);
  const updatedAt = getItemUpdatedAt(item);

  // Get highlighted text for display
  const getHighlightedName = () => {
    if (item.highlight?.name) {
      return <span dangerouslySetInnerHTML={{ __html: item.highlight.name }} />;
    }
    return getItemName(item);
  };

  const getHighlightedDescription = () => {
    if (item.highlight?.description) {
      return <span dangerouslySetInnerHTML={{ __html: item.highlight.description }} />;
    }
    return isFolder ? item.folder.description : item.document.description;
  };

  // Get highlighted metadata fields
  const getHighlightedMetadata = () => {
    const highlights = [];
    
    if (item.highlight?.['metadata.categoryName']) {
      highlights.push(
        <div key="category" className="text-xs text-blue-600">
          <strong>Category:</strong> <span dangerouslySetInnerHTML={{ __html: item.highlight['metadata.categoryName'] }} />
        </div>
      );
    }
    
    if (item.highlight?.['metadata.key']) {
      highlights.push(
        <div key="key" className="text-xs text-green-600">
          <strong>Key:</strong> <span dangerouslySetInnerHTML={{ __html: item.highlight['metadata.key'] }} />
        </div>
      );
    }
    
    if (item.highlight?.['metadata.value']) {
      highlights.push(
        <div key="value" className="text-xs text-purple-600">
          <strong>Value:</strong> <span dangerouslySetInnerHTML={{ __html: item.highlight['metadata.value'] }} />
        </div>
      );
    }
    
    if (item.highlight?.ocrText) {
      highlights.push(
        <div key="ocr" className="text-xs text-orange-600">
          <strong>OCR:</strong> <span dangerouslySetInnerHTML={{ __html: item.highlight.ocrText }} />
        </div>
      );
    }
    
    return highlights.length > 0 ? (
      <div className="mt-1 space-y-1">
        {highlights}
      </div>
    ) : null;
  };

  const content = (
    <Card className="group hover:shadow-md transition-all h-full">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
            {isFolder ? (
              <Folder className="h-6 w-6 text-primary" />
            ) : (
              <File className="h-6 w-6 text-primary" />
            )}
          </div>
          <div className="relative">
            <button 
              ref={buttonRef}
              onClick={(e) => { e.preventDefault(); setOpenDropdownId(showMenu ? null : itemId); }}
              className="p-1 rounded hover:bg-muted transition-opacity"
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            
            {showMenu && (
              <SearchResultMenu 
                item={item} 
                onClose={() => setOpenDropdownId(null)}
                buttonRef={buttonRef}
              />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-foreground group-hover:underline group-hover:text-primary line-clamp-2">
            {getHighlightedName()}
          </h3>
          <p className="text-sm text-muted-foreground group-hover:underline group-hover:text-primary line-clamp-2">
            {getHighlightedDescription()}
          </p>
          {!isFolder && (
            <p className="text-xs text-muted-foreground uppercase">
              {getItemMimeType(item)?.split('/')[1]} • v{getItemVersionNumber(item)}
            </p>
          )}
          {getHighlightedMetadata()}
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(updatedAt)}
            </span>
            <span>{formatFileSize(size)}</span>
          </div>
          <div className="flex items-center gap-1">
            {isFolder ? item.folder.isPublic : item.document.isPublic ? (
              <Globe className="h-3 w-3 text-green-500" />
            ) : (
              <Lock className="h-3 w-3 text-red-500" />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <Badge variant={isFolder ? "default" : "secondary"} className="text-xs">
            {isFolder ? 'Folder' : 'Document'}
          </Badge>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-500" />
            <span className="text-xs font-medium">{item.score.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return isFolder ? (
    <Link href={`/folders/${item.folder.id}`} className="cursor-pointer group">{content}</Link>
  ) : (
    <Link href={`/documents/${item.document.documentId}`} className="cursor-pointer group">{content}</Link>
  );
}

// Search Result Menu Component
function SearchResultMenu({ item, onClose, buttonRef }: { 
  item: SearchResultItem; 
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const isFolder = item.type === 'folder';

  useEffect(() => {
    if (buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right - 192 + window.scrollX // 192px is the width of the dropdown
      });
    }
  }, [buttonRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-result-menu-dropdown')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const menuContent = (
    <div className="search-result-menu-dropdown fixed w-48 bg-white border border-gray-300 rounded-lg shadow-lg" style={{ zIndex: 9999, top: position.top, left: position.left }}>
      {!isFolder && (
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100">
          <Eye className="h-4 w-4" />
          Preview
        </button>
      )}
      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100">
        <Download className="h-4 w-4" />
        Download
      </button>
      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100">
        <Share2 className="h-4 w-4" />
        Share
      </button>
      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100">
        <Edit className="h-4 w-4" />
        Edit
      </button>
      <hr className="border-gray-200" />
      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
        <Trash2 className="h-4 w-4" />
        Move to Trash
      </button>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(menuContent, document.body) : null;
}

// Loading Skeleton
function SearchResultsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
        <div className="flex gap-3">
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-10 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-10 animate-pulse"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-muted rounded w-full mb-4"></div>
              <div className="flex justify-between">
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-4 bg-muted rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
