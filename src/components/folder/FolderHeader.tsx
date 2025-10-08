import React from 'react';
import { 
  FolderOpen, 
  Globe, 
  Lock, 
  Star, 
  Edit, 
  Upload, 
  Plus,
  User,
  Calendar,
  HardDrive,
  Folder,
  File
} from 'lucide-react';
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
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
  getProfileImage: (user: any, isCompany?: boolean) => string;
  getUserInitials: (user: any) => string;
  isLoading?: boolean;
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
  formatFileSize,
  formatDate,
  getProfileImage,
  getUserInitials,
  isLoading = false
}: FolderHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      {/* Main Header */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-gray-900">{folder.name}</h1>
                {folder.isPublic ? (
                  <Globe className="h-4 w-4 text-green-600" />
                ) : (
                  <Lock className="h-4 w-4 text-gray-400" />
                )}
                <button
                  onClick={onToggleFavorite}
                  disabled={isLoadingFavorite}
                  className={`ml-2 ${isLoadingFavorite ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isFolderFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star className={`h-4 w-4 ${isFolderFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`} />
                </button>
              </div>
              {folder.description && (
                <p className="text-sm text-gray-600 mt-1">{folder.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {folder.userPermissions?.canUpload && (
              <button 
                onClick={onUpload}
                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Upload className="h-4 w-4" />
                Upload
              </button>
            )}
            {folder.userPermissions?.canCreateSubFolders && (
              <button 
                onClick={onCreateFolder}
                className="flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                New Folder
              </button>
            )}
            {folder.userPermissions?.canManagePermissions && (
              <button 
                onClick={onEditPermissions}
                className="flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Edit className="h-4 w-4" />
                Permissions
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Properties Section - Compact */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        {isLoading ? (
          // Loading skeleton
          <div className="flex flex-wrap items-center gap-6 text-xs">
            {/* Owner Skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="space-y-1">
                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                <div className="h-2 bg-gray-200 rounded w-12 animate-pulse"></div>
              </div>
            </div>
            {/* Stats Skeleton */}
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-8 animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-6 text-xs">
            {/* Owner */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <img
                  src={getProfileImage(folder.ownedBy)}
                  alt={`${folder.ownedBy.firstName} ${folder.ownedBy.lastName}`}
                  className="h-6 w-6 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-xs hidden">
                  {getUserInitials(folder.ownedBy)}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-900">
                  {folder.ownedBy.firstName} {folder.ownedBy.lastName}
                </div>
                <div className="text-xs text-gray-500">Owner</div>
              </div>
            </div>

            {/* Creator */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <img
                  src={getProfileImage(folder.createdBy)}
                  alt={`${folder.createdBy.firstName} ${folder.createdBy.lastName}`}
                  className="h-6 w-6 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium text-xs hidden">
                  {getUserInitials(folder.createdBy)}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-900">
                  {folder.createdBy.firstName} {folder.createdBy.lastName}
                </div>
                <div className="text-xs text-gray-500">Created by</div>
              </div>
            </div>

            {/* Statistics with icons */}
            <div className="flex items-center gap-1">
              <HardDrive className="h-3 w-3 text-gray-400" />
              <span className="text-xs font-medium text-gray-900">{formatFileSize(folder.size)}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Folder className="h-3 w-3 text-gray-400" />
              <span className="text-xs font-medium text-gray-900">{data?.folders.length || 0}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <File className="h-3 w-3 text-gray-400" />
              <span className="text-xs font-medium text-gray-900">{data?.documents.length || 0}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span className="text-xs font-medium text-gray-900">Created: {formatDate(folder.createdAt).split(',')[0]}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span className="text-xs font-medium text-gray-900">Updated: {formatDate(folder.updatedAt).split(',')[0]}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
