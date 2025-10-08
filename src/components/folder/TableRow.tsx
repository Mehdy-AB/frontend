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
import { ItemMenu } from './ItemMenu';

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
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
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
  openDropdownId, 
  setOpenDropdownId 
}: TableRowProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemId = item.type === 'folder' ? `folder-${item.id}` : `document-${item.documentId}`;
  const showMenu = openDropdownId === itemId;
  const isFolder = item.type === 'folder';
  const size = isFolder ? item.size : item.sizeBytes;
  const updatedAt = isFolder ? item.updatedAt : item.updatedAt;

  return (
    <tr className="border-b border-ui last:border-b-0 hover:bg-neutral-background group">
      <td className="p-4">
        {isFolder ? (
          <Link href={`/folders/${item.id}`} className="flex cursor-pointer group items-center gap-3">
            <div className="h-10 w-10 bg-primary-light rounded-lg flex items-center justify-center">
              <Folder className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-medium text-neutral-text-dark group-hover:underline group-hover:text-primary">{item.name}</div>
              <div className="text-sm text-neutral-text-light group-hover:underline group-hover:text-primary">{item.description}</div>
            </div>
          </Link>
        ) : (
          <Link href={`/documents/${item.documentId}`} className="flex cursor-pointer group items-center gap-3">
            <div className="h-10 w-10 bg-primary-light rounded-lg flex items-center justify-center">
              <File className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-medium text-neutral-text-dark group-hover:underline group-hover:text-primary">{item.name}</div>
              <div className="text-sm text-neutral-text-light group-hover:underline group-hover:text-primary">
                {item.mimeType.split('/')[1].toUpperCase()} • v{item.versionNumber}
              </div>
            </div>
          </Link>
        )}
      </td>
      <td className="p-4">
        <div className="text-sm text-neutral-text-dark">{item.ownedBy.firstName} {item.ownedBy.lastName}</div>
      </td>
      <td className="p-4">
        <div className="text-sm text-neutral-text-light">{formatFileSize(size)}</div>
      </td>
      <td className="p-4">
        <div className="text-sm text-neutral-text-light">{formatDate(updatedAt)}</div>
      </td>
      <td className="p-4">
        <div className="text-sm text-neutral-text-light">
          {isFolder ? '-' : `v${item.versionNumber}`}
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1">
          {item.isPublic ? (
            <>
              <Globe className="h-4 w-4 text-success" />
              <span className="text-sm text-neutral-text-light">Public</span>
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 text-neutral-text-light" />
              <span className="text-sm text-neutral-text-light">Private</span>
            </>
          )}
        </div>
      </td>
      <td className="p-4">
        <div className="relative" style={{ zIndex: 10 }}>
          <button 
            ref={buttonRef}
            onClick={() => setOpenDropdownId(showMenu ? null : itemId)}
            className="p-1 item-menu-dropdown rounded hover:bg-ui cu transition-opacity"
          >
            <MoreVertical className="h-4 w-4 text-neutral-text-light" />
          </button>
          
          {showMenu && (
            <ItemMenu 
              item={item} 
              onEditPermissions={onEditPermissions}
              onEditFolderPermissions={onEditFolderPermissions}
              onMove={onMove}
              onRename={onRename}
              onDelete={onDelete}
              onShowComments={onShowComments}
              onClose={() => setOpenDropdownId(null)}
              buttonRef={buttonRef}
            />
          )}
        </div>
      </td>
    </tr>
  );
}
