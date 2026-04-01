import React, { useState } from 'react';
import Link from 'next/link';
import {
  Folder,
  File,
  Lock,
  Globe,
  Link2,
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
  showOwner?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

/** Recursive child row for nested composed documents */
function ChildDocumentRow({
  child,
  depth,
  formatFileSize,
  formatDate,
  showOwner,
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
}: {
  child: DocumentResponseDto;
  depth: number;
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
  showOwner: boolean;
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
}) {
  const [showChildren, setShowChildren] = useState(false);
  const hasChildren = child.composedChildren && child.composedChildren.length > 0;
  const indent = 8 + depth * 8; // increasing indentation per level (pl-8, pl-16, pl-24, ...)

  return (
    <>
      <tr className="border-b border-ui last:border-b-0 hover:bg-primary/[0.03] bg-gray-50/50">
        {/* Name — indented with tree connector */}
        <td className="p-4 max-w-[300px]">
          <div style={{ paddingLeft: `${indent * 4}px` }} className="flex items-center gap-3">
            <div className="w-4 border-t border-l border-primary/20 h-5 -mt-5 shrink-0 rounded-bl-md"></div>
            <Link href={`/documents/${child.documentId}`} className="flex cursor-pointer items-center gap-3 flex-1 min-w-0 group/child">
              <div className="relative h-9 w-9 bg-primary-light/60 rounded-lg flex items-center justify-center shrink-0">
                <File className="h-4 w-4 text-primary" />
                <div className="absolute -bottom-0.5 -right-0.5 rounded-full p-0.5">
                  {child.isPublic ? (
                    <Globe className="h-2.5 w-2.5 text-success" />
                  ) : (
                    <Lock className="h-2.5 w-2.5 text-neutral-text-light" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-neutral-text-dark group-hover/child:underline group-hover/child:text-primary truncate">
                  {child.name}
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-text-light">
                  <span className="truncate">{child.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'} • v{child.versionNumber}</span>
                  {child.relationType && (
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium uppercase tracking-wide">
                      {child.relationType === 'PARENT_DOCUMENT' ? 'Child Document'
                        : child.relationType === 'CHILD_DOCUMENT' ? 'Parent Document'
                          : child.relationType.replace(/_/g, ' ')}
                    </span>
                  )}
                  {child.workflowInstance && (
                    <DocumentWorkflowBadge
                      documentId={child.documentId}
                      workflowInstance={child.workflowInstance}
                      compact
                    />
                  )}
                </div>
              </div>
            </Link>
          </div>
        </td>
        {/* Owner */}
        {showOwner && (
          <td className="p-4">
            {child.ownedBy && (
              <div className="flex items-center gap-3">
                <UserAvatar user={child.ownedBy} size="sm" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-neutral-text-light">{child.ownedBy.firstName} {child.ownedBy.lastName}</span>
                  <span className="text-xs text-neutral-text-light">{child.ownedBy.email}</span>
                </div>
              </div>
            )}
          </td>
        )}
        {/* Creator */}
        <td className="p-4">
          {child.createdBy && (
            <div className="flex items-center gap-3">
              <UserAvatar user={child.createdBy} size="sm" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-neutral-text-light">{child.createdBy.firstName} {child.createdBy.lastName}</span>
                <span className="text-xs text-neutral-text-light">{child.createdBy.email}</span>
              </div>
            </div>
          )}
        </td>
        {/* Size */}
        <td className="p-4">
          <div className="text-sm text-neutral-text-light">{formatFileSize(child.sizeBytes || 0)}</div>
        </td>
        {/* Created At */}
        <td className="p-4">
          <div className="text-sm text-neutral-text-light">{formatDate(child.createdAt)}</div>
        </td>
        {/* Last Modified */}
        <td className="p-4">
          <div className="text-sm text-neutral-text-light">{formatDate(child.updatedAt)}</div>
        </td>
        {/* Actions */}
        <td className="p-4">
          <div className="flex items-center gap-2">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowChildren(!showChildren);
                }}
                className={`flex items-center justify-center h-8 w-8 rounded-md transition-colors ${showChildren
                  ? 'bg-primary text-white'
                  : 'text-primary hover:bg-primary/10'
                  }`}
                title={showChildren ? 'Hide linked documents' : `Show ${child.composedChildren!.length} linked document(s)`}
              >
                <Link2 className="h-4 w-4" />
              </button>
            )}
            <div className="relative" style={{ zIndex: 10 }}>
              <TableActionMenu
                item={{ ...child, type: 'document' as const }}
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
          </div>
        </td>
      </tr>

      {/* Recursively render this child's children */}
      {hasChildren && showChildren && child.composedChildren!.map((grandchild) => (
        <ChildDocumentRow
          key={`child-${grandchild.documentId}`}
          child={grandchild}
          depth={depth + 1}
          formatFileSize={formatFileSize}
          formatDate={formatDate}
          showOwner={showOwner}
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
      ))}
    </>
  );
}

