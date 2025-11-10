'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Share2, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Folder,
  File,
  Lock,
  Globe,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '../../contexts/LanguageContext';
import { notificationApiClient } from '@/api/notificationClient';
import { FolderRepoResDto, FolderResDto, DocumentResponseDto, SortFields } from '@/types/api';
import Pagination from '@/components/main/Pagination';
import ServerSearchInput from '@/components/main/ServerSearchInput';
import UserAvatar from '@/components/main/UserAvatar';
import EditFolderModal from '@/components/modals/EditFolderModal';
import EditDocumentModal from '@/components/modals/EditDocumentModal';
import { ItemMenu } from '@/components/folder/ItemMenu';

// Unified interface for table items
type TableItem = (FolderResDto & { type: 'folder' }) | (DocumentResponseDto & { type: 'document' });

// Sort options for shared items
type SortOption = 'name' | 'createdAt' | 'updatedAt' | 'size';

// Helper function to format path (remove UUID prefix for folders)
const formatPath = (path: string | undefined): string => {
  if (!path) return '';
  
  const pathSegments = path.split('.').filter(segment => segment.trim() !== '');
  
  // Check if first segment is a UUID (supports both dash and underscore formats)
  const uuidPatternDash = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const uuidPatternUnderscore = /^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$/i;
  const firstSegmentIsUuid = pathSegments.length > 0 && 
    (uuidPatternDash.test(pathSegments[0]) || uuidPatternUnderscore.test(pathSegments[0]));
  
  // Skip the UUID segment if it exists
  const folderSegments = firstSegmentIsUuid ? pathSegments.slice(1) : pathSegments;
  
  return folderSegments.join(' › ');
};

// Helper function to format path with username replacement for documents
const formatPathWithUsername = (path: string | undefined, username: string | undefined): { hasPath: boolean; username: string | null; restPath: string } => {
  if (!path) return { hasPath: false, username: null, restPath: '' };
  
  const pathSegments = path.split('.').filter(segment => segment.trim() !== '');
  
  // Check if first segment is a UUID (supports both dash and underscore formats)
  const uuidPatternDash = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const uuidPatternUnderscore = /^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$/i;
  const firstSegmentIsUuid = pathSegments.length > 0 && 
    (uuidPatternDash.test(pathSegments[0]) || uuidPatternUnderscore.test(pathSegments[0]));
  
  if (firstSegmentIsUuid && username) {
    // Replace UUID with username
    const folderSegments = pathSegments.slice(1);
    return {
      hasPath: true,
      username: username,
      restPath: folderSegments.length > 0 ? folderSegments.join(' › ') : ''
    };
  }
  
  // No UUID or no username, just return the path segments
  const folderSegments = firstSegmentIsUuid ? pathSegments.slice(1) : pathSegments;
  return {
    hasPath: folderSegments.length > 0,
    username: null,
    restPath: folderSegments.join(' › ')
  };
};

