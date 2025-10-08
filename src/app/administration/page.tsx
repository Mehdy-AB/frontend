// app/administration/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  FolderTree, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Key,
  Mail,
  Calendar,
  UserCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  History,
  Activity,
  BarChart3,
  TrendingUp,
  Clock,
  User,
  FileText,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { notificationApiClient } from '@/api/notificationClient';
import AuditLogService from '@/api/services/auditLogService';
import {
  FullUserDto,
  UserDto,
  RoleDto,
  GroupDto,
  UserCreateReq,
  UserUpdateReq,
  RoleCreateReq,
  RoleUpdateReq,
  GroupCreateReq,
  GroupUpdateReq,
  SortFieldsUser,
  SearchFields,
  AuditLog,
  AuditLogStatistics
} from '@/types/api';
import { useLanguage } from '../../contexts/LanguageContext';

// Additional types for the admin page
export interface PermissionDto {
  id: string;
  name: string;
  description: string;
  resource: string;
  scope: string;
}

export default function AdministrationPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'groups' | 'audit'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState<SortFieldsUser>(SortFieldsUser.FIRST_NAME);
  const [sortDesc, setSortDesc] = useState(false);
  
  // Audit log states
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditStatistics, setAuditStatistics] = useState<AuditLogStatistics>({});
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  const [auditDateRange, setAuditDateRange] = useState<{start: string, end: string}>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [auditEntityType, setAuditEntityType] = useState<string>('all');
  const [auditUserId, setAuditUserId] = useState<string>('');

  // Real API data fetching
    const fetchData = async () => {
      try {
        setLoading(true);
      setError(null);
      
      const [usersData, rolesData, groupsData, permissionsData] = await Promise.all([
        notificationApiClient.getAllUsers({
          page: 0,
          size: pageSize,
          query: searchQuery || undefined,
          desc: sortDesc,
          sort: sortBy
        }),
        notificationApiClient.getAllRoles({
          page: 0,
          size: 100, // Get all roles
          query: searchQuery || undefined,
          desc: sortDesc
        }),
        notificationApiClient.getAllGroups({
          page: 0,
          size: 100, // Get all groups
          query: searchQuery || undefined,
          desc: sortDesc
        }),
        notificationApiClient.getAllPermissions()
      ]);
      
      setUsers(usersData);
      setRoles(rolesData);
      setGroups(groupsData);
      setPermissions(permissionsData);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchData();
  }, [searchQuery, sortBy, sortDesc]);

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      setAuditLoading(true);
      const [logsResponse, statsResponse] = await Promise.all([
        AuditLogService.getAllAuditLogs({
          page: 0,
          size: 50,
          sortBy: 'timestamp',
          sortDir: 'desc'
        }),
        AuditLogService.getUserActivityStatistics(
          auditDateRange.start,
          auditDateRange.end
        )
      ]);
      
      setAuditLogs(logsResponse.content);
      setAuditStatistics(statsResponse);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setAuditLoading(false);
    }
  };

  // Fetch audit logs when audit tab is active
  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab, auditDateRange]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Real API utility functions
  const getUsersInGroup = async (groupId: string): Promise<UserDto[]> => {
    try {
      return await notificationApiClient.getGroupMembers(groupId, { max: 100 });
    } catch (error) {
      console.error('Error fetching group members:', error);
      return [];
    }
  };

  const getUsersWithRole = async (roleName: string): Promise<UserDto[]> => {
    try {
      return await notificationApiClient.getRoleUsers(roleName, { size: 100 });
    } catch (error) {
      console.error('Error fetching role users:', error);
      return [];
    }
  };

  // For simplicity, we'll track these in state - in a real app, you'd call APIs
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
  const [userGroups, setUserGroups] = useState<Record<string, string[]>>({});

  const getRolesForUser = (userId: string): string[] => {
    return userRoles[userId] || [];
  };

  const getGroupsForUser = (userId: string): string[] => {
    return userGroups[userId] || [];
  };

  // User management operations
  const handleCreateUser = async (userData: UserCreateReq) => {
    try {
      await notificationApiClient.createUser(userData);
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error creating user:', error);
      alert('Failed to create user: ' + (error.message || 'Unknown error'));
    }
  };

  const handleUpdateUser = async (userId: string, userData: UserUpdateReq) => {
    try {
      await notificationApiClient.updateUser(userId, userData);
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error updating user:', error);
      alert('Failed to update user: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await notificationApiClient.deleteUser(userId);
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user: ' + (error.message || 'Unknown error'));
    }
  };

  const handleAssignRole = async (userId: string, roleName: string) => {
    try {
      await notificationApiClient.assignRoleToUser(roleName, userId);
      // Update local state
      setUserRoles(prev => ({
        ...prev,
        [userId]: [...(prev[userId] || []), roleName]
      }));
    } catch (error: any) {
      console.error('Error assigning role:', error);
      alert('Failed to assign role: ' + (error.message || 'Unknown error'));
    }
  };

  const handleRemoveRole = async (userId: string, roleName: string) => {
    try {
      await notificationApiClient.removeRoleFromUser(roleName, userId);
      // Update local state
      setUserRoles(prev => ({
        ...prev,
        [userId]: (prev[userId] || []).filter(role => role !== roleName)
      }));
    } catch (error: any) {
      console.error('Error removing role:', error);
      alert('Failed to remove role: ' + (error.message || 'Unknown error'));
    }
  };

  if (loading) {
    return <AdministrationSkeleton />;
  }

  if (error) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <CardContent className="text-center">
          <div className="text-destructive text-lg mb-4">{error}</div>
          <Button onClick={() => fetchData()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">{t('admin.userManagement')}</h1>
          <p className="text-muted-foreground">{t('admin.manageUsersRolesGroups')}</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add {activeTab.slice(0, -1)}
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-ui">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-text-light hover:text-neutral-text-dark'
            }`}
          >
            <Users className="h-4 w-4" />
            {t('admin.users')} ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'roles'
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-text-light hover:text-neutral-text-dark'
            }`}
          >
            <Shield className="h-4 w-4" />
            {t('admin.roles')} ({roles.length})
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'groups'
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-text-light hover:text-neutral-text-dark'
            }`}
          >
            <FolderTree className="h-4 w-4" />
            {t('admin.groups')} ({groups.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-text-light hover:text-neutral-text-dark'
            }`}
          >
            <History className="h-4 w-4" />
            Audit Logs ({auditLogs.length})
          </button>
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select defaultValue={`all-${activeTab}`}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={`all-${activeTab}`}>All {activeTab}</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selectedItems.length} selected
          </span>
          {selectedItems.length > 0 && (
            <>
              <Button variant="outline" size="sm">
                {t('admin.assignRoles')}
              </Button>
              <Button variant="outline" size="sm">
                Add to Group
              </Button>
              <Button variant="destructive" size="sm">
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <Card>
        {activeTab === 'users' && (
          <UsersTab 
            users={users} 
            roles={roles}
            groups={groups}
            getRolesForUser={getRolesForUser}
            getGroupsForUser={getGroupsForUser}
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            formatDate={formatDate}
            t={t}
          />
        )}
        {activeTab === 'roles' && (
          <RolesTab 
            roles={roles} 
            permissions={permissions}
            getUsersWithRole={getUsersWithRole}
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
          />
        )}
        {activeTab === 'groups' && (
          <GroupsTab 
            groups={groups} 
            getUsersInGroup={getUsersInGroup}
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
          />
        )}
        {activeTab === 'audit' && (
          <AuditTab 
            auditLogs={auditLogs}
            auditStatistics={auditStatistics}
            loading={auditLoading}
            searchTerm={auditSearchTerm}
            setSearchTerm={setAuditSearchTerm}
            dateRange={auditDateRange}
            setDateRange={setAuditDateRange}
            entityType={auditEntityType}
            setEntityType={setAuditEntityType}
            userId={auditUserId}
            setUserId={setAuditUserId}
            onRefresh={fetchAuditLogs}
          />
        )}
      </Card>
    </div>
  );
}

