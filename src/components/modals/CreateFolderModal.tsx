'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Folder, 
  Plus, 
  Trash2, 
  Users, 
  Shield, 
  FolderTree,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  X,
  Save,
  Search,
  User,
  UserCheck,
  Crown
} from 'lucide-react';
import { notificationApiClient } from '@/api/notificationClient';
import { CreateFolderDto, FolderPermissionReq, UserDto, RoleDto, GroupDto } from '@/types/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId?: number | null;
  parentName?: string;
  onSuccess?: () => void;
}

// Permission types based on your API
interface UserPermission {
  id: string;
  permission: FolderPermissionReq;
}

interface GroupPermission {
  id: string;
  permission: FolderPermissionReq;
}

interface RolePermission {
  id: string;
  permission: FolderPermissionReq;
}


const defaultPermission: FolderPermissionReq = {
  canView: false,
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
  inherits: false
};

const presetPermissions = {
  viewOnly: {
    ...defaultPermission,
    canView: true,
    inherits: true
  },
  contributor: {
    ...defaultPermission,
    canView: true,
    canUpload: true,
    canEditDoc: true,
    inherits: true
  },
  editor: {
    ...defaultPermission,
    canView: true,
    canUpload: true,
    canEdit: true,
    canEditDoc: true,
    canDeleteDoc: true,
    canCreateSubFolders: true,
    inherits: true
  },
  admin: {
    ...defaultPermission,
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
    inherits: false
  }
};

