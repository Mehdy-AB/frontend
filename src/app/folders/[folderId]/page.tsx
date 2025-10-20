// app/folders/[folderId]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '../../../contexts/LanguageContext';
import { notificationApiClient } from '@/api/notificationClient';
import CreateFolderModal from '@/components/modals/CreateFolderModal';
import FileUploadModal from '@/components/modals/FileUploadModal';
import EditFolderModal from '@/components/modals/EditFolderModal';
import EditDocumentModal from '@/components/modals/EditDocumentModal';
import AdvancedSearchModal from '@/components/modals/AdvancedSearchModal';
import { DocumentResponseDto, FolderRepoResDto, FolderResDto, SortFields, AuditLog } from '@/types/api';
import AuditLogService from '@/api/services/auditLogService';
import { favoriteService } from '@/api/services/favoriteService';
import FolderActionModal from '@/components/modals/FolderActionModal';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal';
import { CommentsModal } from '@/components/modals/CommentsModal';

// Import extracted components
import {
  BreadcrumbNavigation,
  FolderHeader,
  ActivitySection,
  FolderCommentsSection,
  FolderToolbar,
  UnifiedTableView,
  UnifiedGridView,
  FolderDetailsSkeleton
} from '@/components/folder';

// Unified interface for table items
type TableItem = (FolderResDto & { type: 'folder' }) | (DocumentResponseDto & { type: 'document' });

// Sort options for folder contents
type SortOption = 'name' | 'createdAt' | 'updatedAt' | 'size' | 'type';

