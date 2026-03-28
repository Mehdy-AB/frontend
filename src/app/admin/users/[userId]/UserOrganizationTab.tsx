'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Star,
    Crown,
    ChevronDown,
    ChevronRight,
    Trash2,
    Plus,
    Building2,
    Users,
    Briefcase,
    Loader2,
    Search,
    Network,
    Shield,
    Calendar,
    UserCheck,
    AlertTriangle,
    X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
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
import {
    orgUnitService,
    UserOrgUnitResponse,
    MemberDetailResponse,
    PositionAssignmentResponse,
    GroupMembershipInfo,
    OrgUnitResponse,
    OrgUnitGroupResponse,
    OrgPositionResponse,
    getTypeColorClass,
} from '@/api/services/orgUnitService';
import { formatDate, formatDateOnly } from '@/lib/dateFormatter';

// ==================== Props ====================

interface UserOrganizationTabProps {
    userId: string;
    canRead: boolean;
    canAssignUser: boolean;
    canManageGroups: boolean;
    canAssignPosition: boolean;
    addNotification: (n: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
}

// ==================== Component ====================

export default function UserOrganizationTab({
    userId,
    canRead,
    canAssignUser,
    canManageGroups,
    canAssignPosition,
    addNotification,
}: UserOrganizationTabProps) {
    // ── State ──────────────────────────────────────────────
    const [loading, setLoading] = useState(true);
    const [orgUnits, setOrgUnits] = useState<UserOrgUnitResponse[]>([]);
    const [expandedOuId, setExpandedOuId] = useState<string | null>(null);
    const [memberDetails, setMemberDetails] = useState<Record<string, MemberDetailResponse>>({});
    const [detailLoading, setDetailLoading] = useState<string | null>(null);

    // Dialogs
    const [addOuDialog, setAddOuDialog] = useState(false);
    const [addGroupDialog, setAddGroupDialog] = useState<string | null>(null); // ouId
    const [assignPositionDialog, setAssignPositionDialog] = useState<string | null>(null); // ouId
    const [removeOuConfirm, setRemoveOuConfirm] = useState<UserOrgUnitResponse | null>(null);
    const [removeGroupConfirm, setRemoveGroupConfirm] = useState<{ ouId: string; groupId: string; groupName: string } | null>(null);
    const [revokePositionConfirm, setRevokePositionConfirm] = useState<{ ouId: string; positionId: string; assignmentId: string; seatCode: string } | null>(null);
    const [changePrimaryConfirm, setChangePrimaryConfirm] = useState<{ ou: UserOrgUnitResponse; currentPrimary: UserOrgUnitResponse | null } | null>(null);

    // Search states for dialogs
    const [ouSearchQuery, setOuSearchQuery] = useState('');
    const [ouSearchResults, setOuSearchResults] = useState<OrgUnitResponse[]>([]);
    const [ouSearchLoading, setOuSearchLoading] = useState(false);

    // Group dialog — server-side paginated
    const [groupSearchQuery, setGroupSearchQuery] = useState('');
    const [groupSearchResults, setGroupSearchResults] = useState<OrgUnitGroupResponse[]>([]);
    const [groupSearchLoading, setGroupSearchLoading] = useState(false);
    const [groupPage, setGroupPage] = useState(0);
    const [groupHasMore, setGroupHasMore] = useState(false);
    const [groupTotalElements, setGroupTotalElements] = useState(0);

    // Position dialog — server-side paginated
    const [positionSearchQuery, setPositionSearchQuery] = useState('');
    const [positionSearchResults, setPositionSearchResults] = useState<OrgPositionResponse[]>([]);
    const [positionSearchLoading, setPositionSearchLoading] = useState(false);
    const [positionPage, setPositionPage] = useState(0);
    const [positionHasMore, setPositionHasMore] = useState(false);
    const [positionTotalElements, setPositionTotalElements] = useState(0);

    const [actionLoading, setActionLoading] = useState(false);

    // ── Data Fetching ─────────────────────────────────────
    const fetchOrgUnits = useCallback(async () => {
        if (!canRead) return;
        setLoading(true);
        try {
            const data = await orgUnitService.getUserOrgUnits(userId);
            setOrgUnits(data);
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Error', message: err.message || 'Failed to load org units' });
        } finally {
            setLoading(false);
        }
    }, [userId, canRead, addNotification]);

    useEffect(() => { fetchOrgUnits(); }, [fetchOrgUnits]);

    const fetchMemberDetails = useCallback(async (ouId: string) => {
        if (memberDetails[ouId]) return;
        setDetailLoading(ouId);
        try {
            const detail = await orgUnitService.getMemberDetails(ouId, userId);
            setMemberDetails(prev => ({ ...prev, [ouId]: detail }));
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Error', message: err.message || 'Failed to load member details' });
        } finally {
            setDetailLoading(null);
        }
    }, [userId, memberDetails, addNotification]);

    const toggleExpand = (ouId: string) => {
        if (expandedOuId === ouId) {
            setExpandedOuId(null);
        } else {
            setExpandedOuId(ouId);
            fetchMemberDetails(ouId);
        }
    };

    // ── Computed ───────────────────────────────────────────
    const primaryOu = orgUnits.find(ou => ou.isPrimary);
    const totalPositions = Object.values(memberDetails).reduce((sum, d) => sum + (d.positionAssignments?.length || 0), 0);
    const totalGroups = Object.values(memberDetails).reduce((sum, d) => sum + (d.groupMemberships?.length || 0), 0);

    // ── Actions ───────────────────────────────────────────

    // Change primary OU
    const handleChangePrimary = async () => {
        if (!changePrimaryConfirm) return;
        setActionLoading(true);
        try {
            const { ou, currentPrimary } = changePrimaryConfirm;
            if (ou.isPrimary) {
                // Removing primary
                const res = await orgUnitService.removePrimaryBatch(ou.orgUnitId, [userId]);
                if (res.failCount > 0) throw new Error(res.errors?.[0] || 'Failed to remove primary');
                addNotification({ type: 'success', title: 'Primary Removed', message: `Removed primary status from ${ou.orgUnitName}` });
            } else {
                // Setting new primary — backend auto-unsets the old one
                const res = await orgUnitService.setPrimaryBatch(ou.orgUnitId, [userId]);
                if (res.failCount > 0) throw new Error(res.errors?.[0] || 'Failed to set primary');
                const swapMsg = currentPrimary ? ` (auto-switched from ${currentPrimary.orgUnitName})` : '';
                addNotification({ type: 'success', title: 'Primary Set', message: `${ou.orgUnitName} is now the primary org unit${swapMsg}` });
            }
            setChangePrimaryConfirm(null);
            setMemberDetails({});
            await fetchOrgUnits();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Error', message: err.message || 'Failed to change primary' });
        } finally {
            setActionLoading(false);
        }
    };

    // Remove from OU
    const handleRemoveFromOu = async () => {
        if (!removeOuConfirm) return;
        setActionLoading(true);
        try {
            await orgUnitService.removeUser(removeOuConfirm.orgUnitId, userId);
            addNotification({ type: 'success', title: 'Removed', message: `Removed from ${removeOuConfirm.orgUnitName}` });
            setRemoveOuConfirm(null);
            if (expandedOuId === removeOuConfirm.orgUnitId) setExpandedOuId(null);
            await fetchOrgUnits();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Error', message: err.message || 'Failed to remove from OU' });
        } finally {
            setActionLoading(false);
        }
    };

    // Add to OU
    const handleAddToOu = async (ouId: string) => {
        setActionLoading(true);
        try {
            await orgUnitService.assignUser(ouId, { userId });
            addNotification({ type: 'success', title: 'Assigned', message: 'User added to org unit successfully' });
            setAddOuDialog(false);
            setOuSearchQuery('');
            setOuSearchResults([]);
            await fetchOrgUnits();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Error', message: err.message || 'Failed to add to OU' });
        } finally {
            setActionLoading(false);
        }
    };

    // Add to Group
    const handleAddToGroup = async (ouId: string, groupId: string) => {
        setActionLoading(true);
        try {
            await orgUnitService.addGroupMember(ouId, groupId, userId, 'MEMBER');
            addNotification({ type: 'success', title: 'Added to Group', message: 'User added to group successfully' });
            setAddGroupDialog(null);
            // Refresh details for this OU
            setMemberDetails(prev => { const next = { ...prev }; delete next[ouId]; return next; });
            fetchMemberDetails(ouId);
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Error', message: err.message || 'Failed to add to group' });
        } finally {
            setActionLoading(false);
        }
    };

    // Remove from Group
    const handleRemoveFromGroup = async () => {
        if (!removeGroupConfirm) return;
        setActionLoading(true);
        try {
            await orgUnitService.removeGroupMember(removeGroupConfirm.ouId, removeGroupConfirm.groupId, userId);
            addNotification({ type: 'success', title: 'Removed', message: `Removed from group "${removeGroupConfirm.groupName}"` });
            setRemoveGroupConfirm(null);
            // Refresh
            const ouId = removeGroupConfirm.ouId;
            setMemberDetails(prev => { const next = { ...prev }; delete next[ouId]; return next; });
            fetchMemberDetails(ouId);
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Error', message: err.message || 'Failed to remove from group' });
        } finally {
            setActionLoading(false);
        }
    };

    // Assign to Position
    const handleAssignToPosition = async (ouId: string, positionId: string) => {
        setActionLoading(true);
        try {
            await orgUnitService.assignUsersToPosition(ouId, positionId, [userId], {});
            addNotification({ type: 'success', title: 'Assigned', message: 'Position assigned successfully' });
            setAssignPositionDialog(null);
            // Refresh details
            setMemberDetails(prev => { const next = { ...prev }; delete next[ouId]; return next; });
            fetchMemberDetails(ouId);
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Error', message: err.message || 'Failed to assign position' });
        } finally {
            setActionLoading(false);
        }
    };

    // Revoke Position
    const handleRevokePosition = async () => {
        if (!revokePositionConfirm) return;
        setActionLoading(true);
        try {
            await orgUnitService.unassignFromPositionBatch(
                revokePositionConfirm.ouId,
                revokePositionConfirm.positionId,
                [revokePositionConfirm.assignmentId]
            );
            addNotification({ type: 'success', title: 'Revoked', message: `Position assignment revoked` });
            setRevokePositionConfirm(null);
            // Refresh
            const ouId = revokePositionConfirm.ouId;
            setMemberDetails(prev => { const next = { ...prev }; delete next[ouId]; return next; });
            fetchMemberDetails(ouId);
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Error', message: err.message || 'Failed to revoke assignment' });
        } finally {
            setActionLoading(false);
        }
    };

    // ── Search Helpers ────────────────────────────────────

    const searchOrgUnits = async (query: string) => {
        setOuSearchQuery(query);
        if (query.length < 2) { setOuSearchResults([]); return; }
        setOuSearchLoading(true);
        try {
            const results = await orgUnitService.search(query);
            // Filter out OUs user is already a member of
            const existingIds = new Set(orgUnits.map(o => o.orgUnitId));
            setOuSearchResults(results.filter(r => !existingIds.has(r.id)));
        } catch {
            setOuSearchResults([]);
        } finally {
            setOuSearchLoading(false);
        }
    };

    const searchGroups = async (ouId: string, query: string = '', page: number = 0, append: boolean = false) => {
        setGroupSearchLoading(true);
        try {
            const res = await orgUnitService.getGroups(ouId, {
                query: query || undefined,
                isActive: true,
                page,
                size: 10,
            });
            // Filter out groups user is already in
            const detail = memberDetails[ouId];
            const existingGroupIds = new Set(detail?.groupMemberships?.map(g => g.groupId) || []);
            const filtered = (res?.content || []).filter((g: OrgUnitGroupResponse) => !existingGroupIds.has(g.id));

            if (append) {
                setGroupSearchResults(prev => [...prev, ...filtered]);
            } else {
                setGroupSearchResults(filtered);
            }
            setGroupPage(page);
            setGroupTotalElements(res?.totalElements || 0);
            setGroupHasMore((page + 1) < (res?.totalPages || 0));
        } catch {
            if (!append) setGroupSearchResults([]);
            setGroupHasMore(false);
        } finally {
            setGroupSearchLoading(false);
        }
    };

    const searchPositions = async (ouId: string, query: string = '', page: number = 0, append: boolean = false) => {
        setPositionSearchLoading(true);
        try {
            const res = await orgUnitService.getPositions(ouId, {
                search: query || undefined,
                isActive: true,
                page,
                size: 10,
            });
            // Exclude seats this user is already assigned to
            const detail = memberDetails[ouId];
            const assignedPositionIds = new Set(
                detail?.positionAssignments
                    ?.filter(pa => pa.status === 'ACTIVE')
                    ?.map(pa => pa.orgPositionId) || []
            );
            const filtered = (res?.content || []).filter((p: OrgPositionResponse) => !assignedPositionIds.has(p.id));

            if (append) {
                setPositionSearchResults(prev => [...prev, ...filtered]);
            } else {
                setPositionSearchResults(filtered);
            }
            setPositionPage(page);
            setPositionTotalElements(res?.totalElements || 0);
            setPositionHasMore((page + 1) < (res?.totalPages || 0));
        } catch {
            if (!append) setPositionSearchResults([]);
            setPositionHasMore(false);
        } finally {
            setPositionSearchLoading(false);
        }
    };

    // ── Render ─────────────────────────────────────────────

    if (!canRead) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Shield className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-sm">You don't have permission to view organization data</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ─── Summary Stats Bar ─── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{orgUnits.length}</p>
                                <p className="text-xs text-muted-foreground">Org Units</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
                                <Star className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold truncate max-w-[120px]">{primaryOu?.orgUnitName || 'None'}</p>
                                <p className="text-xs text-muted-foreground">Primary Unit</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                                <Briefcase className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalPositions}</p>
                                <p className="text-xs text-muted-foreground">Positions</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-violet-500/10 to-violet-600/5 border-violet-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-violet-500/15 flex items-center justify-center">
                                <Users className="h-5 w-5 text-violet-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalGroups}</p>
                                <p className="text-xs text-muted-foreground">Groups</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ─── Header + Add OU Button ─── */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Organizational Units</h3>
                {canAssignUser && (
                    <Button size="sm" variant="outline" onClick={() => setAddOuDialog(true)}>
                        <Plus className="h-4 w-4 mr-1" /> Add to Org Unit
                    </Button>
                )}
            </div>

