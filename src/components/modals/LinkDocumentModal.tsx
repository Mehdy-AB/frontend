'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Link, FileText, Loader2, AlertCircle, Share2, Folder, Search, ChevronRight, Home } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { linkRuleService } from '../../api/services/linkRuleService';
import { notificationApiClient } from '../../api/notificationClient';
import { DocumentLinkRequestDto, DocumentResponseDto, FolderRepoResDto, FolderResDto, SortFields } from '../../types/api';
import { formatFileSize } from '../../utils/documentUtils';
import FolderNavigationPicker from './FolderNavigationPicker';
import Pagination from '../main/Pagination';

interface LinkDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLinkCreated: () => void;
  sourceDocumentId: number;
  sourceDocumentName: string;
}

const LINK_TYPES = [
  { value: 'related', label: 'Related Document' },
  { value: 'reference', label: 'Reference' },
  { value: 'attachment', label: 'Attachment' },
  { value: 'version', label: 'Version' },
  { value: 'parent', label: 'Parent Document' },
  { value: 'child', label: 'Child Document' },
  { value: 'similar', label: 'Similar Document' },
  { value: 'alternative', label: 'Alternative Version' }
];

// Unified type for table items
type TableItem = (FolderResDto & { type: 'folder' }) | (DocumentResponseDto & { type: 'document' });

