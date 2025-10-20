// app/folders/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import FolderActionModal from '@/components/modals/FolderActionModal';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal';
import { 
  Folder, 
  MoreVertical, 
  Lock, 
  Globe, 
  Calendar,
  Download,
  Share2,
  Edit,
  Trash2,
  Plus,
  Grid,
  List,
  Search,
  Settings,
  Eye,
  MessageSquare,
  RefreshCw,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { notificationApiClient } from '@/api/notificationClient';
import { FolderResDto, PageResponse, SortFields } from '@/types/api';
import { useLanguage } from '../../contexts/LanguageContext';
import  CommentCountBadge  from '../../components/comments/CommentCountBadge';
import CreateFolderModal from '@/components/modals/CreateFolderModal';
import FolderCommentModal from '@/components/modals/FolderCommentModal';
import RenameFolderModal from '@/components/modals/RenameFolderModal';
import EditFolderModal from '@/components/modals/EditFolderModal';
import { useRouter } from 'next/navigation';

// Types from API
type SortOption = 'name' | 'createdAt' | 'updatedAt' | 'size';
type FilterOption = 'all' | 'my' | 'shared' | 'public';

export default function FoldersPage() {
  const { t } = useLanguage();
  const [folders, setFolders] = useState<FolderResDto[]>([]);
  const [allFolders, setAllFolders] = useState<FolderResDto[]>([]); // Store all folders for local filtering
  const [localSearchResults, setLocalSearchResults] = useState<FolderResDto[]>([]); // Store local search results
  const [pageData, setPageData] = useState<PageResponse<FolderResDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false); // For table-only loading
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0); // API uses 0-based pagination
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDesc, setSortDesc] = useState(false);
  const [pageSize] = useState(12);
  const [isLocalFiltering, setIsLocalFiltering] = useState(false);
  const router = useRouter();
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderResDto | null>(null);
  const [renameFolder, setRenameFolder] = useState<{ id: number; name: string } | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showFolderActionModal, setShowFolderActionModal] = useState(false);
  const [folderAction, setFolderAction] = useState<'rename' | 'move' | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteFolder, setDeleteFolder] = useState<FolderResDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentingFolder, setCommentingFolder] = useState<FolderResDto | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchFolders();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Real API call to fetch folders
    const fetchFolders = async (isSearchRequest = false) => {
      try {
        if (isSearchRequest) {
          setTableLoading(true);
        } else {
          setLoading(true);
        }
      setError(null);
      
      const sortField = sortBy as SortFields;
      
      let response: PageResponse<FolderResDto>;
      
        // Get regular folders (repository)
        response = await notificationApiClient.getRepository({
          page: currentPage,
          size: pageSize,
          name: debouncedSearchQuery || undefined,
          desc: sortDesc,
          sort: sortField
        });
      
      setFolders(response.content);
      setAllFolders(response.content); // Store all folders for local filtering
      setPageData(response);
    } catch (err: any) {
        console.error('Error fetching folders:', err);
      setError(err.message || 'Failed to load folders');
      } finally {
        if (isSearchRequest) {
          setTableLoading(false);
        } else {
          setLoading(false);
        }
      }
    };

  // Local filtering function - prioritize startsWith matches
  const filterFoldersLocally = (query: string, allFoldersData: FolderResDto[]) => {
    if (!query.trim()) {
      return allFoldersData;
    }
    
    const lowerQuery = query.toLowerCase().trim();
    
    // First, get folders that start with the query (highest priority)
    const startsWithMatches = allFoldersData.filter(folder => 
      folder.name.toLowerCase().startsWith(lowerQuery) ||
      (folder.description && folder.description.toLowerCase().startsWith(lowerQuery))
    );
    
    // Then, get folders that contain the query (lower priority)
    const containsMatches = allFoldersData.filter(folder => 
      !folder.name.toLowerCase().startsWith(lowerQuery) &&
      !(folder.description && folder.description.toLowerCase().startsWith(lowerQuery)) &&
      (folder.name.toLowerCase().includes(lowerQuery) ||
       (folder.description && folder.description.toLowerCase().includes(lowerQuery)))
    );
    
    // Combine results with startsWith matches first
    return [...startsWithMatches, ...containsMatches];
  };

  // Debounce search query for API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms debounce for API calls

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch folders when dependencies change (excluding searchQuery)
  useEffect(() => {
    // Use full page loading for initial load, table loading for filter changes
    const isInitialLoad = currentPage === 0 && sortBy === 'name' && sortDesc === false;
    fetchFolders(!isInitialLoad);
  }, [currentPage, sortBy, sortDesc]);
  
  // Get display folders (local search results or API results)
  const getDisplayFolders = (): FolderResDto[] => {
    if (isLocalFiltering && localSearchResults.length > 0) {
      return localSearchResults;
    }
    return folders;
  };

  // Handle local filtering immediately when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      // If no search query, show all folders
      setFolders(allFolders);
      setLocalSearchResults([]);
      setIsLocalFiltering(false);
      return;
    }

    // First, filter locally for immediate response
    const localResults = filterFoldersLocally(searchQuery, allFolders);
    setLocalSearchResults(localResults);
    setIsLocalFiltering(false); // Local filtering is done immediately
  }, [searchQuery, allFolders]);

  // Handle API fetch with debounced search query
  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      return;
    }

    // After debounce delay, fetch from API for more comprehensive results
    const timer = setTimeout(() => {
      // Only fetch if we still have a search query (user hasn't cleared it)
      if (debouncedSearchQuery.trim()) {
        fetchFolders(true).finally(() => {
          setLocalSearchResults([]); // Clear local results when API results come in
        });
      }
    }, 500); // Additional delay after debounce for API call
    
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


  const handleRenameFolder = (folderId: number, currentName: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      setSelectedFolder(folder);
      setFolderAction('rename');
      setShowFolderActionModal(true);
    }
  };

  const handleDeleteFolder = async (folderId: number, folderName: string) => {
    if (!confirm(`Are you sure you want to delete "${folderName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await notificationApiClient.deleteFolder(folderId);
      fetchFolders(); // Refresh the list
    } catch (error: any) {
      console.error('Error deleting folder:', error);
      alert('Failed to delete folder: ' + (error.message || 'Unknown error'));
    }
  };

  const handleOpenCommentModal = (folder: FolderResDto) => {
    setCommentingFolder(folder);
    setShowCommentModal(true);
  };

  const handleDownloadFolder = async (folderId: number) => {
    // This would need to be implemented on the backend
    alert('Download folder functionality not yet implemented');
  };

  const handleShareFolder = async (folderId: number) => {
    // This would open a share modal
    alert('Share folder functionality not yet implemented');
  };

  const handleEditFolderPermissions = (folder: FolderResDto) => {
    console.log('handleEditFolderPermissions called for folder:', folder.name);
    setSelectedFolder(folder);
    setShowEditFolderModal(true);
  };

  const handleMove = (folder: FolderResDto) => {
    setSelectedFolder(folder);
    setFolderAction('move');
    setShowFolderActionModal(true);
  };

  const handleDelete = (folder: FolderResDto) => {
    console.log('handleDelete called for folder:', folder.name);
    setDeleteFolder(folder);
    setShowDeleteModal(true);
  };

  const handleDeleteWrapper = (id: number, name: string) => {
    console.log('handleDeleteWrapper called for folder:', name);
    // Find the folder by id
    const folder = folders.find(f => f.id === id);
    if (folder) {
      setDeleteFolder(folder);
      setShowDeleteModal(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteFolder) return;
    
    setIsDeleting(true);
    try {
      await notificationApiClient.deleteFolder(deleteFolder.id);
      
      // Update the frontend list directly instead of refetching
      setFolders(prevFolders => prevFolders.filter(f => f.id !== deleteFolder.id));
      
      // Update page data if it exists
      setPageData(prevPageData => {
        if (!prevPageData) return prevPageData;
        return {
          ...prevPageData,
          totalElements: prevPageData.totalElements - 1
        };
      });
      
      // Close the modal
      setShowDeleteModal(false);
      setDeleteFolder(null);
      
    } catch (error) {
      console.error('Error deleting folder:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteFolder(null);
    setIsDeleting(false);
  };

  const handleFolderActionSuccess = (updatedItem?: { id: number; name: string; type: 'folder' | 'document'; action: 'rename' | 'move' }) => {
    if (updatedItem && updatedItem.type === 'folder') {
      if (updatedItem.action === 'rename') {
        // Update the name in the local state
        setFolders(prevFolders => 
          prevFolders.map(folder => 
            folder.id === updatedItem.id 
              ? { ...folder, name: updatedItem.name }
              : folder
          )
        );
      } else if (updatedItem.action === 'move') {
        // Remove the folder from the current list since it's moved to another location
        setFolders(prevFolders => 
          prevFolders.filter(folder => folder.id !== updatedItem.id)
        );
        
        // Update page data if it exists
        setPageData(prevPageData => {
          if (!prevPageData) return prevPageData;
          return {
            ...prevPageData,
            totalElements: prevPageData.totalElements - 1
          };
        });
      }
    }
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
              <div className="h-12 w-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl flex items-center justify-center shadow-sm">
                <Folder className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {t('folders.title')}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Manage and organize your folders
                </p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-lg">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <span className="font-medium text-foreground">{pageData?.totalElements || 0}</span>
                <span className="text-muted-foreground">folders</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/5 rounded-lg">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span className="font-medium text-foreground">{formatFileSize(folders.reduce((acc, folder) => acc + folder.size, 0))}</span>
                <span className="text-muted-foreground">total size</span>
              </div>
              {searchQuery && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/5 rounded-lg">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
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
            
            {/* Create Folder Button */}
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200 h-9 px-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Folder
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
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 h-10 border-2 focus:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md bg-background"
                onKeyDown={(e) => e.key === 'Enter' && fetchFolders(true)}
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
              onRename={(id, name) => handleRenameFolder(id, name)}
              onDelete={handleDeleteWrapper}
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
                <Folder className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No folders yet</h3>
              <p className="text-muted-foreground mb-4 text-center">
                {searchQuery ? `No folders found matching "${searchQuery}"` : "Create your first folder to get started"}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Folder
                </Button>
              )}
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
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Owner</th>
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
                    onRename={(id, name) => handleRenameFolder(id, name)}
                    onDelete={handleDeleteWrapper}
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
                          <Folder className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-foreground mb-2">No folders yet</h3>
                          <p className="text-muted-foreground mb-4">
                            {searchQuery ? `No folders found matching "${searchQuery}"` : "Create your first folder to get started"}
                          </p>
                          {!searchQuery && (
                            <Button
                              onClick={() => setShowCreateModal(true)}
                              className="bg-primary hover:bg-primary/90"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Create Folder
                            </Button>
                          )}
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
            Showing {folders.length} of {pageData.totalElements} folders
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
      
      {/* Modals */}
      <CreateFolderModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        parentId={null}
        onSuccess={fetchFolders}
      />
      

      
      <RenameFolderModal 
        isOpen={showRenameModal}
        onClose={() => {
          setShowRenameModal(false);
          setRenameFolder(null);
        }}
        folderId={renameFolder?.id || null}
        currentName={renameFolder?.name || ''}
        onSuccess={fetchFolders}
      />
      
      {showEditFolderModal && selectedFolder && (
        <EditFolderModal
          isOpen={showEditFolderModal}
          onClose={() => {
            setShowEditFolderModal(false);
            setSelectedFolder(null);
          }}
          folder={selectedFolder}
        />
      )}

      <FolderActionModal
        isOpen={showFolderActionModal}
        onClose={() => {
          setShowFolderActionModal(false);
          setSelectedFolder(null);
          setFolderAction(null);
        }}
        folder={selectedFolder}
        action={folderAction}
        onSuccess={handleFolderActionSuccess}
      />


      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        itemName={deleteFolder?.name || ''}
        itemType="folder"
        isLoading={isDeleting}
      />

      {/* Comment Modal */}
      <FolderCommentModal 
        folder={commentingFolder}
        isOpen={showCommentModal}
        onClose={() => {
          setShowCommentModal(false);
          setCommentingFolder(null);
        }}
      />
    </div>
  );
}

// Folder Menu Component
function FolderMenu({ 
  folder, 
  onEditPermissions, 
  onMove,
  onRename,
  onDelete,
  onComment,
  onClose,
  buttonRef
}: { 
  folder: FolderResDto; 
  onEditPermissions?: (folder: FolderResDto) => void;
  onMove?: (folder: FolderResDto) => void;
  onRename?: (folderId: number, currentName: string) => void;
  onDelete?: (folder: FolderResDto) => void;
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
        left: rect.right - 192 + window.scrollX // 192px is the width of the dropdown
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
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onRename) {
            onRename(folder.id, folder.name);
            onClose();
          }
        }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100"
      >
        <Edit className="h-4 w-4" />
        Rename
      </button>
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Move clicked for folder:', folder.name);
          if (onMove) {
            onMove(folder);
            onClose();
          }
        }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100"
      >
        <Folder className="h-4 w-4" />
        Move
      </button>
      {onEditPermissions && (
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Edit Permissions clicked for folder:', folder.name);
            onEditPermissions(folder);
            onClose();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100"
        >
          <Settings className="h-4 w-4" />
          Edit Permissions
        </button>
      )}
      <hr className="border-gray-200" />
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Delete clicked for folder:', folder.name);
          if (onDelete) {
            onDelete(folder);
            onClose();
          }
        }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
        Move to Trash
      </button>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(menuContent, document.body) : null;
}

// Folder Card Component for Grid View
function FolderCard({ 
  folder, 
  formatFileSize, 
  formatDate,
  onRename,
  onDelete,
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
  onRename: (id: number, name: string) => void;
  onDelete: (id: number, name: string) => void;
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
    <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-2 hover:border-primary/20">
      <CardContent className="p-4">
      <div className="flex items-start justify-between mb-3">
          <div className="h-12 w-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
          <Folder className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-200" />
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
                onRename={onRename}
                onDelete={(folder) => onDelete(folder.id, folder.name)}
                onComment={onComment}
                onClose={() => setOpenDropdownId(null)}
                buttonRef={buttonRef}
              />
            )}
          </div>
        </div>

        <div className='cursor-pointer group hover:underline hover:text-primary' onClick={() => router.push(`/folders/${folder.id}`)}>
            <h3 className="font-medium mb-1 truncate" >{folder.name}</h3>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2 hover:text-primary">{folder.description}</p>
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
  onRename,
  onDelete,
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
  onRename: (id: number, name: string) => void;
  onDelete: (id: number, name: string) => void;
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
          <div className="h-10 w-10 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
            <Folder className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-200" />
          </div>
          <div className='cursor-pointer group ' onClick={() => router.push(`/folders/${folder.id}`)}>
            <div className="font-medium group-hover:underline group-hover:text-primary">{folder.name}</div>
            <div className="text-sm text-muted-foreground group-hover:underline group-hover:text-primary">{folder.description}</div>
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
              onRename={onRename}
              onDelete={(folder) => onDelete(folder.id, folder.name)}
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

// Loading Skeleton for Table/Grid
function FoldersLoadingSkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
  if (viewMode === 'grid') {
    return (
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
    );
  }

  return (
    <Card>
      <div>
        <table className="w-full relative" style={{ zIndex: 1 }}>
          <thead className="bg-gradient-to-r from-muted/30 to-muted/50 border-b">
            <tr>
              <th className="text-left p-4 text-sm font-semibold text-foreground">Name</th>
              <th className="text-left p-4 text-sm font-semibold text-foreground">Owner</th>
              <th className="text-left p-4 text-sm font-semibold text-foreground">Size</th>
              <th className="text-left p-4 text-sm font-semibold text-foreground">Last Modified</th>
              <th className="text-left p-4 text-sm font-semibold text-foreground">Visibility</th>
              <th className="text-left p-4 text-sm font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b last:border-b-0">
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
  );
}