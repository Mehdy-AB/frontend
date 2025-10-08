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
  UserCreateReq, 
  UserUpdateReq, 
  UserDto, 
  RoleDto, 
  GroupDto 
} from '@/types/api';
import { notificationApiClient } from '@/api/notificationClient';
import { X, Plus, Trash2, Shield, FolderTree } from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserDto | null;
  roles: RoleDto[];
  groups: GroupDto[];
  onUserSaved: () => void;
}

export default function UserManagementModal({
  isOpen,
  onClose,
  user,
  roles,
  groups,
  onUserSaved
}: UserManagementModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    jobTitle: [] as string[],
    imageUrl: ''
  });
  
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        password: '',
        jobTitle: user.jobTitle || [],
        imageUrl: user.imageUrl || ''
      });
      
      // Load user's roles and groups
      loadUserRolesAndGroups();
    } else {
      // Reset form for new user
      setFormData({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        jobTitle: [],
        imageUrl: ''
      });
      setUserRoles([]);
      setUserGroups([]);
    }
    setError(null);
  }, [user, isOpen]);

  const loadUserRolesAndGroups = async () => {
    if (!user) return;
    
    try {
      // Note: These would need to be implemented in the API client
      // For now, we'll use empty arrays
      setUserRoles([]);
      setUserGroups([]);
    } catch (error) {
      console.error('Error loading user roles and groups:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddJobTitle = () => {
    if (newJobTitle.trim() && !formData.jobTitle.includes(newJobTitle.trim())) {
      setFormData(prev => ({
        ...prev,
        jobTitle: [...prev.jobTitle, newJobTitle.trim()]
      }));
      setNewJobTitle('');
    }
  };

  const handleRemoveJobTitle = (jobTitle: string) => {
    setFormData(prev => ({
      ...prev,
      jobTitle: prev.jobTitle.filter(jt => jt !== jobTitle)
    }));
  };

  const handleAddRole = async (roleName: string) => {
    if (!user || userRoles.includes(roleName)) return;
    
    try {
      await notificationApiClient.assignRoleToUser(roleName, user.id);
      setUserRoles(prev => [...prev, roleName]);
    } catch (error: any) {
      setError(error.message || 'Failed to assign role');
    }
  };

  const handleRemoveRole = async (roleName: string) => {
    if (!user) return;
    
    try {
      await notificationApiClient.removeRoleFromUser(roleName, user.id);
      setUserRoles(prev => prev.filter(role => role !== roleName));
    } catch (error: any) {
      setError(error.message || 'Failed to remove role');
    }
  };

  const handleAddGroup = async (groupId: string) => {
    if (!user || userGroups.includes(groupId)) return;
    
    try {
      await notificationApiClient.addUserToGroup(groupId, user.id);
      setUserGroups(prev => [...prev, groupId]);
    } catch (error: any) {
      setError(error.message || 'Failed to add user to group');
    }
  };

  const handleRemoveGroup = async (groupId: string) => {
    if (!user) return;
    
    try {
      await notificationApiClient.removeUserFromGroup(groupId, user.id);
      setUserGroups(prev => prev.filter(group => group !== groupId));
    } catch (error: any) {
      setError(error.message || 'Failed to remove user from group');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditMode && user) {
        const updateData: UserUpdateReq = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          jobTitle: formData.jobTitle,
          imageUrl: formData.imageUrl
        };
        
        await notificationApiClient.updateUser(user.id, updateData);
      } else {
        const createData: UserCreateReq = {
          username: formData.username,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
          job: formData.jobTitle,
          imageUrl: formData.imageUrl
        };
        
        await notificationApiClient.createUser(createData);
      }
      
      onUserSaved();
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !confirm('Are you sure you want to delete this user?')) return;
    
    setLoading(true);
    try {
      await notificationApiClient.deleteUser(user.id);
      onUserSaved();
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit User' : 'Create New User'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                required
                disabled={isEditMode}
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
          </div>

          {!isEditMode && (
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="imageUrl">Profile Image URL</Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => handleInputChange('imageUrl', e.target.value)}
            />
          </div>

          <div>
            <Label>Job Titles</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
                placeholder="Add job title"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddJobTitle())}
              />
              <Button type="button" onClick={handleAddJobTitle} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.jobTitle.map((jobTitle) => (
                <Badge key={jobTitle} variant="secondary" className="flex items-center gap-1">
                  {jobTitle}
                  <button
                    type="button"
                    onClick={() => handleRemoveJobTitle(jobTitle)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {isEditMode && (
            <>
              <div>
                <Label>Roles</Label>
                <div className="space-y-2">
                  {userRoles.map((roleName) => (
                    <div key={roleName} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>{roleName}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRole(roleName)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Select onValueChange={handleAddRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Assign new role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles
                        .filter(role => !userRoles.includes(role.name))
                        .map((role) => (
                          <SelectItem key={role.id} value={role.name}>
                            {role.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Groups</Label>
                <div className="space-y-2">
                  {userGroups.map((groupId) => {
                    const group = groups.find(g => g.id === groupId);
                    return (
                      <div key={groupId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <FolderTree className="h-4 w-4" />
                          <span>{group?.name || groupId}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveGroup(groupId)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                  <Select onValueChange={handleAddGroup}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add to group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups
                        .filter(group => !userGroups.includes(group.id))
                        .map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
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
                Delete User
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
              {loading ? 'Saving...' : (isEditMode ? 'Update User' : 'Create User')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
