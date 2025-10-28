'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useServerSideSearch } from '@/components/main/useServerSideSearch';
import ServerSearchInput from '@/components/main/ServerSearchInput';
import Pagination from '@/components/main/Pagination';
import UserAvatar from '@/components/main/UserAvatar';
import { roleManagementService } from '@/api/services/roleManagementService';
import { UserDto } from '@/types/api';

interface AssignRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userIds: string[]) => Promise<void>;
  roleId: string;
  roleName: string;
  loading?: boolean;
}

export default function AssignRoleModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  roleId, 
  roleName,
  loading = false 
}: AssignRoleModalProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const pageSize = 20;

  // Use the server-side search hook - only fetch users NOT in role
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
      return await roleManagementService.getAvailableUsersForRole(
        roleId,
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

  const handleClose = () => {
    setSearchQuery('');
    setSelectedUserIds([]);
    onClose();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage === page) return;
    setPage(newPage);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Assign Role</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Assign "{roleName}" to users
            </p>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="p-4 border-b">
            <ServerSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search users by username or email..."
            />
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : users.length === 0 ? (
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
                {isLocalFiltering ? 'Fetching comprehensive results...' : 'Loading users...'}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t px-4 py-2">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={pageSize}
                onPageChange={handlePageChange}
              />
            </div>
          )}

          {/* Footer */}
          <div className="border-t p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground flex-1">
                {selectedUserIds.length > 0 ? (
                  <span className="font-medium text-foreground">
                    {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''} selected
                  </span>
                ) : (
                  <span>{totalElements} available user{totalElements !== 1 ? 's' : ''}</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={loading || selectedUserIds.length === 0}>
                  {loading ? 'Assigning...' : `Assign ${selectedUserIds.length > 0 ? `(${selectedUserIds.length})` : ''}`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