// Users Tab Component
function UsersTab({ users, roles, groups, getRolesForUser, getGroupsForUser, selectedItems, setSelectedItems, formatDate, t }: any) {
  const [expandedUsers, setExpandedUsers] = useState<string[]>([]);

  const toggleUserExpansion = (userId: string) => {
    setExpandedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedItems((prev: string[]) =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="overflow-hidden">
      <table className="w-full">
        <thead className="bg-neutral-background">
          <tr>
            <th className="text-left p-4 w-8">
              <input 
                type="checkbox" 
                className="rounded border-ui"
                checked={selectedItems.length === users.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedItems(users.map((u: FullUserDto) => u.id));
                  } else {
                    setSelectedItems([]);
                  }
                }}
              />
            </th>
            <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">{t('admin.user')}</th>
            <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">{t('admin.email')}</th>
            <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">{t('admin.roles')}</th>
            <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">{t('admin.groups')}</th>
            <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">{t('admin.created')}</th>
            <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">{t('admin.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user: FullUserDto) => {
            const userRoles = getRolesForUser(user.id);
            const userGroups = getGroupsForUser(user.id);
            const isExpanded = expandedUsers.includes(user.id);

            return (
              <>
                <tr key={user.id} className="border-b border-ui hover:bg-neutral-background/50">
                  <td className="p-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-ui"
                      checked={selectedItems.includes(user.id)}
                      onChange={() => toggleSelectUser(user.id)}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => toggleUserExpansion(user.id)}
                        className="p-1 rounded hover:bg-ui transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <div className="h-10 w-10 bg-primary-light rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-neutral-text-dark">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-neutral-text-light">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-neutral-text-dark">{user.email}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {userRoles.slice(0, 2).map((role: any) => (
                        <span key={role.id} className="px-2 py-1 bg-primary-light text-primary rounded text-xs">
                          {role.name}
                        </span>
                      ))}
                      {userRoles.length > 2 && (
                        <span className="px-2 py-1 bg-neutral-ui text-neutral-text-light rounded text-xs">
                          +{userRoles.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {userGroups.slice(0, 2).map((group: any) => (
                        <span key={group.id} className="px-2 py-1 bg-warning-light text-warning-dark rounded text-xs">
                          {group.name}
                        </span>
                      ))}
                      {userGroups.length > 2 && (
                        <span className="px-2 py-1 bg-neutral-ui text-neutral-text-light rounded text-xs">
                          +{userGroups.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-neutral-text-light">{formatDate(user.createdTimestamp)}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button className="p-1 rounded hover:bg-ui transition-colors" title="Edit">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-1 rounded hover:bg-ui transition-colors" title="Permissions">
                        <Key className="h-4 w-4" />
                      </button>
                      <button className="p-1 rounded hover:bg-error/10 transition-colors" title="Delete">
                        <Trash2 className="h-4 w-4 text-error" />
                      </button>
                    </div>
                  </td>
                </tr>
                
                {/* Expanded Details */}
                {isExpanded && (
                  <tr className="bg-neutral-background/30">
                    <td colSpan={7} className="p-4">
                      <div className="grid grid-cols-2 gap-6 ml-12">
                        {/* Roles Section */}
                        <div>
                          <h4 className="font-medium text-neutral-text-dark mb-3 flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            {t('admin.assignedRoles')} ({userRoles.length})
                          </h4>
                          <div className="space-y-2">
                            {userRoles.map((role: any) => (
                              <div key={role.id} className="flex justify-between items-center p-2 bg-surface rounded border border-ui">
                                <span className="text-sm">{role.name}</span>
                                <button className="text-xs text-error hover:text-error-dark">
                                  Remove
                                </button>
                              </div>
                            ))}
                            <button className="w-full text-xs text-primary hover:text-primary-dark text-center py-2 border border-dashed border-ui rounded">
                              Assign New Role
                            </button>
                          </div>
                        </div>

                        {/* Groups Section */}
                        <div>
                          <h4 className="font-medium text-neutral-text-dark mb-3 flex items-center gap-2">
                            <FolderTree className="h-4 w-4" />
                            {t('admin.groupMemberships')} ({userGroups.length})
                          </h4>
                          <div className="space-y-2">
                            {userGroups.map((group: any) => (
                              <div key={group.id} className="flex justify-between items-center p-2 bg-surface rounded border border-ui">
                                <span className="text-sm">{group.path}</span>
                                <button className="text-xs text-error hover:text-error-dark">
                                  Remove
                                </button>
                              </div>
                            ))}
                            <button className="w-full text-xs text-primary hover:text-primary-dark text-center py-2 border border-dashed border-ui rounded">
                              Add to Group
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Roles Tab Component
function RolesTab({ roles, permissions, getUsersWithRole, selectedItems, setSelectedItems }: any) {
  const [expandedRoles, setExpandedRoles] = useState<string[]>([]);

  const toggleRoleExpansion = (roleId: string) => {
    setExpandedRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  return (
    <div className="overflow-hidden">
      <table className="w-full">
        <thead className="bg-neutral-background">
          <tr>
            <th className="text-left p-4 w-8">
              <input type="checkbox" className="rounded border-ui" />
            </th>
            <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Role</th>
            <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Description</th>
            <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Permissions</th>
            <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Users</th>
            <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role: RoleDto) => {
            const usersWithRole = getUsersWithRole(role.id);
            const isExpanded = expandedRoles.includes(role.id);

            return (
              <>
                <tr key={role.id} className="border-b border-ui hover:bg-neutral-background/50">
                  <td className="p-4">
                    <input type="checkbox" className="rounded border-ui" />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => toggleRoleExpansion(role.id)}
                        className="p-1 rounded hover:bg-ui transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <div className="h-10 w-10 bg-primary-light rounded-full flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-neutral-text-dark">{role.name}</div>
                        <div className="text-sm text-neutral-text-light">{role.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-neutral-text-dark">{role.description}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 3).map((permission: string) => (
                        <span key={permission} className="px-2 py-1 bg-success-light text-success-dark rounded text-xs">
                          {permission}
                        </span>
                      ))}
                      {role.permissions.length > 3 && (
                        <span className="px-2 py-1 bg-neutral-ui text-neutral-text-light rounded text-xs">
                          +{role.permissions.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-neutral-text-light">{usersWithRole.length} users</div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button className="p-1 rounded hover:bg-ui transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-1 rounded hover:bg-error/10 transition-colors">
                        <Trash2 className="h-4 w-4 text-error" />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Expanded Role Details */}
                {isExpanded && (
                  <tr className="bg-neutral-background/30">
                    <td colSpan={6} className="p-4">
                      <div className="grid grid-cols-2 gap-6 ml-12">
                        {/* Permissions Section */}
                        <div>
                          <h4 className="font-medium text-neutral-text-dark mb-3">Permissions</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {role.permissions.map((permission: string) => (
                              <div key={permission} className="flex justify-between items-center p-2 bg-surface rounded border border-ui">
                                <span className="text-sm">{permission}</span>
                                <button className="text-xs text-error hover:text-error-dark">
                                  Remove
                                </button>
                              </div>
                            ))}
                            <button className="w-full text-xs text-primary hover:text-primary-dark text-center py-2 border border-dashed border-ui rounded">
                              Add Permission
                            </button>
                          </div>
                        </div>

                        {/* Users Section */}
                        <div>
                          <h4 className="font-medium text-neutral-text-dark mb-3">Assigned Users</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {usersWithRole.map((user: any) => (
                              <div key={user.id} className="flex justify-between items-center p-2 bg-surface rounded border border-ui">
                                <span className="text-sm">{user.firstName} {user.lastName}</span>
                                <button className="text-xs text-error hover:text-error-dark">
                                  Remove
                                </button>
                              </div>
                            ))}
                            <button className="w-full text-xs text-primary hover:text-primary-dark text-center py-2 border border-dashed border-ui rounded">
                              Assign to User
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Groups Tab Component
function GroupsTab({ groups, getUsersInGroup, selectedItems, setSelectedItems }: any) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const renderGroup = (group: GroupDto, level = 0) => {
    const usersInGroup = getUsersInGroup(group.id);
    const isExpanded = expandedGroups.includes(group.id);

    return (
      <>
        <tr key={group.id} className="border-b border-ui hover:bg-neutral-background/50">
          <td className="p-4" style={{ paddingLeft: `${level * 24 + 16}px` }}>
            <input type="checkbox" className="rounded border-ui" />
          </td>
          <td className="p-4">
            <div className="flex items-center gap-3">
              {(group as any).subGroups && (group as any).subGroups.length > 0 && (
                <button 
                  onClick={() => toggleGroupExpansion(group.id)}
                  className="p-1 rounded hover:bg-ui transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
              <div className="h-10 w-10 bg-primary-light rounded-full flex items-center justify-center">
                <FolderTree className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-medium text-neutral-text-dark">{group.name}</div>
                <div className="text-sm text-neutral-text-light">{group.path}</div>
              </div>
            </div>
          </td>
          <td className="p-4">
            <div className="text-sm text-neutral-text-dark">{group.description}</div>
          </td>
          <td className="p-4">
            <div className="text-sm text-neutral-text-light">{usersInGroup.length} users</div>
          </td>
          <td className="p-4">
            <div className="flex gap-2">
              <button className="p-1 rounded hover:bg-ui transition-colors">
                <Edit className="h-4 w-4" />
              </button>
              <button className="p-1 rounded hover:bg-error/10 transition-colors">
                <Trash2 className="h-4 w-4 text-error" />
              </button>
            </div>
          </td>
        </tr>

        {/* Expanded Group Details */}
        {isExpanded && (
          <tr className="bg-neutral-background/30">
            <td colSpan={5} className="p-4" style={{ paddingLeft: `${level * 24 + 64}px` }}>
              <div>
                <h4 className="font-medium text-neutral-text-dark mb-3">Group Members</h4>
                <div className="space-y-2">
                  {usersInGroup.map((user: any) => (
                    <div key={user.id} className="flex justify-between items-center p-2 bg-surface rounded border border-ui">
                      <span className="text-sm">{user.firstName} {user.lastName}</span>
                      <button className="text-xs text-error hover:text-error-dark">
                        Remove
                      </button>
                    </div>
                  ))}
                  <button className="w-full text-xs text-primary hover:text-primary-dark text-center py-2 border border-dashed border-ui rounded">
                    Add User to Group
                  </button>
                </div>
              </div>
            </td>
          </tr>
        )}

        {/* Render Subgroups */}
        {isExpanded && (group as any).subGroups?.map((subGroup: any) => 
          renderGroup(subGroup, level + 1)
        )}
      </>
    );
  };

  return (
    <div className="overflow-hidden">
      <table className="w-full">
        <thead className="bg-neutral-background">
          <tr>
            <th className="text-left p-4 w-8">
              <input type="checkbox" className="rounded border-ui" />
            </th>
            <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Group</th>
            <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Description</th>
            <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Members</th>
            <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Actions</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group: GroupDto) => renderGroup(group))}
        </tbody>
      </table>
    </div>
  );
}

// Audit Tab Component
function AuditTab({ 
  auditLogs, 
  auditStatistics, 
  loading, 
  searchTerm, 
  setSearchTerm, 
  dateRange, 
  setDateRange, 
  entityType, 
  setEntityType, 
  userId, 
  setUserId, 
  onRefresh 
}: any) {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'upload':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'update':
      case 'edit':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'view':
      case 'download':
        return <Eye className="h-4 w-4 text-gray-600" />;
      case 'login':
        return <User className="h-4 w-4 text-green-600" />;
      case 'logout':
        return <User className="h-4 w-4 text-gray-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case 'document':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'folder':
        return <FolderTree className="h-4 w-4 text-orange-600" />;
      case 'user':
        return <User className="h-4 w-4 text-green-600" />;
      case 'role':
        return <Shield className="h-4 w-4 text-purple-600" />;
      case 'group':
        return <Users className="h-4 w-4 text-indigo-600" />;
      default:
        return <Database className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Activities</p>
                <p className="text-2xl font-bold">{auditLogs.length}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unique Users</p>
                <p className="text-2xl font-bold">
                  {new Set(auditLogs.map(log => log.userId)).size}
                </p>
              </div>
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Documents</p>
                <p className="text-2xl font-bold">
                  {auditLogs.filter(log => log.entityType === 'DOCUMENT').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Folders</p>
                <p className="text-2xl font-bold">
                  {auditLogs.filter(log => log.entityType === 'FOLDER').length}
                </p>
              </div>
              <FolderTree className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Date Range</label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Entity Type</label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="DOCUMENT">Documents</SelectItem>
                  <SelectItem value="FOLDER">Folders</SelectItem>
                  <SelectItem value="USER">Users</SelectItem>
                  <SelectItem value="ROLE">Roles</SelectItem>
                  <SelectItem value="GROUP">Groups</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">User ID</label>
              <Input
                placeholder="Filter by user..."
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button onClick={onRefresh} disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="h-10 w-10 bg-muted rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Activity Found</h3>
              <p className="text-muted-foreground">No audit logs match your current filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log: AuditLog) => (
                <div key={log.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                      {getActionIcon(log.action)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{log.username}</span>
                      <Badge variant="outline" className="text-xs">
                        {log.action}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {getEntityIcon(log.entityType)}
                        {log.entityType}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {log.details || `Performed ${log.action} on ${log.entityType} ${log.entityId}`}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(log.timestamp)}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.userEmail}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Loading Skeleton
function AdministrationSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 bg-muted rounded w-64 animate-pulse shimmer mb-2"></div>
          <div className="h-4 bg-muted rounded w-96 animate-pulse shimmer"></div>
        </div>
        <div className="h-10 bg-muted rounded w-32 animate-pulse shimmer"></div>
      </div>

      <div className="flex gap-8 border-b pb-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-6 bg-muted rounded w-24 animate-pulse shimmer"></div>
        ))}
      </div>

      <div className="flex gap-4">
        <div className="h-10 bg-muted rounded w-64 animate-pulse shimmer"></div>
        <div className="h-10 bg-muted rounded w-32 animate-pulse shimmer"></div>
      </div>

      <Card className="animate-pulse">
        <div className="h-12 bg-muted rounded-t-lg shimmer"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 border-b flex items-center px-4">
            <div className="h-4 bg-muted rounded w-full shimmer"></div>
          </div>
        ))}
      </Card>
    </div>
  );
}