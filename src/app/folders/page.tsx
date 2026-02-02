// app/folders/page.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import RenameModal from '@/components/modals/RenameModal';
import MoveModal from '@/components/modals/MoveModal';
import ChangeDescriptionModal from '@/components/modals/ChangeDescriptionModal';
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
  Filter,
  User
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
import { folderService } from '@/api/services/folderService';
import { FolderResDto, SortFields } from '@/types/api';
import { useLanguage } from '../../contexts/LanguageContext';
import CommentCountBadge from '../../components/comments/CommentCountBadge';
import CreateFolderModal from '@/components/modals/CreateFolderModal';
import FolderCommentModal from '@/components/modals/FolderCommentModal';
import EditFolderModal from '@/components/modals/EditFolderModal';
import { useRouter, useSearchParams } from 'next/navigation';
import { useServerSideSearch } from '@/components/main/useServerSideSearch';
import Pagination from '@/components/main/Pagination';
import UserAvatar from '@/components/main/UserAvatar';
import ServerSearchInput from '@/components/main/ServerSearchInput';
import { TableActionMenu } from '@/components/folder/TableActionMenu';
import { UnifiedTableView } from '@/components/folder/UnifiedTableView';

// Types from API
type SortOption = 'name' | 'createdAt' | 'updatedAt' | 'size';

