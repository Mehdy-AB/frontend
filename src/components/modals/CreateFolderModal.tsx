'use client';

import { useState, useEffect } from 'react';
import { X, Folder, Plus, Trash2, ChevronRight, ChevronDown, Users, Shield, User, Settings } from 'lucide-react';
import { notificationApiClient } from '@/api/notificationClient';
import { CreateFolderDto, SubfolderDto, FolderPermissionReq, UserDto, RoleDto, GroupDto, TypeShareAccessWithTypeReq, GranteeType } from '@/types/api';
import UserAvatar from '@/components/main/UserAvatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId?: number | null;
  parentName?: string;
  onSuccess?: () => void;
}

interface SubfolderInput extends SubfolderDto {
  id: string;
  expanded?: boolean;
}

interface PermissionGrant {
  id: string;
  entityId: string;
  type: 'user' | 'group' | 'role';
  entity: UserDto | GroupDto | RoleDto;
  preset: 'viewer' | 'contributor' | 'editor' | 'admin' | 'custom';
  customPermissions?: FolderPermissionReq;
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
    canShare: true,
    canManagePermissions: false,
    canCreateSubFolders: true,
    canEditDoc: true,
    canDeleteDoc: true,
    canShareDoc: true,
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
  custom: { label: 'Custom', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' }
};

export default function CreateFolderModal({ 
  isOpen, 
  onClose, 
  parentId = null, 
  parentName,
  onSuccess 
}: CreateFolderModalProps) {
  const [loading, setLoading] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [description, setDescription] = useState('');
  const [subfolders, setSubfolders] = useState<SubfolderInput[]>([]);
  const [permissions, setPermissions] = useState<PermissionGrant[]>([]);
  const [expandedPermissions, setExpandedPermissions] = useState<string[]>([]); // Track which permissions are expanded

  // Entity search states
  const [searchType, setSearchType] = useState<'user' | 'group' | 'role'>('user');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(UserDto | GroupDto | RoleDto)[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  // Pre-fetched entities
  const [allUsers, setAllUsers] = useState<UserDto[]>([]);
  const [allGroups, setAllGroups] = useState<GroupDto[]>([]);
  const [allRoles, setAllRoles] = useState<RoleDto[]>([]);
  const [entitiesLoaded, setEntitiesLoaded] = useState(false);

  // Pre-fetch all entities when modal opens
  useEffect(() => {
    if (isOpen && !entitiesLoaded) {
      const fetchAllEntities = async () => {
      try {
        const [usersResponse, groupsResponse, rolesResponse] = await Promise.all([
            notificationApiClient.getAllUsers({ page: 0, size: 1000 }),
            notificationApiClient.getAllGroups({ page: 0, size: 1000 }),
            notificationApiClient.getAllRoles({ page: 0, size: 1000 })
          ]);

          setAllUsers(usersResponse.content || []);
          setAllGroups(groupsResponse.content || []);
          setAllRoles(rolesResponse.content || []);
          setEntitiesLoaded(true);
      } catch (error) {
          console.error('Failed to fetch entities:', error);
        }
      };

      fetchAllEntities();
    }
  }, [isOpen, entitiesLoaded]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setShowSearchDropdown(false);
      setEntitiesLoaded(false); // Reset to fetch fresh next time
    }
  }, [isOpen]);

