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

interface GridItemProps {
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

export function GridItem({ 
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
}: GridItemProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemId = item.type === 'folder' ? `folder-${item.id}` : `document-${item.documentId}`;
  const showMenu = openDropdownId === itemId;
  const isFolder = item.type === 'folder';
  const size = isFolder ? item.size : item.sizeBytes;
  const updatedAt = isFolder ? item.updatedAt : item.updatedAt;

  const content = (
    <div className="bg-surface rounded-lg border border-ui p-4 hover:shadow-medium transition-all group cursor-pointer h-full">
      <div className="flex items-start justify-between mb-3">
        <div className="h-12 w-12 bg-primary-light rounded-lg flex items-center justify-center">
          {isFolder ? (
            <Folder className="h-6 w-6 text-primary" />
          ) : (
            <File className="h-6 w-6 text-primary" />
          )}
        </div>
        <div className="relative" style={{ zIndex: 10 }}>
          <button 
            ref={buttonRef}
            onClick={(e) => { e.preventDefault(); setOpenDropdownId(showMenu ? null : itemId); }}
            className="p-1 rounded hover:bg-neutral-background transition-opacity"
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
      </div>

      <h3 className="font-medium text-neutral-text-dark mb-1 truncate group-hover:underline group-hover:text-primary">{item.name}</h3>
      <p className="text-sm text-neutral-text-light mb-1 group-hover:underline group-hover:text-primary">
        {item.type === 'folder' ? item.description : `${item.mimeType.split('/')[1].toUpperCase()} • v${item.versionNumber}`}
      </p>
      {!isFolder && <p className="text-xs text-neutral-text-light mb-2 uppercase">
        {item.mimeType.split('/')[1] + ` • v${item.versionNumber}`}
      </p>}
      
      <div className="flex items-center justify-between text-xs text-neutral-text-light mb-2">
        <span>{formatFileSize(size)}</span>
        <div className="flex items-center gap-1">
          {item.isPublic ? (
            <Globe className="h-3 w-3 text-success" />
          ) : (
            <Lock className="h-3 w-3 text-neutral-text-light" />
          )}
        </div>
      </div>
      <div className="text-xs text-neutral-text-light">{formatDate(updatedAt)}</div>

      {/* Metadata Tags for documents */}
      {!isFolder && item.metadata && item.metadata.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {item.metadata.slice(0, 2).map((tag: string, index: number) => (
            <span key={index} className="px-2 py-1 bg-neutral-background text-xs text-neutral-text-light rounded">
              {tag}
            </span>
          ))}
          {item.metadata.length > 2 && (
            <span className="px-2 py-1 bg-neutral-background text-xs text-neutral-text-light rounded">
              +{item.metadata.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );

  return isFolder ? (
    <Link href={`/folders/${item.id}`} className='cursor-pointer group'>{content}</Link>
  ) : (
    <Link href={`/documents/${item.documentId}`} className='cursor-pointer group'>{content}</Link>
  );
}
