'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Folder, File, ChevronRight, Search, Check, Home, Share2, Loader2, FolderOpen, FileText } from 'lucide-react';
import { notificationApiClient } from '@/api/notificationClient';
import { FolderResDto, DocumentResponseDto, FolderRepoResDto, SortFields } from '@/types/api';
import Pagination from '../main/Pagination';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface FolderActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: FolderResDto | null;
  document?: DocumentResponseDto | null;
  action: 'rename' | 'move' | null;
  onSuccess?: (updatedItem?: { id: number; name: string; type: 'folder' | 'document'; action: 'rename' | 'move' }) => void;
}

interface BreadcrumbItem {
  id: number;
  name: string;
}

interface MoveableFolder {
  id: number;
  name: string;
  path: string;
  pathLtree?: string;
  description?: string;
  userPermissions?: {
    canCreateSubFolders?: boolean;
    canUpload?: boolean;
  };
  isSelectable: boolean;
  disableReason?: string;
}

export default function FolderActionModal({
  isOpen,
  onClose,
  folder,
  document,
  action,
  onSuccess
}: FolderActionModalProps) {
  const [newName, setNewName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Tab management
  const [activeTab, setActiveTab] = useState<'folders' | 'shared'>('folders');

  // My Folders tab state
  const [myFoldersData, setMyFoldersData] = useState<FolderRepoResDto | null>(null);
  const [myFoldersLoading, setMyFoldersLoading] = useState(false);
  const [myFoldersSearchQuery, setMyFoldersSearchQuery] = useState('');
  const [myFoldersDebouncedQuery, setMyFoldersDebouncedQuery] = useState('');
  const [myFoldersCurrentPage, setMyFoldersCurrentPage] = useState(0);
  const [myFoldersPageSize] = useState(20);
  const [myFoldersCurrentFolderId, setMyFoldersCurrentFolderId] = useState<number | null>(null);
  const [myFoldersBreadcrumbs, setMyFoldersBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const isNavigatingViaBreadcrumbMyFolders = useRef(false);

  // Shared Folders tab state
  const [sharedData, setSharedData] = useState<FolderRepoResDto | null>(null);
  const [sharedLoading, setSharedLoading] = useState(false);
  const [sharedSearchQuery, setSharedSearchQuery] = useState('');
  const [sharedDebouncedQuery, setSharedDebouncedQuery] = useState('');
  const [sharedCurrentPage, setSharedCurrentPage] = useState(0);
  const [sharedPageSize] = useState(20);
  const [sharedCurrentFolderId, setSharedCurrentFolderId] = useState<number | null>(null);
  const [sharedBreadcrumbs, setSharedBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const isNavigatingViaBreadcrumb = useRef(false);

  // Get the item being moved
  const movingItem = folder || document;
  const movingItemId = folder ? folder.id : document?.folderId;
  const movingItemPath = folder?.path || document?.path || '';
  const isMovingFolder = !!folder;

  // Reset state when modal opens/closes or action changes
  useEffect(() => {
    if (isOpen && movingItem) {
      setNewName(movingItem.name);
      setSelectedFolderId(null);
      setSelectedFolderName(null);
      setMyFoldersSearchQuery('');
      setMyFoldersDebouncedQuery('');
      setMyFoldersCurrentPage(0);
      setMyFoldersCurrentFolderId(null);
      setMyFoldersBreadcrumbs([]);
      setSharedSearchQuery('');
      setSharedDebouncedQuery('');
      setSharedCurrentPage(0);
      setSharedCurrentFolderId(null);
      setSharedBreadcrumbs([]);
      setActiveTab('folders');
    }
  }, [isOpen, folder, document, action]);

  // Debounce my folders search
  useEffect(() => {
    const timer = setTimeout(() => {
      setMyFoldersDebouncedQuery(myFoldersSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [myFoldersSearchQuery]);

  // Reset my folders page when search changes
  useEffect(() => {
    setMyFoldersCurrentPage(0);
  }, [myFoldersDebouncedQuery]);

  // Debounce shared search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSharedDebouncedQuery(sharedSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [sharedSearchQuery]);

  // Reset shared page when search changes
  useEffect(() => {
    setSharedCurrentPage(0);
  }, [sharedDebouncedQuery]);

  // Load my folders (using getRepository and getFolder like LinkDocumentModal)
  const loadMyFolders = useCallback(async () => {
    setMyFoldersLoading(true);
    try {
      let response: FolderRepoResDto;

      if (myFoldersCurrentFolderId !== null) {
        // Fetch folder contents
        response = await notificationApiClient.getFolder(myFoldersCurrentFolderId, {
          page: myFoldersCurrentPage,
          size: myFoldersPageSize,
          showFolder: true,
          name: myFoldersDebouncedQuery || undefined,
          sort: SortFields.NAME,
          desc: false
        });
      } else {
        // Fetch root repository
        const repoResponse = await notificationApiClient.getRepository({
          page: myFoldersCurrentPage,
          size: myFoldersPageSize,
          name: myFoldersDebouncedQuery || undefined
        });
        // Convert PageResponse<FolderResDto> to FolderRepoResDto format
        response = {
          folder: undefined,
          folders: repoResponse.content || [],
          documents: [],
          pageable: {
            pageNumber: repoResponse.number ?? myFoldersCurrentPage,
            pageSize: repoResponse.size ?? myFoldersPageSize
          },
          totalElements: repoResponse.totalElements || 0,
          totalPages: repoResponse.totalPages || 0
        };
      }

      setMyFoldersData(response);

      // Build breadcrumbs
      if (myFoldersCurrentFolderId !== null && response.folder) {
        setMyFoldersBreadcrumbs(prev => {
          if (isNavigatingViaBreadcrumbMyFolders.current) {
            isNavigatingViaBreadcrumbMyFolders.current = false;
            const index = prev.findIndex(b => b.id === response.folder!.id);
            if (index !== -1 && prev[index].name !== response.folder!.name) {
              const updated = [...prev];
              updated[index] = { id: response.folder!.id, name: response.folder!.name };
              return updated;
            }
            return prev;
          }

          const folderId = response.folder!.id;
          const existingIndex = prev.findIndex(b => b.id === folderId);
          if (existingIndex !== -1) {
            return prev.slice(0, existingIndex + 1);
          } else {
            return [...prev, { id: folderId, name: response.folder!.name }];
          }
        });
      } else if (myFoldersCurrentFolderId === null) {
        setMyFoldersBreadcrumbs([]);
        isNavigatingViaBreadcrumbMyFolders.current = false;
      }
    } catch (error) {
      console.error('Error loading my folders:', error);
    } finally {
      setMyFoldersLoading(false);
    }
  }, [myFoldersCurrentPage, myFoldersDebouncedQuery, myFoldersCurrentFolderId, myFoldersPageSize]);

  // Load my folders when dependencies change
  useEffect(() => {
    if (action === 'move' && activeTab === 'folders' && isOpen) {
      loadMyFolders();
    }
  }, [action, activeTab, isOpen, loadMyFolders]);

  // Navigate to my folder
  const navigateToMyFolder = (folderId: number, folderName: string) => {
    setMyFoldersCurrentFolderId(folderId);
    setMyFoldersBreadcrumbs(prev => [...prev, { id: folderId, name: folderName }]);
    setMyFoldersCurrentPage(0);
  };

  // Navigate back via breadcrumb (my folders)
  const navigateMyFoldersBreadcrumb = (folderId: number | null, breadcrumbIndex?: number) => {
    if (folderId === null) {
      setMyFoldersCurrentFolderId(null);
      setMyFoldersBreadcrumbs([]);
      isNavigatingViaBreadcrumbMyFolders.current = false;
    } else {
      isNavigatingViaBreadcrumbMyFolders.current = true;
      setMyFoldersCurrentFolderId(folderId);
      if (breadcrumbIndex !== undefined) {
        setMyFoldersBreadcrumbs(prev => prev.slice(0, breadcrumbIndex + 1));
      } else {
        const index = myFoldersBreadcrumbs.findIndex(b => b.id === folderId);
        if (index !== -1) {
          setMyFoldersBreadcrumbs(prev => prev.slice(0, index + 1));
        }
      }
    }
    setMyFoldersCurrentPage(0);
  };

  // Get moveable folders from my folders data with restrictions
  const myMoveableFolders = useMemo(() => {
    if (!myFoldersData) return [];

    return (myFoldersData.folders || []).map(f => {
      let isSelectable = true;
      let disableReason = '';

      // Check if this folder is the same folder being moved or a subfolder
      if (isMovingFolder) {
        // Cannot move folder into itself
        if (f.id === movingItemId) {
          isSelectable = false;
          disableReason = 'Cannot move folder to its current location';
        }
        // Check if this folder is a subfolder of the folder being moved
        else if (movingItemPath && f.path) {
          // Check if the folder path starts with the moving folder's path
          // Normalize paths for comparison (handle ltree format with dots/underscores)
          const normalizedMovingPath = movingItemPath.replace(/[._]/g, '/').toLowerCase().trim();
          const normalizedFolderPath = f.path.replace(/[._]/g, '/').toLowerCase().trim();

          // If the destination folder path starts with the moving folder's path, it's a subfolder
          if (normalizedFolderPath.startsWith(normalizedMovingPath + '/')) {
            isSelectable = false;
            disableReason = 'Cannot move folder into its own subfolder';
          }
        }
      } else {
        // For documents: can navigate into current folder but cannot select it
        if (f.id === movingItemId) {
          isSelectable = false;
          disableReason = 'Cannot move document to its current location';
        }
      }

      return {
        id: f.id,
        name: f.name,
        path: f.path || '',
        description: f.description,
        isSelectable,
        disableReason
      };
    });
  }, [myFoldersData, isMovingFolder, movingItemId, movingItemPath]);

  // Load shared folders
  const fetchSharedData = useCallback(async () => {
    setSharedLoading(true);
    try {
      let response: FolderRepoResDto;

      if (sharedCurrentFolderId !== null) {
        response = await notificationApiClient.getFolder(sharedCurrentFolderId, {
          page: sharedCurrentPage,
          size: sharedPageSize,
          showFolder: true,
          name: sharedDebouncedQuery || undefined,
          sort: SortFields.NAME,
          desc: false
        });
      } else {
        response = await notificationApiClient.getSharedFolders({
          page: sharedCurrentPage,
          size: sharedPageSize,
          name: sharedDebouncedQuery || undefined,
          showFolder: true,
          sort: SortFields.NAME,
          desc: false
        });
      }

      setSharedData(response);

      // Build breadcrumbs
      if (sharedCurrentFolderId !== null && response.folder) {
        setSharedBreadcrumbs(prev => {
          if (isNavigatingViaBreadcrumb.current) {
            isNavigatingViaBreadcrumb.current = false;
            const index = prev.findIndex(b => b.id === response.folder!.id);
            if (index !== -1 && prev[index].name !== response.folder!.name) {
              const updated = [...prev];
              updated[index] = { id: response.folder!.id, name: response.folder!.name };
              return updated;
            }
            return prev;
          }

          const folderId = response.folder!.id;
          const existingIndex = prev.findIndex(b => b.id === folderId);
          if (existingIndex !== -1) {
            return prev.slice(0, existingIndex + 1);
          } else {
            return [...prev, { id: folderId, name: response.folder!.name }];
          }
        });
      } else if (sharedCurrentFolderId === null) {
        setSharedBreadcrumbs([]);
        isNavigatingViaBreadcrumb.current = false;
      }
    } catch (error) {
      console.error('Error fetching shared data:', error);
    } finally {
      setSharedLoading(false);
    }
  }, [sharedCurrentPage, sharedDebouncedQuery, sharedCurrentFolderId, sharedPageSize]);

  // Load shared data when tab is active
  useEffect(() => {
    if (action === 'move' && activeTab === 'shared' && isOpen) {
      fetchSharedData();
    }
  }, [action, activeTab, isOpen, fetchSharedData]);

  // Navigate to shared folder
  const navigateToSharedFolder = (folderId: number, folderName: string) => {
    setSharedCurrentFolderId(folderId);
    setSharedBreadcrumbs(prev => [...prev, { id: folderId, name: folderName }]);
    setSharedCurrentPage(0);
  };

  // Navigate back via breadcrumb
  const navigateSharedBreadcrumb = (folderId: number | null, breadcrumbIndex?: number) => {
    if (folderId === null) {
      setSharedCurrentFolderId(null);
      setSharedBreadcrumbs([]);
      isNavigatingViaBreadcrumb.current = false;
    } else {
      isNavigatingViaBreadcrumb.current = true;
      setSharedCurrentFolderId(folderId);
      if (breadcrumbIndex !== undefined) {
        setSharedBreadcrumbs(prev => prev.slice(0, breadcrumbIndex + 1));
      } else {
        const index = sharedBreadcrumbs.findIndex(b => b.id === folderId);
        if (index !== -1) {
          setSharedBreadcrumbs(prev => prev.slice(0, index + 1));
        }
      }
    }
    setSharedCurrentPage(0);
  };

  // Get moveable folders from shared data
  const sharedMoveableFolders = useMemo(() => {
    if (!sharedData) return [];

    return (sharedData.folders || []).map(f => {
      let isSelectable = true;
      let disableReason = '';

      // Check permissions for shared folders
      if (isMovingFolder) {
        // When moving folder, need canCreateSubFolders permission
        if (!f.userPermissions?.canCreateSubFolders) {
          isSelectable = false;
          disableReason = 'You do not have permission to create subfolders in this folder';
        }
      } else {
        // When moving document, need canUpload permission
        if (!f.userPermissions?.canUpload) {
          isSelectable = false;
          disableReason = 'You do not have permission to upload documents to this folder';
        }
        // For documents: can navigate into current folder but cannot select it
        if (f.id === movingItemId) {
          isSelectable = false;
          disableReason = 'Cannot move document to its current location';
        }
      }

      return {
        id: f.id,
        name: f.name,
        path: f.path || '',
        description: f.description,
        userPermissions: f.userPermissions,
        isSelectable,
        disableReason
      };
    });
  }, [sharedData, isMovingFolder, movingItemId]);

  const handleSubmit = async () => {
    if (!movingItem) return;

    try {
      setLoading(true);

      if (action === 'rename') {
        if (!newName.trim() || newName.trim() === movingItem.name) {
          return;
        }

        if (folder) {
          await notificationApiClient.renameFolder(folder.id, newName.trim());
        } else if (document) {
          await notificationApiClient.renameDocument(document.documentId, newName.trim());
        }
      } else if (action === 'move') {
        if (!selectedFolderId) {
          return;
        }

        if (folder) {
          await notificationApiClient.moveFolder(folder.id, selectedFolderId);
        } else if (document) {
          await notificationApiClient.moveDocument(document.documentId, selectedFolderId);
        }
      }

      const updatedItem = {
        id: folder ? folder.id : document!.documentId,
        name: newName.trim(),
        type: (folder ? 'folder' : 'document') as 'folder' | 'document',
        action: action as 'rename' | 'move'
      };
      onSuccess?.(updatedItem);
      onClose();
    } catch (error) {
      console.error(`Error ${action}ing item:`, error);
    } finally {
      setLoading(false);
    }
  };

  const selectFolder = (folderId: number, folderName: string) => {
    setSelectedFolderId(folderId);
    setSelectedFolderName(folderName);
  };

  const isSubmitDisabled = () => {
    if (action === 'rename') {
      return !newName.trim() || newName.trim() === movingItem?.name || loading;
    } else if (action === 'move') {
      return !selectedFolderId || loading;
    }
    return true;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-w-[95vw] w-full overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="min-w-0">
          <DialogTitle className="flex items-center gap-2 min-w-0">
            {folder ? <Folder className="h-5 w-5 flex-shrink-0" /> : <File className="h-5 w-5 flex-shrink-0" />}
            <span className="truncate">
              {action === 'rename'
                ? (folder ? 'Rename Folder' : 'Rename Document')
                : (folder ? 'Move Folder' : 'Move Document')
              }
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 min-w-0 overflow-hidden flex flex-col flex-1">
          {movingItem && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg min-w-0">
              {folder ? <Folder className="h-5 w-5 text-blue-500 flex-shrink-0" /> : <File className="h-5 w-5 text-green-500 flex-shrink-0" />}
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{movingItem.name}</p>
                <p className="text-sm text-gray-500 truncate">{movingItem.path}</p>
              </div>
            </div>
          )}

          {action === 'rename' && (
            <div className="space-y-2 min-w-0 overflow-hidden w-full">
              <Label htmlFor="item-name">New {folder ? 'Folder' : 'Document'} Name</Label>
              {document ? (
                <div className="space-y-2 w-full min-w-0 overflow-hidden">
                  {(() => {
                    const currentName = document.name;
                    const lastDotIndex = currentName.lastIndexOf('.');
                    const hasExtension = lastDotIndex > 0;
                    const extension = hasExtension ? currentName.substring(lastDotIndex) : '';

                    const currentInputValue = newName.endsWith(extension)
                      ? newName.substring(0, newName.length - extension.length)
                      : newName.replace(/\.[^.]*$/, '');

                    return (
                      <div className="flex items-center gap-2" style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflow: 'hidden' }}>
                        <div className="flex-1 min-w-0" style={{ minWidth: 0, maxWidth: hasExtension ? 'calc(100% - 90px)' : '100%', overflow: 'hidden' }}>
                          <Input
                            id="item-name"
                            type="text"
                            value={currentInputValue}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              const cleanValue = newValue.replace(/\.[^.]*$/, '');
                              setNewName(cleanValue + extension);
                            }}
                            placeholder={`Enter new document name`}
                            className="w-full"
                            style={{
                              width: '100%',
                              maxWidth: '100%',
                              minWidth: 0,
                              boxSizing: 'border-box'
                            }}
                            maxLength={255 - extension.length}
                            autoFocus
                          />
                        </div>
                        {hasExtension && (
                          <div className="flex-shrink-0 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700 font-medium whitespace-nowrap" style={{ flexShrink: 0, minWidth: 'fit-content' }}>
                            {extension}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <p className="text-xs text-gray-500">
                    File extension is preserved and cannot be changed. Maximum length: 255 characters.
                  </p>
                  {newName.length > 200 && (
                    <p className="text-xs text-yellow-600">
                      Name is getting long ({newName.length}/255 characters)
                    </p>
                  )}
                </div>
              ) : (
                <Input
                  id="item-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={`Enter new folder name`}
                  className="w-full"
                  maxLength={255}
                  autoFocus
                />
              )}
            </div>
          )}

          {action === 'move' && (
            <div className="flex flex-col flex-1 min-h-0 space-y-4">
              <div className="space-y-2">
                <Label>Select Destination Folder</Label>

                {/* Tab Selection */}
                <div className="flex gap-2 border-b">
                  <button
                    onClick={() => setActiveTab('folders')}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'folders'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      My Folders
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('shared')}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'shared'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Share2 className="h-4 w-4" />
                      Shared with Me
                    </div>
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'folders' ? (
                  <div className="flex flex-col border rounded-lg overflow-hidden flex-1 min-h-0">
                    {/* Search Bar */}
                    <div className="p-3 border-b bg-gray-50">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          value={myFoldersSearchQuery}
                          onChange={(e) => setMyFoldersSearchQuery(e.target.value)}
                          placeholder="Search folders..."
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Breadcrumb Navigation */}
                    <div className="p-3 border-b bg-white flex items-center gap-2 text-sm overflow-x-auto">
                      <button
                        onClick={() => navigateMyFoldersBreadcrumb(null)}
                        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors flex-shrink-0 ${myFoldersCurrentFolderId === null
                            ? 'font-medium text-blue-600'
                            : 'hover:bg-gray-100 text-gray-700'
                          }`}
                      >
                        <Home className="h-4 w-4" />
                        <span>Root</span>
                      </button>

                      {myFoldersBreadcrumbs.map((crumb, index) => (
                        <div key={`${crumb.id}-${index}`} className="flex items-center gap-2 flex-shrink-0">
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                          <button
                            onClick={() => navigateMyFoldersBreadcrumb(crumb.id, index)}
                            className={`px-2 py-1 rounded transition-colors truncate max-w-[150px] ${index === myFoldersBreadcrumbs.length - 1 && myFoldersCurrentFolderId === crumb.id
                                ? 'font-medium text-blue-600'
                                : 'hover:bg-gray-100 text-gray-700'
                              }`}
                            title={crumb.name}
                          >
                            {crumb.name}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Folders List */}
                    <div className="flex-1 overflow-y-auto bg-white min-h-0">
                      {myFoldersLoading ? (
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        </div>
                      ) : myMoveableFolders.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No folders found
                        </div>
                      ) : (
                        <div className="p-2">
                          {myMoveableFolders.map(folder => {
                            const isSelected = selectedFolderId === folder.id;
                            const isCurrentFolder = folder.id === movingItemId;
                            const tooltipText = !folder.isSelectable
                              ? folder.disableReason
                              : '';

                            const folderItem = (
                              <div
                                className={`flex items-center py-2 px-3 rounded-md transition-colors ${!folder.isSelectable
                                    ? 'opacity-50 bg-gray-50'
                                    : isSelected
                                      ? 'bg-blue-100 border border-blue-300'
                                      : 'hover:bg-gray-100'
                                  }`}
                              >
                                <Folder className={`h-4 w-4 mr-2 ${!folder.isSelectable ? 'text-gray-400' : 'text-blue-500'}`} />

                                <div
                                  className={`flex-1 min-w-0 ${folder.isSelectable ? 'cursor-pointer' : ''}`}
                                  onClick={() => {
                                    if (folder.isSelectable) {
                                      selectFolder(folder.id, folder.name);
                                    }
                                  }}
                                >
                                  <div className={`text-sm truncate ${!folder.isSelectable ? 'text-gray-400' : ''}`}>
                                    {folder.name}
                                  </div>
                                  {folder.path && (
                                    <div className="text-xs text-gray-500 mt-1 truncate">
                                      {folder.path.includes('/') ? folder.path.substring(folder.path.indexOf('/') + 1) : folder.path}
                                    </div>
                                  )}
                                </div>

                                {isSelected && folder.isSelectable && (
                                  <Check className="h-4 w-4 text-blue-600 flex-shrink-0 mr-2" />
                                )}

                                {/* Always show navigation button, even for current folder (for documents) */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigateToMyFolder(folder.id, folder.name);
                                  }}
                                  className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                                  title="Navigate into folder"
                                >
                                  <ChevronRight className="h-4 w-4 text-gray-600" />
                                </button>
                              </div>
                            );

                            return (
                              <div key={folder.id}>
                                {tooltipText ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      {folderItem}
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{tooltipText}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  folderItem
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Pagination */}
                    {myFoldersData && myFoldersData.totalPages > 1 && (
                      <div className="p-3 border-t bg-gray-50">
                        <Pagination
                          currentPage={myFoldersCurrentPage}
                          totalPages={myFoldersData.totalPages}
                          totalElements={myFoldersData.totalElements || 0}
                          pageSize={myFoldersPageSize}
                          onPageChange={setMyFoldersCurrentPage}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col border rounded-lg overflow-hidden flex-1 min-h-0">
                    {/* Search Bar */}
                    <div className="p-3 border-b bg-gray-50">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          value={sharedSearchQuery}
                          onChange={(e) => setSharedSearchQuery(e.target.value)}
                          placeholder="Search shared folders..."
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Breadcrumb Navigation */}
                    <div className="p-3 border-b bg-white flex items-center gap-2 text-sm overflow-x-auto">
                      <button
                        onClick={() => navigateSharedBreadcrumb(null)}
                        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors flex-shrink-0 ${sharedCurrentFolderId === null
                            ? 'font-medium text-blue-600'
                            : 'hover:bg-gray-100 text-gray-700'
                          }`}
                      >
                        <Home className="h-4 w-4" />
                        <span>Shared</span>
                      </button>

                      {sharedBreadcrumbs.map((crumb, index) => (
                        <div key={`${crumb.id}-${index}`} className="flex items-center gap-2 flex-shrink-0">
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                          <button
                            onClick={() => navigateSharedBreadcrumb(crumb.id, index)}
                            className={`px-2 py-1 rounded transition-colors truncate max-w-[150px] ${index === sharedBreadcrumbs.length - 1 && sharedCurrentFolderId === crumb.id
                                ? 'font-medium text-blue-600'
                                : 'hover:bg-gray-100 text-gray-700'
                              }`}
                            title={crumb.name}
                          >
                            {crumb.name}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Folders List */}
                    <div className="flex-1 overflow-y-auto bg-white min-h-0">
                      {sharedLoading ? (
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        </div>
                      ) : sharedMoveableFolders.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No folders found
                        </div>
                      ) : (
                        <div className="p-2">
                          {sharedMoveableFolders.map(folder => {
                            const isSelected = selectedFolderId === folder.id;
                            const tooltipText = !folder.isSelectable
                              ? folder.disableReason
                              : '';

                            const folderItem = (
                              <div
                                className={`flex items-center py-2 px-3 rounded-md transition-colors ${!folder.isSelectable
                                    ? 'opacity-50 bg-gray-50'
                                    : isSelected
                                      ? 'bg-blue-100 border border-blue-300'
                                      : 'hover:bg-gray-100'
                                  }`}
                              >
                                <Folder className={`h-4 w-4 mr-2 ${!folder.isSelectable ? 'text-gray-400' : 'text-blue-500'}`} />

                                <div
                                  className={`flex-1 min-w-0 ${folder.isSelectable ? 'cursor-pointer' : ''}`}
                                  onClick={() => {
                                    if (folder.isSelectable) {
                                      selectFolder(folder.id, folder.name);
                                    }
                                  }}
                                >
                                  <div className={`text-sm truncate ${!folder.isSelectable ? 'text-gray-400' : ''}`}>
                                    {folder.name}
                                  </div>
                                  {folder.path && (
                                    <div className="text-xs text-gray-500 mt-1 truncate">
                                      {folder.path.includes('/') ? folder.path.substring(folder.path.indexOf('/') + 1) : folder.path}
                                    </div>
                                  )}
                                </div>

                                {isSelected && folder.isSelectable && (
                                  <Check className="h-4 w-4 text-blue-600 flex-shrink-0 mr-2" />
                                )}

                                {/* Always show navigation button, even for non-selectable folders (for documents) */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigateToSharedFolder(folder.id, folder.name);
                                  }}
                                  className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                                  title="Navigate into folder"
                                >
                                  <ChevronRight className="h-4 w-4 text-gray-600" />
                                </button>
                              </div>
                            );

                            return (
                              <div key={folder.id}>
                                {tooltipText ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      {folderItem}
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{tooltipText}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  folderItem
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Pagination */}
                    {sharedData && sharedData.totalPages > 1 && (
                      <div className="p-3 border-t bg-gray-50">
                        <Pagination
                          currentPage={sharedCurrentPage}
                          totalPages={sharedData.totalPages}
                          totalElements={sharedData.totalElements || 0}
                          pageSize={sharedPageSize}
                          onPageChange={setSharedCurrentPage}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedFolderId && selectedFolderName && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Selected: {selectedFolderName}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitDisabled()}
              className="min-w-[100px]"
            >
              {loading ? 'Processing...' : action === 'rename' ? 'Rename' : 'Move'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
