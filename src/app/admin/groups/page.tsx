'use client';

import { useState, useEffect } from 'react';
import { 
  FolderTree, 
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
import { GroupDto } from '@/types/api';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function GroupsPage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real API data fetching
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const groupsData = await notificationApiClient.getAllGroups({
        page: 0,
        size: 100,
        query: searchQuery || undefined,
        desc: false
      });
      
      setGroups(groupsData);
    } catch (err: any) {
      console.error('Error fetching groups data:', err);
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
  const getUsersInGroup = async (groupId: string) => {
    try {
      return await notificationApiClient.getGroupMembers(groupId, { max: 100 });
    } catch (error) {
      console.error('Error fetching group members:', error);
      return [];
    }
  };

  if (loading) {
    return <GroupsSkeleton />;
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
          <h1 className="text-2xl font-semibold">Group Management</h1>
          <p className="text-muted-foreground">Manage user groups and memberships</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Group
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select defaultValue="all-groups">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-groups">All Groups</SelectItem>
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
                Add Members
              </Button>
              <Button variant="destructive" size="sm">
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Groups Table */}
      <Card>
        <GroupsTable 
          groups={groups} 
          getUsersInGroup={getUsersInGroup}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
        />
      </Card>
    </div>
  );
}

// Groups Table Component
function GroupsTable({ groups, getUsersInGroup, selectedItems, setSelectedItems }: any) {
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

// Loading Skeleton
function GroupsSkeleton() {
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
