import React from 'react';
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
    MoreVertical,
    FileText,
    Globe
} from 'lucide-react';
import { DocumentResponseDto, FolderResDto } from '@/types/api';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

// Unified interface for table items
type TableItem = (FolderResDto & { type: 'folder' }) | (DocumentResponseDto & { type: 'document' });

interface TableActionMenuProps {
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
    onChangeDescription?: (item: TableItem) => void;
}

export function TableActionMenu({
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
    onChangeDescription
}: TableActionMenuProps) {
    const isFolder = item.type === 'folder';

    // Get workspace context from the item (available on both folders and documents)
    const wsCtx = isFolder
        ? (item as FolderResDto).workspaceContext
        : (item as DocumentResponseDto).workspaceContext;

    // Combine ACL permissions with workspace policy constraints
    const canRename = (item.userPermissions?.canEdit ?? true)
        && (isFolder ? (wsCtx?.canEditFolders ?? true) : (wsCtx?.canEditDocuments ?? true));
    const canMove = (item.userPermissions?.canEdit ?? true)
        && (wsCtx?.canMoveDocumentsOrFolders ?? true);
    const canDelete = item.userPermissions?.canDelete;
    const canManagePermissions = (item.userPermissions?.canManagePermissions ?? true)
        && (wsCtx?.aclSharingAllowed ?? true);
    const canView = item.userPermissions?.canView;
    const canShare = isFolder ? (item.userPermissions as any)?.canShare : false;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                    <span className="sr-only">Open menu</span>
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {!isFolder && onView && (
                    <DropdownMenuItem
                        onClick={() => onView(item)}
                        disabled={!canView}
                        className="cursor-pointer"
                    >
                        <Eye className="mr-2 h-4 w-4" />
                        <span>View</span>
                    </DropdownMenuItem>
                )}

                {onDownload && (
                    <DropdownMenuItem
                        onClick={() => onDownload(item)}
                        disabled={!canView}
                        className="cursor-pointer"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        <span>Download</span>
                    </DropdownMenuItem>
                )}

                {onCopyLink && (
                    <DropdownMenuItem
                        onClick={() => onCopyLink(item)}
                        className="cursor-pointer"
                    >
                        <Copy className="mr-2 h-4 w-4" />
                        <span>Copy Link</span>
                    </DropdownMenuItem>
                )}

                {onShowComments && (
                    <DropdownMenuItem
                        onClick={() => onShowComments(item)}
                        className="cursor-pointer"
                    >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <span>Comments</span>
                    </DropdownMenuItem>
                )}

                {onChangeDescription && isFolder && (
                    <DropdownMenuItem
                        onClick={() => onChangeDescription(item)}
                        disabled={!canRename} // Assuming edit permission is needed for description too
                        className="cursor-pointer"
                    >
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Change Description</span>
                    </DropdownMenuItem>
                )}

                {onRename && (
                    <DropdownMenuItem
                        onClick={() => onRename(item)}
                        disabled={!canRename}
                        className="cursor-pointer"
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Rename</span>
                    </DropdownMenuItem>
                )}

                {onMove && (
                    <DropdownMenuItem
                        onClick={() => onMove(item)}
                        disabled={!canMove}
                        className="cursor-pointer"
                    >
                        <Folder className="mr-2 h-4 w-4" />
                        <span>Move</span>
                    </DropdownMenuItem>
                )}

                {onMoveToWorkspace && (
                    <DropdownMenuItem
                        onClick={() => onMoveToWorkspace(item)}
                        disabled={!canMove}
                        className="cursor-pointer"
                    >
                        <Globe className="mr-2 h-4 w-4" />
                        <span>Move to Workspace</span>
                    </DropdownMenuItem>
                )}

                {isFolder && onEditFolderPermissions && (
                    <DropdownMenuItem
                        onClick={() => onEditFolderPermissions(item as FolderResDto)}
                        disabled={!canManagePermissions}
                        className="cursor-pointer"
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Edit Permissions</span>
                    </DropdownMenuItem>
                )}

                {!isFolder && onEditPermissions && (
                    <DropdownMenuItem
                        onClick={() => onEditPermissions(item as DocumentResponseDto)}
                        disabled={!canManagePermissions}
                        className="cursor-pointer"
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Edit Permissions</span>
                    </DropdownMenuItem>
                )}

                {onDelete && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => onDelete(item)}
                            disabled={!canDelete}
                            className="cursor-pointer text-destructive focus:text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Move to Trash</span>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
