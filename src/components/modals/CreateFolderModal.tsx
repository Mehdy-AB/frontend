'use client';

import { useState, useEffect } from 'react';
import { X, Folder, Plus, Trash2, ChevronRight, ChevronDown, Info, Users, Shield, UserPlus } from 'lucide-react';
import { notificationApiClient } from '@/api/notificationClient';
import { CreateFolderDto, SubfolderDto, FolderPermissionReq, UserDto, RoleDto, GroupDto, TypeShareAcces } from '@/types/api';
import UserAvatar from '@/components/main/UserAvatar';

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

interface PermissionAssignment {
  id: string;
  type: 'user' | 'group' | 'role';
  entity: UserDto | GroupDto | RoleDto;
  permission: FolderPermissionReq;
}

const defaultPermission: FolderPermissionReq = {
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
};

const permissionPresets = {
  viewer: { ...defaultPermission, canView: true },
  contributor: { ...defaultPermission, canView: true, canUpload: true, canEditDoc: true },
  editor: { ...defaultPermission, canView: true, canUpload: true, canEdit: true, canEditDoc: true, canDeleteDoc: true, canCreateSubFolders: true },
  admin: { ...defaultPermission, canView: true, canUpload: true, canEdit: true, canDelete: true, canShare: true, canManagePermissions: true, canCreateSubFolders: true, canEditDoc: true, canDeleteDoc: true, canShareDoc: true, canManagePermissionsDoc: true, inherits: false }
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
  const [showPermissions, setShowPermissions] = useState(false);
  const [permissions, setPermissions] = useState<PermissionAssignment[]>([]);
  const [activePermTab, setActivePermTab] = useState<'users' | 'groups' | 'roles'>('users');

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(UserDto | GroupDto | RoleDto)[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Load available entities
  useEffect(() => {
    if (!isOpen || !showPermissions || !searchQuery) {
      setSearchResults([]);
      return;
    }

    const searchEntities = async () => {
      setSearchLoading(true);
      try {
        let results: any[] = [];
        if (activePermTab === 'users') {
          const response = await notificationApiClient.getAllUsers({ page: 0, size: 20 });
          results = response.content.filter((u: UserDto) => 
            u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
          );
        } else if (activePermTab === 'groups') {
          const response = await notificationApiClient.getAllGroups({ page: 0, size: 20 });
          results = response.content.filter((g: GroupDto) =>
            g.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        } else {
          const response = await notificationApiClient.getAllRoles({ page: 0, size: 20 });
          results = response.content.filter((r: RoleDto) =>
            r.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        setSearchResults(results);
      } catch (error) {
        console.error('Failed to search:', error);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounce = setTimeout(searchEntities, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, activePermTab, isOpen, showPermissions]);

  const handleClose = () => {
    if (!loading) {
      setFolderName('');
      setDescription('');
      setSubfolders([]);
      setPermissions([]);
      setShowPermissions(false);
      setSearchQuery('');
      onClose();
    }
  };

  const addPermission = (entity: UserDto | GroupDto | RoleDto, preset: keyof typeof permissionPresets = 'viewer') => {
    const newPerm: PermissionAssignment = {
      id: `${activePermTab}_${entity.id}_${Date.now()}`,
      type: activePermTab,
      entity,
      permission: { ...permissionPresets[preset] }
    };
    setPermissions(prev => [...prev, newPerm]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removePermission = (id: string) => {
    setPermissions(prev => prev.filter(p => p.id !== id));
  };

  const updatePermission = (id: string, permission: FolderPermissionReq) => {
    setPermissions(prev => prev.map(p => p.id === id ? { ...p, permission } : p));
  };

  const addSubfolder = (parentIndex?: number) => {
    const newSubfolder: SubfolderInput = {
      id: `sf_${Date.now()}_${Math.random()}`,
      name: '',
      description: '',
      subfolders: [],
      expanded: true
    };

    if (parentIndex !== undefined) {
      setSubfolders(prev => {
        const updated = [...prev];
        const parent = updated[parentIndex];
        if (!parent.subfolders) parent.subfolders = [];
        parent.subfolders.push(newSubfolder);
        parent.expanded = true;
        return updated;
      });
    } else {
      setSubfolders(prev => [...prev, newSubfolder]);
    }
  };

  const updateSubfolder = (index: number, field: 'name' | 'description', value: string) => {
    setSubfolders(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateNestedSubfolder = (parentIndex: number, childIndex: number, field: 'name' | 'description', value: string) => {
    setSubfolders(prev => {
      const updated = [...prev];
      const parent = { ...updated[parentIndex] };
      const children = [...(parent.subfolders || [])];
      children[childIndex] = { ...children[childIndex], [field]: value };
      parent.subfolders = children;
      updated[parentIndex] = parent;
      return updated;
    });
  };

  const removeSubfolder = (index: number) => {
    setSubfolders(prev => prev.filter((_, i) => i !== index));
  };

  const removeNestedSubfolder = (parentIndex: number, childIndex: number) => {
    setSubfolders(prev => {
      const updated = [...prev];
      const parent = { ...updated[parentIndex] };
      parent.subfolders = (parent.subfolders || []).filter((_, i) => i !== childIndex);
      updated[parentIndex] = parent;
      return updated;
    });
  };

  const toggleExpanded = (index: number) => {
    setSubfolders(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], expanded: !updated[index].expanded };
      return updated;
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

      // Group permissions by type
      const userPermissions = permissions
        .filter(p => p.type === 'user')
        .map(p => ({ id: p.entity.id, permission: p.permission }));

      const groupPermissions = permissions
        .filter(p => p.type === 'group')
        .map(p => ({ id: p.entity.id, permission: p.permission }));

      const rolePermissions = permissions
        .filter(p => p.type === 'role')
        .map(p => ({ id: p.entity.id, permission: p.permission }));

      const folderData: CreateFolderDto = {
        name: folderName.trim(),
        description: description.trim() || undefined,
        parentId: parentId || undefined,
        usersGevenPermission: userPermissions.length > 0 ? userPermissions : undefined,
        goupesGevenPermission: groupPermissions.length > 0 ? groupPermissions : undefined,
        rolesGevenPermission: rolePermissions.length > 0 ? rolePermissions : undefined,
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

  const currentPermissions = permissions.filter(p => p.type === activePermTab);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Folder className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Create New Folder</h2>
              {parentName && (
                <p className="text-sm text-slate-500 mt-0.5">
                  Inside <span className="font-medium text-slate-700">{parentName}</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="w-10 h-10 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Folder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter folder description"
                  disabled={loading}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 resize-none"
                />
              </div>
            </div>

            {/* Permissions Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-slate-600" />
                  <h3 className="text-lg font-semibold text-slate-900">Permissions</h3>
                  <span className="text-sm text-slate-500">({permissions.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPermissions(!showPermissions)}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                >
                  {showPermissions ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  {showPermissions ? 'Hide' : 'Show'}
                </button>
              </div>

              {showPermissions && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                  {/* Tabs */}
                  <div className="flex gap-2 border-b border-slate-200">
                    <button
                      type="button"
                      onClick={() => setActivePermTab('users')}
                      className={`px-4 py-2 font-medium transition-colors ${
                        activePermTab === 'users'
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Users className="w-4 h-4 inline mr-2" />
                      Users
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePermTab('groups')}
                      className={`px-4 py-2 font-medium transition-colors ${
                        activePermTab === 'groups'
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Users className="w-4 h-4 inline mr-2" />
                      Groups
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePermTab('roles')}
                      className={`px-4 py-2 font-medium transition-colors ${
                        activePermTab === 'roles'
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Shield className="w-4 h-4 inline mr-2" />
                      Roles
                    </button>
                  </div>

                  {/* Search */}
                  <div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Search ${activePermTab}...`}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Search Results */}
                  {searchQuery && searchResults.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-48 overflow-y-auto">
                      {searchResults.map((entity) => (
                        <div
                          key={entity.id}
                          className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                          onClick={() => addPermission(entity)}
                        >
                          <div className="flex items-center gap-3">
                            {activePermTab === 'users' && (
                              <UserAvatar user={entity as UserDto} size="sm" />
                            )}
                            <div>
                              <p className="font-medium text-slate-900">
                                {activePermTab === 'users' ? (entity as UserDto).displayName : entity.name}
                              </p>
                              {activePermTab === 'users' && (
                                <p className="text-sm text-slate-500">{(entity as UserDto).email}</p>
                              )}
                            </div>
                          </div>
                          <UserPlus className="w-4 h-4 text-blue-600" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Current Permissions */}
                  {currentPermissions.length > 0 ? (
                    <div className="space-y-2">
                      {currentPermissions.map((perm) => (
                        <div key={perm.id} className="bg-white border border-slate-200 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              {perm.type === 'user' && (
                                <UserAvatar user={perm.entity as UserDto} size="sm" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-900 truncate">
                                  {perm.type === 'user' ? (perm.entity as UserDto).displayName : perm.entity.name}
                                </p>
                                {perm.type === 'user' && (
                                  <p className="text-sm text-slate-500 truncate">{(perm.entity as UserDto).email}</p>
                                )}
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {Object.entries(permissionPresets).map(([key, preset]) => (
                                    <button
                                      key={key}
                                      type="button"
                                      onClick={() => updatePermission(perm.id, preset)}
                                      className={`px-2 py-1 text-xs rounded ${
                                        JSON.stringify(perm.permission) === JSON.stringify(preset)
                                          ? 'bg-blue-600 text-white'
                                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                      }`}
                                    >
                                      {key.charAt(0).toUpperCase() + key.slice(1)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removePermission(perm.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <UserPlus className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                      <p>No {activePermTab} added yet</p>
                      <p className="text-sm">Search and click to add</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Subfolders Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Subfolders</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Create nested folders in one go</p>
                </div>
                <button
                  type="button"
                  onClick={() => addSubfolder()}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Subfolder
                </button>
              </div>

              {subfolders.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
                  <Info className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No subfolders added</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Click "Add Subfolder" to create nested folders
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subfolders.map((subfolder, index) => (
                    <div key={subfolder.id} className="bg-slate-50 rounded-lg border border-slate-200">
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          {(subfolder.subfolders && subfolder.subfolders.length > 0) && (
                            <button
                              type="button"
                              onClick={() => toggleExpanded(index)}
                              className="mt-3 text-slate-400 hover:text-slate-600"
                            >
                              {subfolder.expanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <input
                                type="text"
                                value={subfolder.name}
                                onChange={(e) => updateSubfolder(index, 'name', e.target.value)}
                                placeholder="Subfolder name"
                                disabled={loading}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100"
                              />
                              <button
                                type="button"
                                onClick={() => addSubfolder(index)}
                                disabled={loading}
                                title="Add nested subfolder"
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeSubfolder(index)}
                                disabled={loading}
                                title="Remove subfolder"
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={subfolder.description || ''}
                              onChange={(e) => updateSubfolder(index, 'description', e.target.value)}
                              placeholder="Description (optional)"
                              disabled={loading}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 text-sm"
                            />
                          </div>
                        </div>

                        {subfolder.expanded && subfolder.subfolders && subfolder.subfolders.length > 0 && (
                          <div className="mt-3 ml-6 pl-4 border-l-2 border-slate-300 space-y-3">
                            {subfolder.subfolders.map((nestedSubfolder, nestedIndex) => (
                              <div key={(nestedSubfolder as SubfolderInput).id} className="flex items-start gap-3">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="text"
                                      value={nestedSubfolder.name}
                                      onChange={(e) => updateNestedSubfolder(index, nestedIndex, 'name', e.target.value)}
                                      placeholder="Nested subfolder name"
                                      disabled={loading}
                                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 text-sm"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeNestedSubfolder(index, nestedIndex)}
                                      disabled={loading}
                                      title="Remove nested subfolder"
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    value={nestedSubfolder.description || ''}
                                    onChange={(e) => updateNestedSubfolder(index, nestedIndex, 'description', e.target.value)}
                                    placeholder="Description (optional)"
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 text-xs"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Automatic Permission Inheritance</p>
                <p className="text-blue-700">
                  All subfolders will automatically inherit permissions from the parent folder. 
                  You can modify permissions later from the folder settings.
                </p>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-6 py-2.5 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !folderName.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating...
              </span>
            ) : (
              'Create Folder'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
