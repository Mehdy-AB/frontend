import React from 'react';
import { FolderOpen, Star, Edit, Upload, Plus, Calendar, HardDrive, Share2, MoreVertical, MessageSquare, History as HistoryIcon, Download, Folder as FolderIcon, Trash2, FileText } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import UserAvatar from '@/components/main/UserAvatar';
import { FolderResDto, FolderRepoResDto } from '@/types/api';

interface FolderHeaderProps {
  folder: FolderResDto;
  data: FolderRepoResDto | null;
  isFolderFavorite: boolean;
  isLoadingFavorite: boolean;
  onToggleFavorite: () => void;
  onEditPermissions: () => void;
  onUpload: () => void;
  onCreateFolder: () => void;
  onShowComments: () => void;
  onShowActivity: () => void;
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
  isLoading?: boolean;
  onRename?: () => void;
  onMove?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onChangeDescription?: () => void;
}

export function FolderHeader({
  folder,
  data,
  isFolderFavorite,
  isLoadingFavorite,
  onToggleFavorite,
  onEditPermissions,
  onUpload,
  onCreateFolder,
  onShowComments,
  onShowActivity,
  formatFileSize,
  formatDate,
  isLoading = false,
  onRename,
  onMove,
  onDelete,
  onDownload,
  onChangeDescription,
}: FolderHeaderProps) {
  // Combine ACL permissions with workspace policy constraints
  const wsCtx = folder.workspaceContext;
  const canUpload = (folder.userPermissions?.canUpload ?? true) && (wsCtx?.canUploadDocuments ?? true);
  const canCreateSub = (folder.userPermissions?.canCreateSubFolders ?? true) && (wsCtx?.canCreateFolders ?? true);
  const canEdit = (folder.userPermissions?.canEdit ?? true) && (wsCtx?.canEditFolders ?? true);
  const canMove = (folder.userPermissions?.canEdit ?? true) && (wsCtx?.canMoveDocumentsOrFolders ?? true);
  const canExport = wsCtx?.exportFolderEnabled ?? true;
  const canShareAcl = (folder.userPermissions?.canManagePermissions ?? true) && (wsCtx?.aclSharingAllowed ?? true);

  // Helper to build tooltip messages
  const getDisabledReason = (aclOk: boolean, policyOk: boolean, aclMsg: string, policyMsg: string) => {
    if (!policyOk) return policyMsg;
    if (!aclOk) return aclMsg;
    return '';
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6 py-6">
        <div className="flex items-start gap-6">
          {/* Left: Big Blue Icon */}
          <div className="shrink-0">
            <FolderOpen className="h-16 w-16 text-blue-400" />
          </div>

          {/* Right: Content Column */}
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            {/* Row 1: Name and Actions */}
            <div className="flex items-start justify-between w-full">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{folder.name}</h1>
                <button
                  onClick={onToggleFavorite}
                  disabled={isLoadingFavorite}
                  className={isLoadingFavorite ? 'opacity-50 cursor-not-allowed' : ''}
                  title={isFolderFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star
                    className={`h-6 w-6 ${isFolderFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
                  />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onUpload}
                      disabled={!canUpload}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${canUpload ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                    >
                      <Upload className="h-4 w-4" />
                      Upload
                    </button>
                  </TooltipTrigger>
                  {!canUpload && (
                    <TooltipContent>
                      <p>{!(wsCtx?.canUploadDocuments ?? true) ? 'Uploading is disabled by workspace policy' : "You don't have permission to upload documents"}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onCreateFolder}
                      disabled={!canCreateSub}
                      className={`flex items-center gap-2 border px-3 py-2 rounded-md text-sm font-medium transition-colors ${canCreateSub ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'}`}
                    >
                      <Plus className="h-4 w-4" />
                      New Folder
                    </button>
                  </TooltipTrigger>
                  {!canCreateSub && (
                    <TooltipContent>
                      <p>{!(wsCtx?.canCreateFolders ?? true) ? 'Creating folders is disabled by workspace policy' : "You don't have permission to create subfolders"}</p>
                    </TooltipContent>
                  )}
                </Tooltip>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 border border-gray-300 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      <MoreVertical className="h-4 w-4" />
                      More
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={onShowComments} className="cursor-pointer">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Comments
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onShowActivity} className="cursor-pointer">
                      <HistoryIcon className="h-4 w-4 mr-2" />
                      Activity
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onEditPermissions}
                      disabled={!canShareAcl}
                      className={`cursor-pointer ${!canShareAcl ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Permissions
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {onChangeDescription && (
                      <DropdownMenuItem onClick={onChangeDescription} className="cursor-pointer">
                        <FileText className="h-4 w-4 mr-2" />
                        Change Description
                      </DropdownMenuItem>
                    )}

                    {onRename && (
                      <DropdownMenuItem
                        onClick={onRename}
                        disabled={!canEdit}
                        className="cursor-pointer"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                    )}

                    {onMove && (
                      <DropdownMenuItem
                        onClick={onMove}
                        disabled={!canMove}
                        className="cursor-pointer"
                      >
                        <FolderIcon className="h-4 w-4 mr-2" />
                        Move
                      </DropdownMenuItem>
                    )}

                    {onDownload && (
                      <DropdownMenuItem onClick={onDownload} className="cursor-pointer">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                    )}

                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={onDelete}
                          disabled={!folder.userPermissions?.canDelete}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Move to Trash
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Row 2: Description */}
            {folder.description && (
              <p className="text-gray-500 text-base">{folder.description}</p>
            )}

            {/* Row 3: Meta Info (User, Size, Date) */}
            <div className="flex items-center gap-6 mt-1 text-sm text-gray-500">
              {/* User Info */}
              <div className="flex items-center gap-3">
                <UserAvatar user={folder.ownedBy} size="sm" />
                <div className="flex flex-col leading-tight">
                  <span className="font-medium text-gray-900">{folder.ownedBy.firstName} {folder.ownedBy.lastName}</span>
                  <span className="text-xs text-gray-400">{folder.ownedBy.email}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-8 w-px bg-gray-200" />

              {/* Size */}
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-gray-400" />
                <span>{formatFileSize(folder.size)}</span>
              </div>

              {/* Divider */}
              <div className="h-8 w-px bg-gray-200" />

              {/* Date */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{formatDate(folder.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
