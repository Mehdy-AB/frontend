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
  Check,
  FileText
} from 'lucide-react';
import { notificationApiClient } from '@/api/notificationClient';
import { useNotifications } from '@/hooks/useNotifications';
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
import ConfirmationModal from './ConfirmationModal';

interface EditFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: FolderResDto;
}


const PERMISSION_PRESETS = {
  viewer: {
    canView: true,
    canEdit: false,
    canDelete: false,
    canManagePermissions: false,
    canCreateSubFolders: false,
    canUpload: false,
    canEditDoc: false,
    canDeleteDoc: false,
    canManagePermissionsDoc: false,
    inherits: true
  },
  contributor: {
    canView: true,
    canEdit: false,
    canDelete: false,
    canManagePermissions: false,
    canCreateSubFolders: false,
    canUpload: true,
    canEditDoc: false,
    canDeleteDoc: false,
    canManagePermissionsDoc: false,
    inherits: true
  },
  editor: {
    canView: true,
    canEdit: true,
    canDelete: false,
    canManagePermissions: false,
    canCreateSubFolders: true,
    canUpload: true,
    canEditDoc: true,
    canDeleteDoc: true,
    canManagePermissionsDoc: false,
    inherits: true
  },
  admin: {
    canView: true,
    canEdit: true,
    canDelete: true,
    canManagePermissions: true,
    canCreateSubFolders: true,
    canUpload: true,
    canEditDoc: true,
    canDeleteDoc: true,
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
  return grantee != null && ('userCount' in grantee || 'users' in grantee) && !('username' in grantee);
}

function isRole(grantee: UserDto | GroupDto | RoleDto | null | undefined): grantee is RoleDto {
  return grantee != null && !('username' in grantee) && !('userCount' in grantee);
}

export default function EditFolderModal({ isOpen, onClose, folder }: EditFolderModalProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const { showError } = useNotifications();

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
        const user = grant.grantee as UserDto;
        return [
          user.username || '',
          user.firstName || '',
          user.lastName || '',
          user.email || ''
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
  const addPermission = (entity: UserDto | GroupDto | RoleDto, type: 'user' | 'group' | 'role') => {
    try {
      // Prevent users from granting permissions to themselves
      if (type === 'user' && entity.id === currentUserId) {
        showError('Cannot Add Permission', 'You cannot grant permissions to yourself');
        return;
      }

      // Determine entity type
      let granteeType: GranteeType;
      if (type === 'user') {
        granteeType = GranteeType.USER;
      } else if (type === 'group') {
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

  // Delete confirmation modal state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [granteeToDelete, setGranteeToDelete] = useState<{ id: string; name: string; inherits: boolean } | null>(null);

  const removePermission = (granteeId: string, granteeName: string, inherits: boolean) => {
    setGranteeToDelete({ id: granteeId, name: granteeName, inherits });
    setShowDeleteConfirmation(true);
  };

  const confirmRemovePermission = async () => {
    if (!granteeToDelete) return;

    try {
      // Optimistic removal
      removeGrantFromList(granteeToDelete.id, (g) => g.grantee?.id);

      // Delete from backend
      await notificationApiClient.deleteFolderShared(folder.id, granteeToDelete.id, granteeToDelete.inherits);

      // Close confirmation modal
      setShowDeleteConfirmation(false);
      setGranteeToDelete(null);
    } catch (error) {
      console.error('Error removing permission:', error);
      // Refresh to restore on error
      fetchPermissions(false);
      setShowDeleteConfirmation(false);
      setGranteeToDelete(null);
    }
  };

  const cancelRemovePermission = () => {
    setShowDeleteConfirmation(false);
    setGranteeToDelete(null);
  };

  const updatePermission = (grant: TypeShareAccessRes) => {
    try {
      if (!grant.grantee) return;

      // Use type from response if available, otherwise determine from grantee
      let granteeType: GranteeType = grant.type;
      if (!granteeType) {
        if (isUser(grant.grantee)) {
          granteeType = GranteeType.USER;
        } else if (isGroup(grant.grantee)) {
          granteeType = GranteeType.GROUP;
        } else {
          granteeType = GranteeType.ROLE;
        }
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

    // Prevent users from granting permissions to themselves
    if (editingGrant.type === GranteeType.USER && editingGrant.grantee.id === currentUserId) {
      showError('Cannot Grant Permission', 'You cannot grant permissions to yourself');
      return;
    }

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
    } catch (error: any) {
      console.error('Error saving permission:', error);
      // Check if error is about self-granting
      if (error?.response?.status === 400 || error?.message?.includes('cannot grant permissions to yourself')) {
        showError('Cannot Grant Permission', 'You cannot grant permissions to yourself');
      }
    }
  };

  // Simple close handler - no unsaved changes to worry about
  const handleClose = () => {
    onClose();
  };

  // Add Entity Buttons Component
  const AddEntityButtons = () => (
    <div className="flex gap-3 mb-4">
      <button
        onClick={handleAddUser}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${selectedEntityType === 'user'
          ? 'bg-primary text-white shadow-md shadow-primary/20 ring-2 ring-primary ring-offset-2'
          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
          }`}
      >
        <div className={`p-1.5 rounded-lg ${selectedEntityType === 'user' ? 'bg-white/20' : 'bg-blue-50'}`}>
          <User className={`h-4 w-4 ${selectedEntityType === 'user' ? 'text-white' : 'text-blue-600'}`} />
        </div>
        Add User
      </button>
      <button
        onClick={handleAddGroup}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${selectedEntityType === 'group'
          ? 'bg-primary text-white shadow-md shadow-primary/20 ring-2 ring-primary ring-offset-2'
          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
          }`}
      >
        <div className={`p-1.5 rounded-lg ${selectedEntityType === 'group' ? 'bg-white/20' : 'bg-green-50'}`}>
          <Users className={`h-4 w-4 ${selectedEntityType === 'group' ? 'text-white' : 'text-green-600'}`} />
        </div>
        Add Group
      </button>
      <button
        onClick={handleAddRole}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${selectedEntityType === 'role'
          ? 'bg-primary text-white shadow-md shadow-primary/20 ring-2 ring-primary ring-offset-2'
          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
          }`}
      >
        <div className={`p-1.5 rounded-lg ${selectedEntityType === 'role' ? 'bg-white/20' : 'bg-purple-50'}`}>
          <Shield className={`h-4 w-4 ${selectedEntityType === 'role' ? 'text-white' : 'text-purple-600'}`} />
        </div>
        Add Role
      </button>
    </div>
  );

  // SearchableSelect component
  const SearchableSelect = () => (
    <div className="relative searchable-select-container">
      {selectedEntityType && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-primary transition-colors" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={`Search ${selectedEntityType}s to add permissions...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all shadow-sm"
            />
            {searching ? (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <button
                onClick={handleCloseDropdown}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {showSearchDropdown && availableEntities.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl shadow-gray-200/50 max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
              <div className="p-1.5 space-y-0.5">
                {availableEntities.map((entity: any) => (
                  <button
                    key={entity.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (selectedEntityType) {
                        addPermission(entity, selectedEntityType);
                      }
                    }}
                    className="w-full px-3 py-2.5 text-left rounded-lg hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      {/* User - Show Avatar */}
                      {'username' in entity && (
                        <>
                          <UserAvatar user={entity as UserDto} size="md" className="ring-2 ring-white shadow-sm" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate group-hover:text-primary transition-colors">
                              {`${entity.firstName || ''} ${entity.lastName || ''}`.trim() || entity.username}
                            </div>
                            <div className="text-xs text-gray-500 truncate flex items-center gap-1.5">
                              <span className="font-medium text-gray-400">@</span>
                              {entity.username}
                              {entity.email && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                                  <span>{entity.email}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Group - Show Icon */}
                      {'userCount' in entity && (
                        <>
                          <div className="p-2.5 bg-green-50 text-green-600 rounded-lg shrink-0 ring-1 ring-green-100 group-hover:bg-green-100 group-hover:text-green-700 transition-colors">
                            <Users className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate group-hover:text-primary transition-colors">{entity.name}</div>
                            <div className="text-xs text-gray-500 truncate">{entity.description || 'Group'}</div>
                          </div>
                          <div className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
                            {entity.userCount || 0} members
                          </div>
                        </>
                      )}

                      {/* Role - Show Icon */}
                      {!('username' in entity) && !('userCount' in entity) && (
                        <>
                          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg shrink-0 ring-1 ring-purple-100 group-hover:bg-purple-100 group-hover:text-purple-700 transition-colors">
                            <Shield className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate group-hover:text-primary transition-colors">{entity.name}</div>
                            <div className="text-xs text-gray-500 truncate">{entity.description || 'Role'}</div>
                          </div>
                        </>
                      )}

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (!isOpen || !isClient) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg border border-ui w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-100 bg-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Folder className="h-5 w-5 text-primary" />
              </div>
              Edit Folder Permissions
            </h2>
            <p className="text-sm text-gray-500 mt-1 ml-11">
              Manage access and permissions for <span className="font-medium text-gray-900">"{folder.name}"</span>
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Header */}
        <div className="border-b border-gray-100 bg-gray-50/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Add Permissions</h3>
            <div className="text-xs font-medium px-2.5 py-1 bg-white border border-gray-200 rounded-full text-gray-600 shadow-sm">
              {totalElements} active grant{totalElements !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="space-y-4">
            <AddEntityButtons />
            <SearchableSelect />
          </div>

          {!selectedEntityType && (
            <ServerSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search existing permissions..."
              className="mt-4"
            />
          )}
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

                // Determine grantee type and icon - use type from response if available
                let granteeType: GranteeType = grant.type;
                let IconComponent: React.ComponentType<{ className?: string }> = User;
                let displayName: string = '';
                let displaySubtitle: string = '';

                // If type not in response, determine from grantee
                if (!granteeType) {
                  if (isUser(grantee)) {
                    granteeType = GranteeType.USER;
                  } else if (isGroup(grantee)) {
                    granteeType = GranteeType.GROUP;
                  } else {
                    granteeType = GranteeType.ROLE;
                  }
                }

                // Set icon and display info based on type
                if (granteeType === GranteeType.USER && isUser(grantee)) {
                  const user = grantee as UserDto;
                  IconComponent = User;
                  displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
                  displaySubtitle = `@${user.username}${user.email ? ` • ${user.email}` : ''}`;
                } else if (granteeType === GranteeType.GROUP && isGroup(grantee)) {
                  const group = grantee as GroupDto;
                  IconComponent = Users;
                  displayName = group.name;
                  // Show user count or user list if available
                  if (group.users && group.users.length > 0) {
                    const userList = group.users.slice(0, 3).join(', ');
                    const extraCount = group.users.length > 3 ? ` +${group.users.length - 3} more` : '';
                    displaySubtitle = group.description
                      ? `${group.description} • ${group.users.length} member${group.users.length !== 1 ? 's' : ''}: ${userList}${extraCount}`
                      : `${group.users.length} member${group.users.length !== 1 ? 's' : ''}: ${userList}${extraCount}`;
                  } else if (group.userCount !== undefined) {
                    displaySubtitle = group.description
                      ? `${group.description} • ${group.userCount} member${group.userCount !== 1 ? 's' : ''}`
                      : `${group.userCount} member${group.userCount !== 1 ? 's' : ''}`;
                  } else {
                    displaySubtitle = group.description || 'Group';
                  }
                } else if (granteeType === GranteeType.ROLE) {
                  const role = grantee as RoleDto;
                  IconComponent = Shield;
                  displayName = role.name;
                  displaySubtitle = role.description || 'Role';
                }

                // Get active permissions for display
                const activePerms = [];
                if (grant.permission?.canView) activePerms.push('View');
                if (grant.permission?.canUpload) activePerms.push('Upload');
                if (grant.permission?.canEdit) activePerms.push('Edit');
                if (grant.permission?.canDelete) activePerms.push('Delete');
                if (grant.permission?.canManagePermissions) activePerms.push('Manage Permissions');
                if (grant.permission?.canCreateSubFolders) activePerms.push('Create Subfolders');
                if (grant.permission?.canEditDoc) activePerms.push('Edit Docs');
                if (grant.permission?.canDeleteDoc) activePerms.push('Delete Docs');
                if (grant.permission?.canManagePermissionsDoc) activePerms.push('Manage Doc Permissions');


                return (
                  <div key={grantee.id} className="group bg-white border border-gray-200 rounded-xl hover:border-primary/30 hover:shadow-md transition-all duration-200">
                    <div className="p-4 flex justify-between items-start gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {isUser(grantee) ? (
                          <UserAvatar user={grantee} size="md" className="ring-2 ring-white shadow-sm shrink-0" />
                        ) : (
                          <div className={`p-2.5 rounded-lg shrink-0 ${isGroup(grantee) ? 'bg-green-50 text-green-600' : 'bg-purple-50 text-purple-600'
                            }`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <div className="font-semibold text-gray-900 truncate">
                              {displayName}
                            </div>
                            {grant.permission.inherits && (
                              <div className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] uppercase font-bold tracking-wider rounded border border-gray-200" title="Inherits to subfolders">
                                Inherits
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 truncate mb-3">
                            {displaySubtitle}
                          </div>

                          {/* Show permissions inline */}
                          <div className="flex flex-wrap gap-1.5">
                            {activePerms.slice(0, 6).map((perm) => (
                              <span key={perm} className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-100/50">
                                {perm}
                              </span>
                            ))}
                            {activePerms.length > 6 && (
                              <span className="inline-flex items-center px-2 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-md border border-gray-100">
                                +{activePerms.length - 6} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updatePermission(grant);
                          }}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                          title="Edit Permissions"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const granteeName = isUser(grantee)
                              ? (() => {
                                const user = grantee as UserDto;
                                return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
                              })()
                              : grantee.name;
                            removePermission(grantee.id, granteeName, grant.permission.inherits);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          disabled={loading}
                          title="Remove Access"
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
                      ? (() => {
                        const user = editingGrant.grantee as UserDto;
                        return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
                      })()
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
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive ? color : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
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

              {/* Individual Permissions - Split into Folder and Document */}
              <div className="space-y-6 mb-6">
                {/* Folder Permissions Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Folder className="h-4 w-4 text-primary" />
                    <label className="text-sm font-semibold text-neutral-text-dark">Folder Permissions</label>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pl-6">
                    <label className="flex items-center gap-2 px-3 py-2.5 border border-ui rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={tempPermission.canView}
                        onChange={(e) => setTempPermission({ ...tempPermission, canView: e.target.checked })}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Eye className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">View</span>
                    </label>

                    <label className="flex items-center gap-2 px-3 py-2.5 border border-ui rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={tempPermission.canEdit}
                        onChange={(e) => setTempPermission({ ...tempPermission, canEdit: e.target.checked })}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Edit className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Edit</span>
                    </label>

                    <label className="flex items-center gap-2 px-3 py-2.5 border border-ui rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={tempPermission.canDelete}
                        onChange={(e) => setTempPermission({ ...tempPermission, canDelete: e.target.checked })}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Trash2 className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Delete</span>
                    </label>

                    <label className="flex items-center gap-2 px-3 py-2.5 border border-ui rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={tempPermission.canCreateSubFolders}
                        onChange={(e) => setTempPermission({ ...tempPermission, canCreateSubFolders: e.target.checked })}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Folder className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Create Subfolders</span>
                    </label>

                    <label className="flex items-center gap-2 px-3 py-2.5 border border-ui rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={tempPermission.canManagePermissions}
                        onChange={(e) => setTempPermission({ ...tempPermission, canManagePermissions: e.target.checked })}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Settings className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Manage Permissions</span>
                    </label>
                  </div>
                </div>

                {/* Document Permissions Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-primary" />
                    <label className="text-sm font-semibold text-neutral-text-dark">Document Permissions</label>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pl-6">
                    <label className="flex items-center gap-2 px-3 py-2.5 border border-ui rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={tempPermission.canUpload}
                        onChange={(e) => setTempPermission({ ...tempPermission, canUpload: e.target.checked })}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Upload className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Upload</span>
                    </label>

                    <label className="flex items-center gap-2 px-3 py-2.5 border border-ui rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={tempPermission.canEditDoc}
                        onChange={(e) => setTempPermission({ ...tempPermission, canEditDoc: e.target.checked })}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Edit className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Edit</span>
                    </label>

                    <label className="flex items-center gap-2 px-3 py-2.5 border border-ui rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={tempPermission.canDeleteDoc}
                        onChange={(e) => setTempPermission({ ...tempPermission, canDeleteDoc: e.target.checked })}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Trash2 className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Delete</span>
                    </label>

                    <label className="flex items-center gap-2 px-3 py-2.5 border border-ui rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={tempPermission.canManagePermissionsDoc}
                        onChange={(e) => setTempPermission({ ...tempPermission, canManagePermissionsDoc: e.target.checked })}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Settings className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Manage Permissions</span>
                    </label>
                  </div>
                </div>

                {/* Inheritance Option */}
                <div>
                  <label className="flex items-center gap-2 px-3 py-2.5 border border-ui rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={tempPermission.inherits}
                      onChange={(e) => setTempPermission({ ...tempPermission, inherits: e.target.checked })}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700">Inherit to Subfolders</span>
                      <p className="text-xs text-gray-500 mt-0.5">Apply these permissions to all subfolders</p>
                    </div>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && granteeToDelete && (
        <ConfirmationModal
          isOpen={showDeleteConfirmation}
          onClose={cancelRemovePermission}
          onConfirm={confirmRemovePermission}
          title="Remove Permission"
          message="Are you sure you want to remove this permission?"
          confirmText="Remove"
          cancelText="Cancel"
          variant="destructive"
          loading={loading}
          itemName={granteeToDelete.name}
          itemType="user"
        />
      )}
    </div>
  );
}
