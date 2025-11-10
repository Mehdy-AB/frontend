'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Edit,
  Trash2,
  Users as UsersIcon,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { notificationApiClient } from '@/api/notificationClient';
import { GroupDto } from '@/types/api';
import Pagination from '@/components/main/Pagination';
import ServerSearchInput from '@/components/main/ServerSearchInput';
import { useServerSideSearch } from '@/components/main/useServerSideSearch';
import { formatDate } from '@/lib/dateFormatter';
import CreateGroupModal, { CreateGroupData } from '@/components/modals/CreateGroupModal';
import EditGroupModal, { EditGroupData } from '@/components/modals/EditGroupModal';
import AssignGroupModal from '@/components/modals/AssignGroupModal';
import ViewGroupUsersModal from '@/components/modals/ViewGroupUsersModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import { useAdminPagePermissions } from '@/hooks/useAdminPagePermissions';

export default function GroupsPage() {
  const router = useRouter();
  const pageSize = 20;
  const { canView, canCreate, canUpdate, canDelete, canAssign } = useAdminPagePermissions();
  
  // Redirect if user doesn't have view permission
  useEffect(() => {
    if (!canView) {
      router.push('/');
    }
  }, [canView, router]);
  
  // Use the server-side search hook
  const {
    displayData: displayGroups,
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
  } = useServerSideSearch<GroupDto>({
    fetchFunction: async (page, searchTerm) => {
      return await notificationApiClient.getAllGroups({
        page,
        size: pageSize,
        desc: false,
        name: searchTerm
      });
    },
    searchFields: (group) => [group.name],
    debounceMs: 800
  });

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isViewUsersModalOpen, setIsViewUsersModalOpen] = useState(false);
  
  // Loading states
  const [isCreateLoading, setIsCreateLoading] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isAssignLoading, setIsAssignLoading] = useState(false);
  
  // Selected items for modals
  const [groupToEdit, setGroupToEdit] = useState<GroupDto | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<GroupDto | null>(null);
  const [groupToAssign, setGroupToAssign] = useState<GroupDto | null>(null);
  const [groupToViewUsers, setGroupToViewUsers] = useState<GroupDto | null>(null);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage === page) return;
    setPage(newPage);
  }, [page, setPage]);

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const toggleSelectGroup = (groupId: string) => {
    setSelectedItems(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleCreateGroup = async (data: CreateGroupData) => {
    try {
      setIsCreateLoading(true);
      const newGroup = await notificationApiClient.createGroup(data);
      // Add to local state
      addItem(newGroup);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setIsCreateLoading(false);
    }
  };

  const handleEditClick = (group: GroupDto) => {
    setGroupToEdit(group);
    setIsEditModalOpen(true);
  };

  const handleEditConfirm = async (data: EditGroupData) => {
    if (!groupToEdit) return;
    
    try {
      setIsEditLoading(true);
      await notificationApiClient.updateGroup(groupToEdit.id, data);
      // Update local state
      updateItem(groupToEdit.id, (item) => ({
        ...item,
        name: data.name,
        description: data.description
      }));
      setIsEditModalOpen(false);
      setGroupToEdit(null);
    } catch (error) {
      console.error('Error editing group:', error);
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDeleteClick = (group: GroupDto) => {
    setGroupToDelete(group);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!groupToDelete) return;
    
    try {
      await notificationApiClient.deleteGroup(groupToDelete.id);
      // Remove from local state
      removeItem(groupToDelete.id);
      setIsDeleteModalOpen(false);
      setGroupToDelete(null);
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const handleAssignClick = (group: GroupDto) => {
    setGroupToAssign(group);
    setIsAssignModalOpen(true);
  };

  const handleAssignConfirm = async (userIds: string[]) => {
    if (!groupToAssign) return;
    
    try {
      setIsAssignLoading(true);
      await notificationApiClient.assignUsersToGroup(groupToAssign.id, userIds);
      // Refetch data to update user count
      await fetchData(true);
      setIsAssignModalOpen(false);
      setGroupToAssign(null);
    } catch (error) {
      console.error('Error assigning users to group:', error);
    } finally {
      setIsAssignLoading(false);
    }
  };

  const handleViewUsersClick = (group: GroupDto) => {
    setGroupToViewUsers(group);
    setIsViewUsersModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading groups...</p>
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Group Management</h1>
          <p className="text-muted-foreground">Manage user groups and their members</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              className="gap-2" 
              onClick={() => setIsCreateModalOpen(true)}
              disabled={!canCreate}
            >
              <Plus className="h-4 w-4" />
              Add Group
            </Button>
          </TooltipTrigger>
          {!canCreate && (
            <TooltipContent>
              <p>You don't have permission to create groups</p>
            </TooltipContent>
          )}
        </Tooltip>
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
              placeholder="Search groups by name..."
            />
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {totalElements} group{totalElements !== 1 ? 's' : ''} total
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Groups Table */}
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
                      checked={selectedItems.length === displayGroups.length && displayGroups.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(displayGroups.map(g => g.id));
                        } else {
                          setSelectedItems([]);
                        }
                      }}
                    />
                  </th>
                  <th className="text-left p-4 text-sm font-medium">Group</th>
                  <th className="text-left p-4 text-sm font-medium">Description</th>
                  <th className="text-left p-4 text-sm font-medium">Members</th>
                  <th className="text-left p-4 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayGroups.map((group: GroupDto) => {
                  const isExpanded = expandedGroups.includes(group.id);

                  return (
                    <React.Fragment key={group.id}>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <input 
                            type="checkbox" 
                            className="rounded border-ui"
                            checked={selectedItems.includes(group.id)}
                            onChange={() => toggleSelectGroup(group.id)}
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => toggleGroupExpansion(group.id)}
                              className="p-1 rounded hover:bg-muted transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                            <div className="h-10 w-10 bg-primary-light rounded-full flex items-center justify-center">
                              <UsersIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{group.name}</div>
                              <div className="text-sm text-muted-foreground">{group.id.substring(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-muted-foreground max-w-md truncate">
                            {group.description || 'No description'}
                          </div>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleViewUsersClick(group)}
                            className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                          >
                            <UsersIcon className="h-4 w-4" />
                            <span>{group.userCount || 0} users</span>
                          </button>
                        </td>
                        <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => canUpdate && handleEditClick(group)}
                                disabled={!canUpdate}
                                className={!canUpdate ? 'opacity-50 cursor-not-allowed' : ''}
                                title={!canUpdate ? "You don't have permission to edit groups" : undefined}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Group
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem 
                                onClick={() => canAssign && handleAssignClick(group)}
                                disabled={!canAssign}
                                className={!canAssign ? 'opacity-50 cursor-not-allowed' : ''}
                                title={!canAssign ? "You don't have permission to assign users to groups" : undefined}
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Assign Users
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem onClick={() => handleViewUsersClick(group)}>
                                <UsersIcon className="h-4 w-4 mr-2" />
                                View Users
                              </DropdownMenuItem>
                              
                              {canDelete && <DropdownMenuSeparator />}
                              
                              <DropdownMenuItem 
                                onClick={() => canDelete && handleDeleteClick(group)} 
                                disabled={!canDelete}
                                className={`${!canDelete ? 'opacity-50 cursor-not-allowed' : 'text-destructive'}`}
                                title={!canDelete ? "You don't have permission to delete groups" : undefined}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Group
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                      
                      {isExpanded && (
                        <tr className="bg-muted/30">
                          <td colSpan={5} className="p-4 pl-20">
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm font-medium mb-2">Group Details</p>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Created:</span>{' '}
                                    <span>{formatDate(group.createdAt)}</span>
                                  </div>
                                  {group.updatedAt && (
                                    <div>
                                      <span className="text-muted-foreground">Updated:</span>{' '}
                                      <span>{formatDate(group.updatedAt)}</span>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-muted-foreground">Members:</span>{' '}
                                    <span>{group.userCount || 0} users</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            
            {displayGroups.length === 0 && !tableLoading && (
              <div className="text-center py-12">
                <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No groups match your search' : 'No groups found'}
                </p>
              </div>
            )}

            {/* Loading indicator */}
            {tableLoading && (
              <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                {isLocalFiltering ? 'Fetching comprehensive results...' : 'Loading groups...'}
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
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateGroup}
        loading={isCreateLoading}
      />

      {groupToEdit && (
        <EditGroupModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setGroupToEdit(null);
          }}
          onSubmit={handleEditConfirm}
          group={groupToEdit}
          loading={isEditLoading}
        />
      )}

      {groupToAssign && (
        <AssignGroupModal
          isOpen={isAssignModalOpen}
          onClose={() => {
            setIsAssignModalOpen(false);
            setGroupToAssign(null);
          }}
          onSubmit={handleAssignConfirm}
          groupId={groupToAssign.id}
          groupName={groupToAssign.name}
          loading={isAssignLoading}
        />
      )}

      {groupToViewUsers && (
        <ViewGroupUsersModal
          isOpen={isViewUsersModalOpen}
          onClose={() => {
            setIsViewUsersModalOpen(false);
            setGroupToViewUsers(null);
          }}
          groupId={groupToViewUsers.id}
          groupName={groupToViewUsers.name}
          onUserRemoved={async (userId) => {
            // Refetch data to update user count
            await fetchData(true);
          }}
        />
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setGroupToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Group"
        message={groupToDelete ? `Are you sure you want to delete group "${groupToDelete.name}"? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        loading={false}
        itemName={groupToDelete?.name}
        itemType="group"
      />
    </div>
  );
}

