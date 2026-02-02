'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Trash2,
  Mail,
  Shield,
  UsersIcon,
  Ban,
  CheckCircle,
  RotateCcw,
  ArrowUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { notificationApiClient } from '@/api/notificationClient';
import { UserDto, SortFieldsUser } from '@/types/api';
import CreateUserModal, { CreateUserData } from '@/components/modals/CreateUserModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import ServerSearchInput from '@/components/main/ServerSearchInput';
import Pagination from '@/components/main/Pagination';
import { useServerSideSearch } from '@/components/main/useServerSideSearch';
import { formatDate } from '@/lib/dateFormatter';
import { useAdminPagePermissions } from '@/hooks/useAdminPagePermissions';
import { exportToCSV, exportSelected, USER_EXPORT_COLUMNS } from '@/lib/exportUtils';
import { Download, Upload } from 'lucide-react';

export default function UsersPage() {
  const router = useRouter();
  const { canView, canCreate, canUpdate, canDelete, canAssign } = useAdminPagePermissions();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(20);

  // Sorting & Tabs
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  const [sortField, setSortField] = useState<SortFieldsUser>(SortFieldsUser.CREATED_TIMESTAMP);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Redirect if user doesn't have view permission
  useEffect(() => {
    if (!canView) {
      router.push('/');
    }
  }, [canView, router]);

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
      // Determine which API to call based on active tab
      if (activeTab === 'deleted') {
        return await notificationApiClient.getDeletedUsers(
          page,
          pageSize,
          sortField,
          sortDirection
        );
      } else {
        return await notificationApiClient.getAllUsers({
          page,
          size: pageSize,
          query: searchTerm || undefined,
          sortBy: sortField,
          sortDirection
        });
      }
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

  // Re-fetch when tab or sort changes
  useEffect(() => {
    // We use the refresh function from the hook which triggers fetchFunction
    // But we need to make sure fetchFunction (which is closure) sees the new state.
    // useServerSideSearch typically uses the latest fetchFunction if passed correctly, 
    // or we might rely on the fact that refresh causes a re-render/re-fetch.
    // Ideally useServerSideSearch should accept dependencies or we trigger it.
    // Assuming fetchData() works.
    fetchData();
  }, [activeTab, sortField, sortDirection]); // we omitted fetchData from dependency array to avoid loop

  const handleSort = (field: SortFieldsUser) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(0);
  };

  const handleExportAll = () => {
    exportToCSV(displayUsers, {
      filename: `users_${activeTab}_export_${new Date().toISOString().split('T')[0]}`,
      columns: USER_EXPORT_COLUMNS
    });
  };

  const handleExportSelected = () => {
    if (selectedItems.length === 0) return;
    exportSelected(displayUsers, selectedItems, {
      filename: `users_selected_${new Date().toISOString().split('T')[0]}`,
      columns: USER_EXPORT_COLUMNS
    });
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedItems(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (displayUsers.length === 0) return;
    if (selectedItems.length === displayUsers.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(displayUsers.map(u => u.id));
    }
  };

  const handleRestoreUser = async (user: UserDto) => {
    try {
      await notificationApiClient.restoreUser(user.id);
      fetchData();
    } catch (error) {
      console.error('Error restoring user:', error);
    }
  };

  const handleCreateUser = async (data: CreateUserData) => {
    try {
      setIsCreateLoading(true);
      const newUser = await notificationApiClient.createUser(data);
      if (activeTab === 'active') {
        addItem(newUser);
      }
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
      // Optimistic update
      updateItem(userId, (user) => ({ ...user, enabled, status: enabled ? 'ACTIVE' : 'INACTIVE' }));

      await notificationApiClient.updateUserStatus(userId, enabled);
      // No need to refresh() as we updated locally. 
      // If error, we might want to revert, but for now simple log.
    } catch (error) {
      console.error('Error updating user status:', error);
      fetchData(); // Revert on error
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

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive text-lg">You don't have permission to view this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage system users, roles, groups, and permissions</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-muted/50 p-1 rounded-lg gap-1 border">
            <Button variant="ghost" size="sm" className="h-8 gap-2" onClick={handleExportAll}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export All</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2"
              onClick={handleExportSelected}
              disabled={selectedItems.length === 0}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Selected ({selectedItems.length})</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 gap-2" disabled>
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
            </Button>
          </div>

          <div className="h-8 w-px bg-border mx-1 hidden sm:block"></div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="gap-2"
                onClick={() => setIsCreateModalOpen(true)}
                disabled={!canCreate}
              >
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </TooltipTrigger>
            {!canCreate && (
              <TooltipContent>
                <p>You don't have permission to create users</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
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

      <Tabs defaultValue="active" value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              <UsersIcon className="h-4 w-4" />
              Active Users
            </TabsTrigger>
            <TabsTrigger value="deleted" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Recycle Bin
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2 text-sm text-center">
            {/* Search Input handled below */}
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b flex justify-between items-center bg-muted/20">
              <div className="flex items-center gap-2">
                {/* Search handled by ServerSearchInput */}
              </div>
              <ServerSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={activeTab === 'deleted' ? "Search not available in bin" : "Search users..."}
                disabled={activeTab === 'deleted'}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="w-12 p-4">
                      <input
                        type="checkbox"
                        className="rounded border-ui"
                        checked={selectedItems.length === displayUsers.length && displayUsers.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th
                      className="text-left p-4 text-sm font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => handleSort(SortFieldsUser.USERNAME)}
                    >
                      <div className="flex items-center gap-1">
                        User
                        {sortField === SortFieldsUser.USERNAME && <ArrowUpDown className="h-4 w-4" />}
                      </div>
                    </th>
                    <th
                      className="text-left p-4 text-sm font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => handleSort(SortFieldsUser.EMAIL)}
                    >
                      <div className="flex items-center gap-1">
                        Email
                        {sortField === SortFieldsUser.EMAIL && <ArrowUpDown className="h-4 w-4" />}
                      </div>
                    </th>
                    <th className="text-left p-4 text-sm font-medium">Roles</th>
                    <th className="text-left p-4 text-sm font-medium">Groups</th>
                    <th className="text-left p-4 text-sm font-medium">Status</th>
                    <th
                      className="text-left p-4 text-sm font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => handleSort(SortFieldsUser.CREATED_TIMESTAMP)}
                    >
                      <div className="flex items-center gap-1">
                        Created
                        {sortField === SortFieldsUser.CREATED_TIMESTAMP && <ArrowUpDown className="h-4 w-4" />}
                      </div>
                    </th>
                    <th className="text-left p-4 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayUsers.map((user: UserDto) => (
                    <tr
                      key={user.id}
                      className={`border-b cursor-pointer group ${user.status !== 'ACTIVE' && !user.enabled ? 'bg-muted/30' : 'hover:bg-muted/50'}`}
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
                          <Avatar className={`h-10 w-10 ${user.status !== 'ACTIVE' && !user.enabled ? 'grayscale' : ''}`}>
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
                        {activeTab === 'deleted' ? (
                          <Badge variant="destructive" className="bg-red-900/50 text-red-200">Deleted</Badge>
                        ) : (user.status === 'ACTIVE' || user.enabled ? (
                          <Badge variant="default" className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Disabled</Badge>
                        ))}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(user.createdAt || user.createdTimestamp)}
                      </td>
                      <td
                        className="p-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2">
                          {activeTab === 'deleted' ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    canDelete && handleRestoreUser(user);
                                  }}
                                  disabled={!canDelete}
                                  className="gap-2 text-green-600 hover:text-green-700 hover:border-green-200"
                                  title="Restore user"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                  Restore
                                </Button>
                              </TooltipTrigger>
                              {!canDelete && (
                                <TooltipContent>
                                  <p>You don't have permission to restore users</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          ) : (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span tabIndex={0}> {/* Span wrapper for disabled button tooltip */}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const isEnabled = user.status === 'ACTIVE' || user.enabled;
                                        canUpdate && !user.roles?.includes('SUPER_ADMIN') && handleUpdateUserStatus(user.id, !isEnabled);
                                      }}
                                      disabled={!canUpdate || user.roles?.includes('SUPER_ADMIN')}
                                      className={user.roles?.includes('SUPER_ADMIN') ? "opacity-50 cursor-not-allowed" : ""}
                                    >
                                      {user.status === 'ACTIVE' || user.enabled ? (
                                        <Ban className={`h-4 w-4 ${user.roles?.includes('SUPER_ADMIN') ? 'text-gray-400' : 'text-orange-500'}`} />
                                      ) : (
                                        <CheckCircle className={`h-4 w-4 ${user.roles?.includes('SUPER_ADMIN') ? 'text-gray-400' : 'text-green-500'}`} />
                                      )}
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {user.roles?.includes('SUPER_ADMIN')
                                    ? <p>Super Admin cannot be modified</p>
                                    : (!canUpdate ? <p>You don't have permission to update users</p> : <p>{user.status === 'ACTIVE' || user.enabled ? 'Disable user' : 'Enable user'}</p>)
                                  }
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span tabIndex={0}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        canDelete && !user.roles?.includes('SUPER_ADMIN') && handleDeleteClick(user);
                                      }}
                                      disabled={!canDelete || user.roles?.includes('SUPER_ADMIN')}
                                      className={canDelete && !user.roles?.includes('SUPER_ADMIN') ? "text-destructive hover:text-destructive" : "opacity-50 cursor-not-allowed"}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {user.roles?.includes('SUPER_ADMIN')
                                    ? <p>Super Admin cannot be deleted</p>
                                    : (!canDelete ? <p>You don't have permission to delete users</p> : <p>Delete user</p>)
                                  }
                                </TooltipContent>
                              </Tooltip>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {displayUsers.length === 0 && !tableLoading && (
                <div className="text-center py-12">
                  <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {activeTab === 'deleted'
                      ? 'Recycle bin is empty'
                      : (searchQuery ? `No users match '${searchQuery}'` : 'No users found')}
                  </p>
                </div>
              )}

              {/* Loading indicator */}
              {tableLoading && (
                <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Loading users...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Tabs>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
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
        message={userToDelete ? `Are you sure you want to delete user "${userToDelete.displayName}"?` : ''}
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
