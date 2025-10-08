'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  RoleCreateReq, 
  RoleUpdateReq, 
  RoleDto, 
  UserDto 
} from '@/types/api';
import { notificationApiClient } from '@/api/notificationClient';
import { X, Plus, Trash2, Shield, Users } from 'lucide-react';

interface RoleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: RoleDto | null;
  permissions: string[];
  users: UserDto[];
  onRoleSaved: () => void;
}

export default function RoleManagementModal({
  isOpen,
  onClose,
  role,
  permissions,
  users,
  onRoleSaved
}: RoleManagementModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });
  
  const [roleUsers, setRoleUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!role;

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description,
        permissions: role.permissions || []
      });
      
      // Load role's users
      loadRoleUsers();
    } else {
      // Reset form for new role
      setFormData({
        name: '',
        description: '',
        permissions: []
      });
      setRoleUsers([]);
    }
    setError(null);
  }, [role, isOpen]);

  const loadRoleUsers = async () => {
    if (!role) return;
    
    try {
      const usersWithRole = await notificationApiClient.getRoleUsers(role.name, { size: 100 });
      setRoleUsers(usersWithRole);
    } catch (error) {
      console.error('Error loading role users:', error);
      setRoleUsers([]);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const handleAssignUser = async (userId: string) => {
    if (!role || roleUsers.find(u => u.id === userId)) return;
    
    try {
      await notificationApiClient.assignRoleToUser(role.name, userId);
      const user = users.find(u => u.id === userId);
      if (user) {
        setRoleUsers(prev => [...prev, user]);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to assign role to user');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!role) return;
    
    try {
      await notificationApiClient.removeRoleFromUser(role.name, userId);
      setRoleUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error: any) {
      setError(error.message || 'Failed to remove role from user');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditMode && role) {
        const updateData: RoleUpdateReq = {
          description: formData.description,
          permissions: formData.permissions
        };
        
        await notificationApiClient.updateRole(role.id, updateData);
      } else {
        const createData: RoleCreateReq = {
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions
        };
        
        await notificationApiClient.createRole(createData);
      }
      
      onRoleSaved();
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!role || !confirm('Are you sure you want to delete this role?')) return;
    
    setLoading(true);
    try {
      await notificationApiClient.deleteRole(role.id);
      onRoleSaved();
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to delete role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Role' : 'Create New Role'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Role Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              disabled={isEditMode}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label>Permissions</Label>
            <div className="max-h-40 overflow-y-auto border rounded p-3 space-y-2">
              {permissions.map((permission) => (
                <label key={permission} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(permission)}
                    onChange={() => handlePermissionToggle(permission)}
                    className="rounded"
                  />
                  <span className="text-sm">{permission}</span>
                </label>
              ))}
            </div>
            <div className="mt-2">
              <Badge variant="secondary">
                {formData.permissions.length} permissions selected
              </Badge>
            </div>
          </div>

          {isEditMode && (
            <div>
              <Label>Assigned Users</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {roleUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{user.firstName} {user.lastName}</span>
                      <span className="text-sm text-gray-500">({user.email})</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveUser(user.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Select onValueChange={handleAssignUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign role to user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter(user => !roleUsers.find(ru => ru.id === user.id))
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </form>

        <DialogFooter className="flex justify-between">
          <div>
            {isEditMode && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete Role
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditMode ? 'Update Role' : 'Create Role')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
