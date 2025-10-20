'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Share2, 
  Search, 
  Filter,
  MoreVertical,
  Download,
  Eye,
  Star,
  Calendar,
  User,
  FileText,
  Folder,
  RefreshCw,
  Grid,
  List,
  Plus,
  Lock,
  Globe,
  MessageSquare,
  Edit,
  Trash2,
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '../../contexts/LanguageContext';
import { notificationApiClient } from '@/api/notificationClient';
import { FolderResDto, PageResponse, SortFields } from '@/types/api';
import { useRouter } from 'next/navigation';
import CommentCountBadge from '../../components/comments/CommentCountBadge';

// Types from API
type SortOption = 'name' | 'createdAt' | 'updatedAt' | 'size';
type FilterOption = 'all' | 'my' | 'shared' | 'public';

export default function SharedPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [folders, setFolders] = useState<FolderResDto[]>([]);
  const [allFolders, setAllFolders] = useState<FolderResDto[]>([]);
  const [localSearchResults, setLocalSearchResults] = useState<FolderResDto[]>([]);
  const [pageData, setPageData] = useState<PageResponse<FolderResDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDesc, setSortDesc] = useState(false);
  const [pageSize] = useState(12);
  const [isLocalFiltering, setIsLocalFiltering] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchSharedFolders();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Real API call to fetch shared folders
  const fetchSharedFolders = async (isSearchRequest = false) => {
    try {
      if (isSearchRequest) {
        setTableLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const sortField = sortBy as SortFields;
      
      const response = await notificationApiClient.getSharedFolders({
        page: currentPage,
        size: pageSize,
        name: debouncedSearchQuery || undefined,
        desc: sortDesc,
        sort: sortField
      });
      
      setFolders(response.content);
      setAllFolders(response.content);
      setPageData(response);
    } catch (err: any) {
      console.error('Error fetching shared folders:', err);
      setError(err.message || 'Failed to load shared folders');
    } finally {
      if (isSearchRequest) {
        setTableLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Local filtering function
  const filterFoldersLocally = (query: string, allFoldersData: FolderResDto[]) => {
    if (!query.trim()) {
      return allFoldersData;
    }
    
    const lowerQuery = query.toLowerCase().trim();
    
    const startsWithMatches = allFoldersData.filter(folder => 
      folder.name.toLowerCase().startsWith(lowerQuery) ||
      (folder.description && folder.description.toLowerCase().startsWith(lowerQuery))
    );
    
    const containsMatches = allFoldersData.filter(folder => 
      !folder.name.toLowerCase().startsWith(lowerQuery) &&
      !(folder.description && folder.description.toLowerCase().startsWith(lowerQuery)) &&
      (folder.name.toLowerCase().includes(lowerQuery) ||
       (folder.description && folder.description.toLowerCase().includes(lowerQuery)))
    );
    
    return [...startsWithMatches, ...containsMatches];
  };

  // Debounce search query for API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch folders when dependencies change
  useEffect(() => {
    const isInitialLoad = currentPage === 0 && sortBy === 'name' && sortDesc === false;
    fetchSharedFolders(!isInitialLoad);
  }, [currentPage, sortBy, sortDesc]);
  
  // Get display folders
  const getDisplayFolders = (): FolderResDto[] => {
    if (isLocalFiltering && localSearchResults.length > 0) {
      return localSearchResults;
    }
    return folders;
  };

  // Handle local filtering immediately when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFolders(allFolders);
      setLocalSearchResults([]);
      setIsLocalFiltering(false);
      return;
    }

    const localResults = filterFoldersLocally(searchQuery, allFolders);
    setLocalSearchResults(localResults);
    setIsLocalFiltering(false);
  }, [searchQuery, allFolders]);

  // Handle API fetch with debounced search query
  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      return;
    }

    const timer = setTimeout(() => {
      if (debouncedSearchQuery.trim()) {
        fetchSharedFolders(true).finally(() => {
          setLocalSearchResults([]);
        });
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [debouncedSearchQuery]);

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

  const handleDownloadFolder = async (folderId: number) => {
    alert('Download folder functionality not yet implemented');
  };

  const handleShareFolder = async (folderId: number) => {
    alert('Share folder functionality not yet implemented');
  };

  const handleEditFolderPermissions = (folder: FolderResDto) => {
    console.log('handleEditFolderPermissions called for folder:', folder.name);
  };

  const handleMove = (folder: FolderResDto) => {
    console.log('Move folder:', folder.name);
  };

  const handleDelete = (folder: FolderResDto) => {
    console.log('Delete folder:', folder.name);
  };

  const handleOpenCommentModal = (folder: FolderResDto) => {
    console.log('Open comment modal for folder:', folder.name);
  };

  // Show loading skeleton only in table rows, not full page
  const showSkeletonRows = loading && folders.length === 0;

  if (error) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <CardContent className="text-center">
          <div className="text-destructive text-lg mb-4">{error}</div>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

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
                <span className="font-medium text-foreground">{pageData?.totalElements || 0}</span>
                <span className="text-muted-foreground">shared folders</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/5 rounded-lg">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span className="font-medium text-foreground">{formatFileSize(folders.reduce((acc, folder) => acc + folder.size, 0))}</span>
                <span className="text-muted-foreground">total size</span>
              </div>
              {searchQuery && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-lg">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <span className="font-medium text-foreground">{getDisplayFolders().length}</span>
                  <span className="text-muted-foreground">results</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Refresh Button */}
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

        {/* Search and Controls Bar */}
        <div className="flex flex-col lg:flex-row gap-4 p-4 bg-gradient-to-r from-muted/30 to-muted/50 rounded-xl border">
          {/* Search Section */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search shared folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 h-10 border-2 focus:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md bg-background"
                onKeyDown={(e) => e.key === 'Enter' && fetchSharedFolders(true)}
              />
              {searchQuery && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sort and View Controls */}
          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={`${sortBy}-${sortDesc ? 'desc' : 'asc'}`} onValueChange={(value) => {
                const [field, direction] = value.split('-');
                setSortBy(field as SortOption);
                setSortDesc(direction === 'desc');
              }}>
                <SelectTrigger className="w-48 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                  <SelectItem value="name-desc">Name Z-A</SelectItem>
                  <SelectItem value="updatedAt-desc">Newest</SelectItem>
                  <SelectItem value="updatedAt-asc">Oldest</SelectItem>
                  <SelectItem value="size-desc">Size (Large)</SelectItem>
                  <SelectItem value="size-asc">Size (Small)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* View Toggle */}
            <div className="flex bg-background rounded-lg p-1 border">
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
      </div>

      {/* Folders Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Show skeleton cards when initially loading */}
          {showSkeletonRows && [...Array(8)].map((_, i) => (
            <Card key={`skeleton-${i}`} className="animate-pulse">
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
          
          {/* Show actual folder cards */}
          {!showSkeletonRows && getDisplayFolders().map((folder) => (
            <FolderCard 
              key={folder.id} 
              folder={folder} 
              formatFileSize={formatFileSize} 
              formatDate={formatDate}
              onDownload={handleDownloadFolder}
              onShare={handleShareFolder}
              onEditPermissions={handleEditFolderPermissions}
              onMove={handleMove}
              onComment={handleOpenCommentModal}
              openDropdownId={openDropdownId}
              setOpenDropdownId={setOpenDropdownId}
              router={router}
            />
          ))}
          
          {/* Show empty state when no folders */}
          {!showSkeletonRows && !loading && getDisplayFolders().length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Share2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No shared folders yet</h3>
              <p className="text-muted-foreground mb-4 text-center">
                {searchQuery ? `No folders found matching "${searchQuery}"` : "No folders have been shared with you yet"}
              </p>
            </div>
          )}
          
          {/* Loading skeleton cards - for search and filter changes */}
          {tableLoading && [...Array(4)].map((_, i) => (
            <Card key={`loading-${i}`} className="animate-pulse">
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
      ) : (
        <Card>
          <div>
            <table className="w-full relative" style={{ zIndex: 1 }}>
              <thead className="bg-gradient-to-r from-muted/30 to-muted/50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Name</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Shared By</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Size</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Last Modified</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Visibility</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Show skeleton rows when initially loading */}
                {showSkeletonRows && [...Array(5)].map((_, i) => (
                  <tr key={`skeleton-${i}`} className="border-b last:border-b-0">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-muted rounded-lg animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                          <div className="h-3 bg-muted rounded w-24 animate-pulse"></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-6 bg-muted rounded w-16 animate-pulse"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-muted rounded w-4 animate-pulse"></div>
                    </td>
                  </tr>
                ))}
                
                {/* Show actual folder rows */}
                {!showSkeletonRows && getDisplayFolders().map((folder) => (
                  <FolderRow 
                    key={folder.id} 
                    folder={folder} 
                    formatFileSize={formatFileSize} 
                    formatDate={formatDate}
                    onDownload={handleDownloadFolder}
                    onShare={handleShareFolder}
                    onEditPermissions={handleEditFolderPermissions}
                    onMove={handleMove}
                    openDropdownId={openDropdownId}
                    setOpenDropdownId={setOpenDropdownId}
                    router={router}
                  />
                ))}
                
                {/* Show empty state when no folders */}
                {!showSkeletonRows && !loading && getDisplayFolders().length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                          <Share2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-foreground mb-2">No shared folders yet</h3>
                          <p className="text-muted-foreground mb-4">
                            {searchQuery ? `No folders found matching "${searchQuery}"` : "No folders have been shared with you yet"}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                
                {/* Loading skeleton rows - for search and filter changes */}
                {tableLoading && [...Array(3)].map((_, i) => (
                  <tr key={`loading-${i}`} className="border-b last:border-b-0">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-muted rounded-lg animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                          <div className="h-3 bg-muted rounded w-24 animate-pulse"></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-6 bg-muted rounded w-16 animate-pulse"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-muted rounded w-4 animate-pulse"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Loading indicator */}
      {tableLoading && (
        <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
          Loading comprehensive results...
        </div>
      )}
      
      {/* Search results indicator */}
      {searchQuery && !tableLoading && (
        <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
          Showing {getDisplayFolders().length} results for "{searchQuery}"
          {debouncedSearchQuery !== searchQuery && (
            <span className="ml-2 text-xs text-blue-500">(comprehensive search in progress...)</span>
          )}
        </div>
      )}

      {/* Pagination */}
      {pageData && pageData.totalPages > 1 && (
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {folders.length} of {pageData.totalElements} shared folders
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
              disabled={pageData.first}
            >
              Previous
            </Button>
            {[...Array(Math.min(pageData.totalPages, 5))].map((_, i) => {
              const pageNumber = currentPage > 2 ? currentPage - 2 + i : i;
              if (pageNumber >= pageData.totalPages) return null;
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
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageData.totalPages - 1))}
              disabled={pageData.last}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Folder Menu Component
function FolderMenu({ 
  folder, 
  onEditPermissions, 
  onMove,
  onComment,
  onClose,
  buttonRef
}: { 
  folder: FolderResDto; 
  onEditPermissions?: (folder: FolderResDto) => void;
  onMove?: (folder: FolderResDto) => void;
  onComment?: (folder: FolderResDto) => void;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right - 192 + window.scrollX
      });
    }
  }, [buttonRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.folder-menu-dropdown')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const menuContent = (
    <div className="folder-menu-dropdown fixed w-48 bg-white border border-gray-300 rounded-lg shadow-lg" style={{ zIndex: 9999, top: position.top, left: position.left }}>
      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100">
        <Eye className="h-4 w-4" />
        Preview
      </button>
      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100">
        <Download className="h-4 w-4" />
        Download
      </button>
      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100">
        <Share2 className="h-4 w-4" />
        Share
      </button>
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onComment) {
            onComment(folder);
            onClose();
          }
        }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100"
      >
        <MessageSquare className="h-4 w-4" />
        Comments
      </button>
      {onEditPermissions && (
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEditPermissions(folder);
            onClose();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100"
        >
          <Settings className="h-4 w-4" />
          View Permissions
        </button>
      )}
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(menuContent, document.body) : null;
}

// Folder Card Component for Grid View
function FolderCard({ 
  folder, 
  formatFileSize, 
  formatDate,
  onDownload,
  onShare,
  onEditPermissions,
  onMove,
  onComment,
  openDropdownId,
  setOpenDropdownId,
  router
}: { 
  folder: FolderResDto; 
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
  onDownload: (id: number) => void;
  onShare: (id: number) => void;
  onEditPermissions?: (folder: FolderResDto) => void;
  onMove?: (folder: FolderResDto) => void;
  onComment?: (folder: FolderResDto) => void;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
  router: any;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const folderId = `folder-${folder.id}`;
  const showMenu = openDropdownId === folderId;
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-2 hover:border-green-500/20">
      <CardContent className="p-4">
      <div className="flex items-start justify-between mb-3">
          <div className="h-12 w-12 bg-gradient-to-br from-green-500/10 to-green-500/20 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
          <Folder className="h-6 w-6 text-green-600 group-hover:scale-110 transition-transform duration-200" />
        </div>
          <div className="relative" style={{ zIndex: 10 }}>
            <button 
              ref={buttonRef}
              onClick={() => setOpenDropdownId(showMenu ? null : folderId)}
              className="p-1 rounded hover:bg-gray-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            
            {showMenu && (
              <FolderMenu 
                folder={folder}
                onEditPermissions={onEditPermissions}
                onMove={onMove}
                onComment={onComment}
                onClose={() => setOpenDropdownId(null)}
                buttonRef={buttonRef}
              />
            )}
          </div>
        </div>

        <div className='cursor-pointer group hover:underline hover:text-green-600' onClick={() => router.push(`/folders/${folder.id}`)}>
            <h3 className="font-medium mb-1 truncate" >{folder.name}</h3>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2 hover:text-green-600">{folder.description}</p>
      </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(folder.updatedAt)}
          </span>
          <span>{formatFileSize(folder.size)}</span>
        </div>
        <div className="flex items-center gap-2">
            <Badge variant={folder.isPublic ? "outline" : "secondary"} className="h-5 px-1">
          {folder.isPublic ? (
                <><Globe className="h-3 w-3 mr-1" />Public</>
          ) : (
                <><Lock className="h-3 w-3 mr-1" />Private</>
          )}
            </Badge>
            <CommentCountBadge 
              entityType="FOLDER" 
              entityId={folder.id} 
              showIcon={true}
              className="text-xs"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Folder Row Component for List View
function FolderRow({ 
  folder, 
  formatFileSize, 
  formatDate,
  onDownload,
  onShare,
  onEditPermissions,
  onMove,
  onComment,
  openDropdownId,
  setOpenDropdownId,
  router
}: { 
  folder: FolderResDto; 
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
  onDownload: (id: number) => void;
  onShare: (id: number) => void;
  onEditPermissions?: (folder: FolderResDto) => void;
  onMove?: (folder: FolderResDto) => void;
  onComment?: (folder: FolderResDto) => void;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
  router: any;
}) {
  const folderId = `folder-${folder.id}`;
  const showMenu = openDropdownId === folderId;
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  return (
    <tr className="border-b last:border-b-0 hover:bg-gradient-to-r hover:from-muted/30 hover:to-muted/50 group transition-all duration-200" style={{ position: 'relative', zIndex: 1 }}>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-green-500/10 to-green-500/20 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
            <Folder className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform duration-200" />
          </div>
          <div className='cursor-pointer group ' onClick={() => router.push(`/folders/${folder.id}`)}>
            <div className="font-medium group-hover:underline group-hover:text-green-600">{folder.name}</div>
            <div className="text-sm text-muted-foreground group-hover:underline group-hover:text-green-600">{folder.description}</div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="text-sm">{folder.ownedBy.firstName} {folder.ownedBy.lastName}</div>
      </td>
      <td className="p-4">
        <div className="text-sm text-muted-foreground">{formatFileSize(folder.size)}</div>
      </td>
      <td className="p-4">
        <div className="text-sm text-muted-foreground">{formatDate(folder.updatedAt)}</div>
      </td>
      <td className="p-4">
        <Badge variant={folder.isPublic ? "outline" : "secondary"}>
          {folder.isPublic ? (
            <><Globe className="h-3 w-3 mr-1" />Public</>
          ) : (
            <><Lock className="h-3 w-3 mr-1" />Private</>
          )}
        </Badge>
      </td>
      <td className="p-4">
        <div className="relative" style={{ zIndex: 10 }}>
          <button 
            ref={buttonRef}
            onClick={() => setOpenDropdownId(showMenu ? null : folderId)}
            className="p-1 rounded hover:bg-gray-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          
          {showMenu && (
            <FolderMenu 
              folder={folder}
              onEditPermissions={onEditPermissions}
              onMove={onMove}
              onComment={onComment}
              onClose={() => setOpenDropdownId(null)}
              buttonRef={buttonRef}
            />
          )}
        </div>
      </td>
    </tr>
  );
}