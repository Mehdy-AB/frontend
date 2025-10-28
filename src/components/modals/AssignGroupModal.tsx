'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useServerSideSearch } from '@/components/main/useServerSideSearch';
import ServerSearchInput from '@/components/main/ServerSearchInput';
import Pagination from '@/components/main/Pagination';
import UserAvatar from '@/components/main/UserAvatar';
import { groupManagementService } from '@/api/services/groupManagementService';
import { UserDto } from '@/types/api';

interface AssignGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userIds: string[]) => Promise<void>;
  groupId: string;
  groupName: string;
  loading?: boolean;
}

export default function AssignGroupModal({
  isOpen,
  onClose,
  onSubmit,
  groupId,
  groupName,
  loading = false
}: AssignGroupModalProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const pageSize = 20;

  // Use the server-side search hook - only fetch users NOT in group
  const {
    displayData: users,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    totalPages,
    totalElements,
    loading: loadingUsers,
    tableLoading,
    isLocalFiltering,
  } = useServerSideSearch<UserDto>({
    fetchFunction: async (page, searchTerm) => {
      return await groupManagementService.getAvailableUsersForGroup(
        groupId,
        page,
        pageSize,
        searchTerm
      );
    },
    searchFields: (user) => [user.username, user.email || ''],
    debounceMs: 800,
    fetchOnMount: isOpen,
  });

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) {
      return;
    }
    await onSubmit(selectedUserIds);
    setSelectedUserIds([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Assign Users to Group</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Add users to "{groupName}"
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="p-4 border-b">
            <ServerSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search available users by username or email..."
            />
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loadingUsers && !isLocalFiltering ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : users.length === 0 && !tableLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchQuery ? 'No available users match your search' : 'No available users to assign'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      onClick={() => toggleUserSelection(user.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary-light border-primary' : 'hover:bg-muted'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-primary border-primary' : 'border-ui'
                      }`}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      
                      <UserAvatar user={user} size="md" className="flex-shrink-0" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{user.displayName || user.username}</div>
                        <div className="text-sm text-muted-foreground truncate">@{user.username}</div>
                        {user.email && (
                          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                        )}
                      </div>
                      
                      {user.jobTitle && (
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {user.jobTitle}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Table Loading Indicator */}
            {tableLoading && (
              <div className="flex items-center justify-center py-4 text-sm text-muted-foreground mt-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                {isLocalFiltering ? 'Fetching comprehensive results...' : 'Loading available users...'}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t p-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading || selectedUserIds.length === 0}>
                {loading ? 'Assigning...' : `Assign to ${selectedUserIds.length} user${selectedUserIds.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