export default function FolderDetailsPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const folderId = params.folderId as string;

  const [data, setData] = useState<FolderRepoResDto | null>(null);
  const [allTableItems, setAllTableItems] = useState<TableItem[]>([]); // Store all items for local filtering
  const [localSearchResults, setLocalSearchResults] = useState<TableItem[]>([]); // Store local search results
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false); // For table-only loading
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list'); // Default to list view
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDesc, setSortDesc] = useState(false);
  const [isLocalFiltering, setIsLocalFiltering] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [showEditDocumentModal, setShowEditDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentResponseDto | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showFolderActionModal, setShowFolderActionModal] = useState(false);
  const [folderAction, setFolderAction] = useState<'rename' | 'move' | null>(null);
  const [actionItem, setActionItem] = useState<TableItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState<TableItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [breadcrumbPath, setBreadcrumbPath] = useState<string[]>([]);
  const [showAdvancedSearchModal, setShowAdvancedSearchModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState<boolean>(false);
  const [showActivitySection, setShowActivitySection] = useState<boolean>(false);
  const [showCommentsSection, setShowCommentsSection] = useState<boolean>(false);
  const [isFolderFavorite, setIsFolderFavorite] = useState<boolean>(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState<boolean>(false);
  const [showCommentsModal, setShowCommentsModal] = useState<boolean>(false);
  const [commentsModalItem, setCommentsModalItem] = useState<TableItem | null>(null);

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
    
    return allItems.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      (item.type === 'folder' ? item.description.toLowerCase().includes(query.toLowerCase()) : false)
    );
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
      case 'type':
        return SortFields.NAME; // API doesn't have type sorting, fallback to name
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
        size: 20,
        name: searchQuery || undefined,
        showFolder: true,
        sort: mapSortOptionToApiField(sortBy),
        desc: sortDesc
      });
      
        setData(response);
        // Store all items for local filtering (will be updated after data is set)
        
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

  // Update allTableItems when data changes
  useEffect(() => {
    if (data) {
      const allItems = getTableItems();
      setAllTableItems(allItems);
    }
  }, [data]);

  // Fetch folder data when dependencies change (excluding searchQuery)
  useEffect(() => {
    if (folderId) {
      // Use full page loading for initial load, table loading for pagination and sorting
      const isInitialLoad = currentPage === 1 && sortBy === 'name' && sortDesc === false;
      fetchFolderData(!isInitialLoad);
    }
  }, [folderId, currentPage, sortBy, sortDesc]);
  
  // Handle search with local filtering first, then API fetch
  useEffect(() => {
    if (!searchQuery.trim()) {
      // If no search query, show all items
      if (data) {
        const allItems = getTableItems();
        setAllTableItems(allItems);
        setLocalSearchResults([]);
      }
      setIsLocalFiltering(false);
      return;
    }

    // First, filter locally for immediate response
    setIsLocalFiltering(true);
    const localResults = filterTableItemsLocally(searchQuery, allTableItems);
    setLocalSearchResults(localResults);

    // Then, after a delay, fetch from API for more comprehensive results
    const timer = setTimeout(() => {
      fetchFolderData(true).finally(() => {
        setIsLocalFiltering(false);
        setLocalSearchResults([]); // Clear local results when API results come in
      });
    }, 800); // Increased delay for better UX
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Parse folder path to create breadcrumbs
  useEffect(() => {
    if (data?.folder?.path) {
      const pathSegments = data.folder.path.split('/').filter(segment => segment.trim() !== '');
      
      // Replace user ID with username if it's the first segment
      const processedSegments = pathSegments.map((segment, index) => {
        // If it's the first segment and looks like a user ID, replace with username
        if (index === 0 && data.folder.ownedBy ) {
          // For now, just use the username from the folder data
          return data.folder.ownedBy.username;
        }
        return segment;
      });
      setBreadcrumbPath(processedSegments);
    }
  }, [data]);

  // Fetch audit logs for the folder
  const fetchAuditLogs = async (folderId: number) => {
    try {
      setIsLoadingAuditLogs(true);
      const response = await AuditLogService.getAuditLogsByEntity('FOLDER', folderId.toString(), {
        page: 0,
        size: 20
      });
      setAuditLogs(response.content);
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
      const response = await favoriteService.isFolderFavorite(folderId);
      setIsFolderFavorite(response.isFavorite);
    } catch (error) {
      console.error('Error checking folder favorite status:', error);
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  // Toggle folder favorite status
  const toggleFolderFavorite = async () => {
    if (!data?.folder || isLoadingFavorite) return;
    
    try {
      setIsLoadingFavorite(true);
      if (isFolderFavorite) {
        await favoriteService.removeFolderFromFavorites(data.folder.id);
        setIsFolderFavorite(false);
      } else {
        await favoriteService.addFolderToFavorites(data.folder.id);
        setIsFolderFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling folder favorite:', error);
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  // Navigate to folder by path
  const navigateToPath = async (pathIndex: number) => {
    if (!data?.folder?.path) return;
    
    const pathSegments = data.folder.path.split('/').filter(segment => segment.trim() !== '');
    
    // For the first segment (user), we need to use the original path with user ID
    // For other segments, we can use the processed path
    let targetPath: string;
    if (pathIndex === 0) {
      // Navigate to root folder (user's main folder)
      targetPath = pathSegments[0];
    } else {
      // Navigate to subfolder
      targetPath = pathSegments.slice(0, pathIndex + 1).join('/');
    }
    
    try {
      const response = await notificationApiClient.getFolderByPath(targetPath, {
        page: 0,
        size: 20,
        showFolder: true
      });
      
      // Navigate to the folder by ID
      router.push(`/folders/${response.folder.id}`);
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
    setShowEditFolderModal(true);
  };

  const handleMove = (item: TableItem) => {
    setActionItem(item);
    setFolderAction('move');
    setShowFolderActionModal(true);
  };

  const handleRename = (item: TableItem) => {
    setActionItem(item);
    setFolderAction('rename');
    setShowFolderActionModal(true);
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

  const handleFolderActionSuccess = (updatedItem?: { id: number; name: string; type: 'folder' | 'document'; action: 'rename' | 'move' }) => {
    if (updatedItem) {
      setData(prevData => {
        if (!prevData) return prevData;
        
        if (updatedItem.action === 'rename') {
          // Update the name in the local state
          if (updatedItem.type === 'folder') {
            const updatedFolders = prevData.folders.map(folder => 
              folder.id === updatedItem.id 
                ? { ...folder, name: updatedItem.name }
                : folder
            );
            return { ...prevData, folders: updatedFolders };
          } else if (updatedItem.type === 'document') {
            const updatedDocuments = prevData.documents.map(doc => 
              doc.documentId === updatedItem.id 
                ? { ...doc, name: updatedItem.name }
                : doc
            );
            return { ...prevData, documents: updatedDocuments };
          }
        } else if (updatedItem.action === 'move') {
          // Remove the item from the current list since it's moved to another location
          if (updatedItem.type === 'folder') {
            const updatedFolders = prevData.folders.filter(folder => folder.id !== updatedItem.id);
            return { 
              ...prevData, 
              folders: updatedFolders,
              page: {
                ...prevData.page,
                totalElements: prevData.page.totalElements - 1
              }
            };
          } else if (updatedItem.type === 'document') {
            const updatedDocuments = prevData.documents.filter(doc => doc.documentId !== updatedItem.id);
            return { 
              ...prevData, 
              documents: updatedDocuments,
              page: {
                ...prevData.page,
                totalElements: prevData.page.totalElements - 1
              }
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <FolderDetailsSkeleton />;
  }

  if (error || !data) {
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

  const { folder } = data;
  const tableItems = getDisplayItems();

  return (
    <div className="bg-gray-50 flex flex-col flex-1">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
      <BreadcrumbNavigation 
        breadcrumbPath={breadcrumbPath}
        onNavigateToPath={navigateToPath}
        currentFolderName={folder.name}
      />
          </div>
          
      {/* Folder Header */}
      <FolderHeader
        folder={folder}
        data={data}
        isFolderFavorite={isFolderFavorite}
        isLoadingFavorite={isLoadingFavorite}
        onToggleFavorite={toggleFolderFavorite}
        onEditPermissions={() => setShowEditFolderModal(true)}
        onUpload={handleUpload}
        onCreateFolder={handleCreateFolder}
        formatFileSize={formatFileSize}
        formatDate={formatDate}
        getProfileImage={getProfileImage}
        getUserInitials={getUserInitials}
        isLoading={loading}
      />

      {/* Toolbar */}
      <FolderToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={() => fetchFolderData(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortDesc={sortDesc}
        onSortDescToggle={() => setSortDesc(!sortDesc)}
      />

      {/* Main Content Area */}
      <div className="flex">
        {/* File List */}
        <div className="flex-1 bg-white">
          {/* Unified Table/Grid View */}
      {viewMode === 'list' ? (
        <UnifiedTableView 
          items={tableItems} 
          formatFileSize={formatFileSize} 
          formatDate={formatDate}
          currentFolderId={folder.id}
          onEditPermissions={handleEditDocumentPermissions}
          onEditFolderPermissions={handleEditFolderPermissions}
          onMove={handleMove}
          onRename={handleRename}
          onDelete={handleDelete}
          onShowComments={handleShowComments}
          openDropdownId={openDropdownId}
          setOpenDropdownId={setOpenDropdownId}
          showLoadingRows={tableLoading}
        />
      ) : (
        <UnifiedGridView 
          items={tableItems} 
          formatFileSize={formatFileSize} 
          formatDate={formatDate}
          currentFolderId={folder.id}
          onEditPermissions={handleEditDocumentPermissions}
          onEditFolderPermissions={handleEditFolderPermissions}
          onMove={handleMove}
          onRename={handleRename}
          onDelete={handleDelete}
          onShowComments={handleShowComments}
          openDropdownId={openDropdownId}
          setOpenDropdownId={setOpenDropdownId}
          showLoadingRows={tableLoading}
        />
      )}

      {/* Loading indicator */}
      {tableLoading && (
            <div className="flex items-center justify-center py-4 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          {isLocalFiltering ? 'Fetching comprehensive results...' : 'Loading items...'}
        </div>
      )}

      {/* Pagination */}
      {data.page && data.page.totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-500">
            Showing {tableItems.length} of {data.page.totalElements} items
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={data.page.first}
                  className="px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            {[...Array(data.page.totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-2 border rounded text-sm ${
                  currentPage === i + 1
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, data.page.totalPages))}
              disabled={data.page.last}
                  className="px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
        </div>

        {/* Sidebar */}
        <div className="w-96 bg-white border-l border-gray-200 h-screen overflow-y-auto">
          <div className=" space-y-2">
            {/* Activity Section */}
            <div className="bg-gray-50 rounded-lg px-2 ">
              {/* Comments Section */}
            <div className="bg-gray-50 rounded-lg px-2 pt-4">
              <FolderCommentsSection
                showCommentsSection={showCommentsSection}
                onToggleCommentsSection={() => setShowCommentsSection(!showCommentsSection)}
                folder={folder}
                isLoading={loading}
              />
            </div>

              <ActivitySection
                showActivitySection={showActivitySection}
                onToggleActivitySection={() => setShowActivitySection(!showActivitySection)}
                auditLogs={auditLogs}
                isLoadingAuditLogs={isLoadingAuditLogs}
                formatDate={formatDate}
                isLoading={loading}
              />
            </div>

            
          </div>
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

      {showUploadModal && (
        <FileUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleFileUploaded}
          folderId={parseInt(folderId)}
        />
      )}

      {showEditFolderModal && folder && (
        <EditFolderModal
          isOpen={showEditFolderModal}
          onClose={() => setShowEditFolderModal(false)}
          folder={folder}
          onSuccess={handleRefresh}
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
          onSuccess={handleRefresh}
        />
      )}

      <FolderActionModal
        isOpen={showFolderActionModal}
        onClose={() => {
          setShowFolderActionModal(false);
          setActionItem(null);
          setFolderAction(null);
        }}
        folder={actionItem && actionItem.type === 'folder' ? actionItem as FolderResDto : null}
        document={actionItem && actionItem.type === 'document' ? actionItem as DocumentResponseDto : null}
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
        itemName={deleteItem?.name || ''}
        itemType={deleteItem?.type || 'folder'}
        isLoading={isDeleting}
      />

      {/* Comments Modal */}
      {commentsModalItem && (
        <CommentsModal
          isOpen={showCommentsModal}
          onClose={() => {
            setShowCommentsModal(false);
            setCommentsModalItem(null);
          }}
          entityType={commentsModalItem.type === 'folder' ? 'FOLDER' : 'DOCUMENT'}
          entityId={commentsModalItem.type === 'folder' ? commentsModalItem.id : commentsModalItem.documentId}
          entityName={commentsModalItem.name}
          canComment={commentsModalItem.userPermissions?.canEdit}
        />
      )}
    </div>
  );
}