            {/* ─── OU Cards ─── */}
            {orgUnits.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Network className="h-12 w-12 mb-4 opacity-30" />
                        <p className="text-sm font-medium">Not a member of any org unit</p>
                        <p className="text-xs mt-1">Use "Add to Org Unit" to assign this user to an organizational unit.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {orgUnits.map(ou => {
                        const isExpanded = expandedOuId === ou.orgUnitId;
                        const detail = memberDetails[ou.orgUnitId];
                        const isDetailLoading = detailLoading === ou.orgUnitId;
                        const typeColorClass = getTypeColorClass(ou.orgUnitTypeColor);
                        const isHead = ou.headUserId === userId;

                        return (
                            <Card key={ou.membershipId} className={`transition-all duration-200 ${isExpanded ? 'ring-1 ring-primary/30 shadow-md' : 'hover:shadow-sm'}`}>
                                {/* Card Header / Summary Row */}
                                <div
                                    className="flex items-center gap-3 p-4 cursor-pointer select-none"
                                    onClick={() => toggleExpand(ou.orgUnitId)}
                                >
                                    {/* Expand icon */}
                                    <div className="text-muted-foreground">
                                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </div>

                                    {/* Type color dot */}
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${typeColorClass}`}>
                                        <Building2 className="h-4 w-4" />
                                    </div>

                                    {/* Name & Meta */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm truncate">{ou.orgUnitName}</span>
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-[16px] shrink-0">{ou.orgUnitCode}</Badge>
                                            {ou.orgUnitTypeName && (
                                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-[16px] shrink-0 ${typeColorClass}`}>
                                                    {ou.orgUnitTypeName}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-xs text-muted-foreground">Level {ou.level}</span>
                                            {ou.headUserDisplayName && (
                                                <span className="text-xs text-muted-foreground">Head: {ou.headUserDisplayName}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right-side badges & actions */}
                                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                                        {/* Head crown */}
                                        {isHead && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="h-7 w-7 rounded-full bg-amber-500/15 flex items-center justify-center">
                                                        <Crown className="h-3.5 w-3.5 text-amber-500" />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>Head of this unit</TooltipContent>
                                            </Tooltip>
                                        )}

                                        {/* Primary star */}
                                        {canAssignUser ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors ${ou.isPrimary ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' : 'text-muted-foreground/40 hover:text-amber-500 hover:bg-amber-500/10'}`}
                                                        onClick={() => setChangePrimaryConfirm({ ou, currentPrimary: primaryOu || null })}
                                                    >
                                                        <Star className={`h-3.5 w-3.5 ${ou.isPrimary ? 'fill-amber-500' : ''}`} />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent>{ou.isPrimary ? 'Remove primary status' : 'Set as primary'}</TooltipContent>
                                            </Tooltip>
                                        ) : (
                                            ou.isPrimary && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="h-7 w-7 rounded-full bg-amber-500/20 flex items-center justify-center">
                                                            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Primary org unit</TooltipContent>
                                                </Tooltip>
                                            )
                                        )}

                                        {/* Remove */}
                                        {canAssignUser && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                        onClick={() => setRemoveOuConfirm(ou)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent>Remove from this unit</TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                </div>

                                {/* ─── Expanded Detail Panel ─── */}
                                {isExpanded && (
                                    <div className="border-t px-4 pb-4 pt-3 space-y-4 bg-muted/30">
                                        {isDetailLoading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                            </div>
                                        ) : detail ? (
                                            <>
                                                {/* Membership Info */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                                                        <div className="flex items-center gap-1.5">
                                                            {ou.isPrimary ? (
                                                                <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 text-xs">⭐ Primary</Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-xs">Member</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-0.5">Assigned</p>
                                                        <p className="text-xs font-medium">{formatDateOnly(detail.assignedAt)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-0.5">Assigned By</p>
                                                        <p className="text-xs font-medium">{detail.assignedByDisplayName || '—'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-0.5">Head of Unit</p>
                                                        <p className="text-xs font-medium flex items-center gap-1">
                                                            {isHead ? (
                                                                <><Crown className="h-3 w-3 text-amber-500" /> Yes</>
                                                            ) : 'No'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Position Assignments */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="text-sm font-semibold flex items-center gap-1.5">
                                                            <Briefcase className="h-3.5 w-3.5 text-emerald-500" />
                                                            Position Assignments ({detail.positionAssignments?.length || 0})
                                                        </h4>
                                                        {canAssignPosition && (
                                                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setAssignPositionDialog(ou.orgUnitId); setPositionSearchQuery(''); searchPositions(ou.orgUnitId, '', 0, false); }}>
                                                                <Plus className="h-3 w-3 mr-1" /> Assign
                                                            </Button>
                                                        )}
                                                    </div>
                                                    {(!detail.positionAssignments || detail.positionAssignments.length === 0) ? (
                                                        <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-4 text-center">No position assignments in this unit</div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {detail.positionAssignments.filter(pa => pa.status === 'ACTIVE').map(pa => (
                                                                <div key={pa.id} className="flex items-center justify-between p-3 rounded-lg bg-background border">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div className={`h-6 w-6 rounded flex items-center justify-center shrink-0 ${getTypeColorClass(pa.orgUnitTypeColor)}`}>
                                                                            <Briefcase className="h-3 w-3" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-xs font-semibold">{pa.positionTitle || pa.seatCode}</span>
                                                                                <Badge variant="outline" className="text-[9px] px-1 py-0 h-[14px]">{pa.seatCode}</Badge>
                                                                                {pa.isPrimary && <Badge className="bg-amber-500/15 text-amber-600 text-[9px] px-1 py-0 h-[14px]">Primary</Badge>}
                                                                            </div>
                                                                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                                                                                <span>{pa.assignmentType}</span>
                                                                                {pa.ftePercentage != null && <span>• {pa.ftePercentage}% FTE</span>}
                                                                                <span>• From {formatDateOnly(pa.effectiveFrom)}</span>
                                                                                {pa.effectiveTo && <span>to {formatDateOnly(pa.effectiveTo)}</span>}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    {canAssignPosition && (
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <button
                                                                                    className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                                                                                    onClick={() => setRevokePositionConfirm({ ouId: ou.orgUnitId, positionId: pa.orgPositionId, assignmentId: pa.id, seatCode: pa.seatCode })}
                                                                                >
                                                                                    <X className="h-3 w-3" />
                                                                                </button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>Revoke assignment</TooltipContent>
                                                                        </Tooltip>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Group Memberships */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="text-sm font-semibold flex items-center gap-1.5">
                                                            <Users className="h-3.5 w-3.5 text-violet-500" />
                                                            Group Memberships ({detail.groupMemberships?.length || 0})
                                                        </h4>
                                                        {canManageGroups && (
                                                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setAddGroupDialog(ou.orgUnitId); setGroupSearchQuery(''); searchGroups(ou.orgUnitId, '', 0, false); }}>
                                                                <Plus className="h-3 w-3 mr-1" /> Add to Group
                                                            </Button>
                                                        )}
                                                    </div>
                                                    {(!detail.groupMemberships || detail.groupMemberships.length === 0) ? (
                                                        <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-4 text-center">Not a member of any group in this unit</div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {detail.groupMemberships.map(gm => {
                                                                const gmTypeColor = getTypeColorClass(gm.groupTypeColor);
                                                                return (
                                                                    <div key={gm.groupId} className="flex items-center justify-between p-3 rounded-lg bg-background border">
                                                                        <div className="flex items-center gap-3 min-w-0">
                                                                            <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${gmTypeColor.split(' ')[0]}`} />
                                                                            <div className="min-w-0">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-xs font-semibold">{gm.groupName}</span>
                                                                                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-[14px]">{gm.groupCode}</Badge>
                                                                                    {gm.groupTypeName && (
                                                                                        <Badge variant="outline" className={`text-[9px] px-1 py-0 h-[14px] ${gmTypeColor}`}>{gm.groupTypeName}</Badge>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                                    {gm.roleInGroup === 'LEADER' ? (
                                                                                        <Badge className="bg-amber-500/15 text-amber-600 text-[9px] px-1 py-0 h-[14px]">
                                                                                            <Crown className="h-2.5 w-2.5 mr-0.5" /> Leader
                                                                                        </Badge>
                                                                                    ) : (
                                                                                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-[14px]">Member</Badge>
                                                                                    )}
                                                                                    <span className="text-[10px] text-muted-foreground">Joined {formatDateOnly(gm.joinedAt)}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        {canManageGroups && (
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <button
                                                                                        className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                                                                                        onClick={() => setRemoveGroupConfirm({ ouId: ou.orgUnitId, groupId: gm.groupId, groupName: gm.groupName })}
                                                                                    >
                                                                                        <X className="h-3 w-3" />
                                                                                    </button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>Remove from group</TooltipContent>
                                                                            </Tooltip>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        ) : null}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* ═══════════ DIALOGS ═══════════ */}

            {/* Add to OU Dialog */}
            <Dialog open={addOuDialog} onOpenChange={v => { if (!v) { setAddOuDialog(false); setOuSearchQuery(''); setOuSearchResults([]); } }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add to Org Unit</DialogTitle>
                        <DialogDescription>Search for an org unit to assign this user to.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search org units..."
                                value={ouSearchQuery}
                                onChange={e => searchOrgUnits(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto space-y-2">
                            {ouSearchLoading ? (
                                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                            ) : ouSearchResults.length === 0 ? (
                                <div className="text-center py-8 text-sm text-muted-foreground">
                                    {ouSearchQuery.length >= 2 ? 'No matching org units found' : 'Type at least 2 characters to search'}
                                </div>
                            ) : (
                                ouSearchResults.map(r => (
                                    <button
                                        key={r.id}
                                        className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors text-left"
                                        onClick={() => handleAddToOu(r.id)}
                                        disabled={actionLoading}
                                    >
                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${getTypeColorClass(r.typeColor)}`}>
                                            <Building2 className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <span className="text-sm font-medium">{r.name}</span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Badge variant="outline" className="text-[9px] px-1 py-0 h-[14px]">{r.code}</Badge>
                                                {r.typeName && <span className="text-[10px] text-muted-foreground">{r.typeName}</span>}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add to Group Dialog — Server-side search + pagination */}
            <Dialog open={!!addGroupDialog} onOpenChange={v => { if (!v) { setAddGroupDialog(null); setGroupSearchQuery(''); setGroupSearchResults([]); setGroupPage(0); } }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add to Group</DialogTitle>
                        <DialogDescription>Search and select a group in this org unit.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search groups..."
                                value={groupSearchQuery}
                                onChange={e => {
                                    const q = e.target.value;
                                    setGroupSearchQuery(q);
                                    if (addGroupDialog) searchGroups(addGroupDialog, q, 0, false);
                                }}
                                className="pl-9"
                            />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto space-y-2">
                            {groupSearchLoading && groupSearchResults.length === 0 ? (
                                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                            ) : groupSearchResults.length === 0 ? (
                                <div className="text-center py-8 text-sm text-muted-foreground">
                                    {groupSearchQuery ? 'No groups match your search' : 'No available groups in this unit'}
                                </div>
                            ) : (
                                <>
                                    {groupSearchResults.map(g => (
                                        <button
                                            key={g.id}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors text-left"
                                            onClick={() => addGroupDialog && handleAddToGroup(addGroupDialog, g.id)}
                                            disabled={actionLoading}
                                        >
                                            <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${getTypeColorClass(g.groupTypeColor).split(' ')[0]}`} />
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm font-medium">{g.name}</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-[14px]">{g.code}</Badge>
                                                    {g.groupTypeName && (
                                                        <Badge variant="outline" className={`text-[9px] px-1 py-0 h-[14px] ${getTypeColorClass(g.groupTypeColor)}`}>{g.groupTypeName}</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                    {groupHasMore && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full text-xs text-muted-foreground"
                                            disabled={groupSearchLoading}
                                            onClick={() => addGroupDialog && searchGroups(addGroupDialog, groupSearchQuery, groupPage + 1, true)}
                                        >
                                            {groupSearchLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                            Load More ({groupSearchResults.length} of {groupTotalElements})
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Assign to Position Dialog — Server-side search + pagination */}
            <Dialog open={!!assignPositionDialog} onOpenChange={v => { if (!v) { setAssignPositionDialog(null); setPositionSearchQuery(''); setPositionSearchResults([]); setPositionPage(0); } }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Assign to Position</DialogTitle>
                        <DialogDescription>Search for a seat to assign this user to.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search positions..."
                                value={positionSearchQuery}
                                onChange={e => {
                                    const q = e.target.value;
                                    setPositionSearchQuery(q);
                                    if (assignPositionDialog) searchPositions(assignPositionDialog, q, 0, false);
                                }}
                                className="pl-9"
                            />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto space-y-2">
                            {positionSearchLoading && positionSearchResults.length === 0 ? (
                                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                            ) : positionSearchResults.length === 0 ? (
                                <div className="text-center py-8 text-sm text-muted-foreground">
                                    {positionSearchQuery ? 'No positions match your search' : 'No positions available in this unit'}
                                </div>
                            ) : (
                                <>
                                    {positionSearchResults.map(p => {
                                        const isFull = p.currentHeadcount >= p.maxHeadcount;
                                        return (
                                            <button
                                                key={p.id}
                                                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${isFull ? 'opacity-50 cursor-not-allowed bg-muted/30' : 'hover:bg-accent'}`}
                                                onClick={() => !isFull && assignPositionDialog && handleAssignToPosition(assignPositionDialog, p.id)}
                                                disabled={actionLoading || isFull}
                                            >
                                                <div className="h-8 w-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                                                    <Briefcase className="h-4 w-4 text-emerald-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-sm font-medium">{p.positionTitle || p.seatCode}</span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-[14px]">{p.seatCode}</Badge>
                                                        <span className={`text-[10px] ${isFull ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                                                            {p.currentHeadcount}/{p.maxHeadcount} filled{isFull ? ' (Full)' : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                    {positionHasMore && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full text-xs text-muted-foreground"
                                            disabled={positionSearchLoading}
                                            onClick={() => assignPositionDialog && searchPositions(assignPositionDialog, positionSearchQuery, positionPage + 1, true)}
                                        >
                                            {positionSearchLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                            Load More ({positionSearchResults.length} of {positionTotalElements})
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Confirmation: Change Primary ── */}
            <AlertDialog open={!!changePrimaryConfirm} onOpenChange={v => { if (!v) setChangePrimaryConfirm(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {changePrimaryConfirm?.ou.isPrimary ? 'Remove Primary Status' : 'Set as Primary'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {changePrimaryConfirm?.ou.isPrimary
                                ? `Remove primary status from "${changePrimaryConfirm?.ou.orgUnitName}"? The user will have no primary org unit.`
                                : changePrimaryConfirm?.currentPrimary
                                    ? `Set "${changePrimaryConfirm?.ou.orgUnitName}" as primary? This will automatically remove primary status from "${changePrimaryConfirm?.currentPrimary.orgUnitName}".`
                                    : `Set "${changePrimaryConfirm?.ou.orgUnitName}" as the primary org unit?`
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleChangePrimary} disabled={actionLoading}>
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Confirmation: Remove from OU ── */}
            <AlertDialog open={!!removeOuConfirm} onOpenChange={v => { if (!v) setRemoveOuConfirm(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove from Org Unit</AlertDialogTitle>
                        <AlertDialogDescription>
                            Remove this user from "{removeOuConfirm?.orgUnitName}"? This will also remove their positions and group memberships in this unit.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveFromOu} className="bg-red-600 hover:bg-red-700" disabled={actionLoading}>
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Confirmation: Remove from Group ── */}
            <AlertDialog open={!!removeGroupConfirm} onOpenChange={v => { if (!v) setRemoveGroupConfirm(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove from Group</AlertDialogTitle>
                        <AlertDialogDescription>
                            Remove this user from group "{removeGroupConfirm?.groupName}"?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveFromGroup} className="bg-red-600 hover:bg-red-700" disabled={actionLoading}>
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Confirmation: Revoke Position ── */}
            <AlertDialog open={!!revokePositionConfirm} onOpenChange={v => { if (!v) setRevokePositionConfirm(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Revoke Position Assignment</AlertDialogTitle>
                        <AlertDialogDescription>
                            Revoke the assignment to seat "{revokePositionConfirm?.seatCode}"?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRevokePosition} className="bg-red-600 hover:bg-red-700" disabled={actionLoading}>
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                            Revoke
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
