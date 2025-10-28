'use client';

import React, { useState } from 'react';
import { X, User, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useServerSideSearch } from '@/components/main/useServerSideSearch';
import ServerSearchInput from '@/components/main/ServerSearchInput';
import Pagination from '@/components/main/Pagination';
import UserAvatar from '@/components/main/UserAvatar';
import { groupManagementService } from '@/api/services/groupManagementService';
import { UserDto } from '@/types/api';
import ConfirmationModal from './ConfirmationModal';

interface ViewGroupUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  onUserRemoved?: (userId: string) => void;
}

export default function ViewGroupUsersModal({
  isOpen,
  onClose,
  groupId,
  groupName,
  onUserRemoved
}: ViewGroupUsersModalProps) {
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [userToRemove, setUserToRemove] = useState<UserDto | null>(null);

  const pageSize = 20;

  // Use the server-side search hook
  const {
    displayData: users,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    totalPages,
    totalElements,
    loading,
    tableLoading,
    isLocalFiltering,
    removeItem,
  } = useServerSideSearch<UserDto>({
    fetchFunction: async (page, searchTerm) => {
      return await groupManagementService.getUsersInGroup(
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

  const handleRemoveClick = (user: UserDto) => {
    setUserToRemove(user);
    setShowConfirmDialog(true);
  };

  const handleRemoveConfirm = async () => {
    if (!userToRemove) return;

    try {
      setRemovingUserId(userToRemove.id);
      await groupManagementService.removeUsersFromGroup(groupId, [userToRemove.id]);
      // Remove from local modal state
      removeItem(userToRemove.id);
      // Notify parent to update its state
      onUserRemoved?.(userToRemove.id);
      setShowConfirmDialog(false);
      setUserToRemove(null);
    } catch (error) {
      console.error('Error removing user from group:', error);
    } finally {
      setRemovingUserId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Users in Group</h2>
            <p className="text-sm text-muted-foreground mt-1">
              View users assigned to "{groupName}"
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
              placeholder="Search users by username or email..."
            />
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading && !isLocalFiltering ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : users.length === 0 && !tableLoading ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No users match your search' : 'No users assigned to this group'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user: UserDto) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <UserAvatar user={user} size="md" className="flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{user.displayName || user.username}</div>
                      <div className="text-sm text-muted-foreground truncate">@{user.username}</div>
                      {user.email && (
                        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {user.jobTitle && (
                        <Badge variant="secondary" className="text-xs">
                          {user.jobTitle}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveClick(user)}
                        disabled={removingUserId === user.id}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Remove user from group"
                      >
                        {removingUserId === user.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive"></div>
                        ) : (
                          <UserMinus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
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

        {/* Confirmation Dialog */}
        <ConfirmationModal
          isOpen={showConfirmDialog}
          onClose={() => {
            setShowConfirmDialog(false);
            setUserToRemove(null);
          }}
          onConfirm={handleRemoveConfirm}
          title="Remove User from Group"
          message={
            userToRemove
              ? `Are you sure you want to remove "${userToRemove.displayName || userToRemove.username}" from the "${groupName}" group?`
              : ''
          }
          confirmText="Remove"
          cancelText="Cancel"
          variant="destructive"
          loading={removingUserId !== null}
          itemName={userToRemove?.displayName || userToRemove?.username}
          itemType="user"
        />
      </div>
    </div>
  );
}