export default function FoldersPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDesc, setSortDesc] = useState(false);
  const [pageSize, setPageSize] = useState(20);

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
    fetchFunction: useCallback(async (currentPage, searchTerm) => {
      const params = {
        page: currentPage,
        size: pageSize,
        name: searchTerm || undefined,
        desc: sortDesc,
        sort: sortBy as SortFields
      };

      // If userId is provided, fetch that user's repository
      if (userId) {
        const response = await notificationApiClient.getUserRepository(userId, params);
        return response;
      }

      // Otherwise fetch current user's repository
      const response = await notificationApiClient.getRepository(params);
      return response;
    }, [pageSize, sortBy, sortDesc, userId]),
    searchFields: (folder) => [folder.name, folder.description || '', folder.ownedBy?.email || ''],
    debounceMs: 300
  });

  // Refetch when sort, pageSize, or userId changes
  useEffect(() => {
    setPage(0);
    fetchData(true);
  }, [sortBy, sortDesc, pageSize, userId]);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderResDto | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showChangeDescriptionModal, setShowChangeDescriptionModal] = useState(false);
  const [actionItem, setActionItem] = useState<FolderResDto | null>(null);
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  const handleRenameFolder = (folder: FolderResDto) => {
    setActionItem(folder);
    setShowRenameModal(true);
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

  const handleDownloadFolder = async (folder: FolderResDto) => {
    try {
      await folderService.downloadFolder(folder.id, folder.name);
    } catch (error) {
      console.error('Error downloading folder:', error);
    }
  };

  const handleShareFolder = async (folder: FolderResDto) => {
    // This would open a share modal
    alert('Share folder functionality not yet implemented');
  };

  const handleEditFolderPermissions = (folder: FolderResDto) => {
    setSelectedFolder(folder);
    setShowEditFolderModal(true);
  };

  const handleMove = (folder: FolderResDto) => {
    setActionItem(folder);
    setShowMoveModal(true);
  };

  const handleChangeDescription = (folder: FolderResDto) => {
    setActionItem(folder);
    setShowChangeDescriptionModal(true);
  };

  const handleDelete = (folder: FolderResDto) => {
    setDeleteFolder(folder);
    setShowDeleteModal(true);
  };

  const handleDeleteWrapper = (folder: FolderResDto) => {
    setDeleteFolder(folder);
    setShowDeleteModal(true);
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

  const handleFolderActionSuccess = (updatedItem?: { id: number; name?: string; description?: string; type: 'folder' | 'document'; action: 'rename' | 'move' | 'change-description' }) => {
    if (updatedItem && updatedItem.type === 'folder') {
      if (updatedItem.action === 'rename' || updatedItem.action === 'change-description') {
        // Refresh data to get updated folder
        fetchData(true);
      } else if (updatedItem.action === 'move') {
        // Remove from list when moved
        removeItem(updatedItem.id);
      }
    }
  };



  // Show loading skeleton only in table rows, not full page
  const showSkeletonRows = (loading && folders.length === 0) || tableLoading;

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

  // Convert folders to TableItem type
  const tableItems = folders.map(f => ({ ...f, type: 'folder' as const }));

  return (
    <div className="space-y-6">
      {/* User Indicator Banner - Show when viewing another user's repository */}
      {userId && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <User className="h-5 w-5 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              Viewing user repository
            </p>
            <p className="text-xs text-amber-600">
              User ID: {userId}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/folders')}
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            View My Repository
          </Button>
        </div>
      )}

      {/* Header Section */}
      <div className="space-y-6">
        {/* Main Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-gray-100">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <Folder className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  {t('folders.title')}
                </h1>
                <p className="text-gray-500 text-sm font-medium">
                  Manage and organize your digital workspace
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm min-w-[120px]">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Folders</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span className="text-xl font-bold text-gray-900">{totalElements || 0}</span>
              </div>
            </div>

            {searchQuery && (
              <div className="flex flex-col px-4 py-2 bg-emerald-50/50 rounded-xl border border-emerald-100 shadow-sm min-w-[120px]">
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Results</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <span className="text-xl font-bold text-emerald-900">{folders.length}</span>
                </div>
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
            className="h-10 px-4 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors rounded-xl"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {/* Create Folder Button */}
          <Button
            onClick={() => setShowCreateModal(true)}
            className="h-10 px-6 bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl border-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Folder
          </Button>
        </div>
      </div>

      {/* Search and Controls Bar */}
      <div className="flex flex-col lg:flex-row gap-4 p-1">
        <div className="flex-1 flex gap-4 p-1.5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
          {/* Search Section */}
          <div className="flex-1">
            <ServerSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t('common.search') + ' folders...'}
              className="h-11 border-0 bg-transparent focus-visible:ring-0 px-4 text-base placeholder:text-gray-400"
            />
          </div>

          {/* Divider */}
          <div className="w-px bg-gray-200 my-2"></div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 pr-2">
            <Select value={`${sortBy}-${sortDesc ? 'desc' : 'asc'}`} onValueChange={(value) => {
              const [field, direction] = value.split('-');
              setSortBy(field as SortOption);
              setSortDesc(direction === 'desc');
            }}>
              <SelectTrigger className="w-[180px] h-9 border-0 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium focus:ring-0 transition-colors rounded-xl">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
                <SelectItem value="updatedAt-desc">Newest First</SelectItem>
                <SelectItem value="updatedAt-asc">Oldest First</SelectItem>
                <SelectItem value="size-desc">Size (Large)</SelectItem>
                <SelectItem value="size-asc">Size (Small)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Folders Table */}
      <Card>
        <UnifiedTableView
          items={tableItems}
          formatFileSize={formatFileSize}
          formatDate={formatDate}
          currentFolderId={0}
          onEditFolderPermissions={handleEditFolderPermissions}
          onMove={(item) => item.type === 'folder' && handleMove(item)}
          onRename={(item) => item.type === 'folder' && handleRenameFolder(item)}
          onDelete={(item) => item.type === 'folder' && handleDeleteWrapper(item)}
          onShowComments={(item) => item.type === 'folder' && handleOpenCommentModal(item)}
          onDownload={(item) => item.type === 'folder' && handleDownloadFolder(item)}
          onShare={(item) => item.type === 'folder' && handleShareFolder(item)}
          onView={(item) => {
            if (item.type === 'folder') {
              router.push(`/folders/${item.id}`);
            }
          }}
          onChangeDescription={(item) => item.type === 'folder' && handleChangeDescription(item)}
          openDropdownId={openDropdownId}
          setOpenDropdownId={setOpenDropdownId}
          showLoadingRows={showSkeletonRows}
          showOwner={false}
        />
      </Card>

      {/* Loading indicator */}
      {
        tableLoading && !showSkeletonRows && (
          <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
            Loading comprehensive results...
          </div>
        )
      }

      {/* Search results indicator */}
      {
        searchQuery && !tableLoading && (
          <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
            Showing {folders.length} results for "{searchQuery}"
            {isLocalFiltering && (
              <span className="ml-2 text-xs text-blue-500">(comprehensive search in progress...)</span>
            )}
          </div>
        )
      }

      {/* Pagination */}
      <Pagination
        totalPages={totalPages}
        currentPage={page}
        totalElements={totalElements}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {/* Modals */}
      <CreateFolderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        parentId={null}
        ownerId={userId || undefined}
        onSuccess={() => fetchData(true)}
      />



      {
        showEditFolderModal && selectedFolder && (
          <EditFolderModal
            isOpen={showEditFolderModal}
            onClose={() => {
              setShowEditFolderModal(false);
              setSelectedFolder(null);
            }}
            folder={selectedFolder}
          />
        )
      }

      {
        showRenameModal && actionItem && (
          <RenameModal
            isOpen={showRenameModal}
            onClose={() => {
              setShowRenameModal(false);
              setActionItem(null);
            }}
            item={actionItem}
            itemType="folder"
            onSuccess={handleFolderActionSuccess}
          />
        )
      }

      {
        showMoveModal && actionItem && (
          <MoveModal
            isOpen={showMoveModal}
            onClose={() => {
              setShowMoveModal(false);
              setActionItem(null);
            }}
            item={actionItem}
            itemType="folder"
            onSuccess={handleFolderActionSuccess}
          />
        )
      }

      {
        showChangeDescriptionModal && actionItem && (
          <ChangeDescriptionModal
            isOpen={showChangeDescriptionModal}
            onClose={() => {
              setShowChangeDescriptionModal(false);
              setActionItem(null);
            }}
            item={actionItem}
            itemType="folder"
            onSuccess={handleFolderActionSuccess}
          />
        )
      }


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
    </div >
  );
}