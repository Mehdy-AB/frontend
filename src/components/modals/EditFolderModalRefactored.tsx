'use client';

import { useState, useEffect } from 'react';
import { 
  Folder, 
  Plus, 
  Trash2, 
  Users, 
  Shield, 
  X,
  User,
  Edit,
  Eye,
  Upload,
  Share2,
  Settings,
  ChevronDown,
  ChevronRight,
  Check
} from 'lucide-react';
import { notificationApiClient } from '@/api/notificationClient';
import { 
  FolderResDto, 
  FolderPermissionReq, 
  UserDto, 
  RoleDto, 
  GroupDto,
  TypeShareAccessRes,
  TypeShareAccessWithTypeReq,
  GranteeType
} from '@/types/api';
import { useServerSideSearch } from '@/components/main/useServerSideSearch';
import ServerSearchInput from '@/components/main/ServerSearchInput';
import SearchPagination from '@/components/search/SearchPagination';
import UserAvatar from '@/components/main/UserAvatar';

interface EditFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: FolderResDto;
}

// Permission presets
const PERMISSION_PRESETS: Record<string, FolderPermissionReq> = {
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
    canEditDoc: true,
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
  },
};

const PRESET_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  viewer: { label: 'Viewer', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200', icon: Eye },
  contributor: { label: 'Contributor', color: 'bg-green-100 text-green-700 hover:bg-green-200', icon: Upload },
  editor: { label: 'Editor', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200', icon: Edit },
  admin: { label: 'Admin', color: 'bg-red-100 text-red-700 hover:bg-red-200', icon: Shield },
};

// Type guards
function isUser(grantee: UserDto | GroupDto | RoleDto | null | undefined): grantee is UserDto {
  return grantee != null && 'username' in grantee;
}

function isGroup(grantee: UserDto | GroupDto | RoleDto | null | undefined): grantee is GroupDto {
  return grantee != null && 'userCount' in grantee && !('username' in grantee);
}

function isRole(grantee: UserDto | GroupDto | RoleDto | null | undefined): grantee is RoleDto {
  return grantee != null && !('username' in grantee) && !('userCount' in grantee);
}

export default function EditFolderModal({ isOpen, onClose, folder }: EditFolderModalProps) {
  const [isClient, setIsClient] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Use server-side search for existing permissions
  const {
    displayData: allGrants,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    totalPages,
    totalElements,
    loading: loadingPermissions,
    fetchData: fetchPermissions,
    updateItem: updateGrantInList,
    addItem: addGrantToList,
    removeItem: removeGrantFromList
  } = useServerSideSearch<TypeShareAccessRes>({
    fetchFunction: async (currentPage, searchTerm) => {
      const response = await notificationApiClient.getFolderShared(
        folder.id, 
        { 
          page: currentPage, 
          size: pageSize,
          search: searchTerm 
        },
        { silent: true }
      );
      return response;
    },
    searchFields: (grant) => {
      if (!grant.grantee) return [];
      if (isUser(grant.grantee)) {
        return [
          grant.grantee.username || '',
          grant.grantee.firstName || '',
          grant.grantee.lastName || '',
          grant.grantee.email || ''
        ];
      } else if (isGroup(grant.grantee)) {
        return [grant.grantee.name || '', grant.grantee.description || ''];
      } else if (isRole(grant.grantee)) {
        return [grant.grantee.name || '', grant.grantee.description || ''];
      }
      return [];
    },
    debounceMs: 300,
    fetchOnMount: false
  });

  // Permission modal state
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [editingGrant, setEditingGrant] = useState<{ grantee: UserDto | GroupDto | RoleDto; permission: FolderPermissionReq; type: GranteeType; isNew: boolean } | null>(null);
  const [tempPermission, setTempPermission] = useState<FolderPermissionReq>(PERMISSION_PRESETS.viewer);

  // Add entity modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addEntityType, setAddEntityType] = useState<'user' | 'group' | 'role' | null>(null);

  // Collapsed state
  const [collapsedPermissions, setCollapsedPermissions] = useState<Record<string, boolean>>({});

  // Load permissions when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPermissions(false);
    }
  }, [isOpen]);

  const handleAddEntity = (type: 'user' | 'group' | 'role') => {
    setAddEntityType(type);
    setShowAddModal(true);
  };

  const handleSelectEntity = (entity: UserDto | GroupDto | RoleDto) => {
    let type: GranteeType;
    if (isUser(entity)) type = 'USER';
    else if (isGroup(entity)) type = 'GROUP';
    else type = 'ROLE';

    setEditingGrant({
      grantee: entity,
      permission: PERMISSION_PRESETS.viewer,
      type,
      isNew: true
    });
    setTempPermission(PERMISSION_PRESETS.viewer);
    setShowAddModal(false);
    setShowPermissionModal(true);
  };

  const handleEditPermission = (grant: TypeShareAccessRes) => {
    if (!grant.grantee) return;

    // Use type from response if available, otherwise determine from grantee
    let type: GranteeType = grant.type;
    if (!type) {
      if (isUser(grant.grantee)) type = 'USER';
      else if (isGroup(grant.grantee)) type = 'GROUP';
      else type = 'ROLE';
    }

    setEditingGrant({
      grantee: grant.grantee,
      permission: grant.permission,
      type,
      isNew: false
    });
    setTempPermission(grant.permission);
    setShowPermissionModal(true);
  };

  const handleSavePermission = async () => {
    if (!editingGrant) return;

    const data: TypeShareAccessWithTypeReq = {
      granteeId: editingGrant.grantee.id,
      permission: tempPermission,
      type: editingGrant.type
    };

    try {
      if (editingGrant.isNew) {
        // POST for new permission
        const result = await notificationApiClient.createOrUpdateFolderShared(folder.id, data);
        addGrantToList(result);
      } else {
        // PUT for update
        const result = await notificationApiClient.createOrUpdateFolderShared(folder.id, data);
        updateGrantInList(editingGrant.grantee.id, () => result, (g) => g.grantee?.id);
      }

      setShowPermissionModal(false);
      setEditingGrant(null);
    } catch (error) {
      console.error('Error saving permission:', error);
    }
  };

  const handleRemovePermission = async (granteeId: string) => {
    try {
      await notificationApiClient.deleteFolderShared(folder.id, granteeId, false);
      removeGrantFromList(granteeId, (g) => g.grantee?.id);
    } catch (error) {
      console.error('Error removing permission:', error);
    }
  };

  const toggleCollapsed = (granteeId: string) => {
    setCollapsedPermissions(prev => ({
      ...prev,
      [granteeId]: !prev[granteeId]
    }));
  };

  const getDisplayName = (grantee: UserDto | GroupDto | RoleDto | null | undefined): string => {
    if (!grantee) return 'Unknown';
    if (isUser(grantee)) return grantee.displayName || grantee.username || 'Unknown User';
    if (isGroup(grantee)) return grantee.name || 'Unknown Group';
    if (isRole(grantee)) return grantee.name || 'Unknown Role';
    return 'Unknown';
  };

  const getDisplaySubtitle = (grantee: UserDto | GroupDto | RoleDto | null | undefined): string => {
    if (!grantee) return '';
    if (isUser(grantee)) return grantee.email || grantee.username || '';
    if (isGroup(grantee)) return `${grantee.userCount || 0} members`;
    if (isRole(grantee)) return grantee.description || '';
    return '';
  };

  const getPermissionBadges = (permission: FolderPermissionReq) => {
    const badges: string[] = [];
    if (permission.canView) badges.push('View');
    if (permission.canUpload) badges.push('Upload');
    if (permission.canEdit) badges.push('Edit');
    if (permission.canDelete) badges.push('Delete');
    if (permission.canShare) badges.push('Share');
    if (permission.canManagePermissions) badges.push('Manage');
    return badges;
  };

  const getCurrentPreset = (permission: FolderPermissionReq): string | null => {
    for (const [key, preset] of Object.entries(PERMISSION_PRESETS)) {
      if (JSON.stringify(preset) === JSON.stringify(permission)) {
        return key;
      }
    }
    return null;
  };

  if (!isClient || !isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Folder className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Manage Permissions</h2>
                <p className="text-sm text-muted-foreground">
                  {folder.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search and Add */}
          <div className="border-b p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Folder Permissions</h3>
              <div className="text-sm text-muted-foreground">
                {totalElements} grant{totalElements !== 1 ? 's' : ''} with access
              </div>
            </div>
            
            <ServerSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name, email, or role..."
            />
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleAddEntity('user')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
              >
                <User className="h-4 w-4" />
                Add User
              </button>
              <button
                onClick={() => handleAddEntity('group')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
              >
                <Users className="h-4 w-4" />
                Add Group
              </button>
              <button
                onClick={() => handleAddEntity('role')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
              >
                <Shield className="h-4 w-4" />
                Add Role
              </button>
            </div>
          </div>

          {/* Permissions List */}
          <div className="flex-1 overflow-auto p-6">
            {loadingPermissions ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : allGrants.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No permissions assigned yet</p>
                <p className="text-sm mt-1">Add users, groups, or roles to grant access</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allGrants.map((grant) => {
                  if (!grant.grantee) return null;
                  const granteeId = grant.grantee.id;
                  const isCollapsed = collapsedPermissions[granteeId] ?? true;
                  
                  return (
                    <div key={granteeId} className="border rounded-lg overflow-hidden">
                      <div 
                        className="p-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {isUser(grant.grantee) && (
                            <UserAvatar user={grant.grantee} size="sm" />
                          )}
                          {isGroup(grant.grantee) && (
                            <div className="p-2 bg-green-100 rounded-lg shrink-0">
                              <Users className="h-5 w-5 text-green-700" />
                            </div>
                          )}
                          {isRole(grant.grantee) && (
                            <div className="p-2 bg-purple-100 rounded-lg shrink-0">
                              <Shield className="h-5 w-5 text-purple-700" />
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{getDisplayName(grant.grantee)}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {getDisplaySubtitle(grant.grantee)}
                            </div>
                            
                            {/* Show permissions inline */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {getPermissionBadges(grant.permission).map(badge => (
                                <span 
                                  key={badge}
                                  className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded"
                                >
                                  {badge}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditPermission(grant);
                            }}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors group"
                            title="Edit Permissions"
                          >
                            <Edit className="h-4 w-4 text-gray-600 group-hover:text-blue-600" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Remove this permission?')) {
                                handleRemovePermission(granteeId);
                              }
                            }}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                            title="Remove Permission"
                          >
                            <Trash2 className="h-4 w-4 text-gray-600 group-hover:text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loadingPermissions && allGrants.length > 0 && (
            <div className="px-6 pb-6">
              <SearchPagination
                totalPages={totalPages}
                currentPage={page}
                totalElements={totalElements}
                itemsPerPage={pageSize}
                onPageChange={setPage}
              />
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Permission Modal */}
      {showPermissionModal && editingGrant && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  {editingGrant.isNew ? 'Set Permissions' : 'Edit Permissions'}
                </h3>
                <button
                  onClick={() => setShowPermissionModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Grantee Info */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mb-6">
                {isUser(editingGrant.grantee) && (
                  <UserAvatar user={editingGrant.grantee} size="md"  />
                )}
                {isGroup(editingGrant.grantee) && (
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Users className="h-6 w-6 text-green-700" />
                  </div>
                )}
                {isRole(editingGrant.grantee) && (
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Shield className="h-6 w-6 text-purple-700" />
                  </div>
                )}
                <div>
                  <div className="font-medium">{getDisplayName(editingGrant.grantee)}</div>
                  <div className="text-sm text-muted-foreground">
                    {getDisplaySubtitle(editingGrant.grantee)}
                  </div>
                </div>
              </div>
              
              {/* Permission Presets */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-3 block">Quick Presets</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PRESET_LABELS).map(([key, { label, color, icon: Icon }]) => {
                    const currentPreset = getCurrentPreset(tempPermission);
                    const isActive = currentPreset === key;
                    
                    return (
                      <button
                        key={key}
                        onClick={() => setTempPermission(PERMISSION_PRESETS[key])}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                          isActive ? color : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                        {isActive && <Check className="h-4 w-4 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Individual Permissions */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-3 block">Custom Permissions</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempPermission.canView}
                      onChange={(e) => setTempPermission({...tempPermission, canView: e.target.checked})}
                      className="rounded"
                    />
                    <Eye className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">View</span>
                  </label>
                  
                  <label className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempPermission.canUpload}
                      onChange={(e) => setTempPermission({...tempPermission, canUpload: e.target.checked})}
                      className="rounded"
                    />
                    <Upload className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Upload</span>
                  </label>
                  
                  <label className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempPermission.canEdit}
                      onChange={(e) => setTempPermission({...tempPermission, canEdit: e.target.checked})}
                      className="rounded"
                    />
                    <Edit className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Edit Folder</span>
                  </label>
                  
                  <label className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempPermission.canDelete}
                      onChange={(e) => setTempPermission({...tempPermission, canDelete: e.target.checked})}
                      className="rounded"
                    />
                    <Trash2 className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Delete Folder</span>
                  </label>
                  
                  <label className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempPermission.canShare}
                      onChange={(e) => setTempPermission({...tempPermission, canShare: e.target.checked})}
                      className="rounded"
                    />
                    <Share2 className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Share</span>
                  </label>
                  
                  <label className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempPermission.canManagePermissions}
                      onChange={(e) => setTempPermission({...tempPermission, canManagePermissions: e.target.checked})}
                      className="rounded"
                    />
                    <Settings className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Manage Permissions</span>
                  </label>
                  
                  <label className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempPermission.canEditDoc}
                      onChange={(e) => setTempPermission({...tempPermission, canEditDoc: e.target.checked})}
                      className="rounded"
                    />
                    <Edit className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Edit Documents</span>
                  </label>
                  
                  <label className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempPermission.canDeleteDoc}
                      onChange={(e) => setTempPermission({...tempPermission, canDeleteDoc: e.target.checked})}
                      className="rounded"
                    />
                    <Trash2 className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Delete Documents</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowPermissionModal(false)}
                  className="px-6 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePermission}
                  className="px-6 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors"
                >
                  {editingGrant.isNew ? 'Add Permission' : 'Update Permission'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Entity Modal - TO DO: Implement with available entities endpoint */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  Add {addEntityType?.charAt(0).toUpperCase()}{addEntityType?.slice(1)}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* TODO: Implement search and selection for users/groups/roles */}
              <p className="text-center text-muted-foreground py-12">
                Search and select {addEntityType} to add...
              </p>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

