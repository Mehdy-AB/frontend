'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Download, Trash2, FolderInput } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '../../../contexts/LanguageContext';
import { notificationApiClient } from '@/api/notificationClient';
import { folderService } from '@/api/services/folderService';
import CreateFolderModal from '@/components/modals/CreateFolderModal';
import FileUploadModal from '@/components/modals/FileUploadModal';
import EditFolderModal from '@/components/modals/EditFolderModal';
import EditDocumentModal from '@/components/modals/EditDocumentModal';
import { DocumentResponseDto, FolderRepoResDto, FolderResDto, SortFields, AuditLog, UserDto } from '@/types/api';
import { auditLogService, AuditLog as ServiceAuditLog } from '@/api/services/auditLogService';
import { favoriteService } from '@/api/services/favoriteService';
import RenameModal from '@/components/modals/RenameModal';
import MoveModal from '@/components/modals/MoveModal';
import ChangeDescriptionModal from '@/components/modals/ChangeDescriptionModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import { CommentsModal } from '@/components/modals/CommentsModal';
import { FolderActivityModal } from '@/components/modals/FolderActivityModal';
import { MoveToWorkspaceModal } from '@/components/workspace';

// Import extracted components
import {
  BreadcrumbNavigation,
  FolderHeader,
  FolderToolbar,
  UnifiedTableView,
  FolderDetailsSkeleton
} from '@/components/folder';
import Pagination from '@/components/main/Pagination';

// Unified interface for table items
type TableItem = (FolderResDto & { type: 'folder' }) | (DocumentResponseDto & { type: 'document' });

// Sort options for folder contents
type SortOption = 'name' | 'createdAt' | 'updatedAt' | 'size';

