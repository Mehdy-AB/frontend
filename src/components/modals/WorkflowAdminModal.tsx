'use client';

import React, { useState, useEffect } from 'react';
import { X, Shield, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { notificationApiClient } from '@/api/notificationClient';
import { UserDto } from '@/types/api';
import { useNotifications } from '@/hooks/useNotifications';
import UserAvatar from '@/components/main/UserAvatar';

interface WorkflowAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    userId: string;
  }) => Promise<void>;
  editingAdmin?: {
    id: number;
    user: UserDto;
  } | null;
  existingAdminUserIds?: string[];
}

export default function WorkflowAdminModal({
  isOpen,
  onClose,
  onSave,
  editingAdmin,
  existingAdminUserIds = [],
}: WorkflowAdminModalProps) {
  const { showError } = useNotifications();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Load all users for dropdown
  const [allUsers, setAllUsers] = useState<UserDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      const loadUsers = async () => {
        try {
          const response = await notificationApiClient.getAllUsers({ page: 0, size: 1000 });
          setAllUsers(response.content || []);
        } catch (error) {
          console.error('Failed to load users:', error);
        }
      };
      loadUsers();
    } else {
      // Reset search query when modal closes
      setSearchQuery('');
    }
  }, [isOpen]);
  
  // Filter users based on search query
  const filteredUsers = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return allUsers;
    }
    const query = searchQuery.toLowerCase();
    return allUsers.filter(user => 
      (user.displayName || '').toLowerCase().includes(query) ||
      (user.email || '').toLowerCase().includes(query) ||
      (user.username || '').toLowerCase().includes(query)
    );
  }, [allUsers, searchQuery]);
  
  // Filter out existing admins (except the one being edited)
  const availableUsers = React.useMemo(() => {
    return filteredUsers.filter(
      (user) => !existingAdminUserIds.includes(user.id) || (editingAdmin && user.id === editingAdmin.user.id)
    );
  }, [filteredUsers, existingAdminUserIds, editingAdmin]);

  useEffect(() => {
    if (editingAdmin) {
      setSelectedUserId(editingAdmin.user.id);
    } else {
      setSelectedUserId('');
    }
  }, [editingAdmin, isOpen]);

  const handleSave = async () => {
    if (!selectedUserId) {
      showError('Validation Error', 'Please select a user');
      return;
    }

    if (!editingAdmin && existingAdminUserIds.includes(selectedUserId)) {
      showError('Validation Error', 'This user is already an admin of this workflow');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        userId: selectedUserId,
      });
      onClose();
    } catch (error: any) {
      console.error('Error saving admin:', error);
      showError('Save Failed', error?.response?.data?.message || 'Failed to save admin');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {editingAdmin ? 'Edit Workflow Admin' : 'Add Workflow Admin'}
              </h2>
              <p className="text-sm text-gray-600">Manage admin permissions for this workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Selection */}
          <div>
            <Label>Select User *</Label>
            {editingAdmin ? (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <UserAvatar user={editingAdmin.user} size="md" />
                  <div>
                    <p className="font-medium">{editingAdmin.user.displayName || editingAdmin.user.username}</p>
                    <p className="text-sm text-gray-600">{editingAdmin.user.email}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full"
                />
                <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                  {availableUsers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">No available users</div>
                  ) : (
                    <div className="divide-y">
                      {availableUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => setSelectedUserId(user.id)}
                          className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                            selectedUserId === user.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <UserAvatar user={user} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {user.displayName || user.username}
                              </p>
                              <p className="text-xs text-gray-600 truncate">{user.email}</p>
                            </div>
                            {selectedUserId === user.id && (
                              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !selectedUserId}>
            {isSaving ? 'Saving...' : editingAdmin ? 'Update Admin' : 'Add Admin'}
          </Button>
        </div>
      </div>
    </div>
  );
}

