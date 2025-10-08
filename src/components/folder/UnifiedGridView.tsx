import React from 'react';
import { FolderOpen } from 'lucide-react';
import { DocumentResponseDto, FolderResDto } from '@/types/api';
import { GridItem } from './GridItem';

// Unified interface for table items
type TableItem = (FolderResDto & { type: 'folder' }) | (DocumentResponseDto & { type: 'document' });

interface UnifiedGridViewProps {
  items: TableItem[];
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
  currentFolderId: number;
  onEditPermissions?: (document: DocumentResponseDto) => void;
  onEditFolderPermissions?: (folder: FolderResDto) => void;
  onMove?: (item: TableItem) => void;
  onRename?: (item: TableItem) => void;
  onDelete?: (item: TableItem) => void;
  onShowComments?: (item: TableItem) => void;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
  showLoadingRows?: boolean;
}

export function UnifiedGridView({ 
  items, 
  formatFileSize, 
  formatDate, 
  currentFolderId, 
  onEditPermissions, 
  onEditFolderPermissions, 
  onMove, 
  onRename, 
  onDelete, 
  onShowComments,
  openDropdownId, 
  setOpenDropdownId, 
  showLoadingRows = false 
}: UnifiedGridViewProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white">
        <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Empty Folder</h3>
        <p className="text-gray-500">This folder is empty. Upload a document or create a subfolder to get started.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <GridItem 
          key={item.type === 'folder' ? `folder-${item.id}` : `document-${item.documentId}`}
          item={item} 
          formatFileSize={formatFileSize} 
          formatDate={formatDate}
          currentFolderId={currentFolderId}
          onEditPermissions={onEditPermissions}
          onEditFolderPermissions={onEditFolderPermissions}
          onMove={onMove}
          onRename={onRename}
          onDelete={onDelete}
          onShowComments={onShowComments}
          openDropdownId={openDropdownId}
          setOpenDropdownId={setOpenDropdownId}
        />
      ))}
      {/* Loading skeleton cards */}
      {showLoadingRows && [...Array(4)].map((_, i) => (
        <div key={`loading-${i}`} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
          <div className="flex items-start justify-between mb-3">
            <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}