// Custom TableRow component for shared items with path and creator info
function SharedTableRow({ 
  item, 
  formatFileSize, 
  formatDate, 
  onEditPermissions,
  onEditFolderPermissions,
  onMove,
  onRename,
  onDelete,
  onShowComments,
  onDownload,
  onShare,
  onCopyLink,
  onView,
  openDropdownId, 
  setOpenDropdownId 
}: {
  item: TableItem;
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
  onEditPermissions?: (document: DocumentResponseDto) => void;
  onEditFolderPermissions?: (folder: FolderResDto) => void;
  onMove?: (item: TableItem) => void;
  onRename?: (item: TableItem) => void;
  onDelete?: (item: TableItem) => void;
  onShowComments?: (item: TableItem) => void;
  onDownload?: (item: TableItem) => void;
  onShare?: (item: TableItem) => void;
  onCopyLink?: (item: TableItem) => void;
  onView?: (item: TableItem) => void;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemId = item.type === 'folder' ? `folder-${item.id}` : `document-${item.documentId}`;
  const showMenu = openDropdownId === itemId;
  const isFolder = item.type === 'folder';
  const size = isFolder ? item.size : item.sizeBytes;
  const updatedAt = isFolder ? item.updatedAt : item.updatedAt;
  const path = item.path;
  const owner = item.ownedBy;
  
  // Format path differently for folders vs documents
  const formattedPath = isFolder ? formatPath(path) : null;
  const pathWithUsername = !isFolder ? formatPathWithUsername(path, owner.username) : null;

  return (
    <tr className="border-b border-ui last:border-b-0 hover:bg-neutral-background group">
      <td className="p-4">
        {isFolder ? (
          <div className="flex cursor-pointer group items-center gap-3" onClick={() => window.location.href = `/folders/${item.id}`}>
            <div className="h-10 w-10 bg-primary-light rounded-lg flex items-center justify-center">
              <Folder className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-neutral-text-dark group-hover:underline group-hover:text-primary truncate">{item.name}</div>
              {formattedPath && (
                <div className="text-sm text-neutral-text-light group-hover:underline group-hover:text-primary truncate">
                  {formattedPath}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex cursor-pointer group items-center gap-3" onClick={() => window.location.href = `/documents/${item.documentId}`}>
            <div className="h-10 w-10 bg-primary-light rounded-lg flex items-center justify-center">
              <File className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-neutral-text-dark group-hover:underline group-hover:text-primary truncate">{item.name}</div>
              {pathWithUsername?.hasPath ? (
                <div className="text-sm text-neutral-text-light group-hover:underline group-hover:text-primary truncate flex items-center gap-1">
                  {pathWithUsername.username && (
                    <span className="text-blue-600 font-medium">{`{${pathWithUsername.username}}`}</span>
                  )}
                  {pathWithUsername.restPath && (
                    <>
                      {pathWithUsername.username && <span> › </span>}
                      <span>{pathWithUsername.restPath}</span>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-sm text-neutral-text-light group-hover:underline group-hover:text-primary">
                  {item.mimeType.split('/')[1].toUpperCase()} • v{item.versionNumber}
                </div>
              )}
            </div>
          </div>
        )}
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <UserAvatar user={owner} size="sm" />
          <div className="flex flex-col min-w-0">
            <div className="text-sm text-neutral-text-dark truncate">
              {owner.firstName} {owner.lastName}
            </div>
            {owner.email && (
              <div className="text-xs text-neutral-text-light truncate">
                {owner.email}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="text-sm text-neutral-text-light">{formatFileSize(size)}</div>
      </td>
      <td className="p-4">
        <div className="text-sm text-neutral-text-light">{formatDate(updatedAt)}</div>
      </td>
      <td className="p-4">
        <div className="text-sm text-neutral-text-light">
          {isFolder ? '-' : `v${item.versionNumber}`}
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1">
          {item.isPublic ? (
            <>
              <Globe className="h-4 w-4 text-success" />
              <span className="text-sm text-neutral-text-light">Public</span>
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 text-neutral-text-light" />
              <span className="text-sm text-neutral-text-light">Private</span>
            </>
          )}
        </div>
      </td>
      <td className="p-4">
        <div className="relative" style={{ zIndex: 10 }}>
          <button 
            ref={buttonRef}
            onClick={() => setOpenDropdownId(showMenu ? null : itemId)}
            className="p-1 item-menu-dropdown rounded hover:bg-ui transition-opacity"
          >
            <MoreVertical className="h-4 w-4 text-neutral-text-light" />
          </button>
          
          {showMenu && (
            <ItemMenu 
              item={item} 
              onEditPermissions={onEditPermissions}
              onEditFolderPermissions={onEditFolderPermissions}
              onMove={onMove}
              onRename={onRename}
              onDelete={onDelete}
              onShowComments={onShowComments}
              onDownload={onDownload}
              onShare={onShare}
              onCopyLink={onCopyLink}
              onView={onView}
              onClose={() => setOpenDropdownId(null)}
              buttonRef={buttonRef}
            />
          )}
        </div>
      </td>
    </tr>
  );
}

export default function SharedPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [data, setData] = useState<FolderRepoResDto | null>(null);
  const [allTableItems, setAllTableItems] = useState<TableItem[]>([]);
  const [localSearchResults, setLocalSearchResults] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDesc, setSortDesc] = useState(false);
  const [isLocalFiltering, setIsLocalFiltering] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [showEditDocumentModal, setShowEditDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentResponseDto | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<FolderResDto | null>(null);
  
  // Ref to prevent multiple simultaneous fetches
  const isFetchingRef = useRef(false);

  // Combine folders and documents for unified table (memoized)
  const tableItems = useMemo(() => {
    if (!data) return [];
    
    const folderItems: TableItem[] = (data.folders || []).map(folder => ({
      ...folder,
      type: 'folder' as const
    }));
    
    const documentItems: TableItem[] = (data.documents || []).map(doc => ({
      ...doc,
      type: 'document' as const
    }));
    
    return [...folderItems, ...documentItems];
  }, [data]);

  // Update allTableItems when tableItems changes
  useEffect(() => {
    setAllTableItems(tableItems);
  }, [tableItems]);

  // Get display items (local search results or API results)
  const displayItems = useMemo(() => {
    if (isLocalFiltering && localSearchResults.length > 0) {
      return localSearchResults;
    }
    return tableItems;
  }, [isLocalFiltering, localSearchResults, tableItems]);

  // Local filtering function for table items
  const filterTableItemsLocally = (query: string, allItems: TableItem[]) => {
    if (!query.trim()) {
      return allItems;
    }
    
    const lowerQuery = query.toLowerCase();
    return allItems.filter(item => {
      const matchesName = item.name.toLowerCase().includes(lowerQuery);
      const matchesDescription = item.type === 'folder' && (item as any).description 
        ? (item as any).description.toLowerCase().includes(lowerQuery) 
        : false;
      const matchesPath = item.path ? formatPath(item.path).toLowerCase().includes(lowerQuery) : false;
      return matchesName || matchesDescription || matchesPath;
    });
  };

  // Map sort option to API sort field
  const mapSortOptionToApiField = (sortOption: SortOption): SortFields => {
    switch (sortOption) {
      case 'name':
        return SortFields.NAME;
      case 'createdAt':
        return SortFields.CREATED_AT;
      case 'updatedAt':
        return SortFields.UPDATED_AT;
      case 'size':
        return SortFields.NAME; // API doesn't have size sorting, fallback to name
      default:
        return SortFields.NAME;
    }
  };

  // Fetch shared folders and documents from API
  const fetchSharedData = useCallback(async (isSearchRequest = false, searchTerm?: string) => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      return;
    }
    
    isFetchingRef.current = true;
    try {
      if (isSearchRequest) {
        setTableLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await notificationApiClient.getSharedFolders({
        page: currentPage,
        size: 20,
        name: searchTerm !== undefined ? searchTerm : (debouncedSearchQuery || undefined),
        showFolder: true,
        sort: mapSortOptionToApiField(sortBy),
        desc: sortDesc
      });
      
      setData(response);
    } catch (err: any) {
      console.error('Error fetching shared data:', err);
      setError(err.message || 'Failed to load shared items');
    } finally {
      if (isSearchRequest) {
        setTableLoading(false);
      } else {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, [currentPage, debouncedSearchQuery, sortBy, sortDesc]);


  // Debounce search query for API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle local filtering immediately when search query changes
  // Only filter if we have items and a search query, and we're not waiting for API results
  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsLocalFiltering(false);
      setLocalSearchResults([]);
      return;
    }

    // Only do local filtering if we have data to filter
    if (allTableItems.length === 0) {
      return;
    }

    // Filter locally for immediate response
    setIsLocalFiltering(true);
    const localResults = filterTableItemsLocally(searchQuery, allTableItems);
    setLocalSearchResults(localResults);
    
    // Clear local filtering after debounced search completes (handled by API fetch effect)
  }, [searchQuery, allTableItems]);

  // Track previous values to detect changes
  const prevSortBy = useRef(sortBy);
  const prevSortDesc = useRef(sortDesc);
  const prevDebouncedSearch = useRef(debouncedSearchQuery);
  const prevPage = useRef(currentPage);

  // Fetch data when pagination, sort, or debounced search changes
  useEffect(() => {
    const sortChanged = prevSortBy.current !== sortBy || prevSortDesc.current !== sortDesc;
    const searchChanged = prevDebouncedSearch.current !== debouncedSearchQuery;
    const pageChanged = prevPage.current !== currentPage;

    // Reset to page 0 when sort or search changes
    if ((sortChanged || searchChanged) && currentPage !== 0) {
      prevSortBy.current = sortBy;
      prevSortDesc.current = sortDesc;
      prevDebouncedSearch.current = debouncedSearchQuery;
      setCurrentPage(0);
      return; // Will trigger another fetch when currentPage updates
    }

    // Update refs
    prevSortBy.current = sortBy;
    prevSortDesc.current = sortDesc;
    prevDebouncedSearch.current = debouncedSearchQuery;
    prevPage.current = currentPage;

    // Determine if this is the initial load
    const isInitialLoad = currentPage === 0 && 
                         sortBy === 'name' && 
                         sortDesc === false && 
                         !debouncedSearchQuery &&
                         !data;

    // Fetch data
    fetchSharedData(!isInitialLoad);
  }, [currentPage, sortBy, sortDesc, debouncedSearchQuery, fetchSharedData]);

  // Clear local filtering when new data arrives from API (for search queries)
  const prevDataRef = useRef<FolderRepoResDto | null>(null);
  useEffect(() => {
    // Only clear if data actually changed (new API response) and we have a search query
    if (data && data !== prevDataRef.current && debouncedSearchQuery && isLocalFiltering) {
      // New data arrived from API search, clear local filtering to show API results
      setIsLocalFiltering(false);
          setLocalSearchResults([]);
    }
    prevDataRef.current = data;
  }, [data, debouncedSearchQuery, isLocalFiltering]);

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
      day: 'numeric'
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchSharedData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEditFolderPermissions = (folder: FolderResDto) => {
    setSelectedFolder(folder);
    setShowEditFolderModal(true);
  };

  const handleEditDocumentPermissions = (document: DocumentResponseDto) => {
    setSelectedDocument(document);
    setShowEditDocumentModal(true);
  };

  const handleMove = (item: TableItem) => {
    console.log('Move item:', item.name);
  };

  const handleRename = (item: TableItem) => {
    console.log('Rename item:', item.name);
  };

  const handleDelete = (item: TableItem) => {
    console.log('Delete item:', item.name);
  };

  const handleShowComments = (item: TableItem) => {
    console.log('Show comments for item:', item.name);
  };

  const handleView = (item: TableItem) => {
    if (item.type === 'document') {
      router.push(`/documents/${item.documentId}`);
    }
  };

  const handleDownload = async (item: TableItem) => {
    if (item.type === 'document') {
      try {
        const downloadUrl = await notificationApiClient.downloadDocument(item.documentId);
        await notificationApiClient.fileDownloaded(item.documentId);
        const link = window.document.createElement('a');
        link.href = downloadUrl;
        link.download = item.name;
        link.target = '_blank';
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      } catch (error) {
        console.error('Error downloading document:', error);
      }
    }
  };

  const handleShare = (item: TableItem) => {
    if (item.type === 'document') {
      setSelectedDocument(item);
      setShowEditDocumentModal(true);
    } else if (item.type === 'folder') {
      setSelectedFolder(item);
      setShowEditFolderModal(true);
    }
  };

  const handleCopyLink = (item: TableItem) => {
    const baseUrl = window.location.origin;
    let link = '';
    if (item.type === 'document') {
      link = `${baseUrl}/documents/${item.documentId}`;
    } else if (item.type === 'folder') {
      link = `${baseUrl}/folders/${item.id}`;
    }
    if (link) {
      navigator.clipboard.writeText(link).then(() => {
        console.log('Link copied to clipboard');
      }).catch(err => {
        console.error('Failed to copy link:', err);
      });
    }
  };

  if (error) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
          <div className="text-destructive text-lg mb-4">{error}</div>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
      </Card>
    );
  }

  const totalElements = data?.totalElements || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-6">
        {/* Main Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gradient-to-br from-green-500/10 to-green-500/20 rounded-xl flex items-center justify-center shadow-sm">
                <Share2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Shared with Me
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Folders and documents shared with you by other users
                </p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/5 rounded-lg">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="font-medium text-foreground">{totalElements}</span>
                <span className="text-muted-foreground">shared items</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="h-9 px-3"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search and Sort Controls */}
        <div className="bg-white border border-gray-200 rounded-lg px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <ServerSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search shared folders and documents..."
              />
          </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 hover:bg-gray-50 transition-colors">
                    <ArrowUpDown className="h-4 w-4" />
                    <span>Sort by: {sortBy === 'name' ? 'Name' : sortBy === 'createdAt' ? 'Date Created' : sortBy === 'updatedAt' ? 'Date Modified' : 'Size'}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setSortBy('name')} className={sortBy === 'name' ? 'bg-gray-100' : ''}>
                    Name
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('createdAt')} className={sortBy === 'createdAt' ? 'bg-gray-100' : ''}>
                    Date Created
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('updatedAt')} className={sortBy === 'updatedAt' ? 'bg-gray-100' : ''}>
                    Date Modified
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('size')} className={sortBy === 'size' ? 'bg-gray-100' : ''}>
                    Size
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                onClick={() => setSortDesc(!sortDesc)}
                className="p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                title={sortDesc ? 'Sort Ascending' : 'Sort Descending'}
              >
                {sortDesc ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table View */}
      <Card>
        {loading && displayItems.length === 0 ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading shared items...</p>
                </div>
        ) : displayItems.length === 0 ? (
          <div className="p-12 text-center">
            <Share2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No shared items yet</h3>
            <p className="text-muted-foreground">
              {searchQuery ? `No items found matching "${searchQuery}"` : "No folders or documents have been shared with you yet"}
            </p>
        </div>
      ) : (
          <div className="bg-white">
            <table className="w-full relative" style={{ zIndex: 1 }}>
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Owner</th>
                  <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Size</th>
                  <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Last Modified</th>
                  <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Version</th>
                  <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Visibility</th>
                  <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((item) => (
                  <SharedTableRow
                    key={item.type === 'folder' ? `folder-${item.id}` : `document-${item.documentId}`}
                    item={item}
                    formatFileSize={formatFileSize} 
                    formatDate={formatDate}
                    onEditPermissions={handleEditDocumentPermissions}
                    onEditFolderPermissions={handleEditFolderPermissions}
                    onMove={handleMove}
                    onRename={handleRename}
                    onDelete={handleDelete}
                    onShowComments={handleShowComments}
                    onDownload={handleDownload}
                    onShare={handleShare}
                    onCopyLink={handleCopyLink}
                    onView={handleView}
                    openDropdownId={openDropdownId}
                    setOpenDropdownId={setOpenDropdownId}
                  />
                ))}
                {/* Loading skeleton rows */}
                {tableLoading && [...Array(3)].map((_, i) => (
                  <tr key={`loading-${i}`} className="border-b border-ui last:border-b-0">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-neutral-ui rounded-lg animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-neutral-ui rounded w-32 animate-pulse"></div>
                          <div className="h-3 bg-neutral-ui rounded w-24 animate-pulse"></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-neutral-ui rounded w-20 animate-pulse"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-neutral-ui rounded w-16 animate-pulse"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-neutral-ui rounded w-20 animate-pulse"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-neutral-ui rounded w-12 animate-pulse"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-neutral-ui rounded w-16 animate-pulse"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-neutral-ui rounded w-4 animate-pulse"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={20}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Modals */}
      {showEditFolderModal && selectedFolder && (
        <EditFolderModal
          folder={selectedFolder}
          isOpen={showEditFolderModal}
          onClose={() => {
            setShowEditFolderModal(false);
            setSelectedFolder(null);
            fetchSharedData(); // Refresh data after closing
          }}
        />
      )}

      {showEditDocumentModal && selectedDocument && (
        <EditDocumentModal
          document={selectedDocument}
          isOpen={showEditDocumentModal}
          onClose={() => {
            setShowEditDocumentModal(false);
            setSelectedDocument(null);
            fetchSharedData(); // Refresh data after closing
          }}
            />
      )}
        </div>
  );
}
