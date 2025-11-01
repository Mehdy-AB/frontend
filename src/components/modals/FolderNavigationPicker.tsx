'use client';

import { useState, useEffect } from 'react';
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
import { FolderResDto, DocumentResponseDto } from '@/types/api';
import { formatFileSize, formatDate } from '@/utils/documentUtils';
import { Input } from '../ui/input';

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
  const [folders, setFolders] = useState<FolderResDto[]>([]);
  const [documents, setDocuments] = useState<DocumentResponseDto[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load root folders on mount
  useEffect(() => {
    loadRootFolders();
  }, []);

  // Load folders and documents when currentFolderId changes
  useEffect(() => {
    if (currentFolderId !== null) {
      loadFolderContents(currentFolderId);
    }
  }, [currentFolderId]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentFolderId !== null) {
        loadFolderContents(currentFolderId);
      } else {
        loadRootFolders();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadRootFolders = async () => {
    try {
      setLoading(true);
      const response = await notificationApiClient.getRepository({
        page: 0,
        size: 100,
        name: searchQuery || undefined
      });
      setFolders(response.content);
      setDocuments([]);
      setBreadcrumbs([]);
    } catch (error) {
      console.error('Error loading root folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFolderContents = async (folderId: number) => {
    try {
      setLoading(true);
      const response = await notificationApiClient.getFolder(folderId, {
        page: 0,
        size: 100,
        showFolder: true,
        name: searchQuery || undefined
      });
      
      setFolders(response.folders || []);
      setDocuments(response.documents || []);
      
      // Build breadcrumbs from folder path
      if (response.folder) {
        const pathSegments = response.folder.path.split('/').filter(Boolean);
        const newBreadcrumbs: BreadcrumbItem[] = [
          { id: response.folder.id, name: response.folder.name }
        ];
        setBreadcrumbs(newBreadcrumbs);
      }
    } catch (error) {
      console.error('Error loading folder contents:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = (folderId: number | null) => {
    if (folderId === null) {
      // Go to root
      setCurrentFolderId(null);
      loadRootFolders();
    } else {
      setCurrentFolderId(folderId);
    }
  };

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
          onClick={() => navigateToFolder(null)}
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <Home className="h-4 w-4" />
          <span className="font-medium">Root</span>
        </button>
        
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.id} className="flex items-center gap-2 flex-shrink-0">
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <button
              onClick={() => navigateToFolder(crumb.id)}
              className="px-2 py-1 rounded hover:bg-gray-100 transition-colors truncate max-w-[150px]"
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
                onClick={() => navigateToFolder(folder.id)}
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
                      <span>{formatDate(document.uploadedAt)}</span>
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
                  {searchQuery 
                    ? `No folders or documents match "${searchQuery}"`
                    : 'This folder is empty'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