export default function FolderDetailsPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const folderId = params.folderId as string;

  const [data, setData] = useState<FolderRepoResDto | null>(null);
  const [folder, setFolder] = useState<FolderResDto | null>(null);
  const [allTableItems, setAllTableItems] = useState<TableItem[]>([]); // Store all items for local filtering
  const [localSearchResults, setLocalSearchResults] = useState<TableItem[]>([]); // Store local search results
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false); // For table-only loading
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDesc, setSortDesc] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [isLocalFiltering, setIsLocalFiltering] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [showEditDocumentModal, setShowEditDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentResponseDto | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<FolderResDto | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // New state for separate modals
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showMoveToWorkspaceModal, setShowMoveToWorkspaceModal] = useState(false);
  const [showChangeDescriptionModal, setShowChangeDescriptionModal] = useState(false);
  const [actionItem, setActionItem] = useState<TableItem | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState<TableItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState<boolean>(false);
  const [isFolderFavorite, setIsFolderFavorite] = useState<boolean>(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState<boolean>(false);
  const [showCommentsModal, setShowCommentsModal] = useState<boolean>(false);
  const [commentsModalItem, setCommentsModalItem] = useState<TableItem | null>(null);
  const [showDocumentsOnly, setShowDocumentsOnly] = useState<boolean>(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadFolderItem, setDownloadFolderItem] = useState<{ id: number; name: string } | null>(null);
  const [includeMetadata, setIncludeMetadata] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Selection state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [showBulkDownloadDialog, setShowBulkDownloadDialog] = useState(false);
  const [bulkIncludeMetadata, setBulkIncludeMetadata] = useState(false);

  // Clear selection on page/sort/search change
  useEffect(() => {
    setSelectedItems(new Set());
  }, [currentPage, sortBy, sortDesc, searchQuery, folderId]);

  const handleToggleSelect = useCallback((key: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const tableItems = getDisplayItems();
    const allKeys = tableItems.map(i => i.type === 'folder' ? `folder-${i.id}` : `document-${i.documentId}`);
    const allSelected = allKeys.length > 0 && allKeys.every(k => selectedItems.has(k));
    if (allSelected) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(allKeys));
    }
  }, [selectedItems]);

  const getSelectedItems = useCallback((): TableItem[] => {
    const tableItems = getDisplayItems();
    return tableItems.filter(i => {
      const key = i.type === 'folder' ? `folder-${i.id}` : `document-${i.documentId}`;
      return selectedItems.has(key);
    });
  }, [selectedItems]);

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const selected = getSelectedItems();
      for (const item of selected) {
        if (item.type === 'folder') {
          await notificationApiClient.deleteFolder(item.id);
        } else {
          await notificationApiClient.deleteDocument(item.documentId);
        }
      }
      setSelectedItems(new Set());
      fetchFolderData();
    } catch (error) {
      console.error('Error bulk deleting:', error);
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeleteModal(false);
    }
  };

  const handleBulkDownload = async () => {
    setIsBulkDownloading(true);
    try {
      const selected = getSelectedItems();
      const documentIds = selected.filter(i => i.type === 'document').map(i => i.documentId);
      const folderIds = selected.filter(i => i.type === 'folder').map(i => i.id);
      await folderService.bulkDownload(documentIds, folderIds, bulkIncludeMetadata);
    } catch (error) {
      console.error('Error bulk downloading:', error);
    } finally {
      setIsBulkDownloading(false);
      setShowBulkDownloadDialog(false);
    }
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

  // Fetch folder data from API
  const fetchFolderData = async (isSearchRequest = false) => {
    try {
      if (isSearchRequest) {
        setTableLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await notificationApiClient.getFolder(parseInt(folderId), {
        page: currentPage - 1, // API uses 0-based pagination
        size: pageSize,
        name: searchQuery || undefined,
        showFolder: !showDocumentsOnly, // When showDocumentsOnly is true, set showFolder to false
        sort: mapSortOptionToApiField(sortBy),
        desc: sortDesc,
      });

      setData(response);
      // Extract folder from response (API includes it when showFolder=true)
      if (response.folder) {
        setFolder(response.folder);
      } else {
        // Fallback: fetch folder separately if not in response
        try {
          const folderData = await folderService.getFolderById(parseInt(folderId));
          setFolder(folderData);
        } catch (folderErr) {
          console.error('Error fetching folder details:', folderErr);
          // Don't set error here, just log it - folder might not be critical
        }
      }

      // Fetch audit logs and favorite status for the folder
      if (!isSearchRequest) {
        await Promise.all([
          fetchAuditLogs(parseInt(folderId)),
          checkFolderFavoriteStatus(parseInt(folderId))
        ]);
      }
    } catch (err) {
      setError('Failed to load folder details');
      console.error('Error fetching folder data:', err);
    } finally {
      if (isSearchRequest) {
        setTableLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Combine folders and documents for unified table
  const getTableItems = (): TableItem[] => {
    if (!data) return [];

    const folderItems: TableItem[] = data.folders.map(folder => ({
      ...folder,
      type: 'folder' as const
    }));

    const documentItems: TableItem[] = data.documents.map(doc => ({
      ...doc,
      type: 'document' as const
    }));

    // Sort by name (you can change the sorting logic)
    const allItems = [...folderItems, ...documentItems];

    return allItems;
  };

  // Get display items (local search results or API results)
  const getDisplayItems = (): TableItem[] => {
    if (isLocalFiltering && localSearchResults.length > 0) {
      return localSearchResults;
    }
    return getTableItems();
  };

  // Local filtering function for table items
  const filterTableItemsLocally = (query: string, allItems: TableItem[]) => {
    if (!query.trim()) {
      return allItems;
    }

    const lowerQuery = query.toLowerCase();
    return allItems.filter(item => {
      const matchesName = item.name.toLowerCase().includes(lowerQuery);
      // Check folder description (using type assertion since description exists at runtime but not in type def)
      const matchesDescription = item.type === 'folder' && (item as any).description
        ? (item as any).description.toLowerCase().includes(lowerQuery)
        : false;
      return matchesName || matchesDescription;
    });
  };

  // Update allTableItems when data changes
  useEffect(() => {
    if (data) {
      const allItems = getTableItems();
      setAllTableItems(allItems);
    }
  }, [data]);

  // Track previous values to detect changes
  const prevSortBy = useRef(sortBy);
  const prevSortDesc = useRef(sortDesc);
  const prevShowDocumentsOnly = useRef(showDocumentsOnly);
  const prevSearchQuery = useRef(searchQuery);
  const isFirstLoad = useRef(true);

  // Single unified fetch effect — handles page, sort, filter, and search changes
  useEffect(() => {
    if (!folderId) return;

    const sortChanged = prevSortBy.current !== sortBy || prevSortDesc.current !== sortDesc;
    const filterChanged = prevShowDocumentsOnly.current !== showDocumentsOnly;
    const searchChanged = prevSearchQuery.current !== searchQuery;

    // Update refs immediately
    prevSortBy.current = sortBy;
    prevSortDesc.current = sortDesc;
    prevShowDocumentsOnly.current = showDocumentsOnly;
    prevSearchQuery.current = searchQuery;

    // Reset to page 1 when sort, filter, or search changes
    if ((sortChanged || filterChanged || searchChanged) && currentPage !== 1) {
      setCurrentPage(1);
      return; // Will re-trigger this effect when currentPage updates
    }

    const isInitialLoad = isFirstLoad.current;
    if (isInitialLoad) {
      isFirstLoad.current = false;
    }

    // If search query changed, apply local filtering + debounced API call
    if (searchChanged && searchQuery.trim()) {
      setIsLocalFiltering(true);
      const localResults = filterTableItemsLocally(searchQuery, allTableItems);
      setLocalSearchResults(localResults);

      const timer = setTimeout(() => {
        fetchFolderData(true).finally(() => {
          setIsLocalFiltering(false);
          setLocalSearchResults([]);
        });
      }, 500);

      return () => clearTimeout(timer);
    }

    // Clear local filtering when search is cleared
    if (searchChanged && !searchQuery.trim()) {
      setIsLocalFiltering(false);
      setLocalSearchResults([]);
    }

    // Direct API fetch for non-search changes (pagination, sort, etc.)
    fetchFolderData(!isInitialLoad);
  }, [folderId, currentPage, sortBy, sortDesc, showDocumentsOnly, pageSize, searchQuery]);

  // Fetch audit logs for the folder
  const fetchAuditLogs = async (folderId: number) => {
    try {
      setIsLoadingAuditLogs(true);
      const response = await auditLogService.getAuditLogsByEntity('FOLDER', folderId, 0, 20);
      // Map service AuditLog to expected AuditLog type from @/types/api
      const mappedLogs: AuditLog[] = response.content.map((log: ServiceAuditLog) => ({
        id: log.id,
        entityType: log.entityType,
        entityId: log.entityId,
        action: log.action,
        description: log.details,
        user: {
          id: log.userId,
          username: log.username,
          email: '',
          displayName: log.username,
          enabled: true,
          emailVerified: false,
          createdTimestamp: '',
          createdAt: '',
          updatedAt: '',
          status: 'ACTIVE',
          roles: [],
          groups: []
        } as UserDto,
        timestamp: log.timestamp,
        ipAddress: log.ipAddress
      }));
      setAuditLogs(mappedLogs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoadingAuditLogs(false);
    }
  };

  // Check if folder is favorite
  const checkFolderFavoriteStatus = async (folderId: number) => {
    try {
      setIsLoadingFavorite(true);
      const response = await favoriteService.checkFolderFavorite(folderId);
      setIsFolderFavorite(response.isFavorite);
    } catch (error) {
      console.error('Error checking folder favorite status:', error);
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  // Toggle folder favorite status
  const toggleFolderFavorite = async () => {
    if (!folderId || isLoadingFavorite) return;

    const folderIdNum = parseInt(folderId, 10);
    if (isNaN(folderIdNum)) return;

    try {
      setIsLoadingFavorite(true);
      if (isFolderFavorite) {
        await favoriteService.removeFolderFromFavorites(folderIdNum);
        setIsFolderFavorite(false);
      } else {
        await favoriteService.addFolderToFavorites(folderIdNum);
        setIsFolderFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling folder favorite:', error);
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  // Navigate to folder by path
  const navigateToPath = async (cumulativePath: string) => {
    if (!cumulativePath) return;

    try {
      const response = await notificationApiClient.getFolderIdByPath(cumulativePath);

      // Navigate to the folder by ID
      router.push(`/folders/${response.id}`);
    } catch (error) {
      console.error('Error navigating to path:', error);
    }
  };

  // Handlers
  const handleCreateFolder = () => {
    setShowCreateFolderModal(true);
  };

  const handleUpload = () => {
    setShowUploadModal(true);
  };

  const handleRefresh = () => {
    // Refresh the data
    if (folderId) {
      fetchFolderData(false); // Use regular loading, not table loading
    }
  };

  const handleEditDocumentPermissions = (document: DocumentResponseDto) => {
    setSelectedDocument(document);
    setShowEditDocumentModal(true);
  };

  const handleEditFolderPermissions = (folder: FolderResDto) => {
    setSelectedFolder(folder);
    setShowEditFolderModal(true);
  };

  const handleMove = (item: TableItem) => {
    setActionItem(item);
    setShowMoveModal(true);
  };

  const handleMoveToWorkspace = (item: TableItem) => {
    setActionItem(item);
    setShowMoveToWorkspaceModal(true);
  };

  const handleRename = (item: TableItem) => {
    setActionItem(item);
    setShowRenameModal(true);
  };

  const handleChangeDescription = (item: TableItem) => {
    setActionItem(item);
    setShowChangeDescriptionModal(true);
  };

  const handleDelete = (item: TableItem) => {
    console.log('handleDelete called with item:', item);
    setDeleteItem(item);
    setShowDeleteModal(true);
  };

  const handleShowComments = (item: TableItem) => {
    setCommentsModalItem(item);
    setShowCommentsModal(true);
  };

  const handleShowActivity = () => {
    setShowActivityModal(true);
  };

  const handleView = (item: TableItem) => {
    if (item.type === 'document') {
      router.push(`/documents/${item.documentId}`);
    }
  };

  const handleDownload = async (item: TableItem) => {
    if (item.type === 'document') {
      try {
        await notificationApiClient.downloadDocument(item.documentId);
        await notificationApiClient.fileDownloaded(item.documentId);
      } catch (error) {
        console.error('Error downloading document:', error);
      }
    } else if (item.type === 'folder') {
      setDownloadFolderItem({ id: item.id, name: item.name });
      setIncludeMetadata(false);
      setShowDownloadDialog(true);
    }
  };

  const handleConfirmDownload = async () => {
    if (!downloadFolderItem) return;
    setIsDownloading(true);
    try {
      await folderService.downloadFolder(downloadFolderItem.id, downloadFolderItem.name, includeMetadata);
    } catch (error) {
      console.error('Error downloading folder:', error);
    } finally {
      setIsDownloading(false);
      setShowDownloadDialog(false);
      setDownloadFolderItem(null);
    }
  };

  const handleShare = (item: TableItem) => {
    if (item.type === 'document') {
      setSelectedDocument(item);
      // You can open a share modal here or navigate to share page
      // For now, we'll just open the edit permissions modal
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
        // You could show a toast notification here
        console.log('Link copied to clipboard');
      }).catch(err => {
        console.error('Failed to copy link:', err);
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;

    setIsDeleting(true);
    try {
      if (deleteItem.type === 'folder') {
        await notificationApiClient.deleteFolder(deleteItem.id);
      } else {
        await notificationApiClient.deleteDocument(deleteItem.documentId);
      }

      // Update the frontend list directly instead of refetching
      setData(prevData => {
        if (!prevData) return prevData;

        if (deleteItem.type === 'folder') {
          const updatedFolders = prevData.folders.filter(folder => folder.id !== deleteItem.id);
          return { ...prevData, folders: updatedFolders };
        } else {
          const updatedDocuments = prevData.documents.filter(doc => doc.documentId !== deleteItem.documentId);
          return { ...prevData, documents: updatedDocuments };
        }
      });

      // Update the table items as well
      setAllTableItems(prevItems => prevItems.filter(tableItem => {
        if (tableItem.type === 'folder' && deleteItem.type === 'folder') {
          return tableItem.id !== deleteItem.id;
        } else if (tableItem.type === 'document' && deleteItem.type === 'document') {
          return tableItem.documentId !== deleteItem.documentId;
        }
        return true; // Keep items of different types
      }));

      // Close the modal
      setShowDeleteModal(false);
      setDeleteItem(null);

    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteItem(null);
    setIsDeleting(false);
  };

  const handleFolderActionSuccess = (updatedItem?: { id: number; name?: string; description?: string; type: 'folder' | 'document'; action: 'rename' | 'move' | 'change-description' }) => {
    if (updatedItem) {
      setData(prevData => {
        if (!prevData) return prevData;

        if (updatedItem.action === 'rename' && updatedItem.name) {
          // Update the name in the local state
          if (updatedItem.type === 'folder') {
            const updatedFolders = prevData.folders.map(folder =>
              folder.id === updatedItem.id
                ? { ...folder, name: updatedItem.name! }
                : folder
            );
            return { ...prevData, folders: updatedFolders };
          } else if (updatedItem.type === 'document') {
            const updatedDocuments = prevData.documents.map(doc =>
              doc.documentId === updatedItem.id
                ? { ...doc, name: updatedItem.name! }
                : doc
            );
            return { ...prevData, documents: updatedDocuments };
          }
        } else if (updatedItem.action === 'change-description' && updatedItem.description !== undefined) {
          if (updatedItem.type === 'folder') {
            const updatedFolders = prevData.folders.map(folder =>
              folder.id === updatedItem.id
                ? { ...folder, description: updatedItem.description }
                : folder
            );
            // Also update current folder if it's the one being edited (though usually it's subfolders in the list)
            if (folder && folder.id === updatedItem.id) {
              setFolder({ ...folder, description: updatedItem.description });
            }
            return { ...prevData, folders: updatedFolders };
          }
        } else if (updatedItem.action === 'move') {
          // Remove the item from the current list since it's moved to another location
          if (updatedItem.type === 'folder') {
            const updatedFolders = prevData.folders.filter(f => f.id !== updatedItem.id);
            return {
              ...prevData,
              folders: updatedFolders,
              totalElements: prevData.totalElements - 1
            };
          } else if (updatedItem.type === 'document') {
            const updatedDocuments = prevData.documents.filter(doc => doc.documentId !== updatedItem.id);
            return {
              ...prevData,
              documents: updatedDocuments,
              totalElements: prevData.totalElements - 1
            };
          }
        }

        return prevData;
      });
    }
  };

  const handleFolderCreated = () => {
    setShowCreateFolderModal(false);
    handleRefresh();
  };

  const handleFileUploaded = () => {
    setShowUploadModal(false);
    handleRefresh();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper function to get profile image or default
  const getProfileImage = (user: any, isCompany: boolean = false) => {
    if (user?.imageUrl) {
      return user.imageUrl;
    }
    // Return default image based on type
    return isCompany ? '/default-company.png' : '/default-user.png';
  };

  // Helper function to get user initials
  const getUserInitials = (user: any) => {
    if (!user) return '?';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || user.username?.charAt(0)?.toUpperCase() || '?';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toLowerCase();
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  };

  if (loading) {
    return <FolderDetailsSkeleton />;
  }

  if (error || !data || !folder || !folder.ownedBy) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-error text-lg mb-4">{error || 'Folder not found'}</div>
        <button
          onClick={() => router.back()}
          className="bg-primary text-surface px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const tableItems = getDisplayItems();

  return (
    <div className="bg-gray-50 flex flex-col flex-1 h-full overflow-hidden">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 shrink-0">
        <BreadcrumbNavigation
          folderPath={folder.path || ''}
          folderOwnerId={folder.ownedBy?.id || ''}
          folderOwnerDisplayName={folder.ownedBy?.displayName || ''}
          currentFolderName={folder.name || ''}
          onNavigateToPath={navigateToPath}
        />
      </div>

      {/* Folder Header */}
      <FolderHeader
        folder={folder}
        data={data}
        isFolderFavorite={isFolderFavorite}
        isLoadingFavorite={isLoadingFavorite}
        onToggleFavorite={toggleFolderFavorite}
        onEditPermissions={() => handleEditFolderPermissions(folder)}
        onUpload={handleUpload}
        onCreateFolder={handleCreateFolder}
        onShowComments={() => setShowCommentsModal(true)}
        onShowActivity={handleShowActivity}
        formatFileSize={formatFileSize}
        formatDate={formatDate}
        isLoading={loading}
        onChangeDescription={() => {
          // For the current folder header
          setActionItem({ ...folder, type: 'folder' } as TableItem);
          setShowChangeDescriptionModal(true);
        }}
        onRename={() => {
          setActionItem({ ...folder, type: 'folder' } as TableItem);
          setShowRenameModal(true);
        }}
        onMove={() => {
          setActionItem({ ...folder, type: 'folder' } as TableItem);
          setShowMoveModal(true);
        }}
        onDelete={() => {
          setDeleteItem({ ...folder, type: 'folder' } as TableItem);
          setShowDeleteModal(true);
        }}
        onDownload={() => {
          setDownloadFolderItem({ id: folder.id, name: folder.name });
          setIncludeMetadata(false);
          setShowDownloadDialog(true);
        }}
      />

      {/* Toolbar */}
      <FolderToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={() => fetchFolderData(true)}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortDesc={sortDesc}
        onSortDescToggle={() => setSortDesc(!sortDesc)}
        showDocumentsOnly={showDocumentsOnly}
        onToggleDocumentsOnly={setShowDocumentsOnly}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* File List */}
        <div className="flex-1 bg-white overflow-y-auto">
          {/* Unified Table View */}
          <UnifiedTableView
            items={tableItems}
            formatFileSize={formatFileSize}
            formatDate={formatDate}
            currentFolderId={folder.id}
            onEditPermissions={handleEditDocumentPermissions}
            onEditFolderPermissions={handleEditFolderPermissions}
            onMove={handleMove}
            onMoveToWorkspace={handleMoveToWorkspace}
            onRename={handleRename}
            onDelete={handleDelete}
            onShowComments={handleShowComments}
            onDownload={handleDownload}
            onShare={handleShare}
            onCopyLink={handleCopyLink}
            onView={handleView}
            onChangeDescription={handleChangeDescription}
            openDropdownId={openDropdownId}
            setOpenDropdownId={setOpenDropdownId}
            showLoadingRows={tableLoading}
            selectedItems={selectedItems}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
          />

          {/* Loading indicator */}
          {tableLoading && (
            <div className="flex items-center justify-center py-4 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              {isLocalFiltering ? 'Fetching comprehensive results...' : 'Loading items...'}
            </div>
          )}

          {/* Pagination */}
          {data && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <Pagination
                currentPage={currentPage - 1}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                pageSize={pageSize}
                onPageChange={(page) => {
                  setCurrentPage(page + 1);
                }}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateFolderModal && (
        <CreateFolderModal
          isOpen={showCreateFolderModal}
          onClose={() => setShowCreateFolderModal(false)}
          onSuccess={handleFolderCreated}
          parentId={parseInt(folderId)}
        />
      )}


      {/* Always render to prevent remounting and refetching on parent state changes */}
      <FileUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleFileUploaded}
        folderId={parseInt(folderId)}
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

      {showEditDocumentModal && selectedDocument && (
        <EditDocumentModal
          isOpen={showEditDocumentModal}
          onClose={() => {
            setShowEditDocumentModal(false);
            setSelectedDocument(null);
          }}
          document={selectedDocument}
        />
      )}

      {showRenameModal && actionItem && (
        <RenameModal
          isOpen={showRenameModal}
          onClose={() => {
            setShowRenameModal(false);
            setActionItem(null);
          }}
          item={actionItem.type === 'folder' ? actionItem as FolderResDto : actionItem as DocumentResponseDto}
          itemType={actionItem.type}
          onSuccess={handleFolderActionSuccess}
        />
      )}

      {showMoveModal && actionItem && (
        <MoveModal
          isOpen={showMoveModal}
          onClose={() => {
            setShowMoveModal(false);
            setActionItem(null);
          }}
          item={actionItem.type === 'folder' ? actionItem as FolderResDto : actionItem as DocumentResponseDto}
          itemType={actionItem.type}
          onSuccess={handleFolderActionSuccess}
        />
      )}

      {showMoveToWorkspaceModal && actionItem && (
        <MoveToWorkspaceModal
          open={showMoveToWorkspaceModal}
          onClose={() => {
            setShowMoveToWorkspaceModal(false);
            setActionItem(null);
          }}
          itemName={actionItem.type === 'folder' ? (actionItem as FolderResDto).name : (actionItem as DocumentResponseDto).name}
          itemType={actionItem.type}
          onConfirm={async (workspaceId, targetFolderId) => {
            try {
              if (actionItem.type === 'folder') {
                await notificationApiClient.moveFolder((actionItem as FolderResDto).id, targetFolderId);
              } else {
                await notificationApiClient.moveDocument((actionItem as DocumentResponseDto).documentId, targetFolderId);
              }
              handleFolderActionSuccess();
            } catch (err) {
              console.error('Move to workspace failed:', err);
            }
          }}
        />
      )}

      {showChangeDescriptionModal && actionItem && (
        <ChangeDescriptionModal
          isOpen={showChangeDescriptionModal}
          onClose={() => {
            setShowChangeDescriptionModal(false);
            setActionItem(null);
          }}
          item={actionItem.type === 'folder' ? actionItem as FolderResDto : actionItem as DocumentResponseDto}
          itemType={actionItem.type}
          onSuccess={handleFolderActionSuccess}
        />
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title={`Delete ${deleteItem?.type === 'document' ? 'Document' : 'Folder'}`}
        message="This action cannot be undone"
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        loading={isDeleting}
        itemName={deleteItem?.name || ''}
        itemType={deleteItem?.type || 'folder'}
      />

      {/* Comments Modal */}
      <CommentsModal
        isOpen={showCommentsModal}
        onClose={() => {
          setShowCommentsModal(false);
          setCommentsModalItem(null);
        }}
        entityType={commentsModalItem ? (commentsModalItem.type === 'folder' ? 'FOLDER' : 'DOCUMENT') : 'FOLDER'}
        entityId={commentsModalItem ? (commentsModalItem.type === 'folder' ? commentsModalItem.id : commentsModalItem.documentId) : parseInt(folderId)}
        entityName={commentsModalItem ? commentsModalItem.name : folder.name}
        canComment={true} // Simplify for now, or derive from permissions
      />

      {/* Activity Modal */}
      <FolderActivityModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        auditLogs={auditLogs}
        isLoadingAuditLogs={isLoadingAuditLogs}
        formatDate={formatDate}
      />

      {/* Download Dialog */}
      {showDownloadDialog && downloadFolderItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Download className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Download Folder</h3>
                  <p className="text-sm text-gray-500">{downloadFolderItem.name}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeMetadata}
                    onChange={(e) => setIncludeMetadata(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Export with metadata</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Each file will include a .metadata.json with the model schema and values
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDownloadDialog(false);
                    setDownloadFolderItem(null);
                  }}
                  disabled={isDownloading}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDownload}
                  disabled={isDownloading}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
                >
                  {isDownloading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedItems.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="bg-gray-900 text-white rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 bg-blue-500 rounded-lg flex items-center justify-center text-xs font-bold">
                {selectedItems.size}
              </div>
              <span className="text-sm font-medium text-gray-300">selected</span>
            </div>

            <div className="w-px h-6 bg-gray-700" />

            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>

            <button
              onClick={() => { setBulkIncludeMetadata(false); setShowBulkDownloadDialog(true); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-400 hover:bg-blue-500/20 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download
            </button>

            <button
              onClick={() => {
                const selected = getSelectedItems();
                if (selected.length > 0) {
                  setActionItem(selected[0]);
                  setShowMoveModal(true);
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-green-400 hover:bg-green-500/20 transition-colors"
            >
              <FolderInput className="h-4 w-4" />
              Move
            </button>

            <div className="w-px h-6 bg-gray-700" />

            <button
              onClick={() => setSelectedItems(new Set())}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation */}
      <ConfirmationModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedItems.size} Item(s)`}
        message={`Are you sure you want to delete ${selectedItems.size} selected item(s)? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        variant="destructive"
        loading={isBulkDeleting}
        itemName={`${selectedItems.size} items`}
        itemType="folder"
      />
      {/* Bulk Download Dialog */}
      {showBulkDownloadDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Download {selectedItems.size} Item(s)</h3>
            <p className="text-sm text-gray-600 mb-4">Selected items will be packaged into a single ZIP file.</p>
            <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={bulkIncludeMetadata}
                onChange={(e) => setBulkIncludeMetadata(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Export with metadata</span>
                <p className="text-xs text-gray-500 mt-0.5">Each file will include a .metadata.json with the model schema and values</p>
              </div>
            </label>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowBulkDownloadDialog(false)} disabled={isBulkDownloading} className="rounded-xl">Cancel</Button>
              <Button onClick={handleBulkDownload} disabled={isBulkDownloading} className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                {isBulkDownloading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Downloading...</>) : (<><Download className="h-4 w-4 mr-2" />Download ZIP</>)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}