export function TableRow({
  item,
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
  showOwner = true,
  isSelected,
  onToggleSelect,
}: TableRowProps) {
  const isFolder = item.type === 'folder';
  const selectionEnabled = isSelected !== undefined && !!onToggleSelect;
  const size = isFolder ? item.size : item.sizeBytes;
  const updatedAt = isFolder ? item.updatedAt : item.updatedAt;
  const createdAt = item.createdAt;
  const creator = item.createdBy;

  const [showChildren, setShowChildren] = useState(false);
  const hasChildren = !isFolder && item.composedChildren && item.composedChildren.length > 0;

  return (
    <>
      <tr className={`border-b border-ui last:border-b-0 hover:bg-neutral-background group ${isSelected ? 'bg-blue-50/60' : ''}`}>
        {selectionEnabled && (
          <td className="p-4 w-[48px]">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => { e.stopPropagation(); onToggleSelect!(); }}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
          </td>
        )}
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
        {/* Placement Badge */}
        <td className="p-4">
          {(() => {
            const wsCtx = item.type === 'folder'
              ? (item as FolderResDto).workspaceContext
              : (item as DocumentResponseDto).workspaceContext;
            const path = item.path || '';
            const isWorkspace = !!wsCtx || path.startsWith('ws.');
            const isSecured = wsCtx?.workspaceType === 'SECURED';

            if (isWorkspace && isSecured) {
              return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  <Lock className="h-3 w-3" />Secured
                </span>
              );
            }
            if (isWorkspace) {
              return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800" title={wsCtx?.workspaceName || undefined}>
                  <Globe className="h-3 w-3" />{wsCtx?.workspaceName || 'Workspace'}
                </span>
              );
            }
            return (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                <Folder className="h-3 w-3" />Personal
              </span>
            );
          })()}
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
          <div className="flex items-center gap-2">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowChildren(!showChildren);
                }}
                className={`flex items-center justify-center h-8 w-8 rounded-md transition-colors ${showChildren
                  ? 'bg-primary text-white'
                  : 'text-primary hover:bg-primary/10'
                  }`}
                title={showChildren ? 'Hide linked documents' : `Show ${item.composedChildren!.length} linked document(s)`}
              >
                <Link2 className="h-4 w-4" />
              </button>
            )}
            <div className="relative" style={{ zIndex: 10 }}>
              <TableActionMenu
                item={item}
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
              />
            </div>
          </div>
        </td>
      </tr>

      {/* Composed children — recursive via ChildDocumentRow */}
      {hasChildren && showChildren && item.composedChildren!.map((child) => (
        <ChildDocumentRow
          key={`child-${child.documentId}`}
          child={child}
          depth={0}
          formatFileSize={formatFileSize}
          formatDate={formatDate}
          showOwner={showOwner}
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
      ))}
    </>
  );
}
