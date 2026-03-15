'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    UsersRound,
    Plus,
    Trash2,
    ChevronRight,
    ChevronDown,
    Search,
    X,
    RefreshCw,
    UserPlus,
    UserMinus,
    Crown,
    Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTypeColorClass } from '@/api/services/orgUnitService';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import UserAvatar from '@/components/main/UserAvatar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    orgUnitService,
    OrgUnitGroupResponse,
    GroupMemberResponse,
    CreateOrgUnitGroupRequest,
    OrgUnitGroupTypeResponse,
} from '@/api/services/orgUnitService';
import { apiClient } from '@/api/client';

// ==================== Types ====================

interface SimpleUser {
    id: string;
    username: string;
    displayName: string;
    email: string;
    imageUrl?: string;
    imgUrl?: string;
}

interface GroupsTabProps {
    ouId: string;
    canManageGroups: boolean;
    addNotification: (n: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
}

// ==================== Component ====================

export default function GroupsTab({ ouId, canManageGroups, addNotification }: GroupsTabProps) {
    // State
    const [groups, setGroups] = useState<OrgUnitGroupResponse[]>([]);
    const [groupsLoading, setGroupsLoading] = useState(false);
    const [groupTypes, setGroupTypes] = useState<OrgUnitGroupTypeResponse[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [form, setForm] = useState<CreateOrgUnitGroupRequest>({ code: '', name: '', description: '', groupTypeId: '' });
    const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
    const [groupMembers, setGroupMembers] = useState<Record<string, GroupMemberResponse[]>>({});
    const [actionLoading, setActionLoading] = useState(false);

    // Add member state
    const [addMemberGroupId, setAddMemberGroupId] = useState<string | null>(null);
    const [memberSearchQuery, setMemberSearchQuery] = useState('');
    const [memberSearchResults, setMemberSearchResults] = useState<SimpleUser[]>([]);

    // Set leader state
    const [leaderGroupId, setLeaderGroupId] = useState<string | null>(null);
    const [leaderSearchQuery, setLeaderSearchQuery] = useState('');
    const [leaderSearchResults, setLeaderSearchResults] = useState<SimpleUser[]>([]);

    // ==================== Fetchers ====================

    const fetchGroups = useCallback(async () => {
        try {
            setGroupsLoading(true);
            const data = await orgUnitService.getGroups(ouId);
            setGroups(data);
        } catch { /* ignore */ }
        finally { setGroupsLoading(false); }
    }, [ouId]);

    const fetchGroupTypes = useCallback(async () => {
        try {
            const types = await orgUnitService.getOrgUnitGroupTypes(true);
            setGroupTypes(types);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { 
        fetchGroups(); 
        fetchGroupTypes();
    }, [fetchGroups, fetchGroupTypes]);

    const fetchGroupMembers = useCallback(async (groupId: string) => {
        try {
            const data = await orgUnitService.getGroupMembers(ouId, groupId);
            setGroupMembers(prev => ({ ...prev, [groupId]: data }));
        } catch {
            setGroupMembers(prev => ({ ...prev, [groupId]: [] }));
        }
    }, [ouId]);

    // ==================== Handlers ====================

    const toggleExpand = (groupId: string) => {
        if (expandedGroupId === groupId) {
            setExpandedGroupId(null);
        } else {
            setExpandedGroupId(groupId);
            if (!groupMembers[groupId]) {
                fetchGroupMembers(groupId);
            }
        }
    };

    const handleCreate = async () => {
        try {
            setActionLoading(true);
            await orgUnitService.createGroup(ouId, form);
            addNotification({ type: 'success', title: 'Group Created', message: `"${form.name}" created successfully` });
            setIsCreateOpen(false);
            setForm({ code: '', name: '', description: '', groupTypeId: '' });
            fetchGroups();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to create group', message: err?.message || 'Unknown error' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (groupId: string, groupName: string) => {
        if (!confirm(`Delete group "${groupName}"? This cannot be undone.`)) return;
        try {
            setActionLoading(true);
            await orgUnitService.deleteGroup(ouId, groupId);
            addNotification({ type: 'success', title: 'Group Deleted', message: `"${groupName}" deleted successfully` });
            if (expandedGroupId === groupId) setExpandedGroupId(null);
            fetchGroups();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to delete group', message: err?.message || 'Unknown error' });
        } finally {
            setActionLoading(false);
        }
    };

    // ==================== Member Search (Server-side) ====================

    const searchUsers = useCallback(async (query: string) => {
        try {
            if (!query || query.length < 2) {
                const params = new URLSearchParams({ page: '0', size: '10' });
                const response = await apiClient.get<any>(`/api/v1/admin/users?${params}`);
                const users = response.content || response || [];
                return Array.isArray(users) ? users : [];
            }
            const params = new URLSearchParams({ query, page: '0', size: '10' });
            const response = await apiClient.get<any>(`/api/v1/admin/users/search?${params}`);
            const users = response.content || response || [];
            return Array.isArray(users) ? users : [];
        } catch {
            return [];
        }
    }, []);

    // Member search debounce
    useEffect(() => {
        if (!addMemberGroupId) return;
        const timer = setTimeout(async () => {
            const users = await searchUsers(memberSearchQuery);
            setMemberSearchResults(users);
        }, 400);
        return () => clearTimeout(timer);
    }, [memberSearchQuery, searchUsers, addMemberGroupId]);

    // Leader search debounce
    useEffect(() => {
        if (!leaderGroupId) return;
        const timer = setTimeout(async () => {
            const users = await searchUsers(leaderSearchQuery);
            setLeaderSearchResults(users);
        }, 400);
        return () => clearTimeout(timer);
    }, [leaderSearchQuery, searchUsers, leaderGroupId]);

    const handleAddMember = async (groupId: string, user: SimpleUser) => {
        try {
            setActionLoading(true);
            await orgUnitService.addGroupMember(ouId, groupId, user.id);
            addNotification({ type: 'success', title: 'Member Added', message: `${user.displayName || user.username} added to group` });
            fetchGroupMembers(groupId);
            fetchGroups();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to add member', message: err?.message || 'Unknown error' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveMember = async (groupId: string, userId: string, displayName: string) => {
        try {
            setActionLoading(true);
            await orgUnitService.removeGroupMember(ouId, groupId, userId);
            addNotification({ type: 'success', title: 'Member Removed', message: `${displayName} removed from group` });
            fetchGroupMembers(groupId);
            fetchGroups();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to remove member', message: err?.message || 'Unknown error' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleSetLeader = async (groupId: string, user: SimpleUser) => {
        try {
            setActionLoading(true);
            await orgUnitService.setGroupLeader(ouId, groupId, user.id);
            addNotification({ type: 'success', title: 'Leader Updated', message: `${user.displayName || user.username} is now the group leader` });
            setLeaderGroupId(null);
            setLeaderSearchQuery('');
            fetchGroups();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to set leader', message: err?.message || 'Unknown error' });
        } finally {
            setActionLoading(false);
        }
    };

    // ==================== Render ====================

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <UsersRound className="h-4 w-4 text-primary" />
                            Operational Groups ({groups.length})
                        </CardTitle>
                        {canManageGroups && (
                            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(true)} className="gap-1.5">
                                <Plus className="h-3.5 w-3.5" />
                                Create Group
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {groupsLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
                            <p className="text-muted-foreground text-sm">Loading groups...</p>
                        </div>
                    ) : groups.length === 0 ? (
                        <div className="text-center py-10">
                            <UsersRound className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                            <p className="text-muted-foreground">No operational groups in this unit</p>
                            {canManageGroups && (
                                <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => setIsCreateOpen(true)}>
                                    <Plus className="h-3.5 w-3.5" />
                                    Create First Group
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {groups.map(group => {
                                const typeColorClass = getTypeColorClass(group.groupTypeColor);
                                const typeName = group.groupTypeName || 'Unknown Type';
                                return (
                                    <div key={group.id} className="rounded-lg border overflow-hidden">
                                        {/* Group row */}
                                        <div
                                            className="flex items-center justify-between p-3 hover:bg-muted/40 transition-colors cursor-pointer"
                                            onClick={() => toggleExpand(group.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 flex items-center justify-center">
                                                    <UsersRound className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-medium text-sm">{group.name}</span>
                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono">{group.code}</Badge>
                                                        <Badge variant="outline" className={`text-[10px] px-1 py-0 h-4 ${typeColorClass}`}>{typeName}</Badge>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                                                        <span>{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</span>
                                                        {group.leaderDisplayName && (
                                                            <span className="flex items-center gap-1">
                                                                <Crown className="h-3 w-3 text-amber-500" />
                                                                {group.leaderDisplayName}
                                                            </span>
                                                        )}
                                                        {!group.isActive && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Inactive</Badge>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {canManageGroups && (
                                                    <>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-amber-600"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setLeaderGroupId(leaderGroupId === group.id ? null : group.id);
                                                                        setLeaderSearchQuery('');
                                                                    }} disabled={actionLoading}>
                                                                    <Crown className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Set leader</TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                                                    onClick={(e) => { e.stopPropagation(); handleDelete(group.id, group.name); }} disabled={actionLoading}>
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Delete group</TooltipContent>
                                                        </Tooltip>
                                                    </>
                                                )}
                                                {expandedGroupId === group.id
                                                    ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                    : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                            </div>
                                        </div>

                                        {/* Set Leader dropdown */}
                                        {leaderGroupId === group.id && (
                                            <div className="border-t bg-amber-50/40 dark:bg-amber-950/20 p-3">
                                                <p className="text-xs font-medium text-muted-foreground mb-2">Set Group Leader</p>
                                                <div className="relative mb-2">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                    <Input value={leaderSearchQuery} onChange={(e) => setLeaderSearchQuery(e.target.value)}
                                                        placeholder="Search users by name or email..." className="pl-9 h-8 text-sm" autoFocus />
                                                </div>
                                                <div className="max-h-40 overflow-y-auto space-y-1">
                                                    {leaderSearchResults.length === 0 ? (
                                                        <p className="text-xs text-center text-muted-foreground py-2">{leaderSearchQuery ? 'No users found' : 'Type to search'}</p>
                                                    ) : leaderSearchResults.map(user => (
                                                        <button key={user.id} onClick={() => handleSetLeader(group.id, user)} disabled={actionLoading}
                                                            className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted/60 transition-colors text-left text-sm">
                                                            <UserAvatar user={{ displayName: user.displayName, imgUrl: user.imgUrl || user.imageUrl }} size="sm" />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-medium truncate text-xs">{user.displayName || user.username}</p>
                                                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                            </div>
                                                            <Crown className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                                                        </button>
                                                    ))}
                                                </div>
                                                <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => setLeaderGroupId(null)}>Cancel</Button>
                                            </div>
                                        )}

                                        {/* Expanded — group members */}
                                        {expandedGroupId === group.id && (
                                            <div className="border-t bg-muted/20 p-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-xs font-medium text-muted-foreground">Group Members</p>
                                                    {canManageGroups && (
                                                        <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 px-2"
                                                            onClick={() => {
                                                                setAddMemberGroupId(addMemberGroupId === group.id ? null : group.id);
                                                                setMemberSearchQuery('');
                                                            }}>
                                                            <UserPlus className="h-3 w-3" /> Add
                                                        </Button>
                                                    )}
                                                </div>

                                                {/* Add member search */}
                                                {addMemberGroupId === group.id && (
                                                    <div className="mb-3 p-2 rounded-md bg-background border">
                                                        <div className="relative mb-2">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                            <Input value={memberSearchQuery} onChange={(e) => setMemberSearchQuery(e.target.value)}
                                                                placeholder="Search users..." className="pl-9 h-8 text-sm" autoFocus />
                                                        </div>
                                                        <div className="max-h-36 overflow-y-auto space-y-1">
                                                            {memberSearchResults.length === 0 ? (
                                                                <p className="text-xs text-center text-muted-foreground py-2">{memberSearchQuery ? 'No users found' : 'Type to search'}</p>
                                                            ) : memberSearchResults
                                                                .filter(u => !(groupMembers[group.id] || []).some(m => m.userId === u.id))
                                                                .map(user => (
                                                                    <button key={user.id} onClick={() => handleAddMember(group.id, user)} disabled={actionLoading}
                                                                        className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted/60 transition-colors text-left text-sm">
                                                                        <UserAvatar user={{ displayName: user.displayName, imgUrl: user.imgUrl || user.imageUrl }} size="sm" />
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="font-medium truncate text-xs">{user.displayName || user.username}</p>
                                                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                                        </div>
                                                                        <Plus className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                                                    </button>
                                                                ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Members list */}
                                                {!groupMembers[group.id] ? (
                                                    <div className="flex items-center justify-center py-3">
                                                        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                                                    </div>
                                                ) : groupMembers[group.id].length === 0 ? (
                                                    <p className="text-xs text-muted-foreground text-center py-3">No members in this group</p>
                                                ) : (
                                                    <div className="space-y-1">
                                                        {groupMembers[group.id].map(member => (
                                                            <div key={member.id} className="flex items-center justify-between p-2 rounded-md bg-background border text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <UserAvatar user={{ displayName: member.userDisplayName, imgUrl: member.userImageUrl || undefined }} size="sm" />
                                                                    <div>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <Link href={`/admin/users/${member.userId}`} className="font-medium text-xs hover:text-primary hover:underline">
                                                                                {member.userDisplayName}
                                                                            </Link>
                                                                            {member.userId === group.leaderUserId && (
                                                                                <Crown className="h-3 w-3 text-amber-500" />
                                                                            )}
                                                                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">{member.roleInGroup}</Badge>
                                                                        </div>
                                                                        <p className="text-[10px] text-muted-foreground">{member.userEmail}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] text-muted-foreground">{new Date(member.joinedAt).toLocaleDateString()}</span>
                                                                    {canManageGroups && (
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                                                                    onClick={() => handleRemoveMember(group.id, member.userId, member.userDisplayName)} disabled={actionLoading}>
                                                                                    <UserMinus className="h-3 w-3" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>Remove from group</TooltipContent>
                                                                        </Tooltip>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Group Form */}
            {isCreateOpen && (
                <Card className="border-primary/30">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Create New Group</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)}><X className="h-4 w-4" /></Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Project Alpha Team" />
                            </div>
                            <div className="space-y-2">
                                <Label>Code</Label>
                                <Input value={form.code} onChange={(e) => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. PROJ-ALPHA" className="font-mono" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Group Type</Label>
                            <Select value={form.groupTypeId} onValueChange={(v) => setForm(p => ({ ...p, groupTypeId: v }))}>
                                <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                                <SelectContent>
                                    {groupTypes.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
                            <Textarea value={form.description || ''} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                                placeholder="Brief description of the group's purpose..." rows={2} />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={actionLoading || !form.name || !form.code} className="gap-1.5">
                                {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                                Create Group
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
