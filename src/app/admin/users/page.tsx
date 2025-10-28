'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Plus, 
  Trash2,
  Mail,
  Shield,
  UsersIcon,
  Ban,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notificationApiClient } from '@/api/notificationClient';
import { UserDto } from '@/types/api';
import CreateUserModal, { CreateUserData } from '@/components/modals/CreateUserModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import ServerSearchInput from '@/components/main/ServerSearchInput';
import Pagination from '@/components/main/Pagination';
import { useServerSideSearch } from '@/components/main/useServerSideSearch';
import { formatDate } from '@/lib/dateFormatter';

export default function UsersPage() {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const pageSize = 20;
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateLoading, setIsCreateLoading] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserDto | null>(null);

  // Server-side search hook
  const {
    displayData: displayUsers,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    totalPages,
    totalElements,
    loading,
    tableLoading,
    isLocalFiltering,
    error,
    fetchData,
    clearError,
    updateItem,
    addItem,
    removeItem
  } = useServerSideSearch<UserDto>({
    fetchFunction: async (page, searchTerm) => {
      return await notificationApiClient.getAllUsers({
        page,
        size: pageSize,
        query: searchTerm || undefined,
      });
    },
    searchFields: (user) => [
      user.username,
      user.email,
      user.displayName,
      user.firstName || '',
      user.lastName || ''
    ],
    debounceMs: 800
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedItems(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateUser = async (data: CreateUserData) => {
    try {
      setIsCreateLoading(true);
      const newUser = await notificationApiClient.createUser(data);
      addItem(newUser);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setIsCreateLoading(false);
    }
  };

  const handleDeleteClick = (user: UserDto) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    try {
      await notificationApiClient.deleteUser(userToDelete.id);
      removeItem(userToDelete.id);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleUpdateUserStatus = async (userId: string, enabled: boolean) => {
    try {
      await notificationApiClient.updateUserStatus(userId, enabled);
      updateItem(userId, (user) => ({ ...user, enabled }));
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleViewUserDetails = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage system users, roles, groups, and permissions</p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-destructive">{error}</div>
              <Button variant="outline" size="sm" onClick={() => { clearError(); fetchData(false); }}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <ServerSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search users by name, email, or username..."
            />
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {totalElements} user{totalElements !== 1 ? 's' : ''} total
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedItems.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                {selectedItems.length} selected
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-ui"
                      checked={selectedItems.length === displayUsers.length && displayUsers.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(displayUsers.map(u => u.id));
                        } else {
                          setSelectedItems([]);
                        }
                      }}
                    />
                  </th>
                  <th className="text-left p-4 text-sm font-medium">User</th>
                  <th className="text-left p-4 text-sm font-medium">Email</th>
                  <th className="text-left p-4 text-sm font-medium">Roles</th>
                  <th className="text-left p-4 text-sm font-medium">Groups</th>
                  <th className="text-left p-4 text-sm font-medium">Status</th>
                  <th className="text-left p-4 text-sm font-medium">Created</th>
                  <th className="text-left p-4 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayUsers.map((user: UserDto) => (
                  <tr 
                    key={user.id} 
                    className="border-b hover:bg-muted/50 cursor-pointer group"
                    onClick={() => handleViewUserDetails(user.id)}
                  >
                    <td 
                      className="p-4" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input 
                        type="checkbox" 
                        className="rounded border-ui"
                        checked={selectedItems.includes(user.id)}
                        onChange={() => toggleSelectUser(user.id)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.imageUrl || user.imgUrl} alt={user.displayName} />
                          <AvatarFallback>
                            {user.firstName?.[0] || user.username[0].toUpperCase()}
                            {user.lastName?.[0] || user.username[1]?.toUpperCase() || ''}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium group-hover:underline">{user.displayName}</div>
                          <div className="text-sm text-muted-foreground">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{user.roles?.length || 0} roles</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <UsersIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{user.groups?.length || 0} groups</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {user.status === 'ACTIVE' || user.enabled ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Disabled</Badge>
                      )}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatDate(user.createdAt || user.createdTimestamp)}
                    </td>
                    <td 
                      className="p-4" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateUserStatus(user.id, !user.enabled)}
                          title={user.enabled ? 'Disable user' : 'Enable user'}
                        >
                          {user.enabled ? (
                            <Ban className="h-4 w-4 text-orange-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(user)}
                          className="text-destructive hover:text-destructive"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {displayUsers.length === 0 && !tableLoading && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No users match your search' : 'No users found'}
                </p>
              </div>
            )}

            {/* Loading indicator */}
            {tableLoading && (
              <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                {isLocalFiltering ? 'Fetching comprehensive results...' : 'Loading users...'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={pageSize}
        onPageChange={handlePageChange}
      />

      {/* Modals */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateUser}
        loading={isCreateLoading}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message={userToDelete ? `Are you sure you want to delete user "${userToDelete.displayName}"? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        loading={false}
        itemName={userToDelete?.displayName}
        itemType="user"
      />
    </div>
  );
}