export default function CreateFolderModal({ 
  isOpen, 
  onClose, 
  parentId = null, 
  parentName,
  onSuccess 
}: CreateFolderModalProps) {
  const { data: session } = useSession();
  const [folderData, setFolderData] = useState<CreateFolderDto>({
    name: '',
    description: '',
    parentId: parentId === null ? undefined : parentId,
    usersGevenPermission: [],
    goupesGevenPermission: [],
    rolesGevenPermission: [],
    subgroups: []
  });

  const [users, setUsers] = useState<UserDto[]>([]);
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'permissions' | 'subfolders'>('basic');
  const [expandedSubfolders, setExpandedSubfolders] = useState<number[]>([]);
  
  // Search states
  const [userSearch, setUserSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<UserDto[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<GroupDto[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<RoleDto[]>([]);
  
  // Search dropdown states
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchingGroups, setSearchingGroups] = useState(false);
  const [searchingRoles, setSearchingRoles] = useState(false);
  
  // Selected items for adding to permissions
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupDto | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleDto | null>(null);
  
  // Collapsed permission panels state
  const [collapsedPermissions, setCollapsedPermissions] = useState<{[key: string]: boolean}>({});

  // Toggle collapsed state for permission panels
  const togglePermissionPanel = (key: string) => {
    setCollapsedPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Validation functions
  const isUserAlreadySelected = (userId: string) => {
    return folderData.usersGevenPermission.some(perm => perm.id === userId);
  };

  const isGroupAlreadySelected = (groupId: string) => {
    return folderData.goupesGevenPermission.some(perm => perm.id === groupId);
  };

  const isRoleAlreadySelected = (roleId: string) => {
    return folderData.rolesGevenPermission.some(perm => perm.id === roleId);
  };

  const isCurrentUser = (userId: string) => {
    return session?.user?.id === userId;
  };

  // Debounce refs to prevent infinite loops
  const userSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const groupSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roleSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search functions using refs
  const performUserSearch = async (query: string) => {
    if (query.trim().length < 2) return;
    
    setSearchingUsers(true);
    try {
      const searchResults = await notificationApiClient.getAllUsers({ 
        query: query,
        size: 50
      });
      setUsers(prev => {
        const existingIds = new Set(prev.map(u => u.id));
        const newUsers = searchResults.filter(u => !existingIds.has(u.id));
        return [...prev, ...newUsers];
      });
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchingUsers(false);
    }
  };

  const performGroupSearch = async (query: string) => {
    if (query.trim().length < 2) return;
    
    setSearchingGroups(true);
    try {
      const searchResults = await notificationApiClient.getAllGroups({ 
        query: query,
        size: 50
      });
      setGroups(prev => {
        const existingIds = new Set(prev.map(g => g.id));
        const newGroups = searchResults.filter(g => !existingIds.has(g.id));
        return [...prev, ...newGroups];
      });
    } catch (error) {
      console.error('Error searching groups:', error);
    } finally {
      setSearchingGroups(false);
    }
  };

  const performRoleSearch = async (query: string) => {
    if (query.trim().length < 2) return;
    
    setSearchingRoles(true);
    try {
      const searchResults = await notificationApiClient.getAllRoles({ 
        query: query,
        size: 50
      });
      setRoles(prev => {
        const existingIds = new Set(prev.map(r => r.id));
        const newRoles = searchResults.filter(r => !existingIds.has(r.id));
        return [...prev, ...newRoles];
      });
    } catch (error) {
      console.error('Error searching roles:', error);
    } finally {
      setSearchingRoles(false);
    }
  };

  // Load users, groups, and roles data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load users, groups, and roles from API (100 items each)
        const [usersResponse, groupsResponse, rolesResponse] = await Promise.all([
          notificationApiClient.getAllUsers({ page: 0, size: 100 }, { silent: true }),
          notificationApiClient.getAllGroups({ page: 0, size: 100 }, { silent: true }),
          notificationApiClient.getAllRoles({ page: 0, size: 100 }, { silent: true })
        ]);
        
        setUsers(usersResponse);
        setGroups(groupsResponse);
        setRoles(rolesResponse);
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to empty arrays if API fails
        setUsers([]);
        setGroups([]);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Filter users locally (separate from API search)
  useEffect(() => {
    const filtered = users.filter(user => 
      user.firstName?.toLowerCase().startsWith(userSearch.toLowerCase()) ||
      user.lastName?.toLowerCase().startsWith(userSearch.toLowerCase()) ||
      user.email?.toLowerCase().startsWith(userSearch.toLowerCase()) ||
      user.username?.toLowerCase().startsWith(userSearch.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [userSearch, users]);

  // Debounced API search for users (separate effect)
  useEffect(() => {
    // Clear existing timeout
    if (userSearchTimeoutRef.current) {
      clearTimeout(userSearchTimeoutRef.current);
    }
    
    // Set new timeout for API search
    if (userSearch.trim().length >= 2) {
      userSearchTimeoutRef.current = setTimeout(() => {
        performUserSearch(userSearch);
      }, 500);
    }
    
    // Cleanup function
    return () => {
      if (userSearchTimeoutRef.current) {
        clearTimeout(userSearchTimeoutRef.current);
      }
    };
  }, [userSearch]); // Only depend on userSearch, not users

  // Filter groups locally (separate from API search)
  useEffect(() => {
    const filtered = groups.filter(group => 
      group.name?.toLowerCase().startsWith(groupSearch.toLowerCase()) ||
      group.path?.toLowerCase().startsWith(groupSearch.toLowerCase())
    );
    setFilteredGroups(filtered);
  }, [groupSearch, groups]);

  // Debounced API search for groups (separate effect)
  useEffect(() => {
    // Clear existing timeout
    if (groupSearchTimeoutRef.current) {
      clearTimeout(groupSearchTimeoutRef.current);
    }
    
    // Set new timeout for API search
    if (groupSearch.trim().length >= 2) {
      groupSearchTimeoutRef.current = setTimeout(() => {
        performGroupSearch(groupSearch);
      }, 500);
    }
    
    // Cleanup function
    return () => {
      if (groupSearchTimeoutRef.current) {
        clearTimeout(groupSearchTimeoutRef.current);
      }
    };
  }, [groupSearch]); // Only depend on groupSearch, not groups

  // Filter roles locally (separate from API search)
  useEffect(() => {
    const filtered = roles.filter(role => 
      role.name?.toLowerCase().startsWith(roleSearch.toLowerCase()) ||
      role.description?.toLowerCase().startsWith(roleSearch.toLowerCase())
    );
    setFilteredRoles(filtered);
  }, [roleSearch, roles]);

  // Debounced API search for roles (separate effect)
  useEffect(() => {
    // Clear existing timeout
    if (roleSearchTimeoutRef.current) {
      clearTimeout(roleSearchTimeoutRef.current);
    }
    
    // Set new timeout for API search
    if (roleSearch.trim().length >= 2) {
      roleSearchTimeoutRef.current = setTimeout(() => {
        performRoleSearch(roleSearch);
      }, 500);
    }
    
    // Cleanup function
    return () => {
      if (roleSearchTimeoutRef.current) {
        clearTimeout(roleSearchTimeoutRef.current);
      }
    };
  }, [roleSearch]); // Only depend on roleSearch, not roles

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.searchable-select-container')) {
        setShowUserDropdown(false);
        setShowGroupDropdown(false);
        setShowRoleDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle selection from search dropdowns - auto-add permission
  const handleUserSelect = (user: UserDto) => {
    // Validation checks
    if (isUserAlreadySelected(user.id)) {
      alert('This user is already selected.');
      return;
    }
    
    if (isCurrentUser(user.id)) {
      alert('You cannot assign permissions to yourself.');
      return;
    }
    
    setUserSearch('');
    setShowUserDropdown(false);
    
    // Auto-add user permission
    setFolderData(prev => ({
      ...prev,
      usersGevenPermission: [
        ...prev.usersGevenPermission,
        { id: user.id, permission: { ...presetPermissions.viewOnly } }
      ]
    }));
  };

  const handleGroupSelect = (group: GroupDto) => {
    // Validation check
    if (isGroupAlreadySelected(group.id)) {
      alert('This group is already selected.');
      return;
    }
    
    setGroupSearch('');
    setShowGroupDropdown(false);
    
    // Auto-add group permission
    setFolderData(prev => ({
      ...prev,
      goupesGevenPermission: [
        ...prev.goupesGevenPermission,
        { id: group.id, permission: { ...presetPermissions.viewOnly } }
      ]
    }));
  };

  const handleRoleSelect = (role: RoleDto) => {
    // Validation check
    if (isRoleAlreadySelected(role.id)) {
      alert('This role is already selected.');
      return;
    }
    
    setRoleSearch('');
    setShowRoleDropdown(false);
    
    // Auto-add role permission
    setFolderData(prev => ({
      ...prev,
      rolesGevenPermission: [
        ...prev.rolesGevenPermission,
        { id: role.id, permission: { ...presetPermissions.viewOnly } }
      ]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!folderData.name.trim()) {
      alert('Please enter a folder name');
      return;
    }

    try {
      setSubmitting(true);
      await notificationApiClient.createFolder(folderData);
      
      // Reset form
      setFolderData({
        name: '',
        description: '',
        parentId: parentId === null ? undefined : parentId,
        usersGevenPermission: [],
        goupesGevenPermission: [],
        rolesGevenPermission: [],
        subgroups: []
      });
      setActiveTab('basic');
      
      // Close modal and refresh
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error creating folder:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setFolderData({
        name: '',
        description: '',
        parentId: parentId === null ? undefined : parentId,
        usersGevenPermission: [],
        goupesGevenPermission: [],
        rolesGevenPermission: [],
        subgroups: []
      });
      setActiveTab('basic');
      onClose();
    }
  };

  // Subfolder management
  const addSubfolder = () => {
    setFolderData(prev => ({
      ...prev,
      subgroups: [
        ...prev.subgroups,
        {
          name: '',
          description: '',
          parentId: undefined,
          usersGevenPermission: [],
          goupesGevenPermission: [],
          rolesGevenPermission: [],
          subgroups: []
        }
      ]
    }));
  };

  const updateSubfolder = (path: number[], updates: Partial<CreateFolderDto>) => {
    setFolderData(prev => {
      const newSubgroups = [...prev.subgroups];
      
      if (path.length === 1) {
        // Top-level subfolder
        newSubgroups[path[0]] = { ...newSubgroups[path[0]], ...updates };
      } else {
        // Nested subfolder - recursively update
        const updateNested = (subgroups: CreateFolderDto[], currentPath: number[]): CreateFolderDto[] => {
          if (currentPath.length === 1) {
            return subgroups.map((subfolder, i) => 
              i === currentPath[0] ? { ...subfolder, ...updates } : subfolder
            );
          } else {
            const [currentIndex, ...remainingPath] = currentPath;
            return subgroups.map((subfolder, i) => 
              i === currentIndex 
                ? { ...subfolder, subgroups: updateNested(subfolder.subgroups, remainingPath) }
                : subfolder
            );
          }
        };
        
        newSubgroups[path[0]] = {
          ...newSubgroups[path[0]],
          subgroups: updateNested(newSubgroups[path[0]].subgroups, path.slice(1))
        };
      }
      
      return { ...prev, subgroups: newSubgroups };
    });
  };

  const removeSubfolder = (path: number[]) => {
    setFolderData(prev => {
      const newSubgroups = [...prev.subgroups];
      
      if (path.length === 1) {
        // Top-level subfolder
        return { ...prev, subgroups: newSubgroups.filter((_, i) => i !== path[0]) };
      } else {
        // Nested subfolder - recursively remove
        const removeNested = (subgroups: CreateFolderDto[], currentPath: number[]): CreateFolderDto[] => {
          if (currentPath.length === 1) {
            return subgroups.filter((_, i) => i !== currentPath[0]);
          } else {
            const [currentIndex, ...remainingPath] = currentPath;
            return subgroups.map((subfolder, i) => 
              i === currentIndex 
                ? { ...subfolder, subgroups: removeNested(subfolder.subgroups, remainingPath) }
                : subfolder
            );
          }
        };
        
        newSubgroups[path[0]] = {
          ...newSubgroups[path[0]],
          subgroups: removeNested(newSubgroups[path[0]].subgroups, path.slice(1))
        };
        
        return { ...prev, subgroups: newSubgroups };
      }
    });
  };

  // Permission management - auto-add on selection, no manual add needed

  const updateUserPermission = (index: number, updates: Partial<UserPermission>) => {
    setFolderData(prev => ({
      ...prev,
      usersGevenPermission: prev.usersGevenPermission.map((perm, i) => 
        i === index ? { ...perm, ...updates } : perm
      )
    }));
  };

  const removeUserPermission = (index: number) => {
    setFolderData(prev => ({
      ...prev,
      usersGevenPermission: prev.usersGevenPermission.filter((_, i) => i !== index)
    }));
  };


  const updateGroupPermission = (index: number, updates: Partial<GroupPermission>) => {
    setFolderData(prev => ({
      ...prev,
      goupesGevenPermission: prev.goupesGevenPermission.map((perm, i) => 
        i === index ? { ...perm, ...updates } : perm
      )
    }));
  };

  const removeGroupPermission = (index: number) => {
    setFolderData(prev => ({
      ...prev,
      goupesGevenPermission: prev.goupesGevenPermission.filter((_, i) => i !== index)
    }));
  };


  const updateRolePermission = (index: number, updates: Partial<RolePermission>) => {
    setFolderData(prev => ({
      ...prev,
      rolesGevenPermission: prev.rolesGevenPermission.map((perm, i) => 
        i === index ? { ...perm, ...updates } : perm
      )
    }));
  };

  const removeRolePermission = (index: number) => {
    setFolderData(prev => ({
      ...prev,
      rolesGevenPermission: prev.rolesGevenPermission.filter((_, i) => i !== index)
    }));
  };

  const applyPresetPermission = (permissionIndex: number, preset: keyof typeof presetPermissions, type: 'user' | 'group' | 'role') => {
    const presetPermission = presetPermissions[preset];
    
    switch (type) {
      case 'user':
        updateUserPermission(permissionIndex, { permission: { ...presetPermission } });
        break;
      case 'group':
        updateGroupPermission(permissionIndex, { permission: { ...presetPermission } });
        break;
      case 'role':
        updateRolePermission(permissionIndex, { permission: { ...presetPermission } });
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg border border-ui w-full max-w-4xl h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-ui">
          <div>
            <h2 className="text-xl font-semibold text-neutral-text-dark">
              {parentName ? `Create Subfolder in "${parentName}"` : 'Create New Folder'}
            </h2>
            <p className="text-sm text-neutral-text-light">
              Configure folder properties, permissions, and subfolders
            </p>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-neutral-background transition-colors text-neutral-text-light"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-ui">
          <nav className="flex">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('basic');
              }}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'basic'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-text-light hover:text-neutral-text-dark'
              }`}
            >
              <Folder className="h-4 w-4" />
              Basic Info
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('permissions');
              }}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'permissions'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-text-light hover:text-neutral-text-dark'
              }`}
            >
              <Shield className="h-4 w-4" />
              Permissions
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('subfolders');
              }}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'subfolders'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-text-light hover:text-neutral-text-dark'
              }`}
            >
              <FolderTree className="h-4 w-4" />
              Subfolders
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'basic' && (
              <BasicInfoTab 
                folderData={folderData} 
                onChange={setFolderData} 
                loading={submitting}
              />
            )}

            {activeTab === 'permissions' && (
              <PermissionsTab
                folderData={folderData}
                users={users}
                groups={groups}
                roles={roles}
                filteredUsers={filteredUsers}
                filteredGroups={filteredGroups}
                filteredRoles={filteredRoles}
                userSearch={userSearch}
                setUserSearch={setUserSearch}
                groupSearch={groupSearch}
                setGroupSearch={setGroupSearch}
                roleSearch={roleSearch}
                setRoleSearch={setRoleSearch}
                showUserDropdown={showUserDropdown}
                showGroupDropdown={showGroupDropdown}
                showRoleDropdown={showRoleDropdown}
                setShowUserDropdown={setShowUserDropdown}
                setShowGroupDropdown={setShowGroupDropdown}
                setShowRoleDropdown={setShowRoleDropdown}
                searchingUsers={searchingUsers}
                searchingGroups={searchingGroups}
                searchingRoles={searchingRoles}
                onUserSelect={handleUserSelect}
                onGroupSelect={handleGroupSelect}
                onRoleSelect={handleRoleSelect}
                onUpdateUserPermission={updateUserPermission}
                onRemoveUserPermission={removeUserPermission}
                onUpdateGroupPermission={updateGroupPermission}
                onRemoveGroupPermission={removeGroupPermission}
                onUpdateRolePermission={updateRolePermission}
                onRemoveRolePermission={removeRolePermission}
                onApplyPreset={applyPresetPermission}
                loading={submitting}
                collapsedPermissions={collapsedPermissions}
                togglePermissionPanel={togglePermissionPanel}
              />
            )}

            {activeTab === 'subfolders' && (
              <SubfoldersTab
                folderData={folderData}
                onAddSubfolder={addSubfolder}
                onUpdateSubfolder={updateSubfolder}
                onRemoveSubfolder={removeSubfolder}
                expandedSubfolders={expandedSubfolders}
                onToggleExpand={setExpandedSubfolders}
                loading={submitting}
              />
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-ui bg-neutral-background">
          <div className="text-sm text-neutral-text-light">
            Step {activeTab === 'basic' ? 1 : activeTab === 'permissions' ? 2 : 3} of 3
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-ui rounded-lg text-neutral-text-dark hover:bg-surface transition-colors disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={submitting || !folderData.name.trim()}
              className="flex items-center gap-2 bg-primary text-surface px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-surface border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Folder
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Basic Information Tab
function BasicInfoTab({ folderData, onChange, loading }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-text-dark mb-2">
          Folder Name *
        </label>
        <input
          type="text"
          value={folderData.name}
          onChange={(e) => onChange({ ...folderData, name: e.target.value })}
          placeholder="Enter folder name"
          disabled={loading}
          className="w-full p-3 bg-surface border border-ui rounded-lg text-neutral-text-dark placeholder-neutral-text-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-text-dark mb-2">
          Description
        </label>
        <textarea
          value={folderData.description}
          onChange={(e) => onChange({ ...folderData, description: e.target.value })}
          placeholder="Enter folder description"
          disabled={loading}
          rows={4}
          className="w-full p-3 bg-surface border border-ui rounded-lg text-neutral-text-dark placeholder-neutral-text-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 resize-none"
        />
      </div>
    </div>
  );
}

// Permissions Tab
function PermissionsTab({
  folderData,
  users,
  groups,
  roles,
  filteredUsers,
  filteredGroups,
  filteredRoles,
  userSearch,
  setUserSearch,
  groupSearch,
  setGroupSearch,
  roleSearch,
  setRoleSearch,
  showUserDropdown,
  showGroupDropdown,
  showRoleDropdown,
  setShowUserDropdown,
  setShowGroupDropdown,
  setShowRoleDropdown,
  searchingUsers,
  searchingGroups,
  searchingRoles,
  onUserSelect,
  onGroupSelect,
  onRoleSelect,
  onUpdateUserPermission,
  onRemoveUserPermission,
  onUpdateGroupPermission,
  onRemoveGroupPermission,
  onUpdateRolePermission,
  onRemoveRolePermission,
  onApplyPreset,
  loading,
  collapsedPermissions,
  togglePermissionPanel
}: any) {
  const [activePermissionType, setActivePermissionType] = useState<'users' | 'groups' | 'roles'>('users');

  // Filter out already selected items
  const availableUsers = filteredUsers.filter((user: UserDto) => 
    !folderData.usersGevenPermission.some((perm: any) => perm.id === user.id)
  );
  
  const availableGroups = filteredGroups.filter((group: GroupDto) => 
    !folderData.goupesGevenPermission.some((perm: any) => perm.id === group.id)
  );
  
  const availableRoles = filteredRoles.filter((role: RoleDto) => 
    !folderData.rolesGevenPermission.some((perm: any) => perm.id === role.id)
  );

  // SearchableSelect component
  const SearchableSelect = useCallback(({ 
    type, 
    search,
    setSearch, 
    showDropdown, 
    setShowDropdown,
    searching, 
    items, 
    onSelect, 
    placeholder 
  }: any) => (
    <div key={`${type}-search-container`} className="relative searchable-select-container">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-text-light h-4 w-4" />
         <input
           key={`${type}-search-input`}
           type="text"
           placeholder={placeholder}
           value={search}
           onChange={(e) => setSearch(e.target.value)}
           onFocus={() => setShowDropdown(true)}
           className="w-full pl-10 pr-4 py-2 border border-ui rounded-lg text-sm bg-surface text-neutral-text-dark placeholder-neutral-text-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
         />
        {searching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        )}
      </div>
      
      {showDropdown && items.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-surface border border-ui rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {items.map((item: any) => (
            <button
              key={item.id}
              type="button"
              onClick={(e) => {e.preventDefault();e.stopPropagation(); onSelect(item)}}
              className="w-full px-4 py-2 text-left text-sm text-neutral-text-dark hover:bg-neutral-background focus:bg-neutral-background focus:outline-none"
            >
              {type === 'user' && `${item.firstName} ${item.lastName} (${item.email})`}
              {type === 'group' && `${item.name} (${item.path})`}
              {type === 'role' && `${item.name} (${item.description})`}
            </button>
          ))}
        </div>
      )}
    </div>
  ), []);

  const PermissionControls = ({ permission, onUpdate, index, type }: any) => {
    // Function to detect current preset based on permission values
    const getCurrentPreset = () => {
      if (permission.canView && !permission.canUpload && !permission.canEdit && !permission.canDelete && !permission.canShare && !permission.canManagePermissions && !permission.canCreateSubFolders && !permission.canEditDoc && !permission.canDeleteDoc && !permission.canShareDoc && !permission.canManagePermissionsDoc && !permission.inherits) {
        return 'viewOnly';
      }
      if (permission.canView && permission.canUpload && !permission.canEdit && !permission.canDelete && !permission.canShare && !permission.canManagePermissions && !permission.canCreateSubFolders && permission.canEditDoc && !permission.canDeleteDoc && !permission.canShareDoc && !permission.canManagePermissionsDoc && permission.inherits) {
        return 'contributor';
      }
      if (permission.canView && permission.canUpload && permission.canEdit && !permission.canDelete && !permission.canShare && !permission.canManagePermissions && permission.canCreateSubFolders && permission.canEditDoc && !permission.canDeleteDoc && !permission.canShareDoc && !permission.canManagePermissionsDoc && permission.inherits) {
        return 'editor';
      }
      if (permission.canView && permission.canUpload && permission.canEdit && permission.canDelete && permission.canShare && permission.canManagePermissions && permission.canCreateSubFolders && permission.canEditDoc && permission.canDeleteDoc && permission.canShareDoc && permission.canManagePermissionsDoc && !permission.inherits) {
        return 'admin';
      }
      return 'custom';
    };

    return (
      <div className="space-y-4 mb-4 p-4 border border-ui rounded-lg bg-neutral-background">
        {/* Preset Selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-neutral-text-dark whitespace-nowrap">Preset:</label>
          <Select 
            value={getCurrentPreset()}
            onValueChange={(value) => {
              if (value === 'custom') {
                return; // Don't change anything for custom
              }
              onApplyPreset(index, value as keyof typeof presetPermissions, type);
            }}
            disabled={loading}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select preset" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewOnly">View Only</SelectItem>
              <SelectItem value="contributor">Contributor</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="admin">Administrator</SelectItem>
              <SelectItem value="custom">Custom Permissions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Permissions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Folder Permissions */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-neutral-text-light uppercase tracking-wide">Folder</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={permission.canView}
                  onChange={(e) => onUpdate({ permission: { ...permission, canView: e.target.checked } })}
                  disabled={loading}
                  className="rounded border-ui"
                />
                <label className="text-xs text-neutral-text-dark">View</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={permission.canEdit}
                  onChange={(e) => onUpdate({ permission: { ...permission, canEdit: e.target.checked } })}
                  disabled={loading}
                  className="rounded border-ui"
                />
                <label className="text-xs text-neutral-text-dark">Edit</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={permission.canDelete}
                  onChange={(e) => onUpdate({ permission: { ...permission, canDelete: e.target.checked } })}
                  disabled={loading}
                  className="rounded border-ui"
                />
                <label className="text-xs text-neutral-text-dark">Delete</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={permission.canShare}
                  onChange={(e) => onUpdate({ permission: { ...permission, canShare: e.target.checked } })}
                  disabled={loading}
                  className="rounded border-ui"
                />
                <label className="text-xs text-neutral-text-dark">Share</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={permission.canManagePermissions}
                  onChange={(e) => onUpdate({ permission: { ...permission, canManagePermissions: e.target.checked } })}
                  disabled={loading}
                  className="rounded border-ui"
                />
                <label className="text-xs text-neutral-text-dark">Manage</label>
              </div>
            </div>
          </div>

          {/* Document Permissions */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-neutral-text-light uppercase tracking-wide">Documents</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={permission.canUpload}
                  onChange={(e) => onUpdate({ permission: { ...permission, canUpload: e.target.checked } })}
                  disabled={loading}
                  className="rounded border-ui"
                />
                <label className="text-xs text-neutral-text-dark">Upload</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={permission.canEditDoc}
                  onChange={(e) => onUpdate({ permission: { ...permission, canEditDoc: e.target.checked } })}
                  disabled={loading}
                  className="rounded border-ui"
                />
                <label className="text-xs text-neutral-text-dark">Edit</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={permission.canDeleteDoc}
                  onChange={(e) => onUpdate({ permission: { ...permission, canDeleteDoc: e.target.checked } })}
                  disabled={loading}
                  className="rounded border-ui"
                />
                <label className="text-xs text-neutral-text-dark">Delete</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={permission.canShareDoc}
                  onChange={(e) => onUpdate({ permission: { ...permission, canShareDoc: e.target.checked } })}
                  disabled={loading}
                  className="rounded border-ui"
                />
                <label className="text-xs text-neutral-text-dark">Share</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={permission.canManagePermissionsDoc}
                  onChange={(e) => onUpdate({ permission: { ...permission, canManagePermissionsDoc: e.target.checked } })}
                  disabled={loading}
                  className="rounded border-ui"
                />
                <label className="text-xs text-neutral-text-dark">Manage</label>
              </div>
            </div>
          </div>

          {/* Structure Permissions */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-neutral-text-light uppercase tracking-wide">Structure</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={permission.canCreateSubFolders}
                  onChange={(e) => onUpdate({ permission: { ...permission, canCreateSubFolders: e.target.checked } })}
                  disabled={loading}
                  className="rounded border-ui"
                />
                <label className="text-xs text-neutral-text-dark">Create Subfolders</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={permission.inherits}
                  onChange={(e) => onUpdate({ permission: { ...permission, inherits: e.target.checked } })}
                  disabled={loading}
                  className="rounded border-ui"
                />
                <label className="text-xs text-neutral-text-dark">Inherit</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b border-ui">
        <button
          type="button"
          onClick={() => setActivePermissionType('users')}
          className={`px-4 cursor-pointer py-2 flex items-center gap-2 text-sm font-medium ${
            activePermissionType === 'users' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-neutral-text-light hover:text-neutral-text-dark'
          }`}
        >
          <Users className="h-4 w-4" />
          Users ({folderData.usersGevenPermission.length})
        </button>
        <button
          type="button"
          onClick={() => setActivePermissionType('groups')}
          className={`px-4 cursor-pointer py-2 flex items-center gap-2 text-sm font-medium ${
            activePermissionType === 'groups' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-neutral-text-light hover:text-neutral-text-dark'
          }`}
        >
          <FolderTree className="h-4 w-4" />
          Groups ({folderData.goupesGevenPermission.length})
        </button>
        <button
          type="button"
          onClick={() => setActivePermissionType('roles')}
          className={`px-4 cursor-pointer py-2 flex items-center gap-2 text-sm font-medium ${
            activePermissionType === 'roles' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-neutral-text-light hover:text-neutral-text-dark'
          }`}
        >
          <Shield className="h-4 w-4" />
          Roles ({folderData.rolesGevenPermission.length})
        </button>
      </div>

      {activePermissionType === 'users' && (
        <div>
          <div className="mb-4">
            <SearchableSelect
              type="user"
              search={userSearch}
              setSearch={setUserSearch}
              showDropdown={showUserDropdown}
              setShowDropdown={setShowUserDropdown}
              searching={searchingUsers}
              items={availableUsers}
              onSelect={onUserSelect}
              placeholder="Search users..."
            />
          </div>

          {folderData.usersGevenPermission.map((perm: any, index: number) => {
            const selectedUser = users.find((u: UserDto) => u.id === perm.id);
            const panelKey = `user-${index}`;
            const isCollapsed = collapsedPermissions[panelKey];
            
            return (
              <div key={index} className="mb-4 border border-ui rounded-lg">
                <div 
                  className="p-4 border-b border-ui flex justify-between items-center cursor-pointer hover:bg-neutral-background/50 transition-colors"
                  onClick={() => togglePermissionPanel(panelKey)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-neutral-text-light" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-neutral-text-light" />
                    )}
                    <div className="flex-1">
                      {selectedUser ? (
                        <div className="text-sm font-medium text-neutral-text-dark">
                          {selectedUser.firstName} {selectedUser.lastName}
                          <span className="text-neutral-text-light ml-2">({selectedUser.email})</span>
                        </div>
                      ) : (
                        <div className="text-sm text-neutral-text-light">Select User</div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveUserPermission(index);
                    }}
                    className="p-2 text-error hover:bg-error/10 rounded ml-2 disabled:opacity-50"
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {!isCollapsed && (
                  <PermissionControls
                    permission={perm.permission}
                    onUpdate={(updates: any) => onUpdateUserPermission(index, updates)}
                    index={index}
                    type="user"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {activePermissionType === 'groups' && (
        <div>
          <div className="mb-4">
            <SearchableSelect
              type="group"
              search={groupSearch}
              setSearch={setGroupSearch}
              showDropdown={showGroupDropdown}
              setShowDropdown={setShowGroupDropdown}
              searching={searchingGroups}
              items={availableGroups}
              onSelect={onGroupSelect}
              placeholder="Search groups..."
            />
          </div>

          {folderData.goupesGevenPermission.map((perm: any, index: number) => {
            const selectedGroup = groups.find((g: GroupDto) => g.id === perm.id);
            const panelKey = `group-${index}`;
            const isCollapsed = collapsedPermissions[panelKey];
            
            return (
              <div key={index} className="mb-4 border border-ui rounded-lg">
                <div 
                  className="p-4 border-b border-ui flex justify-between items-center cursor-pointer hover:bg-neutral-background/50 transition-colors"
                  onClick={() => togglePermissionPanel(panelKey)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-neutral-text-light" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-neutral-text-light" />
                    )}
                    <div className="flex-1">
                      {selectedGroup ? (
                        <div className="text-sm font-medium text-neutral-text-dark">
                          {selectedGroup.name}
                          <span className="text-neutral-text-light ml-2">({selectedGroup.path})</span>
                        </div>
                      ) : (
                        <div className="text-sm text-neutral-text-light">Select Group</div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveGroupPermission(index);
                    }}
                    className="p-2 text-error hover:bg-error/10 rounded ml-2 disabled:opacity-50"
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {!isCollapsed && (
                  <PermissionControls
                    permission={perm.permission}
                    onUpdate={(updates: any) => onUpdateGroupPermission(index, updates)}
                    index={index}
                    type="group"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {activePermissionType === 'roles' && (
        <div>
          <div className="mb-4">
            <SearchableSelect
              type="role"
              search={roleSearch}
              setSearch={setRoleSearch}
              showDropdown={showRoleDropdown}
              setShowDropdown={setShowRoleDropdown}
              searching={searchingRoles}
              items={availableRoles}
              onSelect={onRoleSelect}
              placeholder="Search roles..."
            />
          </div>

          {folderData.rolesGevenPermission.map((perm: any, index: number) => {
            const selectedRole = roles.find((r: RoleDto) => r.id === perm.id);
            const panelKey = `role-${index}`;
            const isCollapsed = collapsedPermissions[panelKey];
            
            return (
              <div key={index} className="mb-4 border border-ui rounded-lg">
                <div 
                  className="p-4 border-b border-ui flex justify-between items-center cursor-pointer hover:bg-neutral-background/50 transition-colors"
                  onClick={() => togglePermissionPanel(panelKey)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-neutral-text-light" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-neutral-text-light" />
                    )}
                    <div className="flex-1">
                      {selectedRole ? (
                        <div className="text-sm font-medium text-neutral-text-dark">
                          {selectedRole.name}
                          <span className="text-neutral-text-light ml-2">({selectedRole.description})</span>
                        </div>
                      ) : (
                        <div className="text-sm text-neutral-text-light">Select Role</div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveRolePermission(index);
                    }}
                    className="p-2 text-error hover:bg-error/10 rounded ml-2 disabled:opacity-50"
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {!isCollapsed && (
                  <PermissionControls
                    permission={perm.permission}
                    onUpdate={(updates: any) => onUpdateRolePermission(index, updates)}
                    index={index}
                    type="role"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Subfolders Tab
function SubfoldersTab({
  folderData,
  onAddSubfolder,
  onUpdateSubfolder,
  onRemoveSubfolder,
  expandedSubfolders,
  onToggleExpand,
  loading
}: any) {
  const renderSubfolder = (subfolder: CreateFolderDto, path: number[], level = 0) => {
    const pathKey = path.join('-');
    const isExpanded = expandedSubfolders.includes(parseInt(pathKey));

    return (
      <div key={pathKey} className="mb-3">
        <div 
          className="flex items-center gap-3 p-3 border border-ui rounded-lg hover:bg-neutral-background transition-colors"
          style={{ marginLeft: `${level * 24}px` }}
        >
            <button
              type="button"
              onClick={() => onToggleExpand(
                isExpanded 
                  ? expandedSubfolders.filter((i: number) => i !== parseInt(pathKey))
                  : [...expandedSubfolders, parseInt(pathKey)]
              )}
              className="p-1 rounded hover:bg-ui transition-colors disabled:opacity-50"
              disabled={loading}
            >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          
          {isExpanded ? <FolderOpen className="h-4 w-4 text-primary" /> : <Folder className="h-4 w-4 text-primary" />}
          
          <input
            type="text"
            value={subfolder.name}
            onChange={(e) => onUpdateSubfolder(path, { name: e.target.value })}
            placeholder="Subfolder name"
            disabled={loading}
            className="flex-1 p-2 border border-ui rounded text-sm bg-surface text-neutral-text-dark"
          />
          
          <button
            type="button"
            onClick={() => onRemoveSubfolder(path)}
            className="p-2 text-error hover:bg-error/10 rounded disabled:opacity-50"
            disabled={loading}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {isExpanded && (
          <div className="ml-12 mt-2 space-y-3">
            <textarea
              value={subfolder.description}
              onChange={(e) => onUpdateSubfolder(path, { description: e.target.value })}
              placeholder="Subfolder description"
              disabled={loading}
              rows={2}
              className="w-full p-2 border border-ui rounded text-sm bg-surface text-neutral-text-dark resize-none"
            />
            
            {/* Recursive rendering of nested subfolders */}
            {subfolder.subgroups.map((nestedSubfolder: CreateFolderDto, nestedIndex: number) => 
              renderSubfolder(nestedSubfolder, [...path, nestedIndex], level + 1)
            )}
            
            <button
              type="button"
              onClick={() => {
                const updatedSubfolder = {
                  ...subfolder,
                  subgroups: [
                    ...subfolder.subgroups,
                    {
                      name: '',
                      description: '',
                      parentId: undefined,
                      usersGevenPermission: [],
                      goupesGevenPermission: [],
                      rolesGevenPermission: [],
                      subgroups: []
                    }
                  ]
                };
                onUpdateSubfolder(path, updatedSubfolder);
              }}
              className="flex items-center gap-2 text-primary hover:text-primary-dark text-sm disabled:opacity-50"
              disabled={loading}
            >
              <Plus className="h-3 w-3" />
              Add Nested Subfolder
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <button 
        type="button"
        onClick={onAddSubfolder}
        className="flex items-center gap-2 bg-primary text-surface px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
        disabled={loading}
      >
        <Plus className="h-4 w-4" />
        Add Subfolder
      </button>

      <div className="border border-ui rounded-lg p-4 max-h-96 overflow-auto">
        {folderData.subgroups.length === 0 ? (
          <div className="text-center text-neutral-text-light py-8">
            No subfolders added. Click the button above to add subfolders.
          </div>
        ) : (
          folderData.subgroups.map((subfolder: CreateFolderDto, index: number) =>
            renderSubfolder(subfolder, [index])
          )
        )}
      </div>
    </div>
  );
}