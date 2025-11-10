'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Folder, 
  FileText, 
  ChevronRight, 
  Home, 
  Loader2,
  FolderOpen,
  Search
} from 'lucide-react';
import { notificationApiClient } from '@/api/notificationClient';
import { FolderResDto, DocumentResponseDto, FolderRepoResDto } from '@/types/api';
import { formatFileSize, formatDate } from '@/utils/documentUtils';
import { Input } from '../ui/input';
import Pagination from '../main/Pagination';

interface FolderNavigationPickerProps {
  /** Document ID to exclude from selection (can't link to itself) */
  excludeDocumentId?: number;
  /** Callback when a document is selected */
  onSelectDocument: (document: DocumentResponseDto) => void;
  /** Currently selected document */
  selectedDocument?: DocumentResponseDto | null;
}

interface BreadcrumbItem {
  id: number;
  name: string;
}

export default function FolderNavigationPicker({
  excludeDocumentId,
  onSelectDocument,
  selectedDocument
}: FolderNavigationPickerProps) {
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [folderData, setFolderData] = useState<FolderRepoResDto | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const isNavigatingViaBreadcrumb = useRef(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 0 when search query changes
  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedSearchQuery]);

  // Load folder data
  const loadFolderData = useCallback(async () => {
    setLoading(true);
    try {
      let response: FolderRepoResDto;
      
      if (currentFolderId !== null) {
        // Fetch folder contents
        response = await notificationApiClient.getFolder(currentFolderId, {
          page: currentPage,
          size: pageSize,
          showFolder: true,
          name: debouncedSearchQuery || undefined
        });
      } else {
        // Fetch root repository
        const repoResponse = await notificationApiClient.getRepository({
          page: currentPage,
          size: pageSize,
          name: debouncedSearchQuery || undefined
        });
        // Convert PageResponse<FolderResDto> to FolderRepoResDto format
        response = {
          folder: undefined,
          folders: repoResponse.content || [],
          documents: [],
          pageable: {
            pageNumber: repoResponse.number ?? currentPage,
            pageSize: repoResponse.size ?? pageSize
          },
          totalElements: repoResponse.totalElements || 0,
          totalPages: repoResponse.totalPages || 0
        };
      }
      
      setFolderData(response);
      
      // Build breadcrumbs when in a folder
      if (currentFolderId !== null && response.folder) {
        const folderId = response.folder.id;
        const folderName = response.folder.name;
        
        // Update breadcrumbs
        setBreadcrumbs(prev => {
          // If we navigated via breadcrumb, breadcrumbs should already be set correctly
          // Just update the name if it changed
          if (isNavigatingViaBreadcrumb.current) {
            isNavigatingViaBreadcrumb.current = false; // Reset flag
            // Find the folder in breadcrumbs and update its name if needed
            const index = prev.findIndex(b => b.id === folderId);
            if (index !== -1 && prev[index].name !== folderName) {
              const updated = [...prev];
              updated[index] = { id: folderId, name: folderName };
              return updated;
            }
            return prev; // Breadcrumbs already set correctly
          }
          
          // Regular forward navigation - check if folder is already in breadcrumbs
          const existingIndex = prev.findIndex(b => b.id === folderId);
          
          if (existingIndex !== -1) {
            // Folder already in breadcrumbs (shouldn't happen in forward navigation, but handle it)
            return prev.slice(0, existingIndex + 1);
          } else {
            // New folder (navigated forward by clicking a folder)
            // Add it to breadcrumbs
            return [...prev, { id: folderId, name: folderName }];
          }
        });
      } else if (currentFolderId === null) {
        // At root, clear breadcrumbs
        setBreadcrumbs([]);
        isNavigatingViaBreadcrumb.current = false;
      }
    } catch (error) {
      console.error('Error loading folder data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, currentPage, pageSize, debouncedSearchQuery]);

  // Load data when dependencies change
  useEffect(() => {
    loadFolderData();
  }, [loadFolderData]);

  // Navigate to folder
  const navigateToFolder = (folderId: number | null, folderName?: string) => {
    if (folderId === null) {
      // Go to root
      setCurrentFolderId(null);
      setBreadcrumbs([]);
    } else {
      // Navigate into folder
      setCurrentFolderId(folderId);
      // Breadcrumb will be added in loadFolderData when we get the folder data
    }
    setCurrentPage(0); // Reset to first page when navigating
  };

  // Navigate back via breadcrumb
  const navigateBreadcrumb = (folderId: number | null, breadcrumbIndex?: number) => {
    if (folderId === null) {
      // Go to root
      setCurrentFolderId(null);
      setBreadcrumbs([]);
      isNavigatingViaBreadcrumb.current = false;
    } else {
      // Navigate to clicked breadcrumb
      isNavigatingViaBreadcrumb.current = true; // Set flag to indicate breadcrumb navigation
      setCurrentFolderId(folderId);
      // Trim breadcrumbs to the clicked index
      if (breadcrumbIndex !== undefined) {
        setBreadcrumbs(prev => prev.slice(0, breadcrumbIndex + 1));
      } else {
        // Find index and trim
        const index = breadcrumbs.findIndex(b => b.id === folderId);
        if (index !== -1) {
          setBreadcrumbs(prev => prev.slice(0, index + 1));
        }
      }
    }
    setCurrentPage(0); // Reset to first page when navigating
  };

  // Get folders and documents from folderData
  const folders = folderData?.folders || [];
  const documents = folderData?.documents || [];
  const totalElements = folderData?.totalElements || 0;
  const totalPages = folderData?.totalPages || 1;

  const handleDocumentClick = (document: DocumentResponseDto) => {
    // Don't allow selecting the excluded document
    if (excludeDocumentId && document.documentId === excludeDocumentId) {
      return;
    }
    onSelectDocument(document);
  };

  const isDocumentExcluded = (documentId: number) => {
    return excludeDocumentId === documentId;
  };

  const isDocumentSelected = (documentId: number) => {
    return selectedDocument?.documentId === documentId;
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-lg overflow-hidden">
      {/* Search Bar */}
      <div className="p-3 border-b bg-gray-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search folders and documents..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="p-3 border-b bg-white flex items-center gap-2 text-sm overflow-x-auto">
        <button
          onClick={() => navigateBreadcrumb(null)}
          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors flex-shrink-0 ${
            currentFolderId === null 
              ? 'font-medium text-blue-600' 
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <Home className="h-4 w-4" />
          <span>Root</span>
        </button>
        
        {breadcrumbs.map((crumb, index) => (
          <div key={`${crumb.id}-${index}`} className="flex items-center gap-2 flex-shrink-0">
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <button
              onClick={() => navigateBreadcrumb(crumb.id, index)}
              className={`px-2 py-1 rounded transition-colors truncate max-w-[150px] ${
                index === breadcrumbs.length - 1 && currentFolderId === crumb.id
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

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading...</p>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {/* Folders */}
            {folders.map((folder) => (
              <button
                key={`folder-${folder.id}`}
                onClick={() => navigateToFolder(folder.id, folder.name)}
                className="w-full p-3 hover:bg-gray-50 transition-colors flex items-center gap-3 text-left group"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <FolderOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{folder.name}</div>
                  {folder.description && (
                    <div className="text-sm text-gray-500 truncate">{folder.description}</div>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span>{formatFileSize(folder.size)}</span>
                    <span>{formatDate(folder.updatedAt)}</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
              </button>
            ))}

            {/* Documents */}
            {documents.map((document) => {
              const excluded = isDocumentExcluded(document.documentId);
              const selected = isDocumentSelected(document.documentId);
              
              return (
                <button
                  key={`doc-${document.documentId}`}
                  onClick={() => handleDocumentClick(document)}
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
                      <div className="font-medium text-gray-900 truncate">{document.name}</div>
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
                    {document.title && document.title !== document.name && (
                      <div className="text-sm text-gray-600 truncate">{document.title}</div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span>{formatFileSize(document.sizeBytes)}</span>
                      <span>{formatDate(document.createdAt || document.updatedAt)}</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded">{document.mimeType}</span>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Empty State */}
            {!loading && folders.length === 0 && documents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FolderOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No items found</h3>
                <p className="text-xs text-gray-500">
                  {debouncedSearchQuery 
                    ? `No folders or documents match "${debouncedSearchQuery}"`
                    : 'This folder is empty'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-3 border-t bg-gray-50">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}

