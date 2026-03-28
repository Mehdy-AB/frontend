'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Briefcase, Search, ChevronRight, ChevronDown, Users, RefreshCw,
    Check, UserPlus, UserMinus, Calendar, Settings, Pencil,
    Plus, Edit, Trash2, X, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import UserAvatar from '@/components/main/UserAvatar';
import Pagination from '@/components/main/Pagination';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { myScopeService } from '@/api/services/myScopeService';
import { apiClient } from '@/api/client';
import type { OrgPositionResponse, PositionAssignmentResponse } from '@/api/services/orgUnitService';

// ==================== Props ====================

interface PositionsTabProps {
    ouId: string;
    canManage: boolean;
    addNotification: (n: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
    refreshTrigger?: number;
}

// ==================== Component ====================

export default function PositionsTab({ ouId, canManage, addNotification, refreshTrigger = 0 }: PositionsTabProps) {
    // Positions data
    const [positions, setPositions] = useState<OrgPositionResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Search/filter state
    const [search, setSearch] = useState('');
    const [searchDebounced, setSearchDebounced] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [budgetFilter, setBudgetFilter] = useState<string>('all');

    // Pagination
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Expanded position with assignment dialog
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [positionAssignments, setPositionAssignments] = useState<Record<string, PositionAssignmentResponse[]>>({});

    // Assignment search/filter/pagination
    const [assignmentSearch, setAssignmentSearch] = useState('');
    const [assignmentSearchDebounced, setAssignmentSearchDebounced] = useState('');
    const [assignmentTypeFilter, setAssignmentTypeFilter] = useState('');
    const [isPrimaryFilter, setIsPrimaryFilter] = useState('');
    const [assignmentPage, setAssignmentPage] = useState(0);
    const [assignmentPageSize, setAssignmentPageSize] = useState(5);
    const [assignmentTotalPages, setAssignmentTotalPages] = useState(0);
    const [assignmentTotalElements, setAssignmentTotalElements] = useState(0);
    const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>([]);

    // Assign users to seat dialog
    const [assignToSeatId, setAssignToSeatId] = useState<string | null>(null);
    const [assignSeatSearch, setAssignSeatSearch] = useState('');
    const [assignSeatSearchResults, setAssignSeatSearchResults] = useState<any[]>([]);
    const [assignSeatSelectedIds, setAssignSeatSelectedIds] = useState<string[]>([]);
    const [assignSeatPage, setAssignSeatPage] = useState(0);

    // Assign config form
    const [assignConfigForm, setAssignConfigForm] = useState<{
        isPrimary: boolean; effectiveFrom: string; effectiveTo: string;
        assignmentType: string; ftePercentage: number;
    }>({ isPrimary: false, effectiveFrom: new Date().toISOString().split('T')[0], effectiveTo: '', assignmentType: 'PERMANENT', ftePercentage: 100 });

    // Edit assignment dialog
    const [editingAssignment, setEditingAssignment] = useState<PositionAssignmentResponse | null>(null);
    const [editAssignmentForm, setEditAssignmentForm] = useState<{
        isPrimary: boolean; effectiveFrom: string; effectiveTo: string;
        assignmentType: string; ftePercentage: number;
    }>({ isPrimary: false, effectiveFrom: '', effectiveTo: '', assignmentType: 'PERMANENT', ftePercentage: 100 });

    // Batch select positions
    const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);

    // Create seat dialog
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [positionForm, setPositionForm] = useState<{ positionDefinitionId: string; seatCode: string; maxHeadcount?: number; isBudgetApproved?: boolean; reportingToPositionId?: string }>({ positionDefinitionId: '', seatCode: '' });
    const [posDefSearch, setPosDefSearch] = useState('');
    const [posDefSearchDebounced, setPosDefSearchDebounced] = useState('');
    const [posDefResults, setPosDefResults] = useState<any[]>([]);
    const [posDefDropdownOpen, setPosDefDropdownOpen] = useState(false);
    const [posDefSelectedName, setPosDefSelectedName] = useState('');
    const posDefDropdownRef = useRef<HTMLDivElement>(null);

    // Edit seat dialog
    const [editingPositionId, setEditingPositionId] = useState<string | null>(null);
    const [editPositionForm, setEditPositionForm] = useState<any>({});
    const [posDefEditSearch, setPosDefEditSearch] = useState('');
    const [posDefEditSearchDebounced, setPosDefEditSearchDebounced] = useState('');
    const [posDefEditResults, setPosDefEditResults] = useState<any[]>([]);
    const [posDefEditDropdownOpen, setPosDefEditDropdownOpen] = useState(false);
    const [posDefEditSelectedName, setPosDefEditSelectedName] = useState('');
    const posDefEditDropdownRef = useRef<HTMLDivElement>(null);

    // Duplicate confirmation
    const [duplicateInfo, setDuplicateInfo] = useState<any>(null);

    // ==================== Fetchers ====================

