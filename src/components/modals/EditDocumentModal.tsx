'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Folder, 
  Plus, 
  Trash2, 
  Users, 
  Shield, 
  User,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  Edit,
  Eye,
  Upload,
  Share2,
  Settings,
  Save
} from 'lucide-react';
import { notificationApiClient } from '@/api/notificationClient';
import { 
  UserDto, 
  GroupDto, 
  RoleDto, 
  DocumentResponseDto,
  TypeShareAccessRes,
  TypeShareAccessDocumentRes,
  TypeShareAccessWithTypeReq,
  TypeShareAccessDocWithTypeReq,
  FolderPermissionReq,
  DocumentPermissionReq,
  GranteeType
} from '@/types/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentResponseDto;
  onSuccess: () => void;
}

interface UserPermission {
  id: string;
  permission: DocumentPermissionReq;
}

interface GroupPermission {
  id: string;
  permission: DocumentPermissionReq;
}

interface RolePermission {
  id: string;
  permission: DocumentPermissionReq;
}

const PERMISSION_PRESETS = {
  viewOnly: {
    canView: true,
    canUpload: false,
    canEdit: false,
    canDelete: false,
    canShare: false,
    canManagePermissions: false
  },
  upload: {
    canView: true,
    canUpload: true,
    canEdit: false,
    canDelete: false,
    canShare: false,
    canManagePermissions: false
  },
  edit: {
    canView: true,
    canUpload: true,
    canEdit: true,
    canDelete: false,
    canShare: false,
    canManagePermissions: false
  },
  full: {
    canView: true,
    canUpload: true,
    canEdit: true,
    canDelete: true,
    canShare: true,
    canManagePermissions: true
  }
};

