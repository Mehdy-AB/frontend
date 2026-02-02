'use client';

import { useState, useEffect } from 'react';
import { X, Folder, Plus, Trash2, ChevronRight, ChevronDown, Users, Shield, User, Settings, FileText, Eye, Edit, Upload } from 'lucide-react';
import { notificationApiClient } from '@/api/notificationClient';
import { CreateFolderDto, SubfolderDto, FolderPermissionReq, UserDto, RoleDto, GroupDto, TypeShareAccessWithTypeReq, GranteeType } from '@/types/api';
import UserAvatar from '@/components/main/UserAvatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchSelect } from '@/components/main/SearchSelect';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId?: number | null;
  parentName?: string;
  ownerId?: string; // Optional: Owner user ID for creating folders in another user's repository
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
    canEditDoc: true,
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
  ownerId,
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

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFolderName('');
      setDescription('');
      setSubfolders([]);
      setPermissions([]);
      setExpandedPermissions([]);
      setSearchType('user');
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const addPermission = (entity: UserDto | GroupDto | RoleDto) => {
    // Check if already added
    const alreadyAdded = permissions.some(p => String(p.entityId) === String(entity.id) && p.type === searchType);
    if (alreadyAdded) return;

    const newPerm: PermissionGrant = {
      id: `${searchType}_${entity.id}_${Date.now()}`,
      entityId: String(entity.id),
      type: searchType,
      entity,
      preset: 'viewer'
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
        granteeId: String(p.entityId),
        type: p.type.toUpperCase() as GranteeType,
        permission: p.preset === 'custom' ? p.customPermissions! : PERMISSION_PRESETS[p.preset]
      }));

      const folderData: CreateFolderDto = {
        name: folderName.trim(),
        description: description.trim() || undefined,
        parentId: parentId || undefined,
        ownerId: ownerId || undefined,
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500  flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Folder className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Create New Folder</h2>
              {parentName ? (
                <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                  <span>Inside:</span>
                  <span className="font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">{parentName}</span>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-0.5">Create a new folder in your repository</p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Basic Info */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Basic Information</h3>
            </div>

            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Folder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="e.g., Marketing Assets 2024"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50 focus:bg-white text-gray-900 placeholder-gray-400"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a brief description about this folder's contents..."
                  disabled={loading}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50 focus:bg-white text-gray-900 placeholder-gray-400 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Access Control</h3>
              </div>
              <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200">
                {permissions.length} assigned
              </Badge>
            </div>

            <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 space-y-4">
              {/* Type Selector */}
              <div className="flex p-1 bg-gray-200/50 rounded-lg w-fit">
                <button
                  type="button"
                  onClick={() => setSearchType('user')}
                  className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all ${searchType === 'user'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                    }`}
                >
                  <User className="w-4 h-4 mr-2" />
                  Users
                </button>
                <button
                  type="button"
                  onClick={() => setSearchType('group')}
                  className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all ${searchType === 'group'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                    }`}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Groups
                </button>
                <button
                  type="button"
                  onClick={() => setSearchType('role')}
                  className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all ${searchType === 'role'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                    }`}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Roles
                </button>
              </div>

              {/* Search Select */}
              <SearchSelect
                key={searchType}
                items={[]}
                fetchFunction={async (query: string) => {
                  try {
                    if (searchType === 'user') {
                      const res = await notificationApiClient.getAllUsers({ search: query, size: 20 });
                      return res.content || [];
                    } else if (searchType === 'group') {
                      const res = await notificationApiClient.getAllGroups({ search: query, size: 20 });
                      return res.content || [];
                    } else {
                      const res = await notificationApiClient.getAllRoles({ search: query, size: 20 });
                      return res.content || [];
                    }
                  } catch (e) {
                    console.error('Error searching entities:', e);
                    return [];
                  }
                }}
                onSelect={(item) => addPermission(item as any)}
                placeholder={`Search to add ${searchType}s...`}
                displayField={searchType === 'user' ? 'displayName' : 'name'}
                descriptionField={searchType === 'user' ? 'email' : undefined}
                debounceMs={300}
                renderItem={(item: any) => {
                  if (searchType === 'user') {
                    return (
                      <div className="flex items-center gap-3">
                        <UserAvatar user={item as UserDto} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate text-sm">{item.displayName}</p>
                          <p className="text-xs text-gray-500 truncate">{item.email}</p>
                        </div>
                      </div>
                    );
                  } else if (searchType === 'group') {
                    const group = item as GroupDto;
                    return (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0">
                          <Users className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate text-sm">{group.name}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
                            <span>{group.description || 'Group'}</span>
                            {group.users && group.users.length > 0 && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span className="text-gray-400">{group.users.length} members</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  } else {
                    const role = item as RoleDto;
                    return (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0">
                          <Shield className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate text-sm">{role.name}</p>
                          <p className="text-xs text-gray-500 truncate capitalize">{role.description || 'Role'}</p>
                        </div>
                      </div>
                    );
                  }
                }}
              />

              {/* Permissions List */}
              {permissions.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {permissions.map((perm) => {
                    const isExpanded = expandedPermissions.includes(perm.id);
                    const currentPermissions = perm.preset === 'custom' && perm.customPermissions
                      ? perm.customPermissions
                      : PERMISSION_PRESETS[perm.preset as keyof typeof PERMISSION_PRESETS];

                    return (
                      <div key={perm.id} className="group bg-white border border-gray-200 rounded-xl hover:border-blue-200 hover:shadow-md transition-all duration-200 overflow-hidden">
                        {/* Card Content */}
                        <div className="p-4">
                          <div className="flex items-start gap-4">
                            <button
                              type="button"
                              onClick={() => togglePermissionExpanded(perm.id)}
                              className="flex items-center gap-3 flex-1 min-w-0 text-left"
                            >
                              {/* Entity Icon/Avatar */}
                              <div className="relative">
                                {perm.type === 'user' && <UserAvatar user={perm.entity as UserDto} size="md" />}
                                {perm.type === 'group' && (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center border-2 border-white shadow-sm text-emerald-600">
                                    <Users className="w-5 h-5" />
                                  </div>
                                )}
                                {perm.type === 'role' && (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center border-2 border-white shadow-sm text-amber-600">
                                    <Shield className="w-5 h-5" />
                                  </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-gray-100">
                                  {isExpanded ? (
                                    <ChevronDown className="w-3 h-3 text-gray-400" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 text-gray-400" />
                                  )}
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">
                                  {perm.type === 'user'
                                    ? (perm.entity as UserDto).displayName
                                    : (perm.entity as RoleDto | GroupDto).name}
                                </p>
                                {perm.type === 'user' && (
                                  <p className="text-xs text-gray-500 truncate">
                                    {(perm.entity as UserDto).email}
                                  </p>
                                )}
                                {perm.type === 'group' && (
                                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                    <span>{(perm.entity as GroupDto).description || 'Group'}</span>
                                    {(perm.entity as GroupDto).users && (perm.entity as GroupDto).users!.length > 0 && (
                                      <>
                                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                        <span className="text-gray-400">{(perm.entity as GroupDto).users!.length} members</span>
                                      </>
                                    )}
                                  </p>
                                )}
                                {perm.type === 'role' && (
                                  <p className="text-xs text-gray-500 capitalize">
                                    {(perm.entity as RoleDto).description || 'Role'}
                                  </p>
                                )}
                              </div>
                            </button>

                            {/* Preset Selector */}
                            <div className="flex items-center gap-2">
                              <div className="w-32">
                                <Select
                                  value={perm.preset}
                                  onValueChange={(value) => updatePermissionPreset(perm.id, value as any)}
                                >
                                  <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 hover:bg-white hover:border-blue-300 transition-all">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(PRESET_LABELS).map(([key, { label }]) => (
                                      <SelectItem key={key} value={key} className="text-xs">
                                        {label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <button
                                type="button"
                                onClick={() => removePermission(perm.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                title="Remove permission"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Panel */}
                        {isExpanded && (
                          <div className="border-t border-gray-100 bg-gray-50/50 p-4 animate-in slide-in-from-top-2 duration-200">
                            <div className="grid md:grid-cols-2 gap-6">
                              {/* Folder Permissions Section */}
                              <div className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm">
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50">
                                  <div className="p-1.5 bg-blue-50 rounded-md">
                                    <Folder className="h-3.5 w-3.5 text-blue-600" />
                                  </div>
                                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Folder Access</p>
                                </div>
                                <div className="space-y-1">
                                  <label className="flex items-center gap-3 text-sm px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors cursor-pointer group/item">
                                    <input
                                      type="checkbox"
                                      checked={currentPermissions.canView}
                                      onChange={(e) => updateCustomPermission(perm.id, 'canView', e.target.checked)}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="flex items-center gap-2 text-gray-600 group-hover/item:text-gray-900">
                                      <Eye className="w-3.5 h-3.5 text-gray-400" /> View
                                    </span>
                                  </label>
                                  <label className="flex items-center gap-3 text-sm px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors cursor-pointer group/item">
                                    <input
                                      type="checkbox"
                                      checked={currentPermissions.canEdit}
                                      onChange={(e) => updateCustomPermission(perm.id, 'canEdit', e.target.checked)}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="flex items-center gap-2 text-gray-600 group-hover/item:text-gray-900">
                                      <Edit className="w-3.5 h-3.5 text-gray-400" /> Edit
                                    </span>
                                  </label>
                                  <label className="flex items-center gap-3 text-sm px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors cursor-pointer group/item">
                                    <input
                                      type="checkbox"
                                      checked={currentPermissions.canDelete}
                                      onChange={(e) => updateCustomPermission(perm.id, 'canDelete', e.target.checked)}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="flex items-center gap-2 text-gray-600 group-hover/item:text-gray-900">
                                      <Trash2 className="w-3.5 h-3.5 text-gray-400" /> Delete
                                    </span>
                                  </label>
                                  <label className="flex items-center gap-3 text-sm px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors cursor-pointer group/item">
                                    <input
                                      type="checkbox"
                                      checked={currentPermissions.canCreateSubFolders}
                                      onChange={(e) => updateCustomPermission(perm.id, 'canCreateSubFolders', e.target.checked)}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="flex items-center gap-2 text-gray-600 group-hover/item:text-gray-900">
                                      <Folder className="w-3.5 h-3.5 text-gray-400" /> Create Subfolders
                                    </span>
                                  </label>
                                  <label className="flex items-center gap-3 text-sm px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors cursor-pointer group/item">
                                    <input
                                      type="checkbox"
                                      checked={currentPermissions.canManagePermissions}
                                      onChange={(e) => updateCustomPermission(perm.id, 'canManagePermissions', e.target.checked)}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="flex items-center gap-2 text-gray-600 group-hover/item:text-gray-900">
                                      <Settings className="w-3.5 h-3.5 text-gray-400" /> Manage Permissions
                                    </span>
                                  </label>
                                </div>
                              </div>

                              {/* Document Permissions Section */}
                              <div className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm">
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50">
                                  <div className="p-1.5 bg-purple-50 rounded-md">
                                    <FileText className="h-3.5 w-3.5 text-purple-600" />
                                  </div>
                                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Document Access</p>
                                </div>
                                <div className="space-y-1">
                                  <label className="flex items-center gap-3 text-sm px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors cursor-pointer group/item">
                                    <input
                                      type="checkbox"
                                      checked={currentPermissions.canUpload}
                                      onChange={(e) => updateCustomPermission(perm.id, 'canUpload', e.target.checked)}
                                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="flex items-center gap-2 text-gray-600 group-hover/item:text-gray-900">
                                      <Upload className="w-3.5 h-3.5 text-gray-400" /> Upload
                                    </span>
                                  </label>
                                  <label className="flex items-center gap-3 text-sm px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors cursor-pointer group/item">
                                    <input
                                      type="checkbox"
                                      checked={currentPermissions.canEditDoc}
                                      onChange={(e) => updateCustomPermission(perm.id, 'canEditDoc', e.target.checked)}
                                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="flex items-center gap-2 text-gray-600 group-hover/item:text-gray-900">
                                      <Edit className="w-3.5 h-3.5 text-gray-400" /> Edit
                                    </span>
                                  </label>
                                  <label className="flex items-center gap-3 text-sm px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors cursor-pointer group/item">
                                    <input
                                      type="checkbox"
                                      checked={currentPermissions.canDeleteDoc}
                                      onChange={(e) => updateCustomPermission(perm.id, 'canDeleteDoc', e.target.checked)}
                                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="flex items-center gap-2 text-gray-600 group-hover/item:text-gray-900">
                                      <Trash2 className="w-3.5 h-3.5 text-gray-400" /> Delete
                                    </span>
                                  </label>
                                  <label className="flex items-center gap-3 text-sm px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors cursor-pointer group/item">
                                    <input
                                      type="checkbox"
                                      checked={currentPermissions.canManagePermissionsDoc}
                                      onChange={(e) => updateCustomPermission(perm.id, 'canManagePermissionsDoc', e.target.checked)}
                                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="flex items-center gap-2 text-gray-600 group-hover/item:text-gray-900">
                                      <Settings className="w-3.5 h-3.5 text-gray-400" /> Manage Permissions
                                    </span>
                                  </label>
                                </div>
                              </div>
                            </div>

                            {/* Inheritance Option */}
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition-all cursor-pointer">
                                <div className="flex items-center justify-center w-5 h-5">
                                  <input
                                    type="checkbox"
                                    checked={currentPermissions.inherits}
                                    onChange={(e) => updateCustomPermission(perm.id, 'inherits', e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900">Inherit to Subfolders</span>
                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-gray-50">Recommended</Badge>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5">Automatically apply these permissions to all folders created inside this one</p>
                                </div>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-xl border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <Shield className="w-8 h-8 text-gray-300" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-900">No permissions assigned</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-[200px]">Search and add users, groups, or roles to grant access to this folder.</p>
                </div>
              )
              }
            </div>
          </div>

          {/* Subfolders Tree */}
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Structure</h3>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addSubfolder()}
                disabled={loading}
                className="text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Subfolder
              </Button>
            </div>

            {subfolders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
                  <Folder className="w-8 h-8 text-gray-300" />
                </div>
                <h4 className="text-sm font-medium text-gray-900">No subfolders</h4>
                <p className="text-xs text-gray-500 mt-1">Create a nested folder structure instantly.</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addSubfolder()}
                  className="mt-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  Add your first subfolder
                </Button>
              </div>
            ) : (
              <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 max-h-80 overflow-y-auto custom-scrollbar">
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
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50/80 backdrop-blur-sm">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
            className="hover:bg-gray-100 text-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !folderName.trim()}
            className="bg-blue-500 hover:bg-blue-700text-white shadow-lg shadow-blue-500/25 px-8 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
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
    <div className="space-y-3 relative">
      {/* Connecting line for nested items */}
      {path.length > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200 -ml-4" />
      )}

      {subfolders.map((subfolder, index) => {
        const currentPath = [...path, index];
        const hasChildren = subfolder.subfolders && subfolder.subfolders.length > 0;

        return (
          <div key={subfolder.id} className="relative">
            <div className="group flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200">
              {/* Expand/Collapse */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (hasChildren) onToggle(currentPath);
                }}
                className={`w-6 h-6 flex items-center justify-center rounded-md transition-colors ${hasChildren
                  ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  : 'opacity-0 cursor-default'
                  }`}
              >
                {hasChildren && (
                  subfolder.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {/* Folder Icon */}
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                <Folder className="w-4 h-4" />
              </div>

              {/* Name Input */}
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={subfolder.name}
                  onChange={(e) => onUpdate(currentPath, 'name', e.target.value)}
                  placeholder="Subfolder name"
                  disabled={disabled}
                  className="w-full px-2 py-1 text-sm font-medium text-gray-900 bg-transparent border-none focus:ring-0 placeholder-gray-400 p-0"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAddChild(index, path);
                  }}
                  disabled={disabled}
                  title="Add nested subfolder"
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Children */}
            {subfolder.expanded && hasChildren && (
              <div className="ml-8 mt-3 pl-4 border-l-2 border-gray-100">
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
