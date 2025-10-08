import React from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  User, 
  Calendar, 
  HardDrive, 
  Folder, 
  File 
} from 'lucide-react';
import { FolderResDto, FolderRepoResDto } from '@/types/api';

interface FolderPropertiesProps {
  folder: FolderResDto;
  data: FolderRepoResDto | null;
  isPropertiesExpanded: boolean;
  onToggleProperties: () => void;
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
  getProfileImage: (user: any, isCompany?: boolean) => string;
  getUserInitials: (user: any) => string;
  isLoading?: boolean;
}

export function FolderProperties({
  folder,
  data,
  isPropertiesExpanded,
  onToggleProperties,
  formatFileSize,
  formatDate,
  getProfileImage,
  getUserInitials,
  isLoading = false
}: FolderPropertiesProps) {
  return (
    <div>
      <button
        onClick={onToggleProperties}
        className="flex items-center gap-2 w-full text-left hover:bg-white p-2 rounded-md transition-colors"
      >
        <h3 className="text-sm font-semibold text-gray-900">Folder Details</h3>
        {isPropertiesExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500 ml-auto" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500 ml-auto" />
        )}
      </button>
      
      {isPropertiesExpanded && (
        <div className="mt-4 space-y-6">
          {isLoading ? (
            // Skeleton loading state
            <div className="space-y-6">
              {/* Owner & Creator Skeleton */}
              <div className="space-y-4">
                <div>
                  <div className="h-3 bg-gray-200 rounded w-12 mb-3 animate-pulse"></div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="h-3 bg-gray-200 rounded w-16 mb-3 animate-pulse"></div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics Skeleton */}
              <div>
                <div className="h-3 bg-gray-200 rounded w-16 mb-3 animate-pulse"></div>
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                      <div className="h-6 bg-gray-200 rounded w-12 mx-auto mb-2 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-8 mx-auto animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Actual content
            <>
              {/* Owner & Creator */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Owner</h4>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="relative">
                      <img
                        src={getProfileImage(folder.ownedBy)}
                        alt={`${folder.ownedBy.firstName} ${folder.ownedBy.lastName}`}
                        className="h-10 w-10 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm hidden">
                        {getUserInitials(folder.ownedBy)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {folder.ownedBy.firstName} {folder.ownedBy.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        @{folder.ownedBy.username}
                      </div>
                      {folder.ownedBy.jobTitle && folder.ownedBy.jobTitle.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          {folder.ownedBy.jobTitle.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Created By</h4>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="relative">
                      <img
                        src={getProfileImage(folder.createdBy)}
                        alt={`${folder.createdBy.firstName} ${folder.createdBy.lastName}`}
                        className="h-10 w-10 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm hidden">
                        {getUserInitials(folder.createdBy)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {folder.createdBy.firstName} {folder.createdBy.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        @{folder.createdBy.username}
                      </div>
                      {folder.createdBy.jobTitle && folder.createdBy.jobTitle.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          {folder.createdBy.jobTitle.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Statistics</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                    <div className="text-lg font-semibold text-gray-900">{formatFileSize(folder.size)}</div>
                    <div className="text-xs text-gray-500">Total Size</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                    <div className="text-lg font-semibold text-gray-900">{data?.folders.length || 0}</div>
                    <div className="text-xs text-gray-500">Folders</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                    <div className="text-lg font-semibold text-gray-900">{data?.documents.length || 0}</div>
                    <div className="text-xs text-gray-500">Documents</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                    <div className="text-lg font-semibold text-gray-900">{formatDate(folder.createdAt).split(',')[0]}</div>
                    <div className="text-xs text-gray-500">Created</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