export default function EditDocumentModal({ isOpen, onClose, document, onSuccess }: EditDocumentModalProps) {
  const { data: session } = useSession();
  
  // Get current user info
  const currentUser = session?.user;
  
  // Client-side only check
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // All grants in one unified list
  const [allGrants, setAllGrants] = useState<TypeShareAccessDocumentRes[]>([]);
  
  // Available entities for adding new grants
  const [users, setUsers] = useState<UserDto[]>([]);
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGrants, setFilteredGrants] = useState<TypeShareAccessDocumentRes[]>([]);
  const [availableEntities, setAvailableEntities] = useState<(UserDto | GroupDto | RoleDto)[]>([]);
  
  // Search dropdown states
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedEntityType, setSelectedEntityType] = useState<'user' | 'group' | 'role' | null>(null);
  
  // Ref to maintain input focus
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Edit permission popup state
  const [editingGrant, setEditingGrant] = useState<TypeShareAccessDocumentRes | null>(null);
  const [tempPermission, setTempPermission] = useState<DocumentPermissionReq | null>(null);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  
  // Collapsible panels state
  const [collapsedPermissions, setCollapsedPermissions] = useState<Record<string, boolean>>({});

  // Load initial data
  const loadInitialData = async () => {
    try {
      setLoadingPermissions(true);
 
        loadUsers()
        loadGroups()
        loadRoles()
        const permissionsResponse = await notificationApiClient.getDocumentShared(document.documentId, { size: 100 });
        setAllGrants(permissionsResponse.content)
        

    } catch (error) {
      console.error('Error loading document permissions:', error);
    } 
    setLoadingPermissions(false);
  };

  const loadUsers = async () => {
    try {
      const response = await notificationApiClient.getAllUsers({ page: 0, size: 100 }, { silent: true });
      setUsers(response);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await notificationApiClient.getAllGroups({ page: 0, size: 100 }, { silent: true });
      setGroups(response);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await notificationApiClient.getAllRoles({ page: 0, size: 100 }, { silent: true });
      setRoles(response);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen, document.documentId]);

  // Filter grants locally
  useEffect(() => {
    if (!allGrants) return;
    
    const searchLower = searchQuery.toLowerCase();
    const filtered = allGrants.filter(grant => {
      const grantee = grant.grantee;
      if (grantee.username) {
        // User
        return (
          grantee.username?.toLowerCase().includes(searchLower) ||
          grantee.firstName?.toLowerCase().includes(searchLower) ||
          grantee.lastName?.toLowerCase().includes(searchLower) ||
          grantee.email?.toLowerCase().includes(searchLower)
        );
      } else if (grantee.path) {
        // Group
        return (
          grantee.name?.toLowerCase().includes(searchLower) ||
          grantee.path?.toLowerCase().includes(searchLower)
        );
      } else {
        // Role
        return (
          grantee.name?.toLowerCase().includes(searchLower) ||
          grantee.description?.toLowerCase().includes(searchLower)
        );
      }
    });
    setFilteredGrants(filtered);
  }, [searchQuery, allGrants]);

  // Filter available entities for adding
  useEffect(() => {
    if (!users || !groups || !roles || !selectedEntityType) return;
    
    const searchLower = searchQuery.toLowerCase();
    let entities: (UserDto | GroupDto | RoleDto)[] = [];
    
    // Filter by selected entity type
    switch (selectedEntityType) {
      case 'user':
        entities = users;
        break;
      case 'group':
        entities = groups;
        break;
      case 'role':
        entities = roles;
        break;
    }
    
    const filtered = entities.filter(entity => {
      // Check if already has permission
      const hasPermission = allGrants.some(grant => grant.grantee.id === entity.id);
      if (hasPermission) return false;
      
      // Check search match
      if ('username' in entity) {
        // User
        return (
          entity.username?.toLowerCase().includes(searchLower) ||
          entity.firstName?.toLowerCase().includes(searchLower) ||
          entity.lastName?.toLowerCase().includes(searchLower) ||
          entity.email?.toLowerCase().includes(searchLower)
        );
      } else if ('path' in entity) {
        // Group
        return (
          entity.name?.toLowerCase().includes(searchLower) ||
          entity.path?.toLowerCase().includes(searchLower)
        );
      } else {
        // Role
        return (
          entity.name?.toLowerCase().includes(searchLower) ||
          entity.description?.toLowerCase().includes(searchLower)
        );
      }
    });
    
    setAvailableEntities(filtered);
  }, [searchQuery, users, groups, roles, allGrants, selectedEntityType]);

  // Debounced API search for available entities
  useEffect(() => {
    if (searchQuery.trim().length >= 2 && selectedEntityType) {
      const performSearch = async () => {
        try {
          setSearching(true);
          
          switch (selectedEntityType) {
            case 'user':
              const usersResponse = await notificationApiClient.getAllUsers({ page: 0, size: 100, query: searchQuery }, { silent: true });
              setUsers(prev => {
                const existingIds = new Set(prev.map(user => user.id));
                const newUsers = usersResponse.filter((user: UserDto) => !existingIds.has(user.id));
                return [...prev, ...newUsers];
              });
              break;
            case 'group':
              const groupsResponse = await notificationApiClient.getAllGroups({ page: 0, size: 100, search: searchQuery }, { silent: true });
              setGroups(prev => {
                const existingIds = new Set(prev.map(group => group.id));
                const newGroups = groupsResponse.filter((group: GroupDto) => !existingIds.has(group.id));
                return [...prev, ...newGroups];
              });
              break;
            case 'role':
              const rolesResponse = await notificationApiClient.getAllRoles({ page: 0, size: 100, search: searchQuery }, { silent: true });
              setRoles(prev => {
                const existingIds = new Set(prev.map(role => role.id));
                const newRoles = rolesResponse.filter((role: RoleDto) => !existingIds.has(role.id));
                return [...prev, ...newRoles];
              });
              break;
          }
        } catch (error) {
          console.error('Error searching entities:', error);
        } finally {
          setSearching(false);
        }
      };
      
      const timeoutId = setTimeout(performSearch, 500);
      return () => clearTimeout(timeoutId);
    }
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
      if (typeof window !== 'undefined' && window.document) {
        window.document.addEventListener('mousedown', handleClickOutside);
      }
    } catch (error) {
      console.warn('Failed to add event listener:', error);
      return;
    }

    return () => {
      try {
        if (typeof window !== 'undefined' && window.document) {
          window.document.removeEventListener('mousedown', handleClickOutside);
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
  const handleAddUser = () => {
    setSelectedEntityType('user');
    setSearchQuery('');
    setShowSearchDropdown(true);
    // Focus input after state update
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 0);
  };

  const handleAddGroup = () => {
    setSelectedEntityType('group');
    setSearchQuery('');
    setShowSearchDropdown(true);
    // Focus input after state update
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 0);
  };

  const handleAddRole = () => {
    setSelectedEntityType('role');
    setSearchQuery('');
    setShowSearchDropdown(true);
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

  // Permission management functions with immediate API calls
  const addPermission = async (entity: UserDto | GroupDto | RoleDto) => {
    try {
      // Determine entity type
      let granteeType: GranteeType;
      if ('username' in entity) {
        granteeType = GranteeType.USER;
      } else if ('path' in entity) {
        granteeType = GranteeType.GROUP;
      } else {
        granteeType = GranteeType.ROLE;
      }

      const permissionData: TypeShareAccessDocWithTypeReq = {
        granteeId: entity.id,
        permission: PERMISSION_PRESETS.viewOnly,
        type: granteeType
      };

      // Send API request immediately
      const newGrant = await notificationApiClient.createOrUpdateDocumentShared(document.documentId, permissionData);
      
      // Update local state
      setAllGrants(prev => [...prev, newGrant]);
      handleCloseDropdown();
    } catch (error) {
      console.error('Error adding permission:', error);
    }
  };

  const removePermission = async (granteeId: string) => {
    try {
      // Send API request immediately
      await notificationApiClient.deleteDocumentShared(document.documentId, granteeId);
      
      // Update local state
      setAllGrants(prev => prev.filter(grant => 
        grant.grantee.id !== granteeId
      ));
    } catch (error) {
      console.error('Error removing permission:', error);
    }
  };

  const updatePermission = async (granteeId: string, permission: FolderPermissionReq, granteeType: GranteeType) => {
    try {
      const permissionData: TypeShareAccessDocWithTypeReq = {
        granteeId,
        permission,
        type: granteeType
      };

      // Send API request immediately
      const updatedGrant = await notificationApiClient.createOrUpdateDocumentShared(document.documentId, permissionData);
      
      // Update local state
      setAllGrants(prev => prev.map(grant => 
        grant.grantee.id === granteeId ? updatedGrant : grant
      ));
    } catch (error) {
      console.error('Error updating permission:', error);
    }
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
                  <div className="flex items-center gap-2">
                    {'username' in entity && <User className="h-4 w-4 text-neutral-text-light" />}
                    {'path' in entity && <Users className="h-4 w-4 text-neutral-text-light" />}
                    {'description' in entity && <Shield className="h-4 w-4 text-neutral-text-light" />}
                    <div>
                      {'username' in entity && (
                        <div>
                          <div className="font-medium">
                            {`${entity.firstName || ''} ${entity.lastName || ''}`.trim() || entity.username}
                          </div>
                          <div className="text-xs text-neutral-text-light">
                            @{entity.username}{entity.email ? ` • ${entity.email}` : ''}
                          </div>
                        </div>
                      )}
                      {'path' in entity && (
                        <div>
                          <div className="font-medium">{entity.name}</div>
                          <div className="text-xs text-neutral-text-light">{entity.path}</div>
                        </div>
                      )}
                      {'description' in entity && (
                        <div>
                          <div className="font-medium">{entity.name}</div>
                          <div className="text-xs text-neutral-text-light">{entity.description}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  const PermissionControls = ({ permission, granteeId, granteeType }: any) => {
    const detectPreset = (perm: FolderPermissionReq) => {
      if (JSON.stringify(perm) === JSON.stringify(PERMISSION_PRESETS.viewOnly)) return 'viewOnly';
      if (JSON.stringify(perm) === JSON.stringify(PERMISSION_PRESETS.upload)) return 'upload';
      if (JSON.stringify(perm) === JSON.stringify(PERMISSION_PRESETS.edit)) return 'edit';
      if (JSON.stringify(perm) === JSON.stringify(PERMISSION_PRESETS.full)) return 'full';
      return 'custom';
    };

    const handleEditClick = () => {
      const grant = allGrants.find(g => g.grantee.id === granteeId);
      if (grant) {
        setEditingGrant(grant);
        setTempPermission({ ...grant.permission });
      }
    };

    return (
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-text-light">
          Current: {detectPreset(permission).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
        </div>
        <button
          onClick={handleEditClick}
          className="flex items-center gap-2 px-3 py-1 bg-primary text-surface rounded text-sm hover:bg-primary-dark transition-colors"
        >
          <Edit className="h-3 w-3" />
          Edit
        </button>
      </div>
    );
  };

  const handleClose = () => {
    onClose();
  };

  const handleSavePermission = async () => {
    if (!editingGrant || !tempPermission) return;
    
    try {
      setLoading(true);
      
      // Determine grantee type
      let granteeType: GranteeType;
      if (editingGrant.grantee.username) {
        granteeType = GranteeType.USER;
      } else if (editingGrant.grantee.path) {
        granteeType = GranteeType.GROUP;
      } else {
        granteeType = GranteeType.ROLE;
      }

      const permissionData: TypeShareAccessDocWithTypeReq = {
        granteeId: editingGrant.grantee.id,
        permission: tempPermission,
        type: granteeType
      };

      // Send API request
      const updatedGrant = await notificationApiClient.createOrUpdateDocumentShared(document.documentId, permissionData);
      
      // Update local state
      setAllGrants(prev => prev.map(grant => 
        grant.grantee.id === editingGrant.grantee.id ? updatedGrant : grant
      ));
      
      // Close popup
      setEditingGrant(null);
      setTempPermission(null);
    } catch (error) {
      console.error('Error updating permission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingGrant(null);
    setTempPermission(null);
  };

  if (!isOpen || !isClient) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg border border-ui w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-ui">
          <div>
            <h2 className="text-xl font-semibold text-neutral-text-dark">
              Edit Document Permissions
            </h2>
            <p className="text-sm text-neutral-text-light mt-1">
              Manage permissions for "{document.name}"
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-neutral-background transition-colors"
          >
            <X className="h-5 w-5 text-neutral-text-light" />
          </button>
        </div>

        {/* Search Header */}
        <div className="border-b border-ui p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-neutral-text-dark">Document Permissions</h3>
            <div className="text-sm text-neutral-text-light">
              {allGrants.length} grant{allGrants.length !== 1 ? 's' : ''} with access
            </div>
          </div>
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
          ) : filteredGrants.length === 0 ? (
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
              {filteredGrants.map((grant, index) => {
                const grantee = grant.grantee;
                const panelKey = `grant-${index}`;
                const isCollapsed = collapsedPermissions[panelKey];
                
                // Determine grantee type and icon
                let granteeType: GranteeType;
                let IconComponent;
                let displayName;
                let displaySubtitle;
                
                if (grantee.username) {
                  // User
                  granteeType = GranteeType.USER;
                  IconComponent = User;
                  displayName = `${grantee.firstName || ''} ${grantee.lastName || ''}`.trim() || grantee.username;
                  displaySubtitle = `@${grantee.username}${grantee.email ? ` • ${grantee.email}` : ''}`;
                } else if (grantee.path) {
                  // Group
                  granteeType = GranteeType.GROUP;
                  IconComponent = Users;
                  displayName = grantee.name;
                  displaySubtitle = grantee.path;
                } else {
                  // Role
                  granteeType = GranteeType.ROLE;
                  IconComponent = Shield;
                  displayName = grantee.name;
                  displaySubtitle = grantee.description || 'Role';
                }
                
                return (
                  <div key={grantee.id} className="border border-ui rounded-lg">
                    <div 
                      className="p-4 border-b border-ui flex justify-between items-center cursor-pointer hover:bg-neutral-background/50 transition-colors"
                      onClick={() => togglePermissionPanel(panelKey)}
                    >
                      <div className="flex items-center gap-3">
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4 text-neutral-text-light" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-neutral-text-light" />
                        )}
                        <IconComponent className="h-5 w-5 text-neutral-text-light" />
                        <div>
                          <div className="font-medium text-neutral-text-dark">{displayName}</div>
                          <div className="text-sm text-neutral-text-light">{displaySubtitle}</div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removePermission(grantee.id); }}
                        className="p-2 text-error hover:bg-error/10 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {!isCollapsed && (
                      <div className="p-4">
                        <PermissionControls
                          permission={grant.permission}
                          granteeId={grantee.id}
                          granteeType={granteeType}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center p-6 border-t border-ui bg-neutral-background">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-ui rounded-lg text-neutral-text-dark hover:bg-surface transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Edit Permission Popup */}
      {editingGrant && tempPermission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-surface rounded-lg border border-ui w-full max-w-md">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-ui">
              <div>
                <h3 className="text-lg font-semibold text-neutral-text-dark">
                  Edit Permissions
                </h3>
                <p className="text-sm text-neutral-text-light">
                  {editingGrant.grantee.username ? 
                    `${editingGrant.grantee.firstName || ''} ${editingGrant.grantee.lastName || ''}`.trim() || editingGrant.grantee.username :
                    editingGrant.grantee.name
                  }
                </p>
              </div>
              <button
                onClick={handleCancelEdit}
                className="p-2 rounded-lg hover:bg-neutral-background transition-colors"
              >
                <X className="h-5 w-5 text-neutral-text-light" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Permission Presets */}
              <div>
                <label className="block text-sm font-medium text-neutral-text-dark mb-2">
                  Permission Preset
                </label>
                <Select 
                  value={Object.keys(PERMISSION_PRESETS).find(preset => 
                    JSON.stringify(PERMISSION_PRESETS[preset as keyof typeof PERMISSION_PRESETS]) === JSON.stringify(tempPermission)
                  ) || 'custom'}
                  onValueChange={(preset) => {
                    if (preset !== 'custom') {
                      setTempPermission(PERMISSION_PRESETS[preset as keyof typeof PERMISSION_PRESETS] as FolderPermissionReq);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewOnly">View Only</SelectItem>
                    <SelectItem value="upload">Upload</SelectItem>
                    <SelectItem value="edit">Edit</SelectItem>
                    <SelectItem value="full">Full Access</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Individual Permissions */}
              <div>
                <label className="block text-sm font-medium text-neutral-text-dark mb-2">
                  Individual Permissions
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={tempPermission.canView}
                      onChange={(e) => setTempPermission(prev => prev ? { ...prev, canView: e.target.checked } : null)}
                      className="rounded border-ui"
                    />
                    <Eye className="h-4 w-4" />
                    View
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={tempPermission.canUpload}
                      onChange={(e) => setTempPermission(prev => prev ? { ...prev, canUpload: e.target.checked } : null)}
                      className="rounded border-ui"
                    />
                    <Upload className="h-4 w-4" />
                    Upload
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={tempPermission.canEdit}
                      onChange={(e) => setTempPermission(prev => prev ? { ...prev, canEdit: e.target.checked } : null)}
                      className="rounded border-ui"
                    />
                    <Edit className="h-4 w-4" />
                    Edit
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={tempPermission.canDelete}
                      onChange={(e) => setTempPermission(prev => prev ? { ...prev, canDelete: e.target.checked } : null)}
                      className="rounded border-ui"
                    />
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={tempPermission.canShare}
                      onChange={(e) => setTempPermission(prev => prev ? { ...prev, canShare: e.target.checked } : null)}
                      className="rounded border-ui"
                    />
                    <Share2 className="h-4 w-4" />
                    Share
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={tempPermission.canManagePermissions}
                      onChange={(e) => setTempPermission(prev => prev ? { ...prev, canManagePermissions: e.target.checked } : null)}
                      className="rounded border-ui"
                    />
                    <Settings className="h-4 w-4" />
                    Manage
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end items-center p-6 border-t border-ui bg-neutral-background gap-3">
              <button
                onClick={handleCancelEdit}
                disabled={loading}
                className="px-4 py-2 border border-ui rounded-lg text-neutral-text-dark hover:bg-surface transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePermission}
                disabled={loading}
                className="flex items-center gap-2 bg-primary text-surface px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-surface border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
