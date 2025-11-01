// app/folders/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import FolderActionModal from '@/components/modals/FolderActionModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
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
  Search,
  Settings,
  Eye,
  MessageSquare,
  RefreshCw,
  Filter
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
import { FolderResDto, SortFields } from '@/types/api';
import { useLanguage } from '../../contexts/LanguageContext';
import  CommentCountBadge  from '../../components/comments/CommentCountBadge';
import CreateFolderModal from '@/components/modals/CreateFolderModal';
import FolderCommentModal from '@/components/modals/FolderCommentModal';
import EditFolderModal from '@/components/modals/EditFolderModal';
import { useRouter } from 'next/navigation';
import { useServerSideSearch } from '@/components/main/useServerSideSearch';
import SearchPagination from '@/components/search/SearchPagination';
import UserAvatar from '@/components/main/UserAvatar';
import ServerSearchInput from '@/components/main/ServerSearchInput';

// Types from API
type SortOption = 'name' | 'createdAt' | 'updatedAt' | 'size';

export default function FoldersPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDesc, setSortDesc] = useState(false);
  const pageSize = 12;
  
  // Use optimized server-side search hook
  const {
    displayData: folders,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    totalPages,
    totalElements,
    loading,
    tableLoading,
    isLocalFiltering,
    error,
    fetchData,
    removeItem
  } = useServerSideSearch<FolderResDto>({
    fetchFunction: async (currentPage, searchTerm) => {
      const response = await notificationApiClient.getRepository({
        page: currentPage,
        size: pageSize,
        name: searchTerm || undefined,
        desc: sortDesc,
        sort: sortBy as SortFields
      });
      return response;
    },
    searchFields: (folder) => [folder.name, folder.description || '', folder.ownedBy?.email || ''],
    debounceMs: 300
  });

  // Refetch when sort changes
  useEffect(() => {
    fetchData(true);
  }, [sortBy, sortDesc]);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderResDto | null>(null);
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
      await fetchData(true);
    } finally {
      setIsRefreshing(false);
    }
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
      await fetchData(true); // Refresh the list
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
      
      // Use optimistic update from hook
      removeItem(deleteFolder.id);
      
      // Close the modal
      setShowDeleteModal(false);
      setDeleteFolder(null);
      
    } catch (error) {
      console.error('Error deleting folder:', error);
      // Refresh on error to get accurate state
      await fetchData(true);
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
        // Refresh data to get updated folder
        fetchData(true);
      } else if (updatedItem.action === 'move') {
        // Remove from list when moved
        removeItem(updatedItem.id);
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
                <span className="font-medium text-foreground">{totalElements || 0}</span>
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
                  <span className="font-medium text-foreground">{folders.length}</span>
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
            <ServerSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t('common.search') + ' folders by name, description, or owner...'}
              className="h-10"
            />
          </div>

            {/* Sort Controls */}
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
        </div>
      </div>

      {/* Folders Table */}
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
                {!showSkeletonRows && folders.map((folder) => (
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
                {!showSkeletonRows && !loading && folders.length === 0 && (
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
          Showing {folders.length} results for "{searchQuery}"
          {isLocalFiltering && (
            <span className="ml-2 text-xs text-blue-500">(comprehensive search in progress...)</span>
          )}
        </div>
      )}

      {/* Pagination */}
      <SearchPagination
        totalPages={totalPages}
        currentPage={page}
        totalElements={totalElements}
        itemsPerPage={pageSize}
        onPageChange={setPage}
      />
      
      {/* Modals */}
      <CreateFolderModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        parentId={null}
        onSuccess={() => fetchData(true)}
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


      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Folder"
        message="Are you sure you want to delete this folder?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        loading={isDeleting}
        itemName={deleteFolder?.name || ''}
        itemType="folder"
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

// Folder Row Component for Table View
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
        <div className="flex items-center gap-3">
          <UserAvatar user={folder.ownedBy} size="sm" />
          <div>
            <div className="text-sm font-medium">{folder.ownedBy.firstName} {folder.ownedBy.lastName}</div>
            <div className="text-xs text-muted-foreground">{folder.ownedBy.email}</div>
          </div>
        </div>
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
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onEditPermissions) {
                onEditPermissions(folder);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
            title="Manage Permissions"
          >
            <Settings className="h-3.5 w-3.5" />
            Permissions
          </button>
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
      </td>
    </tr>
  );
}