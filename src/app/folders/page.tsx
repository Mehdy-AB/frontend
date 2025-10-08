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
  Filter,
  Settings,
  Eye,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import AdvancedSearchModal from '@/components/modals/AdvancedSearchModal';
import { useRouter } from 'next/navigation';
import { useSessionContext } from '../../contexts/SessionContext';

// Types from API
type SortOption = 'name' | 'createdAt' | 'updatedAt' | 'size';
type FilterOption = 'all' | 'my' | 'shared' | 'public';

export default function FoldersPage() {
  const { t } = useLanguage();
  const { session } = useSessionContext();
  const [folders, setFolders] = useState<FolderResDto[]>([]);
  const [allFolders, setAllFolders] = useState<FolderResDto[]>([]); // Store all folders for local filtering
  const [localSearchResults, setLocalSearchResults] = useState<FolderResDto[]>([]); // Store local search results
  const [pageData, setPageData] = useState<PageResponse<FolderResDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false); // For table-only loading
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0); // API uses 0-based pagination
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDesc, setSortDesc] = useState(false);
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
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
  const [showAdvancedSearchModal, setShowAdvancedSearchModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteFolder, setDeleteFolder] = useState<FolderResDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentingFolder, setCommentingFolder] = useState<FolderResDto | null>(null);

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
      
      if (filterBy === 'shared') {
        // Get shared folders
        const sharedData = await notificationApiClient.getSharedFolders({
          page: currentPage,
          size: pageSize,
          name: searchQuery || undefined,
          desc: sortDesc,
          sort: sortField,
          showFolder: true
        });
        
        // Convert to PageResponse format
        response = {
          content: sharedData.folders || [],
          pageable: {
            pageNumber: currentPage,
            pageSize: pageSize,
            sort: { empty: false, sorted: true, unsorted: false },
            offset: currentPage * pageSize,
            paged: true,
            unpaged: false
          },
          totalPages: sharedData.page?.totalPages || 0,
          totalElements: sharedData.page?.totalElements || 0,
          last: currentPage >= (sharedData.page?.totalPages || 1) - 1,
          size: pageSize,
          number: currentPage,
          sort: { empty: false, sorted: true, unsorted: false },
          numberOfElements: (sharedData.folders || []).length,
          first: currentPage === 0,
          empty: (sharedData.folders || []).length === 0
        };
      } else {
        // Get regular folders (repository)
        response = await notificationApiClient.getRepository({
          page: currentPage,
          size: pageSize,
          name: searchQuery || undefined,
          desc: sortDesc,
          sort: sortField
        });
      }
      
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

  // Local filtering function
  const filterFoldersLocally = (query: string, allFoldersData: FolderResDto[]) => {
    if (!query.trim()) {
      return allFoldersData;
    }
    
    return allFoldersData.filter(folder => 
      folder.name.toLowerCase().includes(query.toLowerCase()) ||
      folder.description.toLowerCase().includes(query.toLowerCase())
    );
  };

  // Fetch folders when dependencies change (excluding searchQuery)
  useEffect(() => {
    // Use full page loading for initial load, table loading for filter changes
    const isInitialLoad = currentPage === 0 && sortBy === 'name' && sortDesc === false && filterBy === 'all';
    fetchFolders(!isInitialLoad);
  }, [currentPage, sortBy, sortDesc, filterBy]);
  
  // Get display folders (local search results or API results)
  const getDisplayFolders = (): FolderResDto[] => {
    if (isLocalFiltering && localSearchResults.length > 0) {
      return localSearchResults;
    }
    return folders;
  };

  // Handle search with local filtering first, then API fetch
  useEffect(() => {
    if (!searchQuery.trim()) {
      // If no search query, show all folders
      setFolders(allFolders);
      setLocalSearchResults([]);
      setIsLocalFiltering(false);
      return;
    }

    // First, filter locally for immediate response
    setIsLocalFiltering(true);
    const localResults = filterFoldersLocally(searchQuery, allFolders);
    setLocalSearchResults(localResults);

    // Then, after a delay, fetch from API for more comprehensive results
    const timer = setTimeout(() => {
      fetchFolders(true).finally(() => {
        setIsLocalFiltering(false);
        setLocalSearchResults([]); // Clear local results when API results come in
      });
    }, 800); // Increased delay for better UX
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  // Folder operations
  const handleCreateFolder = () => {
    setShowCreateModal(true);
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



  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-muted rounded w-64 animate-pulse shimmer"></div>
          <div className="flex gap-3">
            <div className="h-10 bg-muted rounded w-32 animate-pulse shimmer"></div>
            <div className="h-10 bg-muted rounded w-10 animate-pulse shimmer"></div>
            <div className="h-10 bg-muted rounded w-10 animate-pulse shimmer"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-6 bg-muted rounded w-3/4 mb-2 shimmer"></div>
                <div className="h-4 bg-muted rounded w-full mb-4 shimmer"></div>
              <div className="flex justify-between">
                  <div className="h-4 bg-muted rounded w-20 shimmer"></div>
                  <div className="h-4 bg-muted rounded w-16 shimmer"></div>
              </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t('folders.title')}</h1>
          <p className="text-muted-foreground">
            {pageData?.totalElements || 0} folders • {formatFileSize(folders.reduce((acc, folder) => acc + folder.size, 0))} total
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === 'Enter' && fetchFolders(true)}
              />
            </div>
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

          {/* Action Buttons */}
          <div className="flex gap-2">

            <Button className="gap-2" onClick={handleCreateFolder}>
            <Plus className="h-4 w-4" />
            New Folder
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
        <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter:</span>
        </div>
          <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Folders</SelectItem>
              <SelectItem value="my">My Folders</SelectItem>
              <SelectItem value="shared">Shared with me</SelectItem>
              <SelectItem value="public">Public Folders</SelectItem>
            </SelectContent>
          </Select>
          <Select value={`${sortBy}-${sortDesc ? 'desc' : 'asc'}`} onValueChange={(value) => {
            const [field, direction] = value.split('-');
            setSortBy(field as SortOption);
            setSortDesc(direction === 'desc');
          }}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Sort by: Name A-Z</SelectItem>
              <SelectItem value="name-desc">Sort by: Name Z-A</SelectItem>
              <SelectItem value="updatedAt-desc">Sort by: Newest</SelectItem>
              <SelectItem value="updatedAt-asc">Sort by: Oldest</SelectItem>
              <SelectItem value="size-desc">Sort by: Size (Large)</SelectItem>
              <SelectItem value="size-asc">Sort by: Size (Small)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Folders Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {getDisplayFolders().map((folder) => (
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
          {/* Loading skeleton cards - for both search and filter changes */}
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
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium">Name</th>
                  <th className="text-left p-4 text-sm font-medium">Owner</th>
                  <th className="text-left p-4 text-sm font-medium">Size</th>
                  <th className="text-left p-4 text-sm font-medium">Last Modified</th>
                  <th className="text-left p-4 text-sm font-medium">Visibility</th>
                  <th className="text-left p-4 text-sm font-medium">Comments</th>
                  <th className="text-left p-4 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getDisplayFolders().map((folder) => (
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
                {/* Loading skeleton rows - for both search and filter changes */}
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
          {isLocalFiltering ? 'Fetching comprehensive results...' : 'Loading folders...'}
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
        parentId={0}
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

      <AdvancedSearchModal
        isOpen={showAdvancedSearchModal}
        onClose={() => setShowAdvancedSearchModal(false)}
        initialQuery={searchQuery}
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
    <Card className="group hover:shadow-md transition-all">
      <CardContent className="p-4">
      <div className="flex items-start justify-between mb-3">
          <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <Folder className="h-6 w-6 text-primary" />
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
    <tr className="border-b  last:border-b-0 hover:bg-muted/50 group" style={{ position: 'relative', zIndex: 1 }}>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Folder className="h-5 w-5 text-primary" />
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
        <CommentCountBadge 
          entityType="FOLDER" 
          entityId={folder.id} 
          showIcon={true}
          className="text-sm"
        />
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
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 text-sm font-medium">Name</th>
              <th className="text-left p-4 text-sm font-medium">Owner</th>
              <th className="text-left p-4 text-sm font-medium">Size</th>
              <th className="text-left p-4 text-sm font-medium">Last Modified</th>
              <th className="text-left p-4 text-sm font-medium">Visibility</th>
              <th className="text-left p-4 text-sm font-medium">Actions</th>
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