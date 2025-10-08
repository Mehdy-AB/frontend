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
  GroupCreateReq, 
  GroupUpdateReq, 
  GroupDto, 
  UserDto 
} from '@/types/api';
import { notificationApiClient } from '@/api/notificationClient';
import { X, Plus, Trash2, FolderTree, Users } from 'lucide-react';

interface GroupManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  group?: GroupDto | null;
  users: UserDto[];
  groups: GroupDto[];
  onGroupSaved: () => void;
}

export default function GroupManagementModal({
  isOpen,
  onClose,
  group,
  users,
  groups,
  onGroupSaved
}: GroupManagementModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    path: ''
  });
  
  const [groupMembers, setGroupMembers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!group;

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        description: group.description,
        path: group.path
      });
      
      // Load group members
      loadGroupMembers();
    } else {
      // Reset form for new group
      setFormData({
        name: '',
        description: '',
        path: ''
      });
      setGroupMembers([]);
    }
    setError(null);
  }, [group, isOpen]);

  const loadGroupMembers = async () => {
    if (!group) return;
    
    try {
      const members = await notificationApiClient.getGroupMembers(group.id, { max: 100 });
      setGroupMembers(members);
    } catch (error) {
      console.error('Error loading group members:', error);
      setGroupMembers([]);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddMember = async (userId: string) => {
    if (!group || groupMembers.find(m => m.id === userId)) return;
    
    try {
      await notificationApiClient.addUserToGroup(group.id, userId);
      const user = users.find(u => u.id === userId);
      if (user) {
        setGroupMembers(prev => [...prev, user]);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to add user to group');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!group) return;
    
    try {
      await notificationApiClient.removeUserFromGroup(group.id, userId);
      setGroupMembers(prev => prev.filter(member => member.id !== userId));
    } catch (error: any) {
      setError(error.message || 'Failed to remove user from group');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditMode && group) {
        const updateData: GroupUpdateReq = {
          name: formData.name,
          description: formData.description,
          path: formData.path
        };
        
        await notificationApiClient.updateGroup(group.id, updateData);
      } else {
        const createData: GroupCreateReq = {
          name: formData.name,
          description: formData.description,
          path: formData.path
        };
        
        await notificationApiClient.createGroup(createData);
      }
      
      onGroupSaved();
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to save group');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!group || !confirm('Are you sure you want to delete this group?')) return;
    
    setLoading(true);
    try {
      await notificationApiClient.deleteGroup(group.id);
      onGroupSaved();
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to delete group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Group' : 'Create New Group'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Group Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="path">Group Path *</Label>
            <Input
              id="path"
              value={formData.path}
              onChange={(e) => handleInputChange('path', e.target.value)}
              required
              placeholder="/group/path"
            />
            <p className="text-sm text-gray-500 mt-1">
              The hierarchical path for this group (e.g., /departments/engineering)
            </p>
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

          {isEditMode && (
            <div>
              <Label>Group Members ({groupMembers.length})</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {groupMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{member.firstName} {member.lastName}</span>
                      <span className="text-sm text-gray-500">({member.email})</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Select onValueChange={handleAddMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add user to group" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter(user => !groupMembers.find(member => member.id === user.id))
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
                Delete Group
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
              {loading ? 'Saving...' : (isEditMode ? 'Update Group' : 'Create Group')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
