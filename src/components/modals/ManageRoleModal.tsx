'use client';

import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { notificationApiClient } from '@/api/notificationClient';
import { PermissionDto } from '@/types/api';

interface ManageRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateRoleData) => Promise<void>;
  role: any;
  loading?: boolean;
}

export interface UpdateRoleData {
  name: string;
  description?: string;
  permissionKeys: string[];
}

export default function ManageRoleModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  role,
  loading = false 
}: ManageRoleModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [allPermissions, setAllPermissions] = useState<PermissionDto[]>([]);
  const [selectedPermissionKeys, setSelectedPermissionKeys] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [filteredPermissions, setFilteredPermissions] = useState<PermissionDto[]>([]);

  useEffect(() => {
    if (isOpen && role) {
      setName(role.name);
      setDescription(role.description || '');
      // Extract existing permissions from rolePermissions array
      const rolePerms = (role as any).rolePermissions;
      const existingPerms = rolePerms && Array.isArray(rolePerms) 
        ? rolePerms.map((rp: any) => rp.permission?.key).filter((k: string) => k)
        : (role.permissions?.map((p: any) => p.key || p) || []);
      setSelectedPermissionKeys(existingPerms);
      fetchPermissions();
    }
  }, [isOpen, role]);

  useEffect(() => {
    fetchPermissions();
  }, [isOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPermissions(allPermissions);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allPermissions.filter(perm => 
      perm.key.toLowerCase().includes(query) ||
      perm.name.toLowerCase().includes(query) ||
      perm.category?.toLowerCase().includes(query)
    );
    setFilteredPermissions(filtered);
  }, [searchQuery, allPermissions]);

  const fetchPermissions = async () => {
    try {
      setLoadingPermissions(true);
      const permissions = await notificationApiClient.getAllPermissions();
      const permsArray = Array.isArray(permissions) ? permissions : [];
      setAllPermissions(permsArray);
      setFilteredPermissions(permsArray);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const togglePermission = (permissionKey: string) => {
    setSelectedPermissionKeys(prev =>
      prev.includes(permissionKey)
        ? prev.filter(key => key !== permissionKey)
        : [...prev, permissionKey]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name,
      description,
      permissionKeys: selectedPermissionKeys
    });
  };

  const permissionsByCategory = filteredPermissions.reduce((acc, perm) => {
    const category = perm.category || 'GENERAL';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(perm);
    return acc;
  }, {} as Record<string, PermissionDto[]>);

  if (!isOpen || !role) return null;

  const isSystemRole = (role as any).isSystem || false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Manage Role</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isSystemRole ? `Edit permissions for "{role.name}" (System Role)` : `Edit "${role.name}" and manage permissions`}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Role Info */}
          <div className="w-1/3 border-r p-6 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Role Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1"
                  disabled={isSystemRole}
                />
                {isSystemRole && (
                  <p className="text-xs text-muted-foreground mt-1">
                    System roles cannot be renamed
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="mt-1"
                  disabled={isSystemRole}
                />
                {isSystemRole && (
                  <p className="text-xs text-muted-foreground mt-1">
                    System role descriptions are fixed
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Selected Permissions ({selectedPermissionKeys.length})</p>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-2 border rounded-md bg-muted/30">
                  {selectedPermissionKeys.length > 0 ? (
                    selectedPermissionKeys.map(key => {
                      const perm = allPermissions.find(p => p.key === key);
                      return (
                        <Badge key={key} variant="default" className="text-xs">
                          {perm?.name || key}
                        </Badge>
                      );
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No permissions selected</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Permissions */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search permissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingPermissions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : Object.keys(permissionsByCategory).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No permissions found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(permissionsByCategory).map(([category, perms]) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold mb-2">{category}</h3>
                      <div className="space-y-2">
                        {perms.map((perm) => {
                          const isSelected = selectedPermissionKeys.includes(perm.key);
                          return (
                            <div
                              key={perm.id}
                              onClick={() => togglePermission(perm.key)}
                              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                isSelected ? 'bg-primary-light border-primary' : 'hover:bg-muted'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => togglePermission(perm.key)}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{perm.name}</div>
                                <div className="text-xs text-muted-foreground font-mono">{perm.key}</div>
                                {perm.description && (
                                  <div className="text-xs text-muted-foreground mt-1">{perm.description}</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
