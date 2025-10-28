'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  Plus, 
  Edit,
  Trash2,
  Key,
  Users as UsersIcon,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  UserPlus,
  Power,
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
import { notificationApiClient } from '@/api/notificationClient';
import { roleManagementService } from '@/api/services/roleManagementService';
import { RoleDto, PermissionDto } from '@/types/api';
import Pagination from '@/components/main/Pagination';
import { formatDate } from '@/lib/dateFormatter';
import ServerSearchInput from '@/components/main/ServerSearchInput';
import { useServerSideSearch } from '@/components/main/useServerSideSearch';
import CreateRoleModal, { CreateRoleData } from '@/components/modals/CreateRoleModal';
import AssignRoleModal from '@/components/modals/AssignRoleModal';
import ManageRoleModal, { UpdateRoleData } from '@/components/modals/ManageRoleModal';
import EditRoleModal, { EditRoleData } from '@/components/modals/EditRoleModal';
import ManageRolePermissionsModal from '@/components/modals/ManageRolePermissionsModal';
import ViewRoleUsersModal from '@/components/modals/ViewRoleUsersModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';

export default function RolesPage() {
  const pageSize = 20;
  
  // Use the server-side search hook
  const {
    displayData: displayRoles,
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
  } = useServerSideSearch<RoleDto>({
    fetchFunction: async (page, searchTerm) => {
      return await notificationApiClient.getAllRoles({
        page,
        size: pageSize,
        desc: false,
        name: searchTerm
      });
    },
    searchFields: (role) => [role.name], // Only search by name
    debounceMs: 800
  });

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<PermissionDto[]>([]);
  const [expandedRoles, setExpandedRoles] = useState<string[]>([]);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isViewUsersModalOpen, setIsViewUsersModalOpen] = useState(false);
  const [isCreateLoading, setIsCreateLoading] = useState(false);
  const [isAssignLoading, setIsAssignLoading] = useState(false);
  const [isManageLoading, setIsManageLoading] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isPermissionsLoading, setIsPermissionsLoading] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RoleDto | null>(null);
  const [roleToAssign, setRoleToAssign] = useState<RoleDto | null>(null);
  const [roleToManage, setRoleToManage] = useState<RoleDto | null>(null);
  const [roleToEdit, setRoleToEdit] = useState<RoleDto | null>(null);
  const [roleToManagePermissions, setRoleToManagePermissions] = useState<RoleDto | null>(null);
  const [roleToViewUsers, setRoleToViewUsers] = useState<RoleDto | null>(null);

  // Fetch permissions on mount
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const permissionsData = await notificationApiClient.getAllPermissions();
        setPermissions(Array.isArray(permissionsData) ? permissionsData : []);
      } catch (err) {
        console.error('Error fetching permissions:', err);
      }
    };
    fetchPermissions();
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage === page) return;
    setPage(newPage);
  }, [page, setPage]);

  const toggleRoleExpansion = (roleId: string) => {
    setExpandedRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const toggleSelectRole = (roleId: string) => {
    setSelectedItems(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleCreateRole = async (data: CreateRoleData) => {
    try {
      setIsCreateLoading(true);
      // Create role first
      const newRole = await notificationApiClient.createRole({
        name: data.name,
        description: data.description
      });
      
      // Assign permissions if provided
      if (data.permissionKeys && data.permissionKeys.length > 0) {
        await notificationApiClient.assignPermissionsToRole(newRole.name || data.name, data.permissionKeys);
        // Map permission keys to PermissionDto objects
        const rolePermissions = permissions.filter(p => data.permissionKeys.includes(p.key));
        addItem({
          ...newRole,
          permissions: rolePermissions
        });
      } else {
        // Add the new role to local state
        addItem(newRole);
      }
      
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating role:', error);
    } finally {
      setIsCreateLoading(false);
    }
  };


  const handleToggleStatus = async (role: RoleDto) => {
    try {
      const isActive = !role.deletedAt;
      await roleManagementService.toggleRoleStatus(role.id, !isActive);
      // Update local state
      updateItem(role.id, (item) => ({
        ...item,
        deletedAt: isActive ? new Date().toISOString() : undefined
      }));
    } catch (error) {
      console.error('Error toggling role status:', error);
      // Revert on error
      await fetchData(false);
    }
  };

  const handleDeleteClick = (role: RoleDto) => {
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;
    
    try {
      await notificationApiClient.deleteRole(roleToDelete.id);
      // Remove from local state
      removeItem(roleToDelete.id);
      setIsDeleteModalOpen(false);
      setRoleToDelete(null);
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  };

  const handleAssignClick = (role: RoleDto) => {
    setRoleToAssign(role);
    setIsAssignModalOpen(true);
  };

  const handleAssignConfirm = async (userIds: string[]) => {
    if (!roleToAssign) return;
    
    try {
      setIsAssignLoading(true);
      // Assign role to all selected users
      for (const userId of userIds) {
        await notificationApiClient.assignRoleToUser(roleToAssign.name, userId);
      }
      // No need to update local state for user assignment as RoleDto doesn't track users
      setIsAssignModalOpen(false);
      setRoleToAssign(null);
    } catch (error) {
      console.error('Error assigning role:', error);
    } finally {
      setIsAssignLoading(false);
    }
  };

  const handleManageClick = (role: RoleDto) => {
    setRoleToManage(role);
    setIsManageModalOpen(true);
  };

  const handleManageConfirm = async (data: UpdateRoleData) => {
    if (!roleToManage) return;
    
    try {
      setIsManageLoading(true);
      
      // Check if role is system role
      const isSystemRole = (roleToManage as any).isSystem;
      
      let updatedName = roleToManage.name;
      let updatedDescription = roleToManage.description;
      
      // Update role name and description only if not a system role
      if (!isSystemRole) {
        try {
          await notificationApiClient.updateRole(roleToManage.id, {
            name: data.name,
            description: data.description
          });
          updatedName = data.name;
          updatedDescription = data.description;
        } catch (error) {
          console.warn('Could not update role name/description (may be a system role):', error);
          // Continue with permission update even if name/description update fails
        }
      }
      
      // Always update permissions (this is the main purpose of the modal)
      await notificationApiClient.assignPermissionsToRole(roleToManage.name, data.permissionKeys);
      
      // Update local state - map permission keys to PermissionDto objects
      const rolePermissions = permissions.filter(p => data.permissionKeys.includes(p.key));
      updateItem(roleToManage.id, (item) => ({
        ...item,
        name: updatedName,
        description: updatedDescription,
        permissions: rolePermissions
      }));
      
      setIsManageModalOpen(false);
      setRoleToManage(null);
    } catch (error) {
      console.error('Error managing role:', error);
    } finally {
      setIsManageLoading(false);
    }
  };

  const handleEditClick = (role: RoleDto) => {
    setRoleToEdit(role);
    setIsEditModalOpen(true);
  };

  const handleEditConfirm = async (data: EditRoleData) => {
    if (!roleToEdit) return;
    
    try {
      setIsEditLoading(true);
      await notificationApiClient.updateRole(roleToEdit.id, {
        name: data.name,
        description: data.description
      });
      // Update local state
      updateItem(roleToEdit.id, (item) => ({
        ...item,
        name: data.name,
        description: data.description
      }));
      setIsEditModalOpen(false);
      setRoleToEdit(null);
    } catch (error) {
      console.error('Error editing role:', error);
    } finally {
      setIsEditLoading(false);
    }
  };

  const handlePermissionsClick = (role: RoleDto) => {
    setRoleToManagePermissions(role);
    setIsPermissionsModalOpen(true);
  };

  const handlePermissionsConfirm = async (permissionKeys: string[]) => {
    if (!roleToManagePermissions) return;
    
    try {
      setIsPermissionsLoading(true);
      await notificationApiClient.assignPermissionsToRole(roleToManagePermissions.name, permissionKeys);
      // Update local state - map permission keys to PermissionDto objects
      const rolePermissions = permissions.filter(p => permissionKeys.includes(p.key));
      updateItem(roleToManagePermissions.id, (item) => ({
        ...item,
        permissions: rolePermissions
      }));
      setIsPermissionsModalOpen(false);
      setRoleToManagePermissions(null);
    } catch (error) {
      console.error('Error updating permissions:', error);
    } finally {
      setIsPermissionsLoading(false);
    }
  };

  const handleViewUsersClick = (role: RoleDto) => {
    setRoleToViewUsers(role);
    setIsViewUsersModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading roles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <CardContent className="text-center">
          <div className="text-destructive text-lg mb-4">{error}</div>
          <Button onClick={() => { clearError(); fetchData(false); }}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Role Management</h1>
          <p className="text-muted-foreground">Manage system roles and permissions</p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Role
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <ServerSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search roles by name..."
          />
        </CardContent>
      </Card>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Roles ({displayRoles.length}/{totalElements})</CardTitle>
            {selectedItems.length > 0 && (
              <Badge variant="secondary">
                {selectedItems.length} selected
              </Badge>
            )}
    </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
      <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-ui cursor-pointer"
                      checked={selectedItems.length === displayRoles.length && displayRoles.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(displayRoles.map(r => r.id));
                        } else {
                          setSelectedItems([]);
                        }
                      }}
                    />
            </th>
                  <th className="text-left p-4 text-sm font-medium">Role</th>
                  <th className="text-left p-4 text-sm font-medium">Description</th>
                  <th className="text-left p-4 text-sm font-medium">Permissions</th>
                  <th className="text-left p-4 text-sm font-medium">Status</th>
                  <th className="text-left p-4 text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {displayRoles.map((role: RoleDto) => {
            const isExpanded = expandedRoles.includes(role.id);

            return (
                    <React.Fragment key={role.id}>
                      <tr className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-4">
                          <input 
                            type="checkbox" 
                            className="rounded border-ui cursor-pointer"
                            checked={selectedItems.includes(role.id)}
                            onChange={() => toggleSelectRole(role.id)}
                          />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => toggleRoleExpansion(role.id)}
                              className="p-1 rounded hover:bg-muted transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                            <div className="h-10 w-10 bg-primary-light rounded-full flex items-center justify-center flex-shrink-0 relative">
                        <Shield className="h-5 w-5 text-primary" />
                              {(role as any).isSystem && (
                                <div className="absolute -bottom-1 -right-1">
                                  <Badge className="h-4 px-1.5 text-[9px] bg-success text-success-foreground">
                                    System
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium truncate flex items-center gap-2">
                                {role.name}
                                {(role as any).isDefault && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">Default</Badge>
                                )}
                      </div>
                              <div className="text-sm text-muted-foreground truncate">{role.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {role.description || <span className="text-muted-foreground italic">No description</span>}
                          </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                            {(role as any).rolePermissions && Array.isArray((role as any).rolePermissions) && (role as any).rolePermissions.length > 0 ? (
                              <>
                                {(role as any).rolePermissions.slice(0, 3).map((rolePerm: any, idx: number) => {
                                  const perm = rolePerm.permission;
                                  const permKey = perm?.key || perm?.name || 'Unknown';
                                  return (
                                    <Badge key={idx} variant="outline" className="text-xs">{permKey}</Badge>
                                  );
                                })}
                                {(role as any).rolePermissions.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{(role as any).rolePermissions.length - 3} more
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <Badge variant="secondary" className="text-xs">No permissions</Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                          {role.deletedAt ? (
                            <Badge variant="secondary" className="text-xs">
                              Disabled
                            </Badge>
                          ) : (
                            <Badge variant="default" className="text-xs">
                              Active
                            </Badge>
                          )}
                  </td>
                  <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem onClick={() => handleEditClick(role)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Role
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePermissionsClick(role)}>
                                <Key className="h-4 w-4 mr-2" />
                                Manage Permissions
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewUsersClick(role)}>
                                <UsersIcon className="h-4 w-4 mr-2" />
                                View Users
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAssignClick(role)}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Assign to Users
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {!role.deletedAt && (
                                <DropdownMenuItem 
                                  onClick={() => handleToggleStatus(role)}
                                  disabled={(role as any).isSystem}
                                >
                                  <Power className="h-4 w-4 mr-2" />
                                  Disable Role
                                </DropdownMenuItem>
                              )}
                              {role.deletedAt && (
                                <DropdownMenuItem 
                                  onClick={() => handleToggleStatus(role)}
                                  disabled={(role as any).isSystem}
                                >
                                  <Power className="h-4 w-4 mr-2" />
                                  Enable Role
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(role)} 
                                className="text-destructive"
                                disabled={(role as any).isSystem || (role as any).isDefault}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Role
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                  </td>
                </tr>

                {isExpanded && (
                        <tr className="bg-muted/30">
                          <td colSpan={6} className="p-4 pl-20">
                            <div className="grid grid-cols-2 gap-6">
                        <div>
                                <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                                  <Key className="h-4 w-4" />
                                  All Permissions ({(role as any).rolePermissions?.length || 0})
                                </p>
                                <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                                  {(role as any).rolePermissions && Array.isArray((role as any).rolePermissions) && (role as any).rolePermissions.length > 0 ? (
                                    (() => {
                                      // Group permissions by category
                                      const permissionsByCategory = (role as any).rolePermissions.reduce((acc: Record<string, any[]>, rolePerm: any) => {
                                        const perm = rolePerm.permission;
                                        const permCategory = perm?.category || 'GENERAL';
                                        if (!acc[permCategory]) {
                                          acc[permCategory] = [];
                                        }
                                        acc[permCategory].push(rolePerm);
                                        return acc;
                                      }, {});
                                      
                                      return (Object.entries(permissionsByCategory) as [string, any[]][]).map(([category, perms]) => (
                                        <div key={category} className="border rounded-lg p-3 bg-muted/20">
                                          <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                                            <Badge variant="default" className="text-xs font-semibold">
                                              {category}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                              ({(perms as any[]).length} permission{(perms as any[]).length !== 1 ? 's' : ''})
                                            </span>
                                          </div>
                                          <div className="space-y-2">
                                            {(perms as any[]).map((rolePerm: any, idx: number) => {
                                              const perm = rolePerm.permission;
                                              const permKey = perm?.key || perm?.name || 'Unknown';
                                              const permDesc = perm?.description || 'No description';
                                              return (
                                                <div key={idx} className="border rounded-md p-2 hover:bg-muted/30 transition-colors bg-white/50">
                                                  <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                      <p className="text-sm font-medium truncate">{permKey}</p>
                                                      {permDesc && permDesc !== 'No description' && (
                                                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                          {permDesc}
                                                        </p>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      ));
                                    })()
                                  ) : (
                                    <p className="text-sm text-muted-foreground">No permissions assigned</p>
                                  )}
                          </div>
                        </div>
                              <div>
                                <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                                  <UsersIcon className="h-4 w-4" />
                                  Role Information
                                </p>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="font-medium">Role ID:</span>
                                    <span className="ml-2 text-muted-foreground font-mono text-xs">{role.id}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Created:</span>
                                    <span className="ml-2 text-muted-foreground">
                                      {formatDate(role.createdAt)}
                                    </span>
                                  </div>
                        <div>
                                    <span className="font-medium">Updated:</span>
                                    <span className="ml-2 text-muted-foreground">
                                      {formatDate(role.updatedAt)}
                                    </span>
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
            
            {displayRoles.length === 0 && !tableLoading && (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No roles match your search' : 'No roles found'}
                </p>
        </div>
            )}

            {/* Loading indicator */}
            {tableLoading && (
              <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                {isLocalFiltering ? 'Fetching comprehensive results...' : 'Loading roles...'}
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
      <CreateRoleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateRole}
        loading={isCreateLoading}
      />

      {roleToAssign && (
        <AssignRoleModal
          isOpen={isAssignModalOpen}
          onClose={() => {
            setIsAssignModalOpen(false);
            setRoleToAssign(null);
          }}
          onSubmit={handleAssignConfirm}
          roleId={roleToAssign.id}
          roleName={roleToAssign.name}
          loading={isAssignLoading}
        />
      )}

      {roleToManage && (
        <ManageRoleModal
          isOpen={isManageModalOpen}
          onClose={() => {
            setIsManageModalOpen(false);
            setRoleToManage(null);
          }}
          onSubmit={handleManageConfirm}
          role={roleToManage}
          loading={isManageLoading}
        />
      )}

      {roleToEdit && (
        <EditRoleModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setRoleToEdit(null);
          }}
          onSubmit={handleEditConfirm}
          role={roleToEdit}
          loading={isEditLoading}
        />
      )}

      {roleToManagePermissions && (
        <ManageRolePermissionsModal
          isOpen={isPermissionsModalOpen}
          onClose={() => {
            setIsPermissionsModalOpen(false);
            setRoleToManagePermissions(null);
          }}
          onSubmit={handlePermissionsConfirm}
          role={roleToManagePermissions}
          loading={isPermissionsLoading}
        />
      )}

      {roleToViewUsers && (
        <ViewRoleUsersModal
          isOpen={isViewUsersModalOpen}
          onClose={() => {
            setIsViewUsersModalOpen(false);
            setRoleToViewUsers(null);
          }}
          roleId={roleToViewUsers.id}
          roleName={roleToViewUsers.name}
          onUserRemoved={(userId) => {
            // User removal handled in modal - no need to update role state as RoleDto doesn't track users
            console.log('User removed from role:', userId);
          }}
        />
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setRoleToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Role"
        message={roleToDelete ? `Are you sure you want to delete role "${roleToDelete.name}"? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        loading={false}
        itemName={roleToDelete?.name}
        itemType="role"
      />
    </div>
  );
}