import React from 'react';
import { FolderOpen } from 'lucide-react';
import { DocumentResponseDto, FolderResDto } from '@/types/api';
import { TableRow } from './TableRow';

// Unified interface for table items
type TableItem = (FolderResDto & { type: 'folder' }) | (DocumentResponseDto & { type: 'document' });

interface UnifiedTableViewProps {
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

export function UnifiedTableView({ 
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
}: UnifiedTableViewProps) {
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
    <div className="bg-white">
      <table className="w-full relative" style={{ zIndex: 1 }}>
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
            <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Owner</th>
            <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Size</th>
            <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Last Modified</th>
            <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Version</th>
            <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Visibility</th>
            <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <TableRow 
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
          {/* Loading skeleton rows */}
          {showLoadingRows && [...Array(3)].map((_, i) => (
            <tr key={`loading-${i}`} className="border-b border-ui last:border-b-0">
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-neutral-ui rounded-lg animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-neutral-ui rounded w-32 animate-pulse"></div>
                    <div className="h-3 bg-neutral-ui rounded w-24 animate-pulse"></div>
                  </div>
                </div>
              </td>
              <td className="p-4">
                <div className="h-4 bg-neutral-ui rounded w-20 animate-pulse"></div>
              </td>
              <td className="p-4">
                <div className="h-4 bg-neutral-ui rounded w-16 animate-pulse"></div>
              </td>
              <td className="p-4">
                <div className="h-4 bg-neutral-ui rounded w-20 animate-pulse"></div>
              </td>
              <td className="p-4">
                <div className="h-4 bg-neutral-ui rounded w-12 animate-pulse"></div>
              </td>
              <td className="p-4">
                <div className="h-4 bg-neutral-ui rounded w-16 animate-pulse"></div>
              </td>
              <td className="p-4">
                <div className="h-4 bg-neutral-ui rounded w-4 animate-pulse"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
