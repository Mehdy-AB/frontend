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
    Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTypeColorClass } from '@/api/services/orgUnitService';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import UserAvatar from '@/components/main/UserAvatar';
import Pagination from '@/components/main/Pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { myScopeService } from '@/api/services/myScopeService';
import type {
    OrgUnitGroupResponse,
    GroupMemberResponse,
    CreateOrgUnitGroupRequest,
    OrgUnitGroupTypeResponse,
} from '@/api/services/orgUnitService';

// ==================== Types ====================

interface SimpleUser {
    id: string;
    username: string;
    displayName: string;
    email: string;
    imageUrl?: string;
    imgUrl?: string;
}

interface ScopeGroupsTabProps {
    ouId: string;
    canCreate: boolean;
    canManage: boolean;
    addNotification: (n: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
    refreshTrigger?: number;
}

// ==================== Component ====================

export default function ScopeGroupsTab({ ouId, canCreate, canManage, addNotification, refreshTrigger = 0 }: ScopeGroupsTabProps) {
    // Groups data
    const [groups, setGroups] = useState<OrgUnitGroupResponse[]>([]);
    const [groupsLoading, setGroupsLoading] = useState(false);
    const [groupTypes, setGroupTypes] = useState<OrgUnitGroupTypeResponse[]>([]);
    const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
    const [groupMembers, setGroupMembers] = useState<Record<string, GroupMemberResponse[]>>({});
    const [actionLoading, setActionLoading] = useState(false);

    const [groupsPage, setGroupsPage] = useState(0);
    const [groupsTotalPages, setGroupsTotalPages] = useState(0);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // Members pagination state (for the currently expanded group)
    const [membersPage, setMembersPage] = useState(0);
    const [membersSearchQuery, setMembersSearchQuery] = useState('');
    const [membersTotalPages, setMembersTotalPages] = useState(0);
    const [membersTotalElements, setMembersTotalElements] = useState(0);

    // Create/Edit dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<OrgUnitGroupResponse | null>(null);
    const [form, setForm] = useState<CreateOrgUnitGroupRequest & { isActive?: boolean }>({ code: '', name: '', description: '', groupTypeId: '' });

    // Add member dialog
    const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
    const [addMemberGroupId, setAddMemberGroupId] = useState<string | null>(null);
    const [memberSearchQuery, setMemberSearchQuery] = useState('');
    const [memberSearchResults, setMemberSearchResults] = useState<SimpleUser[]>([]);
    const [memberSearchLoading, setMemberSearchLoading] = useState(false);

    // Set leader dialog
    const [leaderDialogOpen, setLeaderDialogOpen] = useState(false);
    const [leaderGroupId, setLeaderGroupId] = useState<string | null>(null);
    const [leaderCurrentId, setLeaderCurrentId] = useState<string | null>(null);
    const [leaderSearchQuery, setLeaderSearchQuery] = useState('');
    const [leaderSearchResults, setLeaderSearchResults] = useState<SimpleUser[]>([]);
    const [leaderSearchLoading, setLeaderSearchLoading] = useState(false);

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<{ id: string, name: string } | null>(null);

    // ==================== Fetchers ====================

    const fetchGroups = useCallback(async () => {
        try {
            setGroupsLoading(true);
            const data: any = await myScopeService.getMyGroupsPaged(ouId, {
                page: groupsPage,
                size: 10,
                query: searchQuery,
                groupTypeId: typeFilter === 'ALL' ? undefined : typeFilter,
                isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE'
            });
            setGroups(data?.content || (Array.isArray(data) ? data : []));
            setGroupsTotalPages(data?.totalPages || 1);
        } catch { /* ignore */ }
        finally { setGroupsLoading(false); }
    }, [ouId, searchQuery, typeFilter, statusFilter, groupsPage, refreshTrigger]);

    const fetchGroupTypes = useCallback(async () => {
        try {
            const types = await myScopeService.getGroupTypes(true);
            setGroupTypes(types);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    useEffect(() => {
        fetchGroupTypes();
    }, [fetchGroupTypes]);

    const fetchGroupMembers = useCallback(async (groupId: string) => {
        try {
            const data: any = await myScopeService.getGroupMembersPaged(ouId, groupId, {
                page: membersPage,
                size: 10,
                query: membersSearchQuery
            });
            setGroupMembers(prev => ({ ...prev, [groupId]: data?.content || (Array.isArray(data) ? data : []) }));
            setMembersTotalPages(data?.totalPages || 1);
            setMembersTotalElements(data?.totalElements || (Array.isArray(data) ? data.length : 0));
        } catch {
            setGroupMembers(prev => ({ ...prev, [groupId]: [] }));
            setMembersTotalPages(0);
            setMembersTotalElements(0);
        }
    }, [ouId, membersPage, membersSearchQuery]);

    useEffect(() => {
        if (expandedGroupId) {
            fetchGroupMembers(expandedGroupId);
        }
    }, [expandedGroupId, fetchGroupMembers]);

    // ==================== OU-Scoped Member Search ====================

    const searchOuMembers = useCallback(async (query: string): Promise<SimpleUser[]> => {
        try {
            const result = await myScopeService.getMyMembersPaged(ouId, { query: query || undefined, page: 0, size: 15 });
            const members = result?.content || result || [];
            if (!Array.isArray(members)) return [];
            return members.map((m: any) => ({
                id: m.userId || m.id,
                username: m.username || '',
                displayName: m.displayName || m.userDisplayName || '',
                email: m.email || m.userEmail || '',
                imgUrl: m.imgUrl || m.imageUrl || m.userImageUrl || undefined,
            }));
        } catch {
            return [];
        }
    }, [ouId]);

    // Member search debounce
    useEffect(() => {
        if (!addMemberDialogOpen || !addMemberGroupId) return;
        const timer = setTimeout(async () => {
            setMemberSearchLoading(true);
            const users = await searchOuMembers(memberSearchQuery);
            setMemberSearchResults(users);
            setMemberSearchLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [memberSearchQuery, searchOuMembers, addMemberDialogOpen, addMemberGroupId]);

    // Leader search debounce
    useEffect(() => {
        if (!leaderDialogOpen || !leaderGroupId) return;
        const timer = setTimeout(async () => {
            setLeaderSearchLoading(true);
            const users = await searchOuMembers(leaderSearchQuery);
            setLeaderSearchResults(users);
            setLeaderSearchLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [leaderSearchQuery, searchOuMembers, leaderDialogOpen, leaderGroupId]);

    // ==================== Handlers ====================

    const toggleExpand = (groupId: string) => {
        if (expandedGroupId === groupId) {
            setExpandedGroupId(null);
        } else {
            setExpandedGroupId(groupId);
            setMembersPage(0);
            setMembersSearchQuery('');
        }
    };

    const openCreateDialog = () => {
        setEditingGroup(null);
        setForm({ code: '', name: '', description: '', groupTypeId: '' });
        setDialogOpen(true);
    };

    const openEditDialog = (group: OrgUnitGroupResponse) => {
        setEditingGroup(group);
        setForm({
            code: group.code,
            name: group.name,
            description: group.description || '',
            groupTypeId: group.groupTypeId || '',
            isActive: group.isActive,
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        try {
            setActionLoading(true);
            if (editingGroup) {
                await myScopeService.updateGroup(ouId, editingGroup.id, {
                    name: form.name,
                    description: form.description || undefined,
                    groupTypeId: form.groupTypeId || undefined,
                    isActive: form.isActive,
                });
                addNotification({ type: 'success', title: 'Group Updated', message: `"${form.name}" updated successfully` });
            } else {
                await myScopeService.createGroup(ouId, form);
                addNotification({ type: 'success', title: 'Group Created', message: `"${form.name}" created successfully` });
            }
            setDialogOpen(false);
            fetchGroups();
        } catch (err: any) {
            addNotification({ type: 'error', title: editingGroup ? 'Failed to update' : 'Failed to create', message: err?.message || 'Unknown error' });
        } finally {
            setActionLoading(false);
        }
    };

    const confirmDelete = (groupId: string, groupName: string) => {
        setGroupToDelete({ id: groupId, name: groupName });
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!groupToDelete) return;
        try {
            setActionLoading(true);
            await myScopeService.deleteGroup(ouId, groupToDelete.id);
            addNotification({ type: 'success', title: 'Group Deleted', message: `"${groupToDelete.name}" deleted successfully` });
            if (expandedGroupId === groupToDelete.id) setExpandedGroupId(null);
            fetchGroups();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to delete group', message: err?.message || 'Unknown error' });
        } finally {
            setActionLoading(false);
            setDeleteDialogOpen(false);
            setGroupToDelete(null);
        }
    };

    const openAddMemberDialog = (groupId: string) => {
        setAddMemberGroupId(groupId);
        setMemberSearchQuery('');
        setMemberSearchResults([]);
        setAddMemberDialogOpen(true);
    };

    const handleAddMember = async (groupId: string, user: SimpleUser) => {
        try {
            setActionLoading(true);
            await myScopeService.addGroupMember(ouId, groupId, user.id);
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
            await myScopeService.removeGroupMember(ouId, groupId, userId);
            addNotification({ type: 'success', title: 'Member Removed', message: `${displayName} removed from group` });
            fetchGroupMembers(groupId);
            fetchGroups();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to remove member', message: err?.message || 'Unknown error' });
        } finally {
            setActionLoading(false);
        }
    };

    const openLeaderDialog = (group: OrgUnitGroupResponse) => {
        setLeaderGroupId(group.id);
        setLeaderCurrentId(group.leaderUserId);
        setLeaderSearchQuery('');
        setLeaderSearchResults([]);
        setLeaderDialogOpen(true);
    };

    const handleSetLeader = async (groupId: string, user: SimpleUser) => {
        try {
            setActionLoading(true);
            await myScopeService.setGroupLeader(ouId, groupId, user.id);
            addNotification({ type: 'success', title: 'Leader Updated', message: `${user.displayName || user.username} is now the group leader` });
            setLeaderDialogOpen(false);
            fetchGroupMembers(groupId);
            fetchGroups();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to set leader', message: err?.message || 'Unknown error' });
        } finally {
            setActionLoading(false);
        }
    };

    // ==================== Render ====================

    return (
        <>
            <div className="space-y-4">
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <UsersRound className="h-4 w-4 text-primary" />
                                Operational Groups
                                {groups.length > 0 && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{groups.length}</Badge>
                                )}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                {(canCreate || canManage) && (
                                    <Button variant="outline" size="sm" onClick={openCreateDialog} className="gap-1.5">
                                        <Plus className="h-3.5 w-3.5" />
                                        Create Group
                                    </Button>
                                )}
                            </div>
                        </div>
                        {/* Filters — always visible */}
                        <div className="flex items-center gap-2 mt-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setGroupsPage(0); }}
                                    placeholder="Search groups by name or code..."
                                    className="pl-9 h-8 text-sm"
                                />
                            </div>
                            <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setGroupsPage(0); }}>
                                <SelectTrigger className="w-48 h-8 text-sm">
                                    <Filter className="h-3 w-3 mr-1.5 text-muted-foreground" />
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Types</SelectItem>
                                    {groupTypes.map(t => (
                                        <SelectItem key={t.id} value={t.id}>
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2.5 w-2.5 rounded-full ${getTypeColorClass(t.color).split(' ')[0]}`} />
                                                {t.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setGroupsPage(0); }}>
                                <SelectTrigger className="w-36 h-8 text-sm">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Status</SelectItem>
                                    <SelectItem value="ACTIVE">
                                        <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /> Active</div>
                                    </SelectItem>
                                    <SelectItem value="INACTIVE">
                                        <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-gray-400" /> Inactive</div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {groupsLoading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
                                <p className="text-muted-foreground text-sm">Loading groups...</p>
                            </div>
                        ) : groups.length === 0 && (searchQuery || typeFilter !== 'ALL' || statusFilter !== 'ALL') ? (
                            <div className="text-center py-8">
                                <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                                <p className="text-muted-foreground text-sm">No groups match your filters</p>
                            </div>
                        ) : groups.length === 0 ? (
                            <div className="text-center py-10">
                                <UsersRound className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                                <p className="text-muted-foreground">No operational groups in this unit</p>
                                {(canCreate || canManage) && (
                                    <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={openCreateDialog}>
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
                                                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${typeColorClass}`}>
                                                        <UsersRound className="h-4 w-4" />
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
                                                    {canManage && (
                                                        <>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                                                                        onClick={(e) => { e.stopPropagation(); openEditDialog(group); }} disabled={actionLoading}>
                                                                        <Edit className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Edit group</TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-amber-600"
                                                                        onClick={(e) => { e.stopPropagation(); openLeaderDialog(group); }} disabled={actionLoading}>
                                                                        <Crown className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Set leader</TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                                                        onClick={(e) => { e.stopPropagation(); confirmDelete(group.id, group.name); }} disabled={actionLoading}>
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

                                            {/* Expanded — group members */}
                                            {expandedGroupId === group.id && (
                                                <div className="border-t bg-muted/20 p-3">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                                            <UsersRound className="w-3.5 h-3.5" /> Group Members ({membersTotalElements})
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <div className="relative w-48">
                                                                <Search className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
                                                                <Input
                                                                    placeholder="Search members..."
                                                                    value={membersSearchQuery}
                                                                    onChange={(e) => { setMembersSearchQuery(e.target.value); setMembersPage(0); }}
                                                                    className="h-7 w-full pl-8 text-xs bg-background"
                                                                />
                                                            </div>
                                                            {canManage && (
                                                                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2.5 bg-background"
                                                                    onClick={() => openAddMemberDialog(group.id)}>
                                                                    <UserPlus className="h-3.5 w-3.5" /> Add Member
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Members list */}
                                                    {!groupMembers[group.id] ? (
                                                        <div className="flex items-center justify-center py-4">
                                                            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                                                        </div>
                                                    ) : groupMembers[group.id].length === 0 ? (
                                                        <p className="text-xs text-muted-foreground text-center py-4">No members match your search</p>
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
                                                                                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 border-amber-300 text-amber-600 bg-amber-50">
                                                                                        <Crown className="h-2.5 w-2.5 mr-0.5" /> Leader
                                                                                    </Badge>
                                                                                )}
                                                                                <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">{member.roleInGroup}</Badge>
                                                                            </div>
                                                                            <p className="text-[10px] text-muted-foreground">{member.userEmail}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] text-muted-foreground">{new Date(member.joinedAt).toLocaleDateString()}</span>
                                                                        {canManage && (
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

                                                    {/* Members pagination */}
                                                    {membersTotalPages > 1 && (
                                                        <div className="mt-3 pt-3 border-t">
                                                            <Pagination currentPage={membersPage} totalPages={membersTotalPages} onPageChange={setMembersPage} pageSize={10} />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {/* Groups pagination */}
                        {groupsTotalPages > 1 && groups.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                                <Pagination currentPage={groupsPage} totalPages={groupsTotalPages} onPageChange={setGroupsPage} pageSize={10} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ==================== Create / Edit Dialog ==================== */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingGroup ? 'Edit Group' : 'Create New Group'}</DialogTitle>
                        <DialogDescription>
                            {editingGroup ? `Update details for "${editingGroup.name}"` : 'Create a new operational group in this unit'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Name <span className="text-destructive">*</span></Label>
                                <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Project Alpha Team" />
                            </div>
                            <div className="space-y-2">
                                <Label>Code <span className="text-destructive">*</span></Label>
                                <Input
                                    value={form.code}
                                    onChange={(e) => setForm(p => ({ ...p, code: e.target.value }))}
                                    placeholder="e.g. PROJ-ALPHA"
                                    className="font-mono"
                                    disabled={!!editingGroup}
                                />
                                {editingGroup && <p className="text-[10px] text-muted-foreground">Code cannot be changed after creation</p>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Group Type</Label>
                            <Select value={form.groupTypeId} onValueChange={(v) => setForm(p => ({ ...p, groupTypeId: v }))}>
                                <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                                <SelectContent>
                                    {groupTypes.map(t => (
                                        <SelectItem key={t.id} value={t.id}>
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2.5 w-2.5 rounded-full ${getTypeColorClass(t.color).split(' ')[0]}`} />
                                                {t.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
                            <Textarea value={form.description || ''} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                                placeholder="Brief description of the group's purpose..." rows={2} />
                        </div>
                        {editingGroup && (
                            <div className="flex items-center gap-3">
                                <Label>Status</Label>
                                <Select value={form.isActive ? 'true' : 'false'} onValueChange={(v) => setForm(p => ({ ...p, isActive: v === 'true' }))}>
                                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Active</SelectItem>
                                        <SelectItem value="false">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={actionLoading || !form.name || !form.code} className="gap-1.5">
                            {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                            {editingGroup ? 'Save Changes' : 'Create Group'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ==================== Add Member Dialog ==================== */}
            <Dialog open={addMemberDialogOpen} onOpenChange={(open) => { setAddMemberDialogOpen(open); if (!open) setAddMemberGroupId(null); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4 text-primary" />
                            Add Member
                        </DialogTitle>
                        <DialogDescription>Search members of this unit to add to the group</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input value={memberSearchQuery} onChange={(e) => setMemberSearchQuery(e.target.value)}
                                placeholder="Search unit members..." className="pl-9 h-9 text-sm" autoFocus />
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-1">
                            {memberSearchLoading ? (
                                <div className="flex items-center justify-center py-4">
                                    <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            ) : memberSearchResults.length === 0 ? (
                                <p className="text-xs text-center text-muted-foreground py-4">{memberSearchQuery ? 'No members found' : 'Type to search unit members'}</p>
                            ) : memberSearchResults
                                .filter(u => !(addMemberGroupId && groupMembers[addMemberGroupId] || []).some((m: GroupMemberResponse) => m.userId === u.id))
                                .map(user => (
                                    <button key={user.id} onClick={() => addMemberGroupId && handleAddMember(addMemberGroupId, user)} disabled={actionLoading}
                                        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/60 transition-colors text-left border border-transparent hover:border-border">
                                        <UserAvatar user={{ displayName: user.displayName, imgUrl: user.imgUrl }} size="sm" />
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-sm truncate">{user.displayName || user.username}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                        <Plus className="h-4 w-4 text-primary flex-shrink-0" />
                                    </button>
                                ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ==================== Set Leader Dialog ==================== */}
            <Dialog open={leaderDialogOpen} onOpenChange={(open) => { setLeaderDialogOpen(open); if (!open) setLeaderGroupId(null); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-amber-500" />
                            Set Group Leader
                        </DialogTitle>
                        <DialogDescription>Select a unit member to lead this group</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input value={leaderSearchQuery} onChange={(e) => setLeaderSearchQuery(e.target.value)}
                                placeholder="Search unit members..." className="pl-9 h-9 text-sm" autoFocus />
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-1">
                            {leaderSearchLoading ? (
                                <div className="flex items-center justify-center py-4">
                                    <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            ) : leaderSearchResults.length === 0 ? (
                                <p className="text-xs text-center text-muted-foreground py-4">{leaderSearchQuery ? 'No members found' : 'Type to search unit members'}</p>
                            ) : leaderSearchResults.map(user => {
                                const isCurrentLeader = user.id === leaderCurrentId;
                                return (
                                    <button
                                        key={user.id}
                                        onClick={() => leaderGroupId && !isCurrentLeader && handleSetLeader(leaderGroupId, user)}
                                        disabled={actionLoading || isCurrentLeader}
                                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors text-left border
                                            ${isCurrentLeader
                                                ? 'bg-amber-50 border-amber-200 cursor-default dark:bg-amber-950/20 dark:border-amber-800'
                                                : 'hover:bg-muted/60 border-transparent hover:border-border cursor-pointer'
                                            }`}
                                    >
                                        <UserAvatar user={{ displayName: user.displayName, imgUrl: user.imgUrl }} size="sm" />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <p className="font-medium text-sm truncate">{user.displayName || user.username}</p>
                                                {isCurrentLeader && (
                                                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950/40">
                                                        Current Leader
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                        {!isCurrentLeader && <Crown className="h-4 w-4 text-amber-500 flex-shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ==================== Delete Confirm Dialog ==================== */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Operational Group</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the group &quot;{groupToDelete?.name}&quot;? This action cannot be undone. All membership associations will be removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleDelete(); }}
                            disabled={actionLoading}
                            className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            Delete Group
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
