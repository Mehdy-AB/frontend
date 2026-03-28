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
  onMoveToWorkspace?: (item: TableItem) => void;
  onRename?: (item: TableItem) => void;
  onDelete?: (item: TableItem) => void;
  onShowComments?: (item: TableItem) => void;
  onDownload?: (item: TableItem) => void;
  onShare?: (item: TableItem) => void;
  onCopyLink?: (item: TableItem) => void;
  onView?: (item: TableItem) => void;
  onChangeDescription?: (item: TableItem) => void;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
  showLoadingRows?: boolean;
  showOwner?: boolean;
  // Selection props
  selectedItems?: Set<string>;
  onToggleSelect?: (key: string) => void;
  onSelectAll?: () => void;
}

function getItemKey(item: TableItem): string {
  return item.type === 'folder' ? `folder-${item.id}` : `document-${item.documentId}`;
}

export function UnifiedTableView({
  items,
  formatFileSize,
  formatDate,
  currentFolderId,
  onEditPermissions,
  onEditFolderPermissions,
  onMove,
  onMoveToWorkspace,
  onRename,
  onDelete,
  onShowComments,
  onDownload,
  onShare,
  onCopyLink,
  onView,
  onChangeDescription,
  openDropdownId,
  setOpenDropdownId,
  showLoadingRows = false,
  showOwner = true,
  selectedItems,
  onToggleSelect,
  onSelectAll,
}: UnifiedTableViewProps) {
  const selectionEnabled = !!selectedItems && !!onToggleSelect && !!onSelectAll;
  const allSelected = selectionEnabled && items.length > 0 && items.every(i => selectedItems!.has(getItemKey(i)));
  const someSelected = selectionEnabled && items.some(i => selectedItems!.has(getItemKey(i)));
  const isIndeterminate = someSelected && !allSelected;

  if (items.length === 0 && !showLoadingRows) {
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
            {selectionEnabled && (
              <th className="p-4 w-[48px]">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
                  onChange={onSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
              </th>
            )}
            <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide w-[300px]">Name</th>
            <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide w-[120px]">Placement</th>
            {showOwner && <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Owner</th>}
            <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Creator</th>
            <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Size</th>
            <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Created At</th>
            <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Last Modified</th>
            <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const key = getItemKey(item);
            return (
              <TableRow
                key={key}
                item={item}
                formatFileSize={formatFileSize}
                formatDate={formatDate}
                currentFolderId={currentFolderId}
                onEditPermissions={onEditPermissions}
                onEditFolderPermissions={onEditFolderPermissions}
                onMove={onMove}
                onMoveToWorkspace={onMoveToWorkspace}
                onRename={onRename}
                onDelete={onDelete}
                onShowComments={onShowComments}
                onDownload={onDownload}
                onShare={onShare}
                onCopyLink={onCopyLink}
                onView={onView}
                onChangeDescription={onChangeDescription}
                openDropdownId={openDropdownId}
                setOpenDropdownId={setOpenDropdownId}
                showOwner={showOwner}
                isSelected={selectionEnabled ? selectedItems!.has(key) : undefined}
                onToggleSelect={selectionEnabled ? () => onToggleSelect!(key) : undefined}
              />
            );
          })}
          {/* Loading skeleton rows */}
          {showLoadingRows && [...Array(3)].map((_, i) => (
            <tr key={`loading-${i}`} className="border-b border-ui last:border-b-0">
              {selectionEnabled && (
                <td className="p-4">
                  <div className="h-4 w-4 bg-neutral-ui rounded animate-pulse"></div>
                </td>
              )}
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
                <div className="h-4 bg-neutral-ui rounded w-16 animate-pulse"></div>
              </td>
              {showOwner && (
                <td className="p-4">
                  <div className="h-4 bg-neutral-ui rounded w-20 animate-pulse"></div>
                </td>
              )}
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
