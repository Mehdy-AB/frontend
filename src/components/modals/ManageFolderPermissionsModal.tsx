'use client';

import { useState, useEffect } from 'react';
import { X, Users, Shield, User as UserIcon, Plus, Trash2, ChevronRight, ChevronDown, Settings } from 'lucide-react';
import { notificationApiClient } from '@/api/notificationClient';
import { FolderPermissionReq, UserDto, RoleDto, GroupDto } from '@/types/api';
import UserAvatar from '@/components/main/UserAvatar';
import ServerSearchInput from '@/components/main/ServerSearchInput';
import { useServerSideSearch } from '@/components/main/useServerSideSearch';
import SearchPagination from '@/components/search/SearchPagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ManageFolderPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: number;
  folderName?: string;
  onSuccess?: () => void;
}

type GranteeType = 'user' | 'group' | 'role';

interface CurrentPermission {
  id: string;
  type: GranteeType;
  entity: UserDto | GroupDto | RoleDto;
  permission: FolderPermissionReq;
  expanded?: boolean;
}

const PERMISSION_PRESETS = {
  viewer: {
    canView: true,
    canUpload: false,
    canEdit: false,
    canDelete: false,
    canShare: false,
    canManagePermissions: false,
    canCreateSubFolders: false,
    canEditDoc: false,
    canDeleteDoc: false,
    canShareDoc: false,
    canManagePermissionsDoc: false,
    inherits: true
  },
  contributor: {
    canView: true,
    canUpload: true,
    canEdit: false,
    canDelete: false,
    canShare: false,
    canManagePermissions: false,
    canCreateSubFolders: false,
    canEditDoc: false,
    canDeleteDoc: false,
    canShareDoc: false,
    canManagePermissionsDoc: false,
    inherits: true
  },
  editor: {
    canView: true,
    canUpload: true,
    canEdit: true,
    canDelete: false,
    canShare: false,
    canManagePermissions: false,
    canCreateSubFolders: true,
    canEditDoc: true,
    canDeleteDoc: true,
    canShareDoc: false,
    canManagePermissionsDoc: false,
    inherits: true
  },
  admin: {
    canView: true,
    canUpload: true,
    canEdit: true,
    canDelete: true,
    canShare: true,
    canManagePermissions: true,
    canCreateSubFolders: true,
    canEditDoc: true,
    canDeleteDoc: true,
    canShareDoc: true,
    canManagePermissionsDoc: true,
    inherits: true
  }
};

