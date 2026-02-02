import React, { useRef } from 'react';
import Link from 'next/link';
import {
  Folder,
  File,
  MoreVertical,
  Lock,
  Globe
} from 'lucide-react';
import { DocumentResponseDto, FolderResDto } from '@/types/api';
import { TableActionMenu } from './TableActionMenu';
import DocumentWorkflowBadge from './DocumentWorkflowBadge';
import UserAvatar from '@/components/main/UserAvatar';

// Unified interface for table items
type TableItem = (FolderResDto & { type: 'folder' }) | (DocumentResponseDto & { type: 'document' });

interface TableRowProps {
  item: TableItem;
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
  currentFolderId: number;
  onEditPermissions?: (document: DocumentResponseDto) => void;
  onEditFolderPermissions?: (folder: FolderResDto) => void;
  onMove?: (item: TableItem) => void;
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
  showOwner?: boolean;
}

export function TableRow({
  item,
  formatFileSize,
  formatDate,
  currentFolderId,
  onEditPermissions,
  onEditFolderPermissions,
  onMove,
  onRename,
  onDelete,
  onShowComments,
  onDownload,
  onShare,
  onCopyLink,
  onView,
  onChangeDescription,
  showOwner = true,
  // openDropdownId and setOpenDropdownId are no longer needed for this row's menu
  // but kept in props if UnifiedTableView passes them (though we can ignore them)
}: TableRowProps) {
  const isFolder = item.type === 'folder';
  const size = isFolder ? item.size : item.sizeBytes;
  const updatedAt = isFolder ? item.updatedAt : item.updatedAt;
  const createdAt = item.createdAt;
  const creator = item.createdBy;

  return (
    <tr className="border-b border-ui last:border-b-0 hover:bg-neutral-background group">
      <td className="p-4 max-w-[300px]">
        {isFolder ? (
          <Link href={`/folders/${item.id}`} className="flex cursor-pointer group items-center gap-3">
            <div className="relative h-10 w-10 bg-primary-light rounded-lg flex items-center justify-center shrink-0">
              <Folder className="h-5 w-5 text-primary" />
              <div className="absolute -bottom-1 -right-1 rounded-full p-0.5">
                {item.public ? (
                  <Globe className="h-3 w-3 text-success" />
                ) : (
                  <Lock className="h-3 w-3 text-neutral-text-light" />
                )}
              </div>
            </div>
            <div className="min-w-0">
              <div className="font-medium text-neutral-text-dark group-hover:underline group-hover:text-primary truncate">{item.name}</div>
              <div className="text-sm text-neutral-text-light group-hover:underline group-hover:text-primary truncate">{item.description}</div>
            </div>
          </Link>
        ) : (
          <Link href={`/documents/${item.documentId}`} className="flex cursor-pointer group items-center gap-3">
            <div className="relative h-10 w-10 bg-primary-light rounded-lg flex items-center justify-center shrink-0">
              <File className="h-5 w-5 text-primary" />
              <div className="absolute -bottom-1 -right-1 rounded-full p-0.5">
                {item.isPublic ? (
                  <Globe className="h-3 w-3 text-success" />
                ) : (
                  <Lock className="h-3 w-3 text-neutral-text-light" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-neutral-text-dark group-hover:underline group-hover:text-primary truncate">{item.name}</div>
              <div className="flex items-center gap-2 text-sm text-neutral-text-light group-hover:underline group-hover:text-primary">
                <span className="truncate">{item.mimeType.split('/')[1].toUpperCase()} • v{item.versionNumber}</span>
                <DocumentWorkflowBadge
                  documentId={item.documentId}
                  workflowInstance={item.workflowInstance}
                  compact
                />
              </div>
            </div>
          </Link>
        )}
      </td>
      {showOwner && (
        <td className="p-4">
          <div className="flex items-center gap-3">
            <UserAvatar user={item.ownedBy} size="sm" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-neutral-text-light">{item.ownedBy.firstName} {item.ownedBy.lastName}</span>
              <span className="text-xs text-neutral-text-light">{item.ownedBy.email}</span>
            </div>
          </div>
        </td>
      )}
      <td className="p-4">
        <div className="flex items-center gap-3">
          <UserAvatar user={creator} size="sm" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-neutral-text-light">{creator.firstName} {creator.lastName}</span>
            <span className="text-xs text-neutral-text-light">{creator.email}</span>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="text-sm text-neutral-text-light">{formatFileSize(size)}</div>
      </td>
      <td className="p-4">
        <div className="text-sm text-neutral-text-light">{formatDate(createdAt)}</div>
      </td>
      <td className="p-4">
        <div className="text-sm text-neutral-text-light">{formatDate(updatedAt)}</div>
      </td>
      <td className="p-4">
        <div className="relative" style={{ zIndex: 10 }}>
          <TableActionMenu
            item={item}
            onEditPermissions={onEditPermissions}
            onEditFolderPermissions={onEditFolderPermissions}
            onMove={onMove}
            onRename={onRename}
            onDelete={onDelete}
            onShowComments={onShowComments}
            onDownload={onDownload}
            onShare={onShare}
            onCopyLink={onCopyLink}
            onView={onView}
            onChangeDescription={onChangeDescription}
          />
        </div>
      </td>
    </tr>
  );
}
