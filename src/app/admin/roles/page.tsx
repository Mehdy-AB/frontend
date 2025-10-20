'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Users,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { notificationApiClient } from '@/api/notificationClient';
import { RoleDto } from '@/types/api';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function RolesPage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real API data fetching
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [rolesData, permissionsData] = await Promise.all([
        notificationApiClient.getAllRoles({
          page: 0,
          size: 100,
          query: searchQuery || undefined,
          desc: false
        }),
        notificationApiClient.getAllPermissions()
      ]);
      
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (err: any) {
      console.error('Error fetching roles data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Real API utility functions
  const getUsersWithRole = async (roleName: string) => {
    try {
      return await notificationApiClient.getRoleUsers(roleName, { size: 100 });
    } catch (error) {
      console.error('Error fetching role users:', error);
      return [];
    }
  };

  if (loading) {
    return <RolesSkeleton />;
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
          <h1 className="text-2xl font-semibold">Role Management</h1>
          <p className="text-muted-foreground">Manage roles and permissions</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Role
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select defaultValue="all-roles">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-roles">All Roles</SelectItem>
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
                Assign to Users
              </Button>
              <Button variant="destructive" size="sm">
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Roles Table */}
      <Card>
        <RolesTable 
          roles={roles} 
          permissions={permissions}
          getUsersWithRole={getUsersWithRole}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
        />
      </Card>
    </div>
  );
}

// Roles Table Component
function RolesTable({ roles, permissions, getUsersWithRole, selectedItems, setSelectedItems }: any) {
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

// Loading Skeleton
function RolesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 bg-muted rounded w-64 animate-pulse shimmer mb-2"></div>
          <div className="h-4 bg-muted rounded w-96 animate-pulse shimmer"></div>
        </div>
        <div className="h-10 bg-muted rounded w-32 animate-pulse shimmer"></div>
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