  // Filter entities based on search query and exclude already selected ones
  useEffect(() => {
    let allEntities: (UserDto | GroupDto | RoleDto)[] = [];
    
    if (searchType === 'user') {
      allEntities = allUsers;
    } else if (searchType === 'group') {
      allEntities = allGroups;
    } else {
      allEntities = allRoles;
    }

    // Filter out already selected entities
    const availableEntities = allEntities.filter(entity => 
      !permissions.some(p => p.entityId === entity.id && p.type === searchType)
    );

    // Apply search filter if there's a query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const filtered = availableEntities.filter((entity) => {
        if (searchType === 'user') {
          const user = entity as UserDto;
          return (
            user.username?.toLowerCase().includes(q) ||
            user.email?.toLowerCase().includes(q) ||
            user.displayName?.toLowerCase().includes(q) ||
            `${user.firstName} ${user.lastName}`.toLowerCase().includes(q)
          );
        } else {
          // For roles and groups, check name property
          const roleOrGroup = entity as RoleDto | GroupDto;
          return (roleOrGroup.name?.toLowerCase().includes(q) || false);
        }
      });
      setSearchResults(filtered);
    } else {
      // Show all available entities when no search query
      setSearchResults(availableEntities);
    }
  }, [searchQuery, searchType, allUsers, allGroups, allRoles, permissions]);

  const handleClose = () => {
    if (!loading) {
      setFolderName('');
      setDescription('');
      setSubfolders([]);
      setPermissions([]);
      setExpandedPermissions([]);
      setSearchQuery('');
      setShowSearchDropdown(false);
      onClose();
    }
  };

  const addPermission = (entity: UserDto | GroupDto | RoleDto, preset: 'viewer' | 'contributor' | 'editor' | 'admin' = 'viewer') => {
    // Check if already added
    const alreadyAdded = permissions.some(p => p.entityId === entity.id && p.type === searchType);
    if (alreadyAdded) return;

    const newPerm: PermissionGrant = {
      id: `${searchType}_${entity.id}_${Date.now()}`,
      entityId: entity.id,
      type: searchType,
      entity,
      preset
    };
    setPermissions(prev => [...prev, newPerm]);
  };

  const removePermission = (id: string) => {
    setPermissions(prev => prev.filter(p => p.id !== id));
  };

  const updatePermissionPreset = (id: string, preset: 'viewer' | 'contributor' | 'editor' | 'admin' | 'custom') => {
    setPermissions(prev => prev.map(p => {
      if (p.id === id) {
        if (preset === 'custom') {
          // Initialize custom permissions with current preset or default viewer
          const currentPreset = p.preset !== 'custom' ? p.preset : 'viewer';
          return { 
            ...p, 
            preset: 'custom',
            customPermissions: { ...PERMISSION_PRESETS[currentPreset] }
          };
        }
        return { ...p, preset, customPermissions: undefined };
      }
      return p;
    }));
  };

  const updateCustomPermission = (id: string, field: keyof FolderPermissionReq, value: boolean) => {
    setPermissions(prev => prev.map(p => {
      if (p.id === id) {
        // If not already custom, switch to custom and initialize with current preset
        if (p.preset !== 'custom') {
          const currentPermissions = { ...PERMISSION_PRESETS[p.preset] };
          currentPermissions[field] = value; // Apply the change
          return {
            ...p,
            preset: 'custom',
            customPermissions: currentPermissions
          };
        }
        // If already custom, just update the field
        if (p.customPermissions) {
          return {
            ...p,
            customPermissions: {
              ...p.customPermissions,
              [field]: value
            }
          };
        }
      }
      return p;
    }));
  };

  const togglePermissionExpanded = (id: string) => {
    setExpandedPermissions(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const addSubfolder = (parentIndex?: number, parentPath: number[] = []) => {
    const newSubfolder: SubfolderInput = {
      id: `sf_${Date.now()}_${Math.random()}`,
        name: '',
        description: '',
      subfolders: [],
      expanded: true
    };

    if (parentIndex !== undefined) {
      setSubfolders(prev => {
        // Helper function to recursively update nested structure
        const updateNested = (items: SubfolderInput[], pathIndex: number): SubfolderInput[] => {
          if (pathIndex === parentPath.length) {
            // We've reached the target level, update the item at parentIndex
            return items.map((item, idx) => {
              if (idx === parentIndex) {
                return {
                  ...item,
                  subfolders: [...(item.subfolders || []), newSubfolder],
                  expanded: true
                };
              }
              return item;
            });
          }
          
          // Continue navigating down the path
          return items.map((item, idx) => {
            if (idx === parentPath[pathIndex]) {
              return {
                ...item,
                subfolders: updateNested(item.subfolders as SubfolderInput[], pathIndex + 1)
              };
            }
            return item;
          });
        };
        
        return updateNested(prev, 0);
      });
      } else {
      setSubfolders(prev => [...prev, newSubfolder]);
    }
  };

  const updateSubfolder = (path: number[], field: 'name' | 'description', value: string) => {
    setSubfolders(prev => {
      const updateNested = (items: SubfolderInput[], depth: number): SubfolderInput[] => {
        if (depth === path.length - 1) {
          // We're at the target level
          return items.map((item, idx) => {
            if (idx === path[depth]) {
              return { ...item, [field]: value };
            }
            return item;
          });
        }
        
        // Continue navigating
        return items.map((item, idx) => {
          if (idx === path[depth]) {
            return {
              ...item,
              subfolders: updateNested(item.subfolders as SubfolderInput[], depth + 1)
            };
          }
          return item;
        });
      };
      
      return updateNested(prev, 0);
    });
  };

  const removeSubfolder = (path: number[]) => {
    setSubfolders(prev => {
      const removeNested = (items: SubfolderInput[], depth: number): SubfolderInput[] => {
        if (depth === path.length - 1) {
          // We're at the target level, remove the item at path[depth]
          return items.filter((_, idx) => idx !== path[depth]);
        }
        
        // Continue navigating
        return items.map((item, idx) => {
          if (idx === path[depth]) {
            return {
              ...item,
              subfolders: removeNested(item.subfolders as SubfolderInput[], depth + 1)
            };
          }
          return item;
        });
      };
      
      return removeNested(prev, 0);
    });
  };

  const toggleExpanded = (path: number[]) => {
    setSubfolders(prev => {
      const toggleNested = (items: SubfolderInput[], depth: number): SubfolderInput[] => {
        if (depth === path.length - 1) {
          // We're at the target level, toggle expanded
          return items.map((item, idx) => {
            if (idx === path[depth]) {
              return { ...item, expanded: !item.expanded };
            }
            return item;
          });
        }
        
        // Continue navigating
        return items.map((item, idx) => {
          if (idx === path[depth]) {
            return {
              ...item,
              subfolders: toggleNested(item.subfolders as SubfolderInput[], depth + 1)
            };
          }
          return item;
        });
      };
      
      return toggleNested(prev, 0);
    });
  };

  const validateAndCleanSubfolders = (subs: SubfolderInput[]): SubfolderDto[] => {
    return subs
      .filter(sf => sf.name && sf.name.trim().length > 0)
      .map(sf => ({
        name: sf.name.trim(),
        description: sf.description?.trim() || undefined,
        subfolders: sf.subfolders && sf.subfolders.length > 0
          ? validateAndCleanSubfolders(sf.subfolders as SubfolderInput[])
          : undefined
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!folderName.trim()) {
      return;
    }

    setLoading(true);

    try {
      const cleanedSubfolders = validateAndCleanSubfolders(subfolders);

      // Convert permissions to API format using the new sharedWith structure
      const sharedWith: TypeShareAccessWithTypeReq[] = permissions.map(p => ({
        granteeId: p.entityId,
        type: p.type.toUpperCase() as GranteeType,
        permission: p.preset === 'custom' ? p.customPermissions! : PERMISSION_PRESETS[p.preset]
      }));

      const folderData: CreateFolderDto = {
        name: folderName.trim(),
        description: description.trim() || undefined,
        parentId: parentId || undefined,
        sharedWith: sharedWith.length > 0 ? sharedWith : undefined,
        subfolders: cleanedSubfolders.length > 0 ? cleanedSubfolders : undefined
      };

      await notificationApiClient.createFolder(folderData);

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Failed to create folder:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Folder className="w-5 h-5 text-white" />
          </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Create New Folder</h2>
              {parentName && (
                <p className="text-sm text-gray-500">Inside: {parentName}</p>
              )}
        </div>
          </div>
            <button
              onClick={handleClose}
              disabled={loading}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Basic Information</h3>
            
      <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Folder Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
          placeholder="Enter folder name"
          required
                disabled={loading}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                autoFocus
        />
      </div>

      <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Description
        </label>
        <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter folder description (optional)"
          disabled={loading}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 resize-none"
        />
      </div>
    </div>

          {/* Permissions */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Permissions</h3>
              <Badge variant="secondary">{permissions.length} assigned</Badge>
            </div>

            {/* Type Selector */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={searchType === 'user' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSearchType('user')}
                className="flex-1"
              >
                <User className="w-4 h-4 mr-2" />
                Users
              </Button>
              <Button
                type="button"
                variant={searchType === 'group' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSearchType('group')}
                className="flex-1"
              >
                <Users className="w-4 h-4 mr-2" />
                Groups
              </Button>
              <Button
                type="button"
                variant={searchType === 'role' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSearchType('role')}
                className="flex-1"
              >
                <Shield className="w-4 h-4 mr-2" />
                Roles
              </Button>
            </div>

            {/* Search */}
      <div className="relative">
         <input
           type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearchDropdown(true)}
                onBlur={() => {
                  // Delay to allow click on dropdown item
                  setTimeout(() => setShowSearchDropdown(false), 200);
                }}
                placeholder={entitiesLoaded ? `Search ${searchType}s...` : `Loading ${searchType}s...`}
                disabled={!entitiesLoaded}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
              />
              
              {/* Search Results Dropdown */}
              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((entity) => (
            <button
                      key={entity.id}
              type="button"
                      onClick={() => {
                        addPermission(entity);
                        setSearchQuery('');
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b last:border-b-0"
                    >
                      {searchType === 'user' && <UserAvatar user={entity as UserDto} size="sm" />}
                      {searchType === 'group' && (
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Users className="w-4 h-4 text-green-600" />
                        </div>
                      )}
                      {searchType === 'role' && (
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <Shield className="w-4 h-4 text-orange-600" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {searchType === 'user' ? (entity as UserDto).displayName : (entity as RoleDto | GroupDto).name}
                        </p>
                        {searchType === 'user' && (
                          <p className="text-sm text-gray-500">{(entity as UserDto).email}</p>
                        )}
                      </div>
                      <Plus className="w-4 h-4 text-blue-600" />
            </button>
          ))}
        </div>
      )}
              
              {/* No results message */}
              {showSearchDropdown && searchResults.length === 0 && entitiesLoaded && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
                  {searchQuery ? `No ${searchType}s found matching "${searchQuery}"` : `All ${searchType}s have been added`}
    </div>
              )}
            </div>

            {/* Permissions List */}
            {permissions.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {permissions.map((perm) => {
                  const isExpanded = expandedPermissions.includes(perm.id);
                  const currentPermissions = perm.preset === 'custom' && perm.customPermissions
                    ? perm.customPermissions
                    : PERMISSION_PRESETS[perm.preset as keyof typeof PERMISSION_PRESETS];

    return (
                    <div key={perm.id} className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                      {/* Header - Always Visible */}
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => togglePermissionExpanded(perm.id)}
                            className="flex items-center gap-3 flex-1 min-w-0 text-left"
                          >
                            {/* Expand/Collapse Icon */}
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            )}
                            
                            {/* Entity Icon/Avatar */}
                            {perm.type === 'user' && <UserAvatar user={perm.entity as UserDto} size="sm" />}
                            {perm.type === 'group' && (
                              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                <Users className="w-4 h-4 text-green-600" />
        </div>
                            )}
                            {perm.type === 'role' && (
                              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                <Shield className="w-4 h-4 text-orange-600" />
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate text-sm">
                                {perm.type === 'user' 
                                  ? (perm.entity as UserDto).displayName 
                                  : (perm.entity as RoleDto | GroupDto).name}
                              </p>
                              {perm.type === 'user' && (
                                <p className="text-xs text-gray-500 truncate">
                                  {(perm.entity as UserDto).email}
                                </p>
                              )}
                              {perm.type !== 'user' && (
                                <p className="text-xs text-gray-500 capitalize">
                                  {perm.type}
                                </p>
                              )}
                              {/* Show current preset */}
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-md font-medium ${PRESET_LABELS[perm.preset].color}`}>
                                  {perm.preset === 'custom' && <Settings className="w-3 h-3 mr-1" />}
                                  {PRESET_LABELS[perm.preset].label}
                                </span>
                              </div>
                            </div>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => removePermission(perm.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Preset Buttons */}
                        <div className="flex flex-wrap gap-2 mt-3 ml-7">
                          {Object.entries(PRESET_LABELS).map(([key, { label, color }]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => updatePermissionPreset(perm.id, key as any)}
                              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                                perm.preset === key ? color : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {key === 'custom' && <Settings className="w-3 h-3 inline mr-1" />}
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Expandable Permissions Panel */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 bg-white">
                          <div className="p-3">
                            <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                              {perm.preset === 'custom' ? 'Custom Permissions' : 'Current Permissions'}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
          {/* Folder Permissions */}
                              <div className="col-span-2">
                                <p className="text-xs font-medium text-gray-700 mb-2">Folder Actions</p>
                              </div>
                              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                                  checked={currentPermissions.canView}
                                  onChange={(e) => updateCustomPermission(perm.id, 'canView', e.target.checked)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>Can View</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                                  checked={currentPermissions.canUpload}
                                  onChange={(e) => updateCustomPermission(perm.id, 'canUpload', e.target.checked)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>Can Upload</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                                  checked={currentPermissions.canEdit}
                                  onChange={(e) => updateCustomPermission(perm.id, 'canEdit', e.target.checked)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>Can Edit</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                                  checked={currentPermissions.canDelete}
                                  onChange={(e) => updateCustomPermission(perm.id, 'canDelete', e.target.checked)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>Can Delete</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                                  checked={currentPermissions.canShare}
                                  onChange={(e) => updateCustomPermission(perm.id, 'canShare', e.target.checked)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>Can Share</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                                  checked={currentPermissions.canManagePermissions}
                                  onChange={(e) => updateCustomPermission(perm.id, 'canManagePermissions', e.target.checked)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>Manage Permissions</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                                  checked={currentPermissions.canCreateSubFolders}
                                  onChange={(e) => updateCustomPermission(perm.id, 'canCreateSubFolders', e.target.checked)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>Create Subfolders</span>
                              </label>
                              
                              {/* Document Permissions */}
                              <div className="col-span-2 mt-2">
                                <p className="text-xs font-medium text-gray-700 mb-2">Document Actions</p>
              </div>
                              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                                  checked={currentPermissions.canEditDoc}
                                  onChange={(e) => updateCustomPermission(perm.id, 'canEditDoc', e.target.checked)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>Edit Documents</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                                  checked={currentPermissions.canDeleteDoc}
                                  onChange={(e) => updateCustomPermission(perm.id, 'canDeleteDoc', e.target.checked)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>Delete Documents</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                                  checked={currentPermissions.canShareDoc}
                                  onChange={(e) => updateCustomPermission(perm.id, 'canShareDoc', e.target.checked)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>Share Documents</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                                  checked={currentPermissions.canManagePermissionsDoc}
                                  onChange={(e) => updateCustomPermission(perm.id, 'canManagePermissionsDoc', e.target.checked)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>Manage Doc Permissions</span>
                              </label>
                              
                              {/* Inheritance */}
                              <div className="col-span-2 mt-2">
                                <label className="flex items-center gap-2 text-xs font-medium">
                <input
                  type="checkbox"
                                    checked={currentPermissions.inherits}
                                    onChange={(e) => updateCustomPermission(perm.id, 'inherits', e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span>Inherit to Subfolders</span>
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
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                <Shield className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No permissions assigned</p>
                <p className="text-xs text-gray-400 mt-1">Search and add {searchType}s above</p>
                        </div>
                      )}
                    </div>

          {/* Subfolders Tree */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Subfolders</h3>
              <Button
                    type="button"
                variant="outline"
                size="sm"
                onClick={() => addSubfolder()}
                    disabled={loading}
                  >
                <Plus className="w-4 h-4 mr-2" />
                Add Subfolder
              </Button>
                </div>

            {subfolders.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                <Folder className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No subfolders</p>
                <p className="text-xs text-gray-400 mt-1">Click "Add Subfolder" to create nested folders</p>
          </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                <SubfolderTree
                  subfolders={subfolders}
                  onUpdate={updateSubfolder}
                  onRemove={removeSubfolder}
                  onAddChild={addSubfolder}
                  onToggle={toggleExpanded}
                    disabled={loading}
                  path={[]}
                />
        </div>
      )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button
                    type="button"
            variant="outline"
            onClick={handleClose}
                    disabled={loading}
                  >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !folderName.trim()}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              'Create Folder'
            )}
          </Button>
              </div>
        </div>
    </div>
  );
}

// Subfolder Tree Component
function SubfolderTree({
  subfolders,
  onUpdate,
  onRemove,
  onAddChild,
  onToggle,
  disabled,
  path
}: {
  subfolders: SubfolderInput[];
  onUpdate: (path: number[], field: 'name' | 'description', value: string) => void;
  onRemove: (path: number[]) => void;
  onAddChild: (parentIndex: number, parentPath: number[]) => void;
  onToggle: (path: number[]) => void;
  disabled: boolean;
  path: number[];
}) {
  return (
    <div className="space-y-2">
      {subfolders.map((subfolder, index) => {
        const currentPath = [...path, index];
        const hasChildren = subfolder.subfolders && subfolder.subfolders.length > 0;

    return (
          <div key={subfolder.id} className="border border-gray-200 rounded-lg bg-white">
            <div className="flex items-center gap-2 p-3">
              {/* Expand/Collapse */}
              {hasChildren && (
            <button
              type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggle(currentPath);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {subfolder.expanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
          </button>
              )}
          
              {/* Folder Icon */}
              <Folder className="w-4 h-4 text-blue-500 flex-shrink-0" />
          
              {/* Name Input */}
          <input
            type="text"
            value={subfolder.name}
                onChange={(e) => onUpdate(currentPath, 'name', e.target.value)}
            placeholder="Subfolder name"
                disabled={disabled}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
              {/* Actions */}
          <button
            type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddChild(index, path);
                }}
                disabled={disabled}
                title="Add nested subfolder"
                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <Plus className="w-4 h-4" />
          </button>
            
            <button
              type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove(currentPath);
                }}
                disabled={disabled}
                title="Remove subfolder"
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
            </button>
          </div>
            
            {/* Children */}
            {subfolder.expanded && hasChildren && (
              <div className="ml-8 mr-3 mb-3 pl-3 border-l-2 border-gray-200">
                <SubfolderTree
                  subfolders={subfolder.subfolders as SubfolderInput[]}
                  onUpdate={onUpdate}
                  onRemove={onRemove}
                  onAddChild={onAddChild}
                  onToggle={onToggle}
                  disabled={disabled}
                  path={currentPath}
                />
          </div>
        )}
      </div>
        );
      })}
    </div>
  );
}
