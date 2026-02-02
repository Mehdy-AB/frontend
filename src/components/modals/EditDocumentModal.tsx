'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  FileText,
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
  Check,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { documentService } from '@/api/services/documentService';
import { notificationApiClient } from '@/api/notificationClient';
import {
  DocumentPermissionReq,
  UserDto,
  RoleDto,
  GroupDto,
  TypeShareAccessRes,
  TypeShareAccessWithTypeReq,
  GranteeType,
  DocumentResponseDto
} from '@/types/api';
import { useServerSideSearch } from '@/components/main/useServerSideSearch';
import ServerSearchInput from '@/components/main/ServerSearchInput';
import SearchPagination from '@/components/search/SearchPagination';
import UserAvatar from '@/components/main/UserAvatar';
import { useNotifications } from '@/hooks/useNotifications';

interface EditDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentResponseDto;
}

const PERMISSION_PRESETS = {
  viewer: {
    canView: true,
    canEdit: false,
    canDelete: false,
    canManagePermissions: false
  },
  editor: {
    canView: true,
    canEdit: true,
    canDelete: false,
    canManagePermissions: false
  },
  admin: {
    canView: true,
    canEdit: true,
    canDelete: true,
    canManagePermissions: true
  }
};

const PRESET_LABELS = {
  viewer: { label: 'Viewer', color: 'bg-blue-600 text-white' },
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

export default function EditDocumentModal({ isOpen, onClose, document }: EditDocumentModalProps) {
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
      const response = await documentService.getDocumentShared(
        document.documentId,
        {
          page: currentPage,
          size: pageSize,
          search: searchTerm
        }
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
  const [editingGrant, setEditingGrant] = useState<{ grantee: UserDto | GroupDto | RoleDto; permission: DocumentPermissionReq; type: GranteeType; isNew: boolean } | null>(null);
  const [tempPermission, setTempPermission] = useState<DocumentPermissionReq>(PERMISSION_PRESETS.viewer);

  // Delete confirmation modal state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [granteeToDelete, setGranteeToDelete] = useState<{ id: string; name: string } | null>(null);


  // Load permissions when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPermissions(false);
    }
  }, [isOpen, document.documentId]);

  // Load available users for document (those without permissions)
  const loadAvailableUsers = async (search?: string) => {
    try {
      const response = await documentService.getAvailableUsersForDocument(
        document.documentId,
        { page: 0, size: 100, search }
      );
      setUsers(response.content || []);
    } catch (error) {
      console.error('Error loading available users:', error);
    }
  };

  // Load available groups for document (those without permissions)
  const loadAvailableGroups = async (search?: string) => {
    try {
      const response = await documentService.getAvailableGroupsForDocument(
        document.documentId,
        { page: 0, size: 100, search }
      );
      setGroups(response.content || []);
    } catch (error) {
      console.error('Error loading available groups:', error);
    }
  };

  // Load available roles for document (those without permissions)
  const loadAvailableRoles = async (search?: string) => {
    try {
      const response = await documentService.getAvailableRolesForDocument(
        document.documentId,
        { page: 0, size: 100, search }
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

  // Close dropdowns when clicking outside or selecting a grantee
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
      window.document.addEventListener('mousedown', handleClickOutside);
    } catch (error) {
      console.warn('Failed to add event listener:', error);
      return;
    }

    return () => {
      try {
        if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
          window.document.removeEventListener('mousedown', handleClickOutside);
        }
      } catch (error) {
        console.warn('Failed to remove event listener:', error);
      }
    };
  }, [isOpen, isClient]);

  // Close dropdown when a grantee is selected
  const handleAddPermissionWithClose = (entity: UserDto | GroupDto | RoleDto) => {
    addPermission(entity);
    handleCloseDropdown(); // Close dropdown after selection
  };

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
      // Prevent users from granting permissions to themselves
      if (isUser(entity) && entity.id === currentUserId) {
        showError('Cannot Add Permission', 'You cannot grant permissions to yourself');
        return;
      }

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

  const handleRemovePermissionClick = (granteeId: string, granteeName: string) => {
    setGranteeToDelete({ id: granteeId, name: granteeName });
    setShowDeleteConfirmation(true);
  };

  const confirmRemovePermission = async () => {
    if (!granteeToDelete) return;

    try {
      setLoading(true);

      // Optimistic removal
      removeGrantFromList(granteeToDelete.id, (g) => g.grantee?.id);

      // Delete from backend
      await documentService.deleteDocumentShared(document.documentId, granteeToDelete.id);

      // Close confirmation modal
      setShowDeleteConfirmation(false);
      setGranteeToDelete(null);
    } catch (error) {
      console.error('Error removing permission:', error);
      // Refresh to restore on error
      fetchPermissions(false);
    } finally {
      setLoading(false);
    }
  };

  const cancelRemovePermission = () => {
    setShowDeleteConfirmation(false);
    setGranteeToDelete(null);
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
        permission: grant.permission as unknown as DocumentPermissionReq,
        type: granteeType,
        isNew: false
      });
      setTempPermission(grant.permission as unknown as DocumentPermissionReq);
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
        const result = await documentService.createOrUpdateDocumentShared(document.documentId, data);
        addGrantToList(result);
      } else {
        // PUT for update (use updateDocumentShared which should use PUT)
        const result = await documentService.updateDocumentShared(document.documentId, data);
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
                        handleAddPermissionWithClose(entity);
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
                <FileText className="h-5 w-5 text-primary" />
              </div>
              Edit Document Permissions
            </h2>
            <p className="text-sm text-gray-500 mt-1 ml-11">
              Manage access and permissions for <span className="font-medium text-gray-900">"{document.name}"</span>
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
                This document doesn't have any specific permissions set. Only the owner can access it.
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
                  const user = grantee as UserDto;
                  granteeType = GranteeType.USER;
                  IconComponent = User;
                  displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
                  displaySubtitle = `@${user.username}${user.email ? ` • ${user.email}` : ''}`;
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
                const perm = grant.permission as any;
                const activePerms = [];
                if (perm?.canView) activePerms.push('View');
                if (perm?.canEdit) activePerms.push('Edit');
                if (perm?.canDelete) activePerms.push('Delete');
                if (perm?.canManagePermissions) activePerms.push('Manage Permissions');

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
                          onClick={() => updatePermission(grant)}
                          className="p-2 hover:bg-neutral-background rounded-lg text-neutral-text-light hover:text-primary transition-colors"
                          title="Edit Permissions"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRemovePermissionClick(grantee.id, displayName)}
                          className="p-2 hover:bg-red-50 rounded-lg text-neutral-text-light hover:text-red-600 transition-colors"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <SearchPagination
                currentPage={page}
                totalPages={totalPages}
                totalElements={totalElements}
                itemsPerPage={pageSize}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Permission Modal */}
      {showPermissionModal && editingGrant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-surface rounded-lg border border-ui w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center p-4 border-b border-ui">
              <h3 className="text-lg font-semibold text-neutral-text-dark">
                {editingGrant.isNew ? 'Add Permissions' : 'Edit Permissions'}
              </h3>
              <button
                onClick={() => setShowPermissionModal(false)}
                className="p-1 hover:bg-neutral-background rounded"
              >
                <X className="h-5 w-5 text-neutral-text-light" />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4 flex items-center gap-3 p-3 bg-neutral-background rounded-lg">
                {isUser(editingGrant.grantee) ? (
                  <UserAvatar user={editingGrant.grantee as UserDto} size="sm" />
                ) : editingGrant.type === GranteeType.GROUP ? (
                  <Users className="h-8 w-8 text-neutral-text-light" />
                ) : (
                  <Shield className="h-8 w-8 text-neutral-text-light" />
                )}
                <div>
                  <div className="font-medium text-neutral-text-dark">
                    {isUser(editingGrant.grantee)
                      ? (editingGrant.grantee as UserDto).username
                      : (editingGrant.grantee as GroupDto | RoleDto).name}
                  </div>
                  <div className="text-xs text-neutral-text-light">
                    {editingGrant.type}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Presets */}
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(PRESET_LABELS).map(([key, { label, color }]) => (
                    <button
                      key={key}
                      onClick={() => setTempPermission(PERMISSION_PRESETS[key as keyof typeof PERMISSION_PRESETS])}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${JSON.stringify(tempPermission) === JSON.stringify(PERMISSION_PRESETS[key as keyof typeof PERMISSION_PRESETS])
                        ? color + ' border-transparent'
                        : 'bg-surface text-neutral-text-dark border-ui hover:bg-neutral-background'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 border-t border-ui pt-4">
                  <label className="flex items-center justify-between p-2 hover:bg-neutral-background rounded cursor-pointer">
                    <span className="text-sm text-neutral-text-dark">View Document</span>
                    <input
                      type="checkbox"
                      checked={tempPermission.canView}
                      onChange={(e) => setTempPermission({ ...tempPermission, canView: e.target.checked })}
                      className="rounded border-ui text-primary focus:ring-primary"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 hover:bg-neutral-background rounded cursor-pointer">
                    <span className="text-sm text-neutral-text-dark">Edit Document</span>
                    <input
                      type="checkbox"
                      checked={tempPermission.canEdit}
                      onChange={(e) => setTempPermission({ ...tempPermission, canEdit: e.target.checked })}
                      className="rounded border-ui text-primary focus:ring-primary"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 hover:bg-neutral-background rounded cursor-pointer">
                    <span className="text-sm text-neutral-text-dark">Delete Document</span>
                    <input
                      type="checkbox"
                      checked={tempPermission.canDelete}
                      onChange={(e) => setTempPermission({ ...tempPermission, canDelete: e.target.checked })}
                      className="rounded border-ui text-primary focus:ring-primary"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 hover:bg-neutral-background rounded cursor-pointer">
                    <span className="text-sm text-neutral-text-dark">Manage Permissions</span>
                    <input
                      type="checkbox"
                      checked={tempPermission.canManagePermissions}
                      onChange={(e) => setTempPermission({ ...tempPermission, canManagePermissions: e.target.checked })}
                      className="rounded border-ui text-primary focus:ring-primary"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-ui flex justify-end gap-2">
              <button
                onClick={() => setShowPermissionModal(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-text-dark hover:bg-neutral-background rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePermission}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && granteeToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-surface rounded-lg border border-ui w-full max-w-md shadow-xl p-6">
            <h3 className="text-lg font-semibold text-neutral-text-dark mb-2">Remove Access?</h3>
            <p className="text-neutral-text-light mb-6">
              Are you sure you want to remove access for <span className="font-medium text-neutral-text-dark">{granteeToDelete.name}</span>?
              They will no longer be able to access this document.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelRemovePermission}
                className="px-4 py-2 text-sm font-medium text-neutral-text-dark hover:bg-neutral-background rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemovePermission}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Removing...' : 'Remove Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
