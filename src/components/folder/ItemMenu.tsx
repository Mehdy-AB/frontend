import React, { useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageSquare,
  Edit,
  Folder,
  Settings,
  Trash2,
  Download,
  Share2,
  Eye,
  Copy,
  Globe
} from 'lucide-react';
import { DocumentResponseDto, FolderResDto } from '@/types/api';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type TableItem = (FolderResDto & { type: 'folder' }) | (DocumentResponseDto & { type: 'document' });

interface ItemMenuProps {
  item: TableItem;
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
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}

export function ItemMenu({
  item,
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
  const canView = item.userPermissions?.canView;
  const canShare = isFolder ? (item.userPermissions as any)?.canShare : false;

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
      {!isFolder && onView && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (canView) {
                  onView(item);
                  onClose();
                }
              }}
              disabled={!canView}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${canView
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-gray-400 cursor-not-allowed'
                }`}
            >
              <Eye className="h-4 w-4" />
              View
            </button>
          </TooltipTrigger>
          {!canView && (
            <TooltipContent>
              <p>You don't have permission to view this document</p>
            </TooltipContent>
          )}
        </Tooltip>
      )}

      {onDownload && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (canView) {
                  onDownload(item);
                  onClose();
                }
              }}
              disabled={!canView}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${canView
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-gray-400 cursor-not-allowed'
                }`}
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </TooltipTrigger>
          {!canView && (
            <TooltipContent>
              <p>You don't have permission to download this item</p>
            </TooltipContent>
          )}
        </Tooltip>
      )}

      {onShare && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (canShare) {
                  onShare(item);
                  onClose();
                }
              }}
              disabled={!canShare}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${canShare
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-gray-400 cursor-not-allowed'
                }`}
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </TooltipTrigger>
          {!canShare && (
            <TooltipContent>
              <p>You don't have permission to share this item</p>
            </TooltipContent>
          )}
        </Tooltip>
      )}

      {onCopyLink && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCopyLink(item);
            onClose();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <Copy className="h-4 w-4" />
          Copy Link
        </button>
      )}

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

      {onRename && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (canRename) {
                  onRename(item);
                  onClose();
                }
              }}
              disabled={!canRename}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${canRename
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-gray-400 cursor-not-allowed'
                }`}
            >
              <Edit className="h-4 w-4" />
              Rename
            </button>
          </TooltipTrigger>
          {!canRename && (
            <TooltipContent>
              <p>You don't have permission to edit this item</p>
            </TooltipContent>
          )}
        </Tooltip>
      )}

      {onMove && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (canMove) {
                  onMove(item);
                  onClose();
                }
              }}
              disabled={!canMove}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${canMove
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-gray-400 cursor-not-allowed'
                }`}
            >
              <Folder className="h-4 w-4" />
              Move
            </button>
          </TooltipTrigger>
          {!canMove && (
            <TooltipContent>
              <p>You don't have permission to move this item</p>
            </TooltipContent>
          )}
        </Tooltip>
      )}

      {onMoveToWorkspace && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (canMove) {
                  onMoveToWorkspace(item);
                  onClose();
                }
              }}
              disabled={!canMove}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${canMove
                ? 'text-blue-600 hover:bg-blue-50'
                : 'text-gray-400 cursor-not-allowed'
                }`}
            >
              <Globe className="h-4 w-4" />
              Move to Workspace
            </button>
          </TooltipTrigger>
          {!canMove && (
            <TooltipContent>
              <p>You don't have permission to move this item</p>
            </TooltipContent>
          )}
        </Tooltip>
      )}

      {isFolder && onEditFolderPermissions && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (canManagePermissions) {
                  onEditFolderPermissions(item as FolderResDto);
                  onClose();
                }
              }}
              disabled={!canManagePermissions}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${canManagePermissions
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-gray-400 cursor-not-allowed'
                }`}
            >
              <Settings className="h-4 w-4" />
              Edit Permissions
            </button>
          </TooltipTrigger>
          {!canManagePermissions && (
            <TooltipContent>
              <p>You don't have permission to manage permissions for this folder</p>
            </TooltipContent>
          )}
        </Tooltip>
      )}

      {!isFolder && onEditPermissions && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (canManagePermissions) {
                  onEditPermissions(item as DocumentResponseDto);
                  onClose();
                }
              }}
              disabled={!canManagePermissions}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${canManagePermissions
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-gray-400 cursor-not-allowed'
                }`}
            >
              <Settings className="h-4 w-4" />
              Edit Permissions
            </button>
          </TooltipTrigger>
          {!canManagePermissions && (
            <TooltipContent>
              <p>You don't have permission to manage permissions for this document</p>
            </TooltipContent>
          )}
        </Tooltip>
      )}

      {onDelete && (
        <>
          <hr className="border-gray-200" />
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (canDelete) {
                    onDelete(item);
                    onClose();
                  }
                }}
                disabled={!canDelete}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${canDelete
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-gray-400 cursor-not-allowed'
                  }`}
              >
                <Trash2 className="h-4 w-4" />
                Move to Trash
              </button>
            </TooltipTrigger>
            {!canDelete && (
              <TooltipContent>
                <p>You don't have permission to delete this item</p>
              </TooltipContent>
            )}
          </Tooltip>
        </>
      )}
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(menuContent, document.body) : null;
}