export default function LinkDocumentModal({ 
  isOpen, 
  onClose, 
  onLinkCreated, 
  sourceDocumentId, 
  sourceDocumentName 
}: LinkDocumentModalProps) {
  const [selectedDocument, setSelectedDocument] = useState<DocumentResponseDto | null>(null);
  const [linkType, setLinkType] = useState('related');
  const [description, setDescription] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'folders' | 'shared'>('folders');
  
  // Shared items state
  const [sharedData, setSharedData] = useState<FolderRepoResDto | null>(null);
  const [sharedLoading, setSharedLoading] = useState(false);
  const [sharedSearchQuery, setSharedSearchQuery] = useState('');
  const [sharedDebouncedQuery, setSharedDebouncedQuery] = useState('');
  const [sharedCurrentPage, setSharedCurrentPage] = useState(0);
  const [sharedPageSize] = useState(20);
  const [sharedCurrentFolderId, setSharedCurrentFolderId] = useState<number | null>(null);
  const [sharedBreadcrumbs, setSharedBreadcrumbs] = useState<Array<{ id: number; name: string }>>([]);

  // Handle document selection from folder navigation
  const handleSelectDocument = (document: DocumentResponseDto) => {
    setSelectedDocument(document);
    setError(null);
  };

  // Handle document selection from shared items
  const handleSelectSharedDocument = (document: DocumentResponseDto) => {
    setSelectedDocument(document);
    setError(null);
  };

  // Note: Breadcrumbs are built incrementally as we navigate into folders
  // This provides the most reliable way to track navigation since we have folder IDs

  // Fetch shared folders and documents
  const fetchSharedData = useCallback(async () => {
    setSharedLoading(true);
    try {
      let response: FolderRepoResDto;
      
      if (sharedCurrentFolderId !== null) {
        // Fetch folder contents
        response = await notificationApiClient.getFolder(sharedCurrentFolderId, {
          page: sharedCurrentPage,
          size: sharedPageSize,
          showFolder: true,
          name: sharedDebouncedQuery || undefined,
          sort: SortFields.NAME,
          desc: false
        });
      } else {
        // Fetch root shared items
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
    } catch (err: any) {
      console.error('Error fetching shared data:', err);
      setError('Failed to load shared items');
    } finally {
      setSharedLoading(false);
    }
  }, [sharedCurrentPage, sharedDebouncedQuery, sharedCurrentFolderId, sharedPageSize]);

  // Debounce shared search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSharedDebouncedQuery(sharedSearchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [sharedSearchQuery]);

  // Reset to page 0 when debounced search query changes
  useEffect(() => {
    setSharedCurrentPage(0);
  }, [sharedDebouncedQuery]);

  // Fetch shared data when tab is active, query changes, page changes, or folder changes
  useEffect(() => {
    if (activeTab === 'shared' && isOpen) {
      fetchSharedData();
    }
  }, [activeTab, isOpen, sharedDebouncedQuery, sharedCurrentPage, sharedCurrentFolderId, fetchSharedData]);

  // Navigate to folder
  const navigateToSharedFolder = (folderId: number, folderName: string) => {
    setSharedCurrentFolderId(folderId);
    setSharedBreadcrumbs(prev => [...prev, { id: folderId, name: folderName }]);
    setSharedCurrentPage(0); // Reset to first page when navigating
  };

  // Navigate back in breadcrumbs
  const navigateSharedBreadcrumb = (folderId: number | null, breadcrumbIndex?: number) => {
    if (folderId === null) {
      // Go to root (Shared)
      setSharedCurrentFolderId(null);
      setSharedBreadcrumbs([]);
    } else {
      // Navigate to the clicked breadcrumb
      // If breadcrumbIndex is provided, use it directly
      if (breadcrumbIndex !== undefined) {
        setSharedCurrentFolderId(folderId);
        setSharedBreadcrumbs(prev => prev.slice(0, breadcrumbIndex + 1));
      } else {
        // Find the index of this folder in breadcrumbs
        const index = sharedBreadcrumbs.findIndex(b => b.id === folderId);
        if (index !== -1) {
          setSharedCurrentFolderId(folderId);
          setSharedBreadcrumbs(prev => prev.slice(0, index + 1));
        }
      }
    }
    setSharedCurrentPage(0); // Reset to first page when navigating
  };

  // Combine folders and documents for shared items
  const sharedTableItems = useMemo(() => {
    if (!sharedData) return [];
    
    const folderItems: TableItem[] = (sharedData.folders || []).map(folder => ({
      ...folder,
      type: 'folder' as const
    }));
    
    const documentItems: TableItem[] = (sharedData.documents || []).map(doc => ({
      ...doc,
      type: 'document' as const
    }));
    
    return [...folderItems, ...documentItems];
  }, [sharedData]);

  // Use API results directly (no local filtering since we're doing server-side search)
  const filteredSharedItems = sharedTableItems;

  // Get pagination info
  const sharedTotalElements = sharedData?.totalElements || 0;
  const sharedTotalPages = sharedData?.totalPages || 1;

  const handleLink = async () => {
    if (!selectedDocument) {
      setError('Please select a document to link');
      return;
    }

    setIsLinking(true);
    setError(null);

    try {
      const linkRequest: DocumentLinkRequestDto = {
        sourceDocumentId: sourceDocumentId,
        targetDocumentId: selectedDocument.documentId,
        linkType: linkType,
        description: description.trim() || undefined
      };

      await linkRuleService.createDocumentLink(linkRequest);
      onLinkCreated();
      handleClose();
    } catch (error) {
      console.error('Error creating link:', error);
      setError('Failed to create link. Please try again.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleClose = () => {
    if (!isLinking) {
      setSelectedDocument(null);
      setLinkType('related');
      setDescription('');
      setError(null);
      setActiveTab('folders');
      setSharedSearchQuery('');
      setSharedDebouncedQuery('');
      setSharedCurrentPage(0);
      setSharedCurrentFolderId(null);
      setSharedBreadcrumbs([]);
      setSharedData(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Link className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create Manual Link</h2>
              <p className="text-sm text-gray-500">Link "{sourceDocumentName}" to another document</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLinking}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Tab Selection */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('folders')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'folders'
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
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'shared'
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Document from Folders
              </label>
              <FolderNavigationPicker
                excludeDocumentId={sourceDocumentId}
                onSelectDocument={handleSelectDocument}
                selectedDocument={selectedDocument}
              />
            </div>
          ) : (
            <div className="flex flex-col h-[500px] border rounded-lg overflow-hidden">
              {/* Search Bar */}
              <div className="p-3 border-b bg-gray-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    value={sharedSearchQuery}
                    onChange={(e) => setSharedSearchQuery(e.target.value)}
                    placeholder="Search shared folders and documents..."
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Breadcrumb Navigation - Always show when in a folder */}
              <div className="p-3 border-b bg-white flex items-center gap-2 text-sm overflow-x-auto">
                <button
                  onClick={() => navigateSharedBreadcrumb(null)}
                  className={`flex items-center gap-1 px-2 py-1 rounded transition-colors flex-shrink-0 ${
                    sharedCurrentFolderId === null 
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
                      className={`px-2 py-1 rounded transition-colors truncate max-w-[150px] ${
                        index === sharedBreadcrumbs.length - 1 && sharedCurrentFolderId === crumb.id
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

              {/* Shared Items List */}
              <div className="flex-1 overflow-y-auto bg-white">
                {sharedLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Loading shared items...</p>
                    </div>
                  </div>
                ) : filteredSharedItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Share2 className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">No shared items found</h3>
                    <p className="text-xs text-gray-500">
                      {sharedSearchQuery 
                        ? `No items match "${sharedSearchQuery}"`
                        : sharedCurrentFolderId !== null
                          ? 'This folder is empty'
                          : 'No folders or documents have been shared with you yet'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredSharedItems.map((item) => {
                      const isDocument = item.type === 'document';
                      const isFolder = item.type === 'folder';
                      const excluded = isDocument && item.documentId === sourceDocumentId;
                      const selected = isDocument && selectedDocument?.documentId === item.documentId;
                      
                      if (isFolder) {
                        return (
                          <button
                            key={`folder-${item.id}`}
                            onClick={() => navigateToSharedFolder(item.id, item.name)}
                            className="w-full p-3 hover:bg-gray-50 transition-colors flex items-center gap-3 text-left group"
                          >
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                              <Folder className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{item.name}</div>
                              {item.description && (
                                <div className="text-sm text-gray-500 truncate">{item.description}</div>
                              )}
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                <span>Folder • {formatFileSize(item.size || 0)}</span>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                          </button>
                        );
                      }

                      return (
                        <button
                          key={`doc-${item.documentId}`}
                          onClick={() => !excluded && handleSelectSharedDocument(item)}
                          disabled={excluded}
                          className={`w-full p-3 transition-colors flex items-center gap-3 text-left
                            ${excluded 
                              ? 'opacity-50 cursor-not-allowed bg-gray-100' 
                              : selected
                                ? 'bg-blue-50 border-l-4 border-blue-500'
                                : 'hover:bg-gray-50'
                            }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                            ${excluded 
                              ? 'bg-gray-200' 
                              : selected 
                                ? 'bg-blue-100' 
                                : 'bg-green-50'
                            }`}>
                            <FileText className={`h-5 w-5 ${excluded ? 'text-gray-400' : selected ? 'text-blue-600' : 'text-green-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-gray-900 truncate">{item.name}</div>
                              {excluded && (
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded flex-shrink-0">
                                  Current Doc
                                </span>
                              )}
                              {selected && !excluded && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex-shrink-0">
                                  Selected
                                </span>
                              )}
                            </div>
                            {item.title && item.title !== item.name && (
                              <div className="text-sm text-gray-600 truncate">{item.title}</div>
                            )}
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                              <span>{formatFileSize(item.sizeBytes || 0)}</span>
                              {item.ownedBy && (
                                <span className="text-gray-600">
                                  by {item.ownedBy.firstName} {item.ownedBy.lastName}
                                </span>
                              )}
                              <span className="bg-gray-100 px-2 py-0.5 rounded">{item.mimeType}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {sharedTotalPages > 1 && (
                <div className="p-3 border-t bg-gray-50">
                  <Pagination
                    currentPage={sharedCurrentPage}
                    totalPages={sharedTotalPages}
                    totalElements={sharedTotalElements}
                    pageSize={sharedPageSize}
                    onPageChange={setSharedCurrentPage}
                  />
                </div>
              )}
            </div>
          )}

          {/* Link Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link Type
            </label>
            <Select value={linkType} onValueChange={setLinkType} disabled={isLinking}>
              <SelectTrigger>
                <SelectValue placeholder="Select link type" />
              </SelectTrigger>
              <SelectContent>
                {LINK_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the relationship between these documents..."
              disabled={isLinking}
            />
          </div>

          {/* Selected Document Summary */}
          {selectedDocument && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Selected Document</h4>
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900">{selectedDocument.name}</p>
                  {selectedDocument.title && selectedDocument.title !== selectedDocument.name && (
                    <p className="text-sm text-blue-700">{selectedDocument.title}</p>
                  )}
                   <div className="flex items-center gap-4 text-xs text-blue-600 mt-1">
                     <span>{formatFileSize(selectedDocument.sizeBytes)}</span>
                     <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                       {selectedDocument.mimeType}
                     </span>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t bg-gray-50 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLinking}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleLink}
            disabled={!selectedDocument || isLinking}
            className="flex-1"
          >
            {isLinking ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Link...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Create Link
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
