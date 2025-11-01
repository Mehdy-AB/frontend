'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Folder, 
  Plus, 
  Trash2, 
  Users, 
  Shield, 
  X,
  Save,
  Search,
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
  viewer: { label: 'Viewer', color: 'bg-blue-600 text-white' },
  contributor: { label: 'Contributor', color: 'bg-green-600 text-white' },
  editor: { label: 'Editor', color: 'bg-orange-600 text-white' },
  admin: { label: 'Admin', color: 'bg-red-600 text-white' },
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
  
  // Client-side only check
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const pageSize = 20;
  
  // Use server-side search for permissions
  const {
    displayData: allGrants,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    totalPages,
    totalElements,
    loading: loadingPermissions,
    tableLoading,
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
  
  // Available entities for adding new grants
  const [users, setUsers] = useState<UserDto[]>([]);
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  
  // Search dropdown states for adding entities
  const [availableEntities, setAvailableEntities] = useState<(UserDto | GroupDto | RoleDto)[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedEntityType, setSelectedEntityType] = useState<'user' | 'group' | 'role' | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Other states
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [collapsedPermissions, setCollapsedPermissions] = useState<Record<string, boolean>>({});
  
  // Permission modal state
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [editingGrant, setEditingGrant] = useState<{ grantee: UserDto | GroupDto | RoleDto; permission: FolderPermissionReq; type: GranteeType; isNew: boolean } | null>(null);
  const [tempPermission, setTempPermission] = useState<FolderPermissionReq>(PERMISSION_PRESETS.viewer);
  

  // Load permissions when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPermissions(false);
    }
  }, [isOpen, folder.id]);

  // Load available users for folder (those without permissions)
  const loadAvailableUsers = async (search?: string) => {
    try {
      const response = await notificationApiClient.getAvailableUsersForFolder(
        folder.id, 
        { page: 0, size: 100, search }, 
        { silent: true }
      );
      setUsers(response.content || []);
    } catch (error) {
      console.error('Error loading available users:', error);
    }
  };

  // Load available groups for folder (those without permissions)
  const loadAvailableGroups = async (search?: string) => {
    try {
      const response = await notificationApiClient.getAvailableGroupsForFolder(
        folder.id, 
        { page: 0, size: 100, search }, 
        { silent: true }
      );
      setGroups(response.content || []);
    } catch (error) {
      console.error('Error loading available groups:', error);
    }
  };

  // Load available roles for folder (those without permissions)
  const loadAvailableRoles = async (search?: string) => {
    try {
      const response = await notificationApiClient.getAvailableRolesForFolder(
        folder.id, 
        { page: 0, size: 100, search }, 
        { silent: true }
      );
      setRoles(response.content || []);
    } catch (error) {
      console.error('Error loading available roles:', error);
    }
  };

  // Set available entities based on selected type and filter out those in allGrants
  useEffect(() => {
    if (!selectedEntityType) return;
    
    let entities: (UserDto | GroupDto | RoleDto)[] = [];
    
    // Select entities based on type
    switch (selectedEntityType) {
      case 'user':
        entities = users || [];
        break;
      case 'group':
        entities = groups || [];
        break;
      case 'role':
        entities = roles || [];
        break;
    }
    
    // Ensure entities is always an array
    if (!Array.isArray(entities)) {
      entities = [];
    }
    
    // Filter out entities that are already in allGrants (including pending additions)
    const granteeIds = new Set(
      allGrants
        .filter(g => g.grantee != null) // Filter out null grantees
        .map(g => g.grantee.id)
    );
    const filtered = entities.filter(entity => !granteeIds.has(entity.id));
    
    setAvailableEntities(filtered);
  }, [users, groups, roles, selectedEntityType, allGrants]);

  // Debounced API search for available entities using optimized endpoints
  useEffect(() => {
    if (!selectedEntityType) return;
    
      const performSearch = async () => {
        try {
          setSearching(true);
        
        const searchTerm = searchQuery.trim() || undefined;
          
          switch (selectedEntityType) {
            case 'user':
            await loadAvailableUsers(searchTerm);
              break;
            case 'group':
            await loadAvailableGroups(searchTerm);
              break;
            case 'role':
            await loadAvailableRoles(searchTerm);
              break;
          }
        } catch (error) {
          console.error('Error searching entities:', error);
        } finally {
          setSearching(false);
        }
      };
      
    const timeoutId = setTimeout(performSearch, 300);
      return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedEntityType]);

  // Maintain focus after API calls
  useEffect(() => {
    if (searchInputRef.current && selectedEntityType) {
      // Restore focus after state updates
      const timeoutId = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [availableEntities, searching, selectedEntityType]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    // Only run when modal is open and we're on the client side
    if (!isOpen || !isClient || typeof window === 'undefined' || typeof document === 'undefined') return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.searchable-select-container')) {
        handleCloseDropdown();
      }
    };

    try {
      document.addEventListener('mousedown', handleClickOutside);
    } catch (error) {
      console.warn('Failed to add event listener:', error);
      return;
    }

    return () => {
      try {
        if (typeof document !== 'undefined') {
          document.removeEventListener('mousedown', handleClickOutside);
        }
      } catch (error) {
        console.warn('Failed to remove event listener:', error);
      }
    };
  }, [isOpen, isClient]);

  // Toggle permission panel collapse
  const togglePermissionPanel = (panelKey: string) => {
    setCollapsedPermissions(prev => ({
      ...prev,
      [panelKey]: !prev[panelKey]
    }));
  };

  // Entity type selection functions
  const handleAddUser = async () => {
    setSelectedEntityType('user');
    setSearchQuery('');
    setShowSearchDropdown(true);
    // Load initial users
    await loadAvailableUsers();
    // Focus input after state update
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 0);
  };

  const handleAddGroup = async () => {
    setSelectedEntityType('group');
    setSearchQuery('');
    setShowSearchDropdown(true);
    // Load initial groups
    await loadAvailableGroups();
    // Focus input after state update
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 0);
  };

  const handleAddRole = async () => {
    setSelectedEntityType('role');
    setSearchQuery('');
    setShowSearchDropdown(true);
    // Load initial roles
    await loadAvailableRoles();
    // Focus input after state update
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 0);
  };

  const handleCloseDropdown = () => {
    setShowSearchDropdown(false);
    setSelectedEntityType(null);
    setSearchQuery('');
  };

  // Permission management functions - NO immediate API calls
  const addPermission = (entity: UserDto | GroupDto | RoleDto) => {
    try {
      // Determine entity type
      let granteeType: GranteeType;
      if (isUser(entity)) {
        granteeType = GranteeType.USER;
      } else if (isGroup(entity)) {
        granteeType = GranteeType.GROUP;
      } else {
        granteeType = GranteeType.ROLE;
      }

      // Open permission modal to set permissions
      setEditingGrant({
        grantee: entity,
        permission: PERMISSION_PRESETS.viewer,
        type: granteeType,
        isNew: true
      });
      setTempPermission(PERMISSION_PRESETS.viewer);
      setShowPermissionModal(true);
    } catch (error) {
      console.error('Error adding permission:', error);
    }
  };

  const removePermission = async (granteeId: string, inherits: boolean) => {
    try {
      if (!confirm('Are you sure you want to remove this permission?')) {
        return;
      }

      // Optimistic removal
      removeGrantFromList(granteeId, (g) => g.grantee?.id);
      
      // Delete from backend
      await notificationApiClient.deleteFolderShared(folder.id, granteeId, inherits);
    } catch (error) {
      console.error('Error removing permission:', error);
      // Refresh to restore on error
      fetchPermissions(false);
    }
  };

  const updatePermission = (grant: TypeShareAccessRes) => {
    try {
      if (!grant.grantee) return;

      let granteeType: GranteeType;
      if (isUser(grant.grantee)) {
        granteeType = GranteeType.USER;
      } else if (isGroup(grant.grantee)) {
        granteeType = GranteeType.GROUP;
        } else {
        granteeType = GranteeType.ROLE;
      }

      // Open permission modal to edit
      setEditingGrant({
        grantee: grant.grantee,
        permission: grant.permission,
        type: granteeType,
        isNew: false
      });
      setTempPermission(grant.permission);
      setShowPermissionModal(true);
    } catch (error) {
      console.error('Error updating permission:', error);
    }
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
        const result = await notificationApiClient.createFolderPermission(folder.id, data);
        addGrantToList(result);
      } else {
        // PUT for update
        const result = await notificationApiClient.updateFolderPermission(folder.id, data);
        updateGrantInList(editingGrant.grantee.id, () => result, (g) => g.grantee?.id);
      }

      setShowPermissionModal(false);
      setEditingGrant(null);
    } catch (error) {
      console.error('Error saving permission:', error);
    }
  };

  // Simple close handler - no unsaved changes to worry about
  const handleClose = () => {
        onClose();
  };

  // Add Entity Buttons Component - removed useCallback to prevent re-renders
  const AddEntityButtons = () => (
    <div className="flex gap-2">
      <button
        onClick={handleAddUser}
        className="flex items-center gap-2 px-3 py-2 bg-primary text-surface rounded-lg text-sm hover:bg-primary-dark transition-colors"
      >
        <User className="h-4 w-4" />
        Add User
      </button>
      <button
        onClick={handleAddGroup}
        className="flex items-center gap-2 px-3 py-2 bg-primary text-surface rounded-lg text-sm hover:bg-primary-dark transition-colors"
      >
        <Users className="h-4 w-4" />
        Add Group
      </button>
      <button
        onClick={handleAddRole}
        className="flex items-center gap-2 px-3 py-2 bg-primary text-surface rounded-lg text-sm hover:bg-primary-dark transition-colors"
      >
        <Shield className="h-4 w-4" />
        Add Role
      </button>
    </div>
  );

  // SearchableSelect component - removed useCallback to prevent re-renders
  const SearchableSelect = () => (
    <div className="relative searchable-select-container">
      {selectedEntityType && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-text-light h-4 w-4" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={`Search ${selectedEntityType}s to add permissions...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-ui rounded-lg text-sm bg-surface text-neutral-text-dark placeholder-neutral-text-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            )}
            <button
              onClick={handleCloseDropdown}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-neutral-background rounded"
            >
              <X className="h-4 w-4 text-neutral-text-light" />
            </button>
          </div>
          
          {showSearchDropdown && availableEntities.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-surface border border-ui rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {availableEntities.map((entity: any) => (
                <button
                  key={entity.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addPermission(entity);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-neutral-text-dark hover:bg-neutral-background focus:bg-neutral-background focus:outline-none border-b border-ui last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    {/* User - Show Avatar */}
                    {'username' in entity && (
                      <>
                        <UserAvatar user={entity as UserDto} size="sm" />
                        <div>
                          <div className="font-medium">
                            {`${entity.firstName || ''} ${entity.lastName || ''}`.trim() || entity.username}
                          </div>
                          <div className="text-xs text-neutral-text-light">
                            @{entity.username}{entity.email ? ` • ${entity.email}` : ''}
                          </div>
                        </div>
                      </>
                    )}
                    
                    {/* Group - Show Icon */}
                    {'userCount' in entity && (
                      <>
                        <div className="p-2 bg-green-100 rounded-lg shrink-0">
                          <Users className="h-4 w-4 text-green-700" />
                        </div>
                        <div>
                          <div className="font-medium">{entity.name}</div>
                          <div className="text-xs text-neutral-text-light">{entity.description || 'Group'}</div>
                        </div>
                      </>
                    )}
                    
                    {/* Role - Show Icon */}
                    {!('username' in entity) && !('userCount' in entity) && (
                      <>
                        <div className="p-2 bg-purple-100 rounded-lg shrink-0">
                          <Shield className="h-4 w-4 text-purple-700" />
                        </div>
                        <div>
                          <div className="font-medium">{entity.name}</div>
                          <div className="text-xs text-neutral-text-light">{entity.description || 'Role'}</div>
                        </div>
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  if (!isOpen || !isClient) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg border border-ui w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-ui">
          <div>
            <h2 className="text-xl font-semibold text-neutral-text-dark">
              Edit Folder Permissions
            </h2>
            <p className="text-sm text-neutral-text-light">
              Manage permissions for "{folder.name}"
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-neutral-background transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-neutral-text-light" />
          </button>
        </div>

        {/* Search Header */}
        <div className="border-b border-ui p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-neutral-text-dark">Folder Permissions</h3>
            <div className="text-sm text-neutral-text-light">
              {totalElements} grant{totalElements !== 1 ? 's' : ''} with access
            </div>
          </div>
          
          <ServerSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name, email, or role..."
            className="mb-4"
          />
          
          <div className="space-y-3">
            <AddEntityButtons />
            <SearchableSelect />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loadingPermissions ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-neutral-text-light">Loading permissions...</span>
              </div>
            </div>
          ) : allGrants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-neutral-ui mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-text-dark mb-2">No Permissions Set</h3>
              <p className="text-neutral-text-light mb-4">
                This folder doesn't have any specific permissions set. Only the owner can access it.
              </p>
              <p className="text-sm text-neutral-text-light">
                Use the buttons above to add users, groups, or roles with specific permissions.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allGrants.map((grant, index) => {
                const grantee = grant.grantee;
                
                // Skip grants with null grantee (defensive programming)
                if (!grantee) return null;
                
                const panelKey = `grant-${index}`;
                const isCollapsed = collapsedPermissions[panelKey];
                
                // Determine grantee type and icon
                let granteeType: GranteeType;
                let IconComponent;
                let displayName;
                let displaySubtitle;
                
                if (isUser(grantee)) {
                  // User
                  granteeType = GranteeType.USER;
                  IconComponent = User;
                  displayName = `${grantee.firstName || ''} ${grantee.lastName || ''}`.trim() || grantee.username;
                  displaySubtitle = `@${grantee.username}${grantee.email ? ` • ${grantee.email}` : ''}`;
                } else if (isGroup(grantee)) {
                  // Group
                  granteeType = GranteeType.GROUP;
                  IconComponent = Users;
                  displayName = grantee.name;
                  displaySubtitle = grantee.description || 'Group';
                } else {
                  // Role
                  granteeType = GranteeType.ROLE;
                  IconComponent = Shield;
                  displayName = grantee.name;
                  displaySubtitle = grantee.description || 'Role';
                }
                
                // Get active permissions for display
                const activePerms = [];
                if (grant.permission?.canView) activePerms.push('View');
                if (grant.permission?.canUpload) activePerms.push('Upload');
                if (grant.permission?.canEdit) activePerms.push('Edit');
                if (grant.permission?.canDelete) activePerms.push('Delete');
                if (grant.permission?.canShare) activePerms.push('Share');
                if (grant.permission?.canManagePermissions) activePerms.push('Manage Permissions');
                if (grant.permission?.canCreateSubFolders) activePerms.push('Create Subfolders');
                if (grant.permission?.canEditDoc) activePerms.push('Edit Docs');
                if (grant.permission?.canDeleteDoc) activePerms.push('Delete Docs');
                if (grant.permission?.canShareDoc) activePerms.push('Share Docs');
                if (grant.permission?.canManagePermissionsDoc) activePerms.push('Manage Doc Permissions');
                
                return (
                  <div key={grantee.id} className="border border-ui rounded-lg">
                    <div className="p-4 flex justify-between items-center">
                      <div className="flex items-center gap-3 flex-1">
                        {isUser(grantee) ? (
                          <UserAvatar user={grantee} size="sm" />
                        ) : (
                        <IconComponent className="h-5 w-5 text-neutral-text-light" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-neutral-text-dark">
                              {displayName}
                            </div>
                          </div>
                          <div className="text-sm text-neutral-text-light mb-1">
                            {displaySubtitle}
                          </div>
                          {/* Show permissions inline */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {activePerms.slice(0, 5).map((perm) => (
                              <span key={perm} className="inline-flex px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-200">
                                {perm}
                              </span>
                            ))}
                            {activePerms.length > 5 && (
                              <span className="inline-flex px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md">
                                +{activePerms.length - 5} more
                              </span>
                            )}
                          </div>
                          </div>
                        </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updatePermission(grant);
                          }}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit Permissions"
                        >
                          <Edit className="h-4 w-4 text-neutral-text-light hover:text-blue-600" />
                        </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removePermission(grantee.id, grant.permission.inherits);
                        }}
                        className="p-2 text-error hover:bg-error/10 rounded transition-colors"
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
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
        <div className="flex justify-end p-6 border-t border-ui">
            <button
              onClick={handleClose}
            disabled={loading}
            className="px-6 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
            Close
            </button>
        </div>
      </div>

      {/* Permission Modal - Add/Edit Permissions */}
      {showPermissionModal && editingGrant && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-neutral-text-dark">
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
                  <UserAvatar user={editingGrant.grantee} size="md" />
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
                  <div className="font-medium text-neutral-text-dark">
                    {isUser(editingGrant.grantee) 
                      ? `${editingGrant.grantee.firstName || ''} ${editingGrant.grantee.lastName || ''}`.trim() || editingGrant.grantee.username
                      : editingGrant.grantee.name
                    }
                  </div>
                  <div className="text-sm text-neutral-text-light">
                    {isUser(editingGrant.grantee) 
                      ? editingGrant.grantee.email || editingGrant.grantee.username
                      : isGroup(editingGrant.grantee)
                      ? `${editingGrant.grantee.userCount || 0} members`
                      : editingGrant.grantee.description || 'Role'
                    }
                  </div>
                </div>
              </div>
              
              {/* Permission Presets */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-3 block text-neutral-text-dark">Quick Presets</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PRESET_LABELS).map(([key, { label, color }]) => {
                    const isActive = JSON.stringify(tempPermission) === JSON.stringify(PERMISSION_PRESETS[key as keyof typeof PERMISSION_PRESETS]);
                    
                    // Get icon based on preset
                    const Icon = key === 'viewer' ? Eye : 
                                key === 'contributor' ? Upload :
                                key === 'editor' ? Edit :
                                Shield;
                    
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setTempPermission(PERMISSION_PRESETS[key as keyof typeof PERMISSION_PRESETS])}
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
                <label className="text-sm font-medium mb-3 block text-neutral-text-dark">Custom Permissions</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 px-3 py-2 border border-ui rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempPermission.canView}
                      onChange={(e) => setTempPermission({...tempPermission, canView: e.target.checked})}
                      className="rounded"
                    />
                    <Eye className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">View</span>
                  </label>
                  
                  <label className="flex items-center gap-2 px-3 py-2 border border-ui rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempPermission.canUpload}
                      onChange={(e) => setTempPermission({...tempPermission, canUpload: e.target.checked})}
                      className="rounded"
                    />
                    <Upload className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Upload</span>
                  </label>
                  
                  <label className="flex items-center gap-2 px-3 py-2 border border-ui rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempPermission.canEdit}
                      onChange={(e) => setTempPermission({...tempPermission, canEdit: e.target.checked})}
                      className="rounded"
                    />
                    <Edit className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Edit Folder</span>
                  </label>
                  
                  <label className="flex items-center gap-2 px-3 py-2 border border-ui rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempPermission.canDelete}
                      onChange={(e) => setTempPermission({...tempPermission, canDelete: e.target.checked})}
                      className="rounded"
                    />
                    <Trash2 className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Delete Folder</span>
                  </label>
                  
                  <label className="flex items-center gap-2 px-3 py-2 border border-ui rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempPermission.canShare}
                      onChange={(e) => setTempPermission({...tempPermission, canShare: e.target.checked})}
                      className="rounded"
                    />
                    <Share2 className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Share</span>
                  </label>
                  
                  <label className="flex items-center gap-2 px-3 py-2 border border-ui rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempPermission.canManagePermissions}
                      onChange={(e) => setTempPermission({...tempPermission, canManagePermissions: e.target.checked})}
                      className="rounded"
                    />
                    <Settings className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Manage Permissions</span>
                  </label>
                  
                  <label className="flex items-center gap-2 px-3 py-2 border border-ui rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempPermission.canCreateSubFolders}
                      onChange={(e) => setTempPermission({...tempPermission, canCreateSubFolders: e.target.checked})}
                      className="rounded"
                    />
                    <Folder className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Create Subfolders</span>
                  </label>
                  
                  <label className="flex items-center gap-2 px-3 py-2 border border-ui rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempPermission.canEditDoc}
                      onChange={(e) => setTempPermission({...tempPermission, canEditDoc: e.target.checked})}
                      className="rounded"
                    />
                    <Edit className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Edit Documents</span>
                  </label>
                  
                  <label className="flex items-center gap-2 px-3 py-2 border border-ui rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempPermission.canDeleteDoc}
                      onChange={(e) => setTempPermission({...tempPermission, canDeleteDoc: e.target.checked})}
                      className="rounded"
                    />
                    <Trash2 className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Delete Documents</span>
                  </label>
                  
                  <label className="flex items-center gap-2 px-3 py-2 border border-ui rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempPermission.canShareDoc}
                      onChange={(e) => setTempPermission({...tempPermission, canShareDoc: e.target.checked})}
                      className="rounded"
                    />
                    <Share2 className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Share Documents</span>
                  </label>
                  
                  <label className="flex items-center gap-2 px-3 py-2 border border-ui rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempPermission.canManagePermissionsDoc}
                      onChange={(e) => setTempPermission({...tempPermission, canManagePermissionsDoc: e.target.checked})}
                      className="rounded"
                    />
                    <Settings className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Manage Doc Permissions</span>
                  </label>
                  
                  <label className="flex items-center gap-2 px-3 py-2 border border-ui rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempPermission.inherits}
                      onChange={(e) => setTempPermission({...tempPermission, inherits: e.target.checked})}
                      className="rounded"
                    />
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Inherit to Subfolders</span>
                  </label>
              </div>
            </div>

              {/* Modal Footer */}
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
    </div>
  );
}
