'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, Search, UserPlus, UserMinus, RefreshCw, Check, Eye, UserCog, Crown,
    Briefcase, UsersRound, Handshake,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import UserAvatar from '@/components/main/UserAvatar';
import Pagination from '@/components/main/Pagination';
import { myScopeService } from '@/api/services/myScopeService';
import { type MemberDetailResponse, getTypeColorClass } from '@/api/services/orgUnitService';
import { apiClient } from '@/api/client';
import type { OrgUnitMemberResponse } from '@/api/services/orgUnitService';

// ==================== Props ====================

interface MembersTabProps {
    ouId: string;
    ouName?: string;
    canManage: boolean;
    canSetManager?: boolean;
    addNotification: (n: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
    refreshTrigger?: number;
    headUserId?: string | null;
}

interface SimpleUser {
    id: string;
    username: string;
    displayName: string;
    email: string;
    imageUrl?: string;
    imgUrl?: string;
}

// ==================== Component ====================

export default function MembersTab({ ouId, ouName, canManage, canSetManager = true, addNotification, refreshTrigger = 0, headUserId = null }: MembersTabProps) {
    // Members state
    const [members, setMembers] = useState<OrgUnitMemberResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [searchDebounced, setSearchDebounced] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [actionLoading, setActionLoading] = useState(false);

    // Add member dialog
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [addSearch, setAddSearch] = useState('');
    const [addResults, setAddResults] = useState<SimpleUser[]>([]);
    const [addSelected, setAddSelected] = useState<Set<string>>(new Set());
    const [addLoading, setAddLoading] = useState(false);

    // Remove confirmation
    const [removeConfirm, setRemoveConfirm] = useState<{ userId: string; name: string } | null>(null);
    const [batchRemoveConfirm, setBatchRemoveConfirm] = useState(false);

    // View member details dialog
    const [viewingMember, setViewingMember] = useState<MemberDetailResponse | null>(null);
    const [viewingMemberLoading, setViewingMemberLoading] = useState(false);

    // Set manager dialog
    const [isSetManagerOpen, setIsSetManagerOpen] = useState(false);
    const [managerSearch, setManagerSearch] = useState('');
    const [managerResults, setManagerResults] = useState<SimpleUser[]>([]);
    const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);

    // ==================== Fetchers ====================