    const fetchPositions = useCallback(async () => {
        try {
            setLoading(true);
            const data: any = await myScopeService.getMyPositions(ouId, {
                search: searchDebounced || undefined,
                isActive: statusFilter === 'all' ? undefined : statusFilter === 'true',
                isBudgetApproved: budgetFilter === 'all' ? undefined : budgetFilter === 'true',
                page,
                size: pageSize,
            });
            setPositions(data?.content || (Array.isArray(data) ? data : []));
            setTotalPages(data?.totalPages || 0);
            setTotalElements(data?.totalElements || 0);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, [ouId, searchDebounced, statusFilter, budgetFilter, page, pageSize]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => { setSearchDebounced(search); setPage(0); }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => { fetchPositions(); }, [fetchPositions, refreshTrigger]);

    // Debounce pos def search (create)
    useEffect(() => {
        const t = setTimeout(() => setPosDefSearchDebounced(posDefSearch), 300);
        return () => clearTimeout(t);
    }, [posDefSearch]);

    useEffect(() => {
        if (!posDefDropdownOpen) return;
        const fetchDefs = async () => {
            try {
                const qp = new URLSearchParams({ isActive: 'true', size: '15', sort: 'sortOrder', direction: 'asc' });
                if (posDefSearchDebounced.trim()) qp.set('search', posDefSearchDebounced.trim());
                const res = await apiClient.get<any>(`/api/v1/admin/positions/definitions?${qp.toString()}`);
                setPosDefResults(Array.isArray(res) ? res : (res.content || []));
            } catch { setPosDefResults([]); }
        };
        fetchDefs();
    }, [posDefSearchDebounced, posDefDropdownOpen]);

    // Debounce pos def search (edit)
    useEffect(() => {
        const t = setTimeout(() => setPosDefEditSearchDebounced(posDefEditSearch), 300);
        return () => clearTimeout(t);
    }, [posDefEditSearch]);

    useEffect(() => {
        if (!posDefEditDropdownOpen) return;
        const fetchDefs = async () => {
            try {
                const qp = new URLSearchParams({ isActive: 'true', size: '15', sort: 'sortOrder', direction: 'asc' });
                if (posDefEditSearchDebounced.trim()) qp.set('search', posDefEditSearchDebounced.trim());
                const res = await apiClient.get<any>(`/api/v1/admin/positions/definitions?${qp.toString()}`);
                setPosDefEditResults(Array.isArray(res) ? res : (res.content || []));
            } catch { setPosDefEditResults([]); }
        };
        fetchDefs();
    }, [posDefEditSearchDebounced, posDefEditDropdownOpen]);

    // Close dropdowns on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (posDefDropdownRef.current && !posDefDropdownRef.current.contains(e.target as Node)) setPosDefDropdownOpen(false);
            if (posDefEditDropdownRef.current && !posDefEditDropdownRef.current.contains(e.target as Node)) setPosDefEditDropdownOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Debounce assignment search
    useEffect(() => {
        const timer = setTimeout(() => setAssignmentSearchDebounced(assignmentSearch), 300);
        return () => clearTimeout(timer);
    }, [assignmentSearch]);

    const fetchAssignments = useCallback(async (positionId: string) => {
        try {
            const data: any = await myScopeService.getPositionAssignments(ouId, positionId, {
                search: assignmentSearchDebounced || undefined,
                page: assignmentPage,
                size: assignmentPageSize,
                assignmentType: assignmentTypeFilter || undefined,
                isPrimary: isPrimaryFilter === 'true' ? true : isPrimaryFilter === 'false' ? false : undefined,
            });
            if (data?.content) {
                setPositionAssignments(prev => ({ ...prev, [positionId]: data.content }));
                setAssignmentTotalPages(data.totalPages || 0);
                setAssignmentTotalElements(data.totalElements || 0);
            } else {
                setPositionAssignments(prev => ({ ...prev, [positionId]: Array.isArray(data) ? data : [] }));
            }
        } catch {
            setPositionAssignments(prev => ({ ...prev, [positionId]: [] }));
        }
    }, [ouId, assignmentSearchDebounced, assignmentPage, assignmentPageSize, assignmentTypeFilter, isPrimaryFilter]);

    // Refetch assignments when filters change
    useEffect(() => {
        if (expandedId) fetchAssignments(expandedId);
    }, [expandedId, fetchAssignments]);

    // Search OU members for assign-to-seat dialog
    useEffect(() => {
        if (!assignToSeatId) return;
        const timer = setTimeout(async () => {
            try {
                const result: any = await myScopeService.getMyMembersPaged(ouId, {
                    query: assignSeatSearch || undefined,
                    page: assignSeatPage,
                    size: 10,
                });
                setAssignSeatSearchResults(result?.content || (Array.isArray(result) ? result : []));
            } catch {
                setAssignSeatSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [assignToSeatId, assignSeatSearch, assignSeatPage, ouId]);

    // ==================== Handlers ====================

    const toggleExpandPosition = (positionId: string) => {
        if (expandedId === positionId) {
            setExpandedId(null);
            setSelectedAssignmentIds([]);
            setAssignmentSearch('');
            setAssignmentPage(0);
            setAssignmentTypeFilter('');
            setIsPrimaryFilter('');
        } else {
            setExpandedId(positionId);
            setSelectedAssignmentIds([]);
            setAssignmentSearch('');
            setAssignmentPage(0);
            setAssignmentTypeFilter('');
            setIsPrimaryFilter('');
        }
    };

    const handleBatchUnassign = async (positionId: string) => {
        if (selectedAssignmentIds.length === 0) return;
        try {
            setActionLoading(true);
            await myScopeService.batchUnassignFromPosition(ouId, positionId, selectedAssignmentIds);
            addNotification({ type: 'success', title: 'Users Unassigned', message: `${selectedAssignmentIds.length} assignment(s) removed` });
            setSelectedAssignmentIds([]);
            fetchAssignments(positionId);
            fetchPositions();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to unassign', message: err?.message || 'Unknown error' });
        } finally { setActionLoading(false); }
    };

    const handleBatchAssignToSeat = async () => {
        if (!assignToSeatId || assignSeatSelectedIds.length === 0) return;
        try {
            setActionLoading(true);
            const posId = assignToSeatId;
            await myScopeService.assignUsersToPosition(ouId, assignToSeatId, {
                userIds: assignSeatSelectedIds,
                isPrimary: assignConfigForm.isPrimary,
                effectiveFrom: assignConfigForm.effectiveFrom || undefined,
                effectiveTo: assignConfigForm.effectiveTo || undefined,
                assignmentType: assignConfigForm.assignmentType,
                ftePercentage: assignConfigForm.ftePercentage,
            });
            addNotification({ type: 'success', title: 'Users Assigned', message: `${assignSeatSelectedIds.length} user(s) assigned to seat` });
            setAssignSeatSelectedIds([]);
            setAssignToSeatId(null);
            setAssignSeatSearch('');
            setAssignConfigForm({ isPrimary: false, effectiveFrom: new Date().toISOString().split('T')[0], effectiveTo: '', assignmentType: 'PERMANENT', ftePercentage: 100 });
            fetchAssignments(posId);
            fetchPositions();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to assign users', message: err?.message || 'Unknown error' });
        } finally { setActionLoading(false); }
    };

    const handleEditAssignment = (assignment: PositionAssignmentResponse) => {
        setEditingAssignment(assignment);
        setEditAssignmentForm({
            isPrimary: assignment.isPrimary,
            effectiveFrom: assignment.effectiveFrom || '',
            effectiveTo: assignment.effectiveTo || '',
            assignmentType: assignment.assignmentType || 'PERMANENT',
            ftePercentage: assignment.ftePercentage ?? 100,
        });
    };

    const handleSaveAssignment = async () => {
        if (!editingAssignment) return;
        try {
            setActionLoading(true);
            await myScopeService.updatePositionAssignment(ouId, editingAssignment.orgPositionId, editingAssignment.id, {
                isPrimary: editAssignmentForm.isPrimary,
                effectiveFrom: editAssignmentForm.effectiveFrom || undefined,
                effectiveTo: editAssignmentForm.effectiveTo || undefined,
                assignmentType: editAssignmentForm.assignmentType,
                ftePercentage: editAssignmentForm.ftePercentage,
            });
            addNotification({ type: 'success', title: 'Assignment Updated', message: 'Position assignment updated successfully' });
            setEditingAssignment(null);
            fetchAssignments(editingAssignment.orgPositionId);
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Update Failed', message: err?.message || 'Unknown error' });
        } finally { setActionLoading(false); }
    };

    // ==================== Seat CRUD Handlers ====================

    const handleCreatePosition = async (force = false) => {
        if (!positionForm.positionDefinitionId || !positionForm.seatCode) return;
        try {
            setActionLoading(true);
            await myScopeService.createPosition(ouId, positionForm, force);
            addNotification({ type: 'success', title: 'Position Created', message: `Seat "${positionForm.seatCode}" created` });
            setIsCreateOpen(false);
            setPositionForm({ positionDefinitionId: '', seatCode: '' });
            setPosDefSelectedName('');
            setDuplicateInfo(null);
            fetchPositions();
        } catch (err: any) {
            if (err?.status === 409 && err?.data?.code === 'DUPLICATE_POSITION_DEFINITION') {
                setDuplicateInfo(err.data);
                return;
            }
            addNotification({ type: 'error', title: 'Failed to create position', message: err?.message });
        } finally { setActionLoading(false); }
    };

    const handleDeletePosition = async (positionId: string, seatCode: string) => {
        try {
            setActionLoading(true);
            await myScopeService.deletePosition(ouId, positionId);
            addNotification({ type: 'success', title: 'Position Deleted', message: `Seat "${seatCode}" deleted` });
            fetchPositions();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to delete position', message: err?.message });
        } finally { setActionLoading(false); }
    };

    const handleBatchDeletePositions = async () => {
        if (selectedSeatIds.length === 0) return;
        try {
            setActionLoading(true);
            await myScopeService.deletePositionsBatch(ouId, selectedSeatIds);
            addNotification({ type: 'success', title: 'Positions Deleted', message: `${selectedSeatIds.length} seat(s) deleted` });
            setSelectedSeatIds([]);
            fetchPositions();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Batch delete failed', message: err?.message });
        } finally { setActionLoading(false); }
    };

    const startEditingPosition = (pos: OrgPositionResponse) => {
        setEditingPositionId(pos.id);
        setEditPositionForm({
            seatCode: pos.seatCode,
            positionDefinitionId: pos.positionDefinitionId,
            maxHeadcount: pos.maxHeadcount,
            isBudgetApproved: pos.isBudgetApproved,
            isActive: pos.isActive,
            reportingToPositionId: pos.reportingToPositionId || undefined,
        });
        setPosDefEditSelectedName(pos.positionTitle || pos.positionCode || '');
    };

    const handleUpdatePosition = async () => {
        if (!editingPositionId) return;
        try {
            setActionLoading(true);
            await myScopeService.updatePosition(ouId, editingPositionId, editPositionForm);
            addNotification({ type: 'success', title: 'Position Updated', message: 'Seat updated successfully' });
            setEditingPositionId(null);
            setEditPositionForm({});
            fetchPositions();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to update position', message: err?.message });
        } finally { setActionLoading(false); }
    };

    // ==================== Render ====================

    return (
        <>
            <div className="space-y-4">
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-primary" />
                                Position Seats ({totalElements})
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                {selectedSeatIds.length > 0 && canManage && (
                                    <Button variant="destructive" size="sm" onClick={handleBatchDeletePositions} disabled={actionLoading} className="gap-1.5">
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete Selected ({selectedSeatIds.length})
                                    </Button>
                                )}
                                {canManage && (
                                    <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(true)} className="gap-1.5">
                                        <Plus className="h-3.5 w-3.5" />
                                        Create Seat
                                    </Button>
                                )}
                            </div>
                        </div>
                        {/* Filter Bar */}
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                            <div className="relative flex-1 min-w-[180px] max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search seats..." className="h-8 pl-9 text-sm" />
                            </div>
                            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
                                <SelectTrigger className="h-8 w-[120px] text-sm">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="true">Active</SelectItem>
                                    <SelectItem value="false">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={budgetFilter} onValueChange={(v) => { setBudgetFilter(v); setPage(0); }}>
                                <SelectTrigger className="h-8 w-[140px] text-sm">
                                    <SelectValue placeholder="Budget" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Budget</SelectItem>
                                    <SelectItem value="true">Approved</SelectItem>
                                    <SelectItem value="false">Not Approved</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
                                <p className="text-muted-foreground text-sm">Loading positions...</p>
                            </div>
                        ) : positions.length === 0 ? (
                            <div className="text-center py-10">
                                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                                <p className="text-muted-foreground">{search || statusFilter !== 'all' || budgetFilter !== 'all' ? 'No positions match your filters' : 'No position seats in this unit'}</p>
                                {canManage && !search && statusFilter === 'all' && budgetFilter === 'all' && (
                                    <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => setIsCreateOpen(true)}>
                                        <Plus className="h-3.5 w-3.5" />
                                        Create First Seat
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {/* Select all */}
                                {canManage && positions.length > 0 && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground">
                                        <input type="checkbox" className="h-3.5 w-3.5 rounded border-gray-300"
                                            checked={selectedSeatIds.length === positions.length && positions.length > 0}
                                            onChange={(e) => { if (e.target.checked) { setSelectedSeatIds(positions.map(p => p.id)); } else { setSelectedSeatIds([]); } }}
                                        />
                                        <span>Select all</span>
                                    </div>
                                )}
                                {positions.map(pos => {
                                    const headcountRatio = pos.maxHeadcount > 0 ? (pos.currentHeadcount / pos.maxHeadcount) : 0;
                                    const headcountColor = headcountRatio >= 1 ? 'text-red-600' : headcountRatio >= 0.75 ? 'text-amber-600' : 'text-emerald-600';
                                    const isExpanded = expandedId === pos.id;

                                    return (
                                        <div key={pos.id} className="rounded-lg border overflow-hidden">
                                            <div className="flex items-center justify-between p-3 hover:bg-muted/40 transition-colors cursor-pointer"
                                                onClick={() => toggleExpandPosition(pos.id)}>
                                                <div className="flex items-center gap-3">
                                                    {canManage && (
                                                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300"
                                                            checked={selectedSeatIds.includes(pos.id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onChange={(e) => { if (e.target.checked) { setSelectedSeatIds(prev => [...prev, pos.id]); } else { setSelectedSeatIds(prev => prev.filter(id => id !== pos.id)); } }}
                                                        />
                                                    )}
                                                    <div className="h-9 w-9 rounded-lg bg-muted/60 border flex items-center justify-center">
                                                        <Briefcase className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-medium text-sm">{pos.positionTitle || 'Untitled'}</span>
                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono">{pos.seatCode}</Badge>
                                                            {pos.positionCode && <span className="text-[10px] text-muted-foreground font-mono">{pos.positionCode}</span>}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                                                            <span className={`flex items-center gap-1 font-medium ${headcountColor}`}>
                                                                <Users className="h-3 w-3" />
                                                                {pos.currentHeadcount}/{pos.maxHeadcount} filled
                                                            </span>
                                                            {pos.isBudgetApproved && (
                                                                <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400"><Check className="h-3 w-3" /> Budget</span>
                                                            )}
                                                            {!pos.isActive && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Inactive</Badge>}
                                                            {pos.reportingToSeatCode && (
                                                                <span className="flex items-center gap-1">Reports to: <span className="font-mono">{pos.reportingToSeatCode}</span></span>
                                                            )}
                                                            <span className="text-muted-foreground/60">·</span>
                                                            <span className="flex items-center gap-1" title={`Created: ${new Date(pos.createdAt).toLocaleString()}`}>
                                                                <Calendar className="h-3 w-3" />
                                                                {new Date(pos.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </span>
                                                            {pos.updatedAt && pos.updatedAt !== pos.createdAt && (
                                                                <span className="flex items-center gap-1 italic" title={`Updated: ${new Date(pos.updatedAt).toLocaleString()}`}>
                                                                    edited {new Date(pos.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {canManage && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                                                                    onClick={(e) => { e.stopPropagation(); startEditingPosition(pos); }} disabled={actionLoading}>
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Edit seat</TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    {canManage && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                                                    onClick={(e) => { e.stopPropagation(); handleDeletePosition(pos.id, pos.seatCode); }} disabled={actionLoading}>
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Delete seat</TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    {isExpanded
                                                        ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                        : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                                </div>
                                            </div>

                                            {/* Assignments Dialog — rendered for expanded position */}
                                            {isExpanded && (
                                                <Dialog open={true} onOpenChange={(open) => { if (!open) toggleExpandPosition(pos.id); }}>
                                                    <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
                                                        <DialogHeader>
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <DialogTitle className="flex items-center gap-2">
                                                                        <Briefcase className="h-4 w-4" />
                                                                        {pos.positionTitle} — {pos.seatCode}
                                                                    </DialogTitle>
                                                                    <DialogDescription className="flex items-center gap-2 mt-1">
                                                                        Assigned Users
                                                                        <Badge variant={pos.currentHeadcount >= pos.maxHeadcount ? "destructive" : "secondary"} className="text-[10px] px-1.5 py-0 h-4">
                                                                            {pos.currentHeadcount}/{pos.maxHeadcount}
                                                                        </Badge>
                                                                    </DialogDescription>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {selectedAssignmentIds.length > 0 && canManage && (
                                                                        <Button variant="destructive" size="sm" className="h-7 text-xs gap-1" onClick={() => handleBatchUnassign(pos.id)} disabled={actionLoading}>
                                                                            <UserMinus className="h-3 w-3" />
                                                                            Unassign ({selectedAssignmentIds.length})
                                                                        </Button>
                                                                    )}
                                                                    {canManage && pos.currentHeadcount < pos.maxHeadcount && (
                                                                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => { setAssignToSeatId(pos.id); setAssignSeatSearch(''); setAssignSeatSelectedIds([]); setAssignSeatPage(0); }}>
                                                                            <UserPlus className="h-3 w-3" />
                                                                            Assign
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </DialogHeader>

                                                        {/* Filter bar */}
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <div className="relative flex-1 min-w-[160px]">
                                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                                <Input
                                                                    value={assignmentSearch}
                                                                    onChange={(e) => { setAssignmentSearch(e.target.value); setAssignmentPage(0); }}
                                                                    placeholder="Search users..."
                                                                    className="h-8 pl-8 text-xs"
                                                                />
                                                            </div>
                                                            <Select value={assignmentTypeFilter || 'ALL'} onValueChange={(v) => { setAssignmentTypeFilter(v === 'ALL' ? '' : v); setAssignmentPage(0); }}>
                                                                <SelectTrigger className="h-8 w-[140px] text-xs">
                                                                    <SelectValue placeholder="All Types" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="ALL">All Types</SelectItem>
                                                                    <SelectItem value="PERMANENT">Permanent</SelectItem>
                                                                    <SelectItem value="ACTING">Acting</SelectItem>
                                                                    <SelectItem value="INTERIM">Interim</SelectItem>
                                                                    <SelectItem value="SECONDMENT">Secondment</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <Select value={isPrimaryFilter || 'ALL'} onValueChange={(v) => { setIsPrimaryFilter(v === 'ALL' ? '' : v); setAssignmentPage(0); }}>
                                                                <SelectTrigger className="h-8 w-[120px] text-xs">
                                                                    <SelectValue placeholder="All" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="ALL">All</SelectItem>
                                                                    <SelectItem value="true">Primary</SelectItem>
                                                                    <SelectItem value="false">Non-Primary</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        {/* Assignment list */}
                                                        <div className="flex-1 overflow-y-auto min-h-0">
                                                            {!positionAssignments[pos.id] ? (
                                                                <div className="flex items-center justify-center py-8">
                                                                    <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                                                                </div>
                                                            ) : positionAssignments[pos.id].length === 0 ? (
                                                                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                                                    <Users className="h-8 w-8 mb-2 opacity-40" />
                                                                    <p className="text-sm">No users assigned to this seat</p>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    {/* Select all */}
                                                                    {canManage && (
                                                                        <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground border-b">
                                                                            <input
                                                                                type="checkbox"
                                                                                className="h-3.5 w-3.5 rounded border-gray-300"
                                                                                checked={selectedAssignmentIds.length === positionAssignments[pos.id].length && positionAssignments[pos.id].length > 0}
                                                                                onChange={(e) => {
                                                                                    if (e.target.checked) {
                                                                                        setSelectedAssignmentIds(positionAssignments[pos.id].map(a => a.id));
                                                                                    } else {
                                                                                        setSelectedAssignmentIds([]);
                                                                                    }
                                                                                }}
                                                                            />
                                                                            <span>Select all ({positionAssignments[pos.id].length})</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="space-y-1.5 mt-1.5">
                                                                        {positionAssignments[pos.id].map(asgn => (
                                                                            <div key={asgn.id} className={`flex items-center justify-between p-2.5 rounded-md bg-background border text-sm transition-colors group ${canManage ? 'hover:bg-muted/40 cursor-pointer' : ''}`} onClick={() => canManage && handleEditAssignment(asgn)}>
                                                                                <div className="flex items-center gap-2.5">
                                                                                    {canManage && (
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            className="h-3.5 w-3.5 rounded border-gray-300"
                                                                                            checked={selectedAssignmentIds.includes(asgn.id)}
                                                                                            onClick={(e) => e.stopPropagation()}
                                                                                            onChange={(e) => {
                                                                                                if (e.target.checked) {
                                                                                                    setSelectedAssignmentIds(prev => [...prev, asgn.id]);
                                                                                                } else {
                                                                                                    setSelectedAssignmentIds(prev => prev.filter(id => id !== asgn.id));
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                    )}
                                                                                    <UserAvatar user={{ displayName: asgn.userDisplayName, imgUrl: asgn.userImageUrl || undefined }} size="sm" />
                                                                                    <div>
                                                                                        <span className="font-medium">{asgn.userDisplayName}</span>
                                                                                        <div className="flex items-center gap-2 mt-0.5">
                                                                                            {asgn.isPrimary && (
                                                                                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">Primary</Badge>
                                                                                            )}
                                                                                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{asgn.assignmentType}</Badge>
                                                                                            {asgn.status === 'REVOKED' && (
                                                                                                <Badge variant="destructive" className="text-[9px] px-1 py-0 h-3.5">Revoked</Badge>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                                    {asgn.ftePercentage != null && <span>{String(asgn.ftePercentage)}% FTE</span>}
                                                                                    {asgn.effectiveFrom && <span>From {new Date(asgn.effectiveFrom).toLocaleDateString()}</span>}
                                                                                    {asgn.effectiveTo && <span>To {new Date(asgn.effectiveTo).toLocaleDateString()}</span>}
                                                                                    {canManage && <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Pagination */}
                                                        {assignmentTotalPages > 1 && (
                                                            <div className="pt-2 border-t">
                                                                <Pagination
                                                                    currentPage={assignmentPage}
                                                                    totalPages={assignmentTotalPages}
                                                                    totalElements={assignmentTotalElements}
                                                                    pageSize={assignmentPageSize}
                                                                    onPageChange={setAssignmentPage}
                                                                    onPageSizeChange={(s) => { setAssignmentPageSize(s); setAssignmentPage(0); }}
                                                                    pageSizeOptions={[5, 10, 20]}
                                                                />
                                                            </div>
                                                        )}
                                                    </DialogContent>
                                                </Dialog>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {/* Pagination */}
                        {totalPages > 0 && (
                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                totalElements={totalElements}
                                pageSize={pageSize}
                                onPageChange={setPage}
                                onPageSizeChange={s => { setPageSize(s); setPage(0); }}
                                pageSizeOptions={[5, 10, 20, 50]}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ==================== Assign Users to Seat Dialog ==================== */}
            <Dialog open={!!assignToSeatId} onOpenChange={(open) => { if (!open) { setAssignToSeatId(null); setAssignSeatSelectedIds([]); setAssignSeatSearch(''); } }}>
                <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><UserPlus className="h-4 w-4 text-primary" /> Assign Users to Seat</DialogTitle>
                        <DialogDescription>Search for members of this organizational unit to assign to the selected seat. You can select multiple users.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search OU members by name or email..."
                                value={assignSeatSearch}
                                onChange={(e) => { setAssignSeatSearch(e.target.value); setAssignSeatPage(0); }}
                                className="pl-9"
                                autoFocus
                            />
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            {assignSeatSelectedIds.length > 0 && (
                                <>
                                    <Badge variant="secondary">{assignSeatSelectedIds.length} selected</Badge>
                                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setAssignSeatSelectedIds([])}>Clear</Button>
                                </>
                            )}
                            {(() => {
                                const p = positions.find(p => p.id === assignToSeatId);
                                const rem = p ? p.maxHeadcount - p.currentHeadcount : 0;
                                const left = rem - assignSeatSelectedIds.length;
                                return <Badge variant={left <= 0 ? "destructive" : "outline"} className="ml-auto">{left} of {rem} slot{rem !== 1 ? 's' : ''} remaining</Badge>;
                            })()}
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-1">
                            {assignSeatSearchResults.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No members found</p>
                            ) : (
                                assignSeatSearchResults.map((member: any) => {
                                    const userId = member.userId || member.id;
                                    const isSelected = assignSeatSelectedIds.includes(userId);
                                    const pos = positions.find(p => p.id === assignToSeatId);
                                    const slotsLeft = pos ? pos.maxHeadcount - pos.currentHeadcount - assignSeatSelectedIds.length : 0;
                                    const isDisabled = !isSelected && slotsLeft <= 0;
                                    return (
                                        <button
                                            key={userId}
                                            disabled={isDisabled}
                                            onClick={() => {
                                                if (isDisabled) return;
                                                setAssignSeatSelectedIds(prev =>
                                                    prev.includes(userId)
                                                        ? prev.filter(id => id !== userId)
                                                        : [...prev, userId]
                                                );
                                            }}
                                            className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-colors text-left ${isSelected ? 'bg-primary/10 border-primary/30' : isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted/60'}`}
                                        >
                                            <input type="checkbox" className="h-4 w-4 rounded border-gray-300" checked={isSelected} disabled={isDisabled} readOnly />
                                            <UserAvatar user={{ displayName: member.displayName || member.userDisplayName, imgUrl: member.imageUrl || member.userImageUrl || undefined }} size="sm" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{member.displayName || member.userDisplayName}</p>
                                                <p className="text-xs text-muted-foreground truncate">{member.email || member.userEmail}</p>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                        {/* Assignment Configuration */}
                        <div className="border-t pt-3 mt-2 space-y-3">
                            <p className="text-sm font-medium text-primary flex items-center gap-1.5">
                                <Settings className="h-3.5 w-3.5" /> Assignment Configuration
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Assignment Type</Label>
                                    <Select value={assignConfigForm.assignmentType} onValueChange={(v) => setAssignConfigForm(f => ({ ...f, assignmentType: v }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PERMANENT">Permanent</SelectItem>
                                            <SelectItem value="ACTING">Acting</SelectItem>
                                            <SelectItem value="INTERIM">Interim</SelectItem>
                                            <SelectItem value="SECONDMENT">Secondment</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">FTE %</Label>
                                    <Input type="number" min={0} max={100} value={assignConfigForm.ftePercentage} onChange={(e) => setAssignConfigForm(f => ({ ...f, ftePercentage: Number(e.target.value) }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Effective From</Label>
                                    <Input type="date" value={assignConfigForm.effectiveFrom} onChange={(e) => setAssignConfigForm(f => ({ ...f, effectiveFrom: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Effective To</Label>
                                    <Input type="date" value={assignConfigForm.effectiveTo} onChange={(e) => setAssignConfigForm(f => ({ ...f, effectiveTo: e.target.value }))} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="assign-config-primary-scope" checked={assignConfigForm.isPrimary} onChange={(e) => setAssignConfigForm(f => ({ ...f, isPrimary: e.target.checked }))} className="h-4 w-4 rounded" />
                                <Label htmlFor="assign-config-primary-scope" className="text-sm cursor-pointer">Primary Position</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setAssignToSeatId(null); setAssignSeatSelectedIds([]); }}>Cancel</Button>
                        <Button onClick={handleBatchAssignToSeat} disabled={actionLoading || assignSeatSelectedIds.length === 0} className="gap-1.5">
                            {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                            Assign {assignSeatSelectedIds.length > 0 ? `(${assignSeatSelectedIds.length})` : ''}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ==================== Edit Assignment Dialog ==================== */}
            <Dialog open={!!editingAssignment} onOpenChange={(open) => { if (!open) setEditingAssignment(null); }}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Settings className="h-4 w-4 text-primary" /> Edit Assignment</DialogTitle>
                        <DialogDescription>
                            Edit the assignment configuration for <strong>{editingAssignment?.userDisplayName}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Assignment Type</Label>
                                <Select value={editAssignmentForm.assignmentType} onValueChange={(v) => setEditAssignmentForm(f => ({ ...f, assignmentType: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PERMANENT">Permanent</SelectItem>
                                        <SelectItem value="ACTING">Acting</SelectItem>
                                        <SelectItem value="INTERIM">Interim</SelectItem>
                                        <SelectItem value="SECONDMENT">Secondment</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">FTE %</Label>
                                <Input type="number" min={0} max={100} value={editAssignmentForm.ftePercentage} onChange={(e) => setEditAssignmentForm(f => ({ ...f, ftePercentage: Number(e.target.value) }))} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Effective From</Label>
                                <Input type="date" value={editAssignmentForm.effectiveFrom} onChange={(e) => setEditAssignmentForm(f => ({ ...f, effectiveFrom: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Effective To</Label>
                                <Input type="date" value={editAssignmentForm.effectiveTo} onChange={(e) => setEditAssignmentForm(f => ({ ...f, effectiveTo: e.target.value }))} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="edit-assign-primary-scope" checked={editAssignmentForm.isPrimary} onChange={(e) => setEditAssignmentForm(f => ({ ...f, isPrimary: e.target.checked }))} className="h-4 w-4 rounded" />
                            <Label htmlFor="edit-assign-primary-scope" className="text-sm cursor-pointer">Primary Position</Label>
                        </div>
                        {editingAssignment && (
                            <div className="text-xs text-muted-foreground space-y-0.5 pt-1 border-t">
                                <p>Assigned by: {editingAssignment.assignedByDisplayName || '—'}</p>
                                <p>Created: {new Date(editingAssignment.createdAt).toLocaleDateString()}</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingAssignment(null)}>Cancel</Button>
                        <Button onClick={handleSaveAssignment} disabled={actionLoading} className="gap-1.5">
                            {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ==================== Edit Position Dialog ==================== */}
            <Dialog open={!!editingPositionId} onOpenChange={(open) => { if (!open) { setEditingPositionId(null); setEditPositionForm({}); } }}>
                <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Edit className="h-4 w-4 text-primary" /> Edit Position Seat</DialogTitle>
                        <DialogDescription>Update the seat configuration.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Position Definition</Label>
                                <div className="relative" ref={posDefEditDropdownRef}>
                                    <div className="flex items-center h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => { setPosDefEditDropdownOpen(!posDefEditDropdownOpen); setPosDefEditSearch(''); }}>
                                        <span className={`flex-1 truncate ${posDefEditSelectedName ? '' : 'text-muted-foreground'}`}>{posDefEditSelectedName || 'Select position...'}</span>
                                        <ChevronDown className="h-4 w-4 ml-1 text-muted-foreground" />
                                    </div>
                                    {posDefEditDropdownOpen && (
                                        <div className="absolute top-full left-0 w-full mt-1 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden">
                                            <div className="p-2 border-b">
                                                <div className="relative">
                                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                    <Input value={posDefEditSearch} onChange={(e) => setPosDefEditSearch(e.target.value)} placeholder="Search by title or code..." className="h-8 pl-8 text-sm" autoFocus />
                                                </div>
                                            </div>
                                            <div className="max-h-48 overflow-y-auto">
                                                {posDefEditResults.length === 0 ? (
                                                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">No definitions found</div>
                                                ) : posDefEditResults.map((def: any) => (
                                                    <button key={def.id} className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors flex items-center gap-2 ${def.id === editPositionForm.positionDefinitionId ? 'bg-primary/5' : ''}`}
                                                        onClick={() => { setEditPositionForm((p: any) => ({ ...p, positionDefinitionId: def.id })); setPosDefEditSelectedName(def.title || def.code); setPosDefEditDropdownOpen(false); }}>
                                                        <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">{def.code}</code>
                                                        <span className="truncate">{def.title}</span>
                                                        {def.id === editPositionForm.positionDefinitionId && <Check className="h-3.5 w-3.5 ml-auto text-primary" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Seat Code</Label>
                                <Input value={editPositionForm.seatCode || ''} onChange={(e) => setEditPositionForm((p: any) => ({ ...p, seatCode: e.target.value }))} placeholder="e.g. SEAT-001" className="font-mono" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Max Headcount</Label>
                                <Input type="number" value={editPositionForm.maxHeadcount ?? 1} onChange={(e) => setEditPositionForm((p: any) => ({ ...p, maxHeadcount: parseInt(e.target.value) || 1 }))} min={1} />
                            </div>
                            <div className="space-y-2">
                                <Label>Budget Approved</Label>
                                <Select value={editPositionForm.isBudgetApproved ? 'true' : 'false'} onValueChange={(v) => setEditPositionForm((p: any) => ({ ...p, isBudgetApproved: v === 'true' }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Yes</SelectItem>
                                        <SelectItem value="false">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={editPositionForm.isActive ? 'true' : 'false'} onValueChange={(v) => setEditPositionForm((p: any) => ({ ...p, isActive: v === 'true' }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Active</SelectItem>
                                        <SelectItem value="false">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setEditingPositionId(null); setEditPositionForm({}); }}>Cancel</Button>
                        <Button onClick={handleUpdatePosition} disabled={actionLoading} className="gap-1.5">
                            {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ==================== Create Position Dialog ==================== */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Create New Seat</DialogTitle>
                        <DialogDescription>Define a new position seat within this organizational unit.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Position Definition</Label>
                                <div className="relative" ref={posDefDropdownRef}>
                                    <div className="flex items-center h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => { setPosDefDropdownOpen(!posDefDropdownOpen); setPosDefSearch(''); }}>
                                        <span className={`flex-1 truncate ${posDefSelectedName || positionForm.positionDefinitionId ? '' : 'text-muted-foreground'}`}>
                                            {posDefSelectedName || 'Select position...'}
                                        </span>
                                        {positionForm.positionDefinitionId && (
                                            <button className="ml-1 p-0.5 hover:bg-muted rounded" onClick={(e) => { e.stopPropagation(); setPositionForm(p => ({ ...p, positionDefinitionId: '' })); setPosDefSelectedName(''); }}>
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                        <ChevronDown className="h-4 w-4 ml-1 text-muted-foreground" />
                                    </div>
                                    {posDefDropdownOpen && (
                                        <div className="absolute top-full left-0 w-full mt-1 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden">
                                            <div className="p-2 border-b">
                                                <div className="relative">
                                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                    <Input value={posDefSearch} onChange={(e) => setPosDefSearch(e.target.value)} placeholder="Search by title or code..." className="h-8 pl-8 text-sm" autoFocus />
                                                </div>
                                            </div>
                                            <div className="max-h-48 overflow-y-auto">
                                                {posDefResults.length === 0 ? (
                                                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">No definitions found</div>
                                                ) : posDefResults.map((def: any) => (
                                                    <button key={def.id} className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors flex items-center gap-2 ${def.id === positionForm.positionDefinitionId ? 'bg-primary/5' : ''}`}
                                                        onClick={() => { setPositionForm(p => ({ ...p, positionDefinitionId: def.id })); setPosDefSelectedName(def.title || def.code); setPosDefDropdownOpen(false); }}>
                                                        <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">{def.code}</code>
                                                        <span className="truncate">{def.title}</span>
                                                        {def.id === positionForm.positionDefinitionId && <Check className="h-3.5 w-3.5 ml-auto text-primary" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Seat Code</Label>
                                <Input value={positionForm.seatCode} onChange={(e) => setPositionForm(p => ({ ...p, seatCode: e.target.value }))} placeholder="e.g. SEAT-001" className="font-mono" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Max Headcount</Label>
                                <Input type="number" value={positionForm.maxHeadcount ?? 1} onChange={(e) => setPositionForm(p => ({ ...p, maxHeadcount: parseInt(e.target.value) || 1 }))} min={1} />
                            </div>
                            <div className="space-y-2">
                                <Label>Budget Approved</Label>
                                <Select value={positionForm.isBudgetApproved ? 'true' : 'false'} onValueChange={(v) => setPositionForm(p => ({ ...p, isBudgetApproved: v === 'true' }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Yes</SelectItem>
                                        <SelectItem value="false">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={() => handleCreatePosition()} disabled={actionLoading || !positionForm.positionDefinitionId || !positionForm.seatCode} className="gap-1.5">
                            {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                            Create Seat
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ==================== Duplicate Position Confirmation ==================== */}
            <Dialog open={!!duplicateInfo} onOpenChange={(open) => { if (!open) setDuplicateInfo(null); }}>
                <DialogContent className="sm:max-w-[440px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="h-5 w-5" />
                            Duplicate Position Definition
                        </DialogTitle>
                        <DialogDescription>{duplicateInfo?.message}</DialogDescription>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        You can create a separate seat anyway, or cancel and increase the headcount on an existing seat instead.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDuplicateInfo(null)}>Cancel</Button>
                        <Button onClick={() => handleCreatePosition(true)} disabled={actionLoading} className="gap-1.5">
                            {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                            Create Anyway
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