const PRESET_LABELS = {
  viewer: { label: 'Viewer', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  contributor: { label: 'Contributor', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
  editor: { label: 'Editor', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
  admin: { label: 'Admin', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
};

export default function ManageFolderPermissionsModal({
  isOpen,
  onClose,
  folderId,
  folderName,
  onSuccess
}: ManageFolderPermissionsModalProps) {
  const [loading, setLoading] = useState(false);
  const [currentPermissions, setCurrentPermissions] = useState<CurrentPermission[]>([]);
  const [selectedTab, setSelectedTab] = useState<GranteeType>('user');
  const [permissionToDelete, setPermissionToDelete] = useState<CurrentPermission | null>(null);
  const pageSize = 10;

  // Server-side search for available entities
  const {
    displayData: availableEntities,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    totalPages,
    totalElements,
    loading: entitiesLoading,
    fetchData
  } = useServerSideSearch<UserDto | RoleDto | GroupDto>({
    fetchFunction: async (currentPage, searchTerm) => {
      if (selectedTab === 'user') {
        return await notificationApiClient.getAvailableUsersForFolder(folderId, {
          page: currentPage,
          size: pageSize,
          search: searchTerm || undefined
        });
      } else if (selectedTab === 'role') {
        return await notificationApiClient.getAvailableRolesForFolder(folderId, {
          page: currentPage,
          size: pageSize,
          search: searchTerm || undefined
        });
      } else {
        return await notificationApiClient.getAvailableGroupsForFolder(folderId, {
          page: currentPage,
          size: pageSize,
          search: searchTerm || undefined
        });
      }
    },
    searchFields: (entity) => {
      if ('displayName' in entity) {
        return [entity.displayName, entity.email || '', entity.username || ''];
      }
      return [entity.name || '', entity.description || ''];
    },
    debounceMs: 300
  });

  // Fetch current permissions
  useEffect(() => {
    if (isOpen) {
      fetchCurrentPermissions();
    }
  }, [isOpen, folderId]);

  // Refresh available entities when tab changes
  useEffect(() => {
    if (isOpen) {
      setPage(0);
      fetchData(true);
    }
  }, [selectedTab, isOpen]);

  const fetchCurrentPermissions = async () => {
    try {
      const response = await notificationApiClient.getFolderShared(folderId, { page: 0, size: 1000 });
      const perms: CurrentPermission[] = response.content.map((perm: any) => ({
        id: `${perm.granteeType}_${perm.granteeId}`,
        type: perm.granteeType.toLowerCase() as GranteeType,
        entity: perm.grantee,
        permission: perm.permission,
        expanded: false
      }));
      setCurrentPermissions(perms);
    } catch (error) {
      console.error('Failed to fetch current permissions:', error);
    }
  };

  const handleAddPermission = async (entity: UserDto | RoleDto | GroupDto) => {
    try {
      setLoading(true);
      await notificationApiClient.createOrUpdateFolderShared(folderId, {
        type: selectedTab.toUpperCase(),
        granteeId: entity.id,
        permission: PERMISSION_PRESETS.viewer
      });
      
      await fetchCurrentPermissions();
      fetchData(true); // Refresh available entities
    } catch (error) {
      console.error('Failed to add permission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePermission = async (perm: CurrentPermission, newPermission: FolderPermissionReq) => {
    try {
      setLoading(true);
      await notificationApiClient.createOrUpdateFolderShared(folderId, {
        type: perm.type.toUpperCase(),
        granteeId: perm.entity.id,
        permission: newPermission
      });
      
      await fetchCurrentPermissions();
    } catch (error) {
      console.error('Failed to update permission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePermission = async () => {
    if (!permissionToDelete) return;
    
    try {
      setLoading(true);
      await notificationApiClient.deleteFolderShared(folderId, permissionToDelete.entity.id, permissionToDelete.permission.inherits || false);
      
      await fetchCurrentPermissions();
      fetchData(true); // Refresh available entities
      setPermissionToDelete(null); // Close confirmation modal
    } catch (error) {
      console.error('Failed to remove permission:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id: string) => {
    setCurrentPermissions(prev => 
      prev.map(p => p.id === id ? { ...p, expanded: !p.expanded } : p)
    );
  };

  const getPresetName = (permission: FolderPermissionReq): keyof typeof PERMISSION_PRESETS | 'custom' => {
    for (const [key, preset] of Object.entries(PERMISSION_PRESETS)) {
      if (JSON.stringify(preset) === JSON.stringify(permission)) {
        return key as keyof typeof PERMISSION_PRESETS;
      }
    }
    return 'custom';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Manage Permissions</h2>
              {folderName && <p className="text-sm text-white/80">Folder: {folderName}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-10 h-10 rounded-xl hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Current Permissions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Current Permissions</h3>
              <Badge variant="secondary">{currentPermissions.length} assigned</Badge>
            </div>

            {currentPermissions.length > 0 ? (
              <div className="space-y-2">
                {currentPermissions.map((perm) => {
                  const isExpanded = perm.expanded;
                  const presetName = getPresetName(perm.permission);

                  return (
                    <div key={perm.id} className="border border-gray-200 rounded-lg bg-white shadow-sm">
                      <div className="flex items-center gap-3 p-4">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(perm.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </button>

                        {/* Entity Info */}
                        <div className="flex-1 flex items-center gap-3">
                          {perm.type === 'user' && <UserAvatar user={perm.entity as UserDto} size="sm" />}
                          {perm.type === 'group' && (
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                              <Users className="w-5 h-5 text-green-600" />
                            </div>
                          )}
                          {perm.type === 'role' && (
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                              <Shield className="w-5 h-5 text-orange-600" />
                            </div>
                          )}

                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {perm.type === 'user' ? (perm.entity as UserDto).displayName : perm.entity.name}
                            </p>
                            {perm.type === 'user' && (
                              <p className="text-sm text-gray-500">{(perm.entity as UserDto).email}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-md font-medium ${
                                presetName !== 'custom' ? PRESET_LABELS[presetName].color : 'bg-purple-100 text-purple-700'
                              }`}>
                                {presetName !== 'custom' ? PRESET_LABELS[presetName].label : 'Custom'}
                              </span>
                              <Badge variant="outline" className="text-xs capitalize">{perm.type}</Badge>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setPermissionToDelete(perm)}
                          disabled={loading}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Expanded Permissions Details */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 bg-gray-50 p-4">
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Quick Presets</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(PRESET_LABELS).map(([key, { label, color }]) => (
                                <button
                                  key={key}
                                  onClick={() => handleUpdatePermission(perm, PERMISSION_PRESETS[key as keyof typeof PERMISSION_PRESETS])}
                                  disabled={loading}
                                  className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                                    presetName === key ? color : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Folder Permissions</p>
                              <div className="space-y-1.5">
                                {['canView', 'canUpload', 'canEdit', 'canDelete', 'canShare', 'canManagePermissions', 'canCreateSubFolders'].map((key) => (
                                  <label key={key} className="flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={perm.permission[key as keyof FolderPermissionReq] as boolean}
                                      onChange={(e) => handleUpdatePermission(perm, { ...perm.permission, [key]: e.target.checked })}
                                      disabled={loading}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">{key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Document Permissions</p>
                              <div className="space-y-1.5">
                                {['canEditDoc', 'canDeleteDoc', 'canShareDoc', 'canManagePermissionsDoc'].map((key) => (
                                  <label key={key} className="flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={perm.permission[key as keyof FolderPermissionReq] as boolean}
                                      onChange={(e) => handleUpdatePermission(perm, { ...perm.permission, [key]: e.target.checked })}
                                      disabled={loading}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">{key.replace('can', '').replace('Doc', ' Doc').replace(/([A-Z])/g, ' $1').trim()}</span>
                                  </label>
                                ))}
                                <label className="flex items-center gap-2 text-sm mt-3 font-medium">
                                  <input
                                    type="checkbox"
                                    checked={perm.permission.inherits}
                                    onChange={(e) => handleUpdatePermission(perm, { ...perm.permission, inherits: e.target.checked })}
                                    disabled={loading}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-gray-700">Inherit to Subfolders</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No permissions assigned yet</p>
                <p className="text-sm text-gray-400 mt-1">Add users, roles, or groups below</p>
              </div>
            )}
          </div>

          {/* Add New Permission */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Permission</h3>

            {/* Tab Selector */}
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                variant={selectedTab === 'user' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTab('user')}
                className="flex-1"
              >
                <UserIcon className="w-4 h-4 mr-2" />
                Users
              </Button>
              <Button
                type="button"
                variant={selectedTab === 'group' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTab('group')}
                className="flex-1"
              >
                <Users className="w-4 h-4 mr-2" />
                Groups
              </Button>
              <Button
                type="button"
                variant={selectedTab === 'role' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTab('role')}
                className="flex-1"
              >
                <Shield className="w-4 h-4 mr-2" />
                Roles
              </Button>
            </div>

            {/* Search */}
            <div className="mb-4">
              <ServerSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={`Search ${selectedTab}s...`}
                className="h-10"
              />
            </div>

            {/* Available Entities List */}
            {entitiesLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : availableEntities.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableEntities.map((entity) => (
                  <div
                    key={entity.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {selectedTab === 'user' && <UserAvatar user={entity as UserDto} size="sm" />}
                    {selectedTab === 'group' && (
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Users className="w-5 h-5 text-green-600" />
                      </div>
                    )}
                    {selectedTab === 'role' && (
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-orange-600" />
                      </div>
                    )}

                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {selectedTab === 'user' ? (entity as UserDto).displayName : entity.name}
                      </p>
                      {selectedTab === 'user' && (
                        <p className="text-sm text-gray-500">{(entity as UserDto).email}</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddPermission(entity)}
                      disabled={loading}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? `No ${selectedTab}s found matching "${searchQuery}"` : `No available ${selectedTab}s`}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4">
                <SearchPagination
                  totalPages={totalPages}
                  currentPage={page}
                  totalElements={totalElements}
                  itemsPerPage={pageSize}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Close
          </Button>
        </div>
      </div>

      {/* Confirmation Modal for Delete */}
      {permissionToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Remove Permission
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove {selectedTab} access for{' '}
              <span className="font-medium">
                {permissionToDelete.type === 'user' 
                  ? (permissionToDelete.entity as UserDto).displayName 
                  : permissionToDelete.entity.name}
              </span>?
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setPermissionToDelete(null)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRemovePermission}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? 'Removing...' : 'Remove'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