    const fetchMembers = useCallback(async (q?: string, p?: number) => {
        try {
            setLoading(true);
            const data = await myScopeService.getMyMembersPaged(ouId, {
                query: q || undefined,
                page: p ?? page,
                size: pageSize,
            });
            setMembers(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, [ouId, page, pageSize]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchDebounced(search);
            setPage(0);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchMembers(searchDebounced || undefined);
    }, [searchDebounced, fetchMembers, page, pageSize, refreshTrigger]);

    // ==================== Add member search ====================

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
        } catch { return []; }
    }, []);

    useEffect(() => {
        if (!isAddDialogOpen) return;
        const timer = setTimeout(async () => {
            setAddLoading(true);
            const users = await searchUsers(addSearch);
            setAddResults(users);
            setAddLoading(false);
        }, 400);
        return () => clearTimeout(timer);
    }, [addSearch, searchUsers, isAddDialogOpen]);

    // ==================== Manager search ====================

    useEffect(() => {
        if (!isSetManagerOpen || managerSearch.length < 2) {
            setManagerResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                const params = new URLSearchParams({ query: managerSearch, page: '0', size: '10' });
                const res = await apiClient.get<any>(`/api/v1/admin/users/search?${params}`);
                const users = (res.content || res || []).map((u: any) => ({
                    id: u.id,
                    username: u.username,
                    displayName: u.displayName,
                    email: u.email,
                    imageUrl: u.imageUrl || u.imgUrl || undefined,
                }));
                setManagerResults(Array.isArray(users) ? users : []);
            } catch { setManagerResults([]); }
        }, 300);
        return () => clearTimeout(timer);
    }, [managerSearch, isSetManagerOpen]);

    // ==================== Handlers ====================

    const toggleSelect = (userId: string) => {
        if (userId === headUserId) return;
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    };

    const toggleSelectAll = () => {
        const selectableMembers = members.filter(m => m.userId !== headUserId);
        if (selected.size === selectableMembers.length && selectableMembers.length > 0) setSelected(new Set());
        else setSelected(new Set(selectableMembers.map(m => m.userId)));
    };

    const toggleAddSelect = (userId: string) => {
        setAddSelected(prev => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    };

    // Batch add via dialog
    const handleBatchAdd = async () => {
        if (addSelected.size === 0) return;
        try {
            setActionLoading(true);
            const assignments = Array.from(addSelected).map(id => ({ userId: id }));
            await myScopeService.addMembersBatch(ouId, assignments);
            addNotification({ type: 'success', title: 'Members Added', message: `${addSelected.size} member(s) added` });
            setAddSelected(new Set());
            setIsAddDialogOpen(false);
            setAddSearch('');
            fetchMembers(searchDebounced || undefined);
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to add members', message: err?.message || 'Unknown error' });
        } finally { setActionLoading(false); }
    };

    // Single remove via alert dialog
    const handleRemoveSingle = async () => {
        if (!removeConfirm) return;
        try {
            setActionLoading(true);
            await myScopeService.removeMember(ouId, removeConfirm.userId);
            addNotification({ type: 'success', title: 'Member Removed', message: `${removeConfirm.name} removed` });
            setRemoveConfirm(null);
            fetchMembers(searchDebounced || undefined);
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to remove', message: err?.message || 'Unknown error' });
        } finally { setActionLoading(false); }
    };

    // Batch remove via alert dialog
    const handleBatchRemove = async () => {
        if (selected.size === 0) return;
        try {
            setActionLoading(true);
            await myScopeService.removeMembersBatch(ouId, Array.from(selected));
            addNotification({ type: 'success', title: 'Members Removed', message: `${selected.size} member(s) removed` });
            setSelected(new Set());
            setBatchRemoveConfirm(false);
            fetchMembers(searchDebounced || undefined);
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to remove members', message: err?.message || 'Unknown error' });
        } finally { setActionLoading(false); }
    };

    // View member details
    const handleViewMemberDetails = async (userId: string) => {
        try {
            setViewingMemberLoading(true);
            const data = await myScopeService.getMemberDetails(ouId, userId);
            setViewingMember(data);
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to load member details', message: err?.message || 'Unknown error' });
        } finally {
            setViewingMemberLoading(false);
        }
    };

    // Batch set manager
    const handleBatchSetManager = async () => {
        if (selected.size === 0 || !selectedManagerId) return;
        try {
            setActionLoading(true);
            const result = await myScopeService.setManagerBatch(ouId, Array.from(selected), selectedManagerId);
            if (result.failCount > 0) {
                addNotification({ type: 'warning', title: 'Partial Success', message: `Assigned manager for ${result.successCount} member(s). ${result.failCount} failed: ${result.errors.join('; ')}` });
            } else {
                addNotification({ type: 'success', title: 'Manager Assigned', message: `Manager assigned for ${result.successCount} member(s)` });
            }
            setSelected(new Set());
            setIsSetManagerOpen(false);
            setSelectedManagerId(null);
            setManagerSearch('');
            fetchMembers(searchDebounced || undefined);
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to set manager', message: err?.message || 'Unknown error' });
        } finally { setActionLoading(false); }
    };

    // ==================== Render ====================

    return (
        <div className="space-y-4">
            <Card className="overflow-hidden">
                <CardHeader className="pb-3 sticky top-1 z-10 bg-card border-b">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            Members {totalElements > 0 && <span className="text-muted-foreground font-normal">({totalElements})</span>}
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search members..." className="pl-9 h-8 text-sm w-52" />
                            </div>
                            {canManage && selected.size > 0 && (
                                <>
                                    {canSetManager && (
                                        <Button variant="outline" size="sm"
                                            onClick={() => { setIsSetManagerOpen(true); setManagerSearch(''); setSelectedManagerId(null); }}
                                            disabled={actionLoading}
                                            className="gap-1.5 text-xs border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50">
                                            <UserCog className="h-3.5 w-3.5" />
                                            Set Manager ({selected.size})
                                        </Button>
                                    )}
                                    <Button variant="destructive" size="sm"
                                        onClick={() => setBatchRemoveConfirm(true)}
                                        disabled={actionLoading} className="gap-1.5 text-xs">
                                        <UserMinus className="h-3.5 w-3.5" />
                                        Remove ({selected.size})
                                    </Button>
                                </>
                            )}
                            {canManage && (
                                <Button variant="outline" size="sm"
                                    onClick={() => { setIsAddDialogOpen(true); setAddSearch(''); setAddSelected(new Set()); }}
                                    className="gap-1.5 text-xs">
                                    <UserPlus className="h-3.5 w-3.5" />
                                    Add Members
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="max-h-[600px] overflow-y-auto">
                    {/* Members Table */}
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
                            <p className="text-muted-foreground text-sm">Loading members...</p>
                        </div>
                    ) : members.length === 0 ? (
                        <div className="text-center py-10">
                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                            <p className="text-muted-foreground">{search ? 'No members match your search' : 'No members in this unit'}</p>
                            {!search && canManage && (
                                <Button variant="outline" size="sm" className="mt-3 gap-1.5"
                                    onClick={() => { setIsAddDialogOpen(true); setAddSearch(''); setAddSelected(new Set()); }}>
                                    <UserPlus className="h-3.5 w-3.5" />
                                    Add First Member
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {/* Select all */}
                            {canManage && members.filter(m => m.userId !== headUserId).length > 0 && (
                                <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground">
                                    <input
                                        type="checkbox"
                                        className="h-3.5 w-3.5 rounded border-gray-300"
                                        checked={selected.size === members.filter(m => m.userId !== headUserId).length && members.filter(m => m.userId !== headUserId).length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                    <span>Select all on this page</span>
                                </div>
                            )}

                            {/* Member Rows */}
                            {members.map(member => (
                                <div key={member.userId}
                                    className={`flex items-center justify-between p-4 rounded-xl border hover:bg-muted/30 hover:shadow-sm transition-all group ${canManage ? 'cursor-pointer' : ''} ${selected.has(member.userId) ? 'bg-primary/5 border-primary/30' : ''}`}
                                    onClick={(e) => {
                                        if (!canManage) return;
                                        const target = e.target as HTMLElement;
                                        if (target.closest('a') || target.closest('button') || target.tagName === 'INPUT') return;
                                        toggleSelect(member.userId);
                                    }}
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        {canManage && (
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                                                checked={selected.has(member.userId)}
                                                onChange={() => toggleSelect(member.userId)}
                                                disabled={member.userId === headUserId}
                                            />
                                        )}
                                        <div className="relative shrink-0">
                                            <UserAvatar user={{ displayName: member.displayName, imgUrl: member.imageUrl || undefined }} size="md" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-sm truncate">
                                                    {member.displayName}
                                                </span>
                                                {member.isPrimary && (
                                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-[18px] shrink-0">
                                                        Primary
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{member.email}</p>
                                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                {member.assignedAt && (
                                                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                                                        <Users className="h-3 w-3" />Joined {new Date(member.assignedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-4">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="sm"
                                                    className="h-7 w-7 p-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => handleViewMemberDetails(member.userId)}>
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>View details</TooltipContent>
                                        </Tooltip>
                                        {canManage && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive disabled:opacity-30"
                                                            onClick={(e) => { e.stopPropagation(); setRemoveConfirm({ userId: member.userId, name: member.displayName }); }}
                                                            disabled={actionLoading || member.userId === headUserId}
                                                        >
                                                            <UserMinus className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>{member.userId === headUserId ? 'Cannot remove the unit head' : 'Remove member'}</TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
                {/* Pagination */}
                <div className="px-6">
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        totalElements={totalElements}
                        pageSize={pageSize}
                        onPageChange={p => { setPage(p); setSelected(new Set()); }}
                        onPageSizeChange={s => { setPageSize(s); setPage(0); setSelected(new Set()); }}
                        pageSizeOptions={[5, 10, 20, 50]}
                    />
                </div>
            </Card>

            {/* ==================== Add Members Dialog ==================== */}
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => { if (!open) { setIsAddDialogOpen(false); setAddSearch(''); setAddSelected(new Set()); } }}>
                <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><UserPlus className="h-4 w-4 text-primary" /> Add Members</DialogTitle>
                        <DialogDescription>Search for users to add to this organizational unit. Select multiple users.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                value={addSearch}
                                onChange={(e) => setAddSearch(e.target.value)}
                                className="pl-9"
                                autoFocus
                            />
                        </div>
                        {addSelected.size > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                                <Badge variant="secondary">{addSelected.size} selected</Badge>
                                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setAddSelected(new Set())}>Clear</Button>
                            </div>
                        )}
                        <div className="max-h-64 overflow-y-auto space-y-1">
                            {addLoading ? (
                                <div className="flex items-center justify-center py-6">
                                    <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            ) : addResults.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    {addSearch ? 'No users found' : 'Type to search users'}
                                </p>
                            ) : (
                                addResults
                                    .filter(u => !members.some(m => m.userId === u.id))
                                    .map(user => (
                                        <button key={user.id}
                                            onClick={() => toggleAddSelect(user.id)}
                                            className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-colors text-left ${addSelected.has(user.id) ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted/60'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300"
                                                checked={addSelected.has(user.id)}
                                                readOnly
                                            />
                                            <UserAvatar user={{ displayName: user.displayName, imgUrl: user.imgUrl || user.imageUrl }} size="sm" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{user.displayName || user.username}</p>
                                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                            </div>
                                        </button>
                                    ))
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); setAddSelected(new Set()); }}>Cancel</Button>
                        <Button onClick={handleBatchAdd} disabled={actionLoading || addSelected.size === 0} className="gap-1.5">
                            {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                            Add {addSelected.size > 0 ? `(${addSelected.size})` : ''}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ==================== Single Remove Confirmation ==================== */}
            <AlertDialog open={!!removeConfirm} onOpenChange={(open) => { if (!open) setRemoveConfirm(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Member</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove <strong>{removeConfirm?.name}</strong> from this unit?
                            This will also revoke their position assignments and group memberships in this unit.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveSingle} disabled={actionLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5">
                            {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ==================== Batch Remove Confirmation ==================== */}
            <AlertDialog open={batchRemoveConfirm} onOpenChange={setBatchRemoveConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove {selected.size} Member(s)</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove <strong>{selected.size} selected member(s)</strong> from this unit?
                            This will also revoke their position assignments and group memberships.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBatchRemove} disabled={actionLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5">
                            {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                            Remove All ({selected.size})
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ==================== View Member Details Dialog ==================== */}
            <Dialog open={!!viewingMember} onOpenChange={(open) => { if (!open) setViewingMember(null); }}>
                <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> Member Details</DialogTitle>
                        <DialogDescription>Detailed information about this member in the current organizational unit.</DialogDescription>
                    </DialogHeader>
                    {viewingMemberLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : viewingMember && (
                        <div className="space-y-5 py-2">
                            {/* User Info Header */}
                            <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/20">
                                <UserAvatar user={{ displayName: viewingMember.displayName, imgUrl: viewingMember.imageUrl || undefined }} size="lg" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-semibold text-base">{viewingMember.displayName}</h3>
                                        {viewingMember.isPrimary && (
                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-[18px]">Primary</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{viewingMember.email}</p>
                                    {viewingMember.jobTitle && <p className="text-xs text-muted-foreground mt-0.5">{viewingMember.jobTitle}</p>}
                                    <p className="text-xs text-muted-foreground mt-0.5">@{viewingMember.username}</p>
                                    {viewingMember.assignedAt && (
                                        <p className="text-[11px] text-muted-foreground mt-1">
                                            Joined: {new Date(viewingMember.assignedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            {viewingMember.assignedByDisplayName && ` · by ${viewingMember.assignedByDisplayName}`}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Direct Manager */}
                            <div>
                                <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2"><UserCog className="h-3.5 w-3.5 text-primary" /> Direct Manager</h4>
                                {viewingMember.managerUserId ? (
                                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                                        <UserAvatar user={{ displayName: viewingMember.managerDisplayName || '', imgUrl: viewingMember.managerImageUrl || undefined }} size="sm" />
                                        <div>
                                            <p className="text-sm font-medium">{viewingMember.managerDisplayName}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic px-3 py-2 rounded-lg border border-dashed">No direct manager assigned</p>
                                )}
                            </div>

                            {/* Position Assignments */}
                            <div>
                                <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2"><Briefcase className="h-3.5 w-3.5 text-primary" /> Position Assignments ({viewingMember.positionAssignments?.length || 0})</h4>
                                {viewingMember.positionAssignments && viewingMember.positionAssignments.length > 0 ? (
                                    <div className="space-y-2">
                                        {viewingMember.positionAssignments.map((pa: any) => (
                                            <div key={pa.id} className="p-3 rounded-lg border text-sm space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {pa.orgUnitTypeColor && (
                                                        <div className={`h-2.5 w-2.5 rounded-full ${getTypeColorClass(pa.orgUnitTypeColor).split(' ')[0]}`} />
                                                    )}
                                                    <span className="font-medium">{pa.positionTitle}</span>
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-[16px]">{pa.seatCode}</Badge>
                                                    {pa.isPrimary && <Badge className="text-[10px] px-1.5 py-0 h-[16px] bg-blue-100 text-blue-700 border-blue-200">Primary</Badge>}
                                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-[16px]">{pa.assignmentType}</Badge>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-[16px] ${getTypeColorClass(pa.orgUnitTypeColor)}`}>{pa.orgUnitName}</Badge>
                                                    {pa.ftePercentage != null && <span>FTE: {pa.ftePercentage}%</span>}
                                                    {pa.effectiveFrom && <span>From: {new Date(pa.effectiveFrom).toLocaleDateString()}</span>}
                                                    {pa.effectiveTo && <span>To: {new Date(pa.effectiveTo).toLocaleDateString()}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic px-3 py-2 rounded-lg border border-dashed">No position assignments</p>
                                )}
                            </div>

                            {/* Operational Groups */}
                            <div>
                                <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2"><UsersRound className="h-3.5 w-3.5 text-primary" /> Operational Groups ({viewingMember.groupMemberships?.length || 0})</h4>
                                {viewingMember.groupMemberships && viewingMember.groupMemberships.length > 0 ? (
                                    <div className="space-y-2">
                                        {viewingMember.groupMemberships.map((gm: any) => (
                                            <div key={gm.groupId} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {gm.groupTypeColor && (
                                                        <div className={`h-2.5 w-2.5 rounded-full ${getTypeColorClass(gm.groupTypeColor).split(' ')[0]}`} />
                                                    )}
                                                    <span className="font-medium">{gm.groupName}</span>
                                                    <span className="text-xs text-muted-foreground">{gm.groupCode}</span>
                                                    {gm.groupTypeName && <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-[16px] ${getTypeColorClass(gm.groupTypeColor)}`}>{gm.groupTypeName}</Badge>}
                                                </div>
                                                <Badge variant="secondary" className="text-[10px] shrink-0">{gm.roleInGroup}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic px-3 py-2 rounded-lg border border-dashed">Not in any operational groups in this unit</p>
                                )}
                            </div>

                            {/* Scoped Roles in this OU */}
                            {viewingMember.scopedRoles && viewingMember.scopedRoles.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2"><Crown className="h-3.5 w-3.5 text-amber-500" /> Unit Roles ({viewingMember.scopedRoles.length})</h4>
                                    <div className="space-y-2">
                                        {viewingMember.scopedRoles.map((sr: any) => (
                                            <div key={sr.id} className="p-3 rounded-lg border text-sm space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-medium">{sr.roleName}</span>
                                                    {sr.source === 'delegation' ? (
                                                        <Badge className="text-[10px] px-1.5 py-0 h-[16px] gap-0.5 bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800"><Handshake className="h-2.5 w-2.5" /> Delegated</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-[16px]">{sr.source === 'admin' ? 'Admin Assigned' : sr.source === 'system' ? 'Auto-granted' : 'Granted'}</Badge>
                                                    )}
                                                </div>
                                                {sr.roleDescription && <p className="text-xs text-muted-foreground">{sr.roleDescription}</p>}
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    {sr.grantedByDisplayName && <span>Granted by: {sr.grantedByDisplayName}</span>}
                                                    {sr.effectiveFrom && <span>Since: {new Date(sr.effectiveFrom).toLocaleDateString()}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ==================== Set Manager Dialog ==================== */}
            <Dialog open={isSetManagerOpen} onOpenChange={(open) => { if (!open) { setIsSetManagerOpen(false); setManagerSearch(''); setSelectedManagerId(null); } }}>
                <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><UserCog className="h-4 w-4 text-primary" /> Set Direct Manager</DialogTitle>
                        <DialogDescription>Search for a user to assign as the direct manager for {selected.size} selected member(s).</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                value={managerSearch}
                                onChange={(e) => setManagerSearch(e.target.value)}
                                className="pl-9"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                            {managerSearch.length < 2 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">Type at least 2 characters to search</p>
                            ) : managerResults.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
                            ) : (
                                managerResults.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => setSelectedManagerId(selectedManagerId === user.id ? null : user.id)}
                                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-colors text-left ${selectedManagerId === user.id ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted/60'}`}
                                    >
                                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedManagerId === user.id ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                                            {selectedManagerId === user.id && <Check className="h-3 w-3 text-white" />}
                                        </div>
                                        <UserAvatar user={{ displayName: user.displayName, imgUrl: user.imageUrl || undefined }} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{user.displayName}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsSetManagerOpen(false); setSelectedManagerId(null); }}>Cancel</Button>
                        <Button onClick={handleBatchSetManager} disabled={actionLoading || !selectedManagerId} className="gap-1.5">
                            {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                            Assign Manager
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
