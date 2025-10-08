import React, { useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  MessageSquare, 
  Edit, 
  Folder, 
  Settings, 
  Trash2 
} from 'lucide-react';
import { DocumentResponseDto, FolderResDto } from '@/types/api';

type TableItem = (FolderResDto & { type: 'folder' }) | (DocumentResponseDto & { type: 'document' });

interface ItemMenuProps {
  item: TableItem;
  onEditPermissions?: (document: DocumentResponseDto) => void;
  onEditFolderPermissions?: (folder: FolderResDto) => void;
  onMove?: (item: TableItem) => void;
  onRename?: (item: TableItem) => void;
  onDelete?: (item: TableItem) => void;
  onShowComments?: (item: TableItem) => void;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}

export function ItemMenu({ 
  item, 
  onEditPermissions, 
  onEditFolderPermissions, 
  onMove, 
  onRename, 
  onDelete, 
  onShowComments,
  onClose, 
  buttonRef 
}: ItemMenuProps) {
  const isFolder = item.type === 'folder';
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  // useLayoutEffect runs *before* paint → no flicker
  useLayoutEffect(() => {
    const updatePosition = () => {
      if (buttonRef?.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const menuWidth = 192;
        setPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.right + window.scrollX - menuWidth,
        });
      }
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [buttonRef]);

  // Close on outside click
  useLayoutEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.item-menu-dropdown')) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const canRename = item.userPermissions?.canEdit;
  const canMove = item.userPermissions?.canEdit;
  const canDelete = item.userPermissions?.canDelete;
  const canManagePermissions = item.userPermissions?.canManagePermissions;

  // 💡 Don’t render until position is known
  if (!position) return null;

  const menuContent = (
    <div
      className="item-menu-dropdown absolute w-48 bg-white border border-gray-200 rounded-lg shadow-xl"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 9999,
      }}
    >
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onShowComments?.(item);
          onClose();
        }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
      >
        <MessageSquare className="h-4 w-4" />
        Comments
      </button>

      {canRename && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRename?.(item);
            onClose();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <Edit className="h-4 w-4" />
          Rename
        </button>
      )}

      {canMove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMove?.(item);
            onClose();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <Folder className="h-4 w-4" />
          Move
        </button>
      )}

      {isFolder && onEditFolderPermissions && canManagePermissions && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditFolderPermissions(item as FolderResDto);
            onClose();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <Settings className="h-4 w-4" />
          Edit Permissions
        </button>
      )}

      {!isFolder && onEditPermissions && canManagePermissions && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditPermissions(item as DocumentResponseDto);
            onClose();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <Settings className="h-4 w-4" />
          Edit Permissions
        </button>
      )}

      {canDelete && (
        <>
          <hr className="border-gray-200" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(item);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Move to Trash
          </button>
        </>
      )}
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(menuContent, document.body) : null;
}
