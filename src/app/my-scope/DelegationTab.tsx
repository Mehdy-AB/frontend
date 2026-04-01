'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Handshake, Plus, Clock, ArrowUpRight, ArrowDownLeft,
    CheckCircle2, XCircle, AlertTriangle, Search, Shield,
    Calendar, UserCheck, ChevronRight, ChevronLeft, RotateCcw, X, Loader2, Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
    delegationService,
    type DelegationResponse, type DelegableRoleResponse, type EligibleDelegateResponse, type CreateDelegationRequest,
    type UserDelegationFilter, type PageResponse,
} from '@/api/services/delegationService';
import UserAvatar from '@/components/main/UserAvatar';

// ==================== Props ====================

interface DelegationTabProps {
    ouId: string;
    ouName: string;
    canManage: boolean;
    addNotification: (n: { type: 'info' | 'error' | 'warning' | 'success'; title: string; message: string }) => void;
    refreshTrigger: number;
}

// ==================== Constants ====================

const STATUS_OPTIONS = [
    { value: '_all', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'PENDING_APPROVAL', label: 'Pending' },
    { value: 'EXPIRED', label: 'Expired' },
    { value: 'REVOKED', label: 'Revoked' },
    { value: 'REJECTED', label: 'Rejected' },
];

const STATUS_STYLES: Record<string, { variant: 'default' | 'destructive' | 'outline' | 'secondary'; icon: React.ReactNode; label: string }> = {
    ACTIVE: { variant: 'default', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Active' },
    PENDING_APPROVAL: { variant: 'outline', icon: <Clock className="h-3 w-3" />, label: 'Pending' },
    EXPIRED: { variant: 'secondary', icon: <Clock className="h-3 w-3" />, label: 'Expired' },
    REVOKED: { variant: 'destructive', icon: <XCircle className="h-3 w-3" />, label: 'Revoked' },
    REJECTED: { variant: 'destructive', icon: <XCircle className="h-3 w-3" />, label: 'Rejected' },
    DRAFT: { variant: 'secondary', icon: <Clock className="h-3 w-3" />, label: 'Draft' },
};

const getStatusBadge = (status: string) => {
    const style = STATUS_STYLES[status] || { variant: 'secondary' as const, icon: null, label: status };
    return <Badge variant={style.variant} className="gap-1 text-xs">{style.icon} {style.label}</Badge>;
};

const formatDate = (iso: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ==================== Detail Drawer ====================

function DelegationDrawer({ delegation, onClose, onRevoke }: {
    delegation: DelegationResponse | null;
    onClose: () => void;
    onRevoke?: (d: DelegationResponse) => void;
}) {
    useEffect(() => {
        if (!delegation) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [delegation, onClose]);

    if (!delegation) return null;
    const d = delegation;

    const fields: { label: string; value: React.ReactNode }[] = [
        { label: 'ID', value: <span className="font-mono text-[11px] text-muted-foreground">{d.id}</span> },
        { label: 'Status', value: getStatusBadge(d.status) },
        { label: 'Start', value: formatDate(d.startAt) },
        { label: 'End', value: formatDate(d.endAt) },
        { label: 'Reason', value: d.reason || '—' },
    ];
    if (d.revocationReason) fields.push({ label: 'Revoke Reason', value: <span className="text-destructive">{d.revocationReason}</span> });

    return (
        <>
            <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50" onClick={onClose} />
            <div className="fixed top-0 right-0 bottom-0 w-[420px] max-w-[90vw] bg-background border-l z-50 flex flex-col animate-in slide-in-from-right duration-200 shadow-2xl">
                <div className="flex justify-between items-center px-5 py-3 border-b bg-muted/30">
                    <h2 className="text-sm font-bold tracking-tight">Delegation Detail</h2>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* Identity */}
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 border">
                        <UserAvatar user={{ displayName: d.delegatorName, imgUrl: d.delegatorImgUrl ?? undefined }} size="xs" />
                        <span className="text-sm font-semibold">{d.delegatorName}</span>
                        <span className="text-violet-600 font-bold text-xs">→</span>
                        <UserAvatar user={{ displayName: d.delegateName, imgUrl: d.delegateImgUrl ?? undefined }} size="xs" />
                        <span className="text-sm font-semibold">{d.delegateName}</span>
                    </div>

                    {/* Fields */}
                    <div>
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 pb-1.5 border-b">Details</h3>
                        {fields.map(f => (
                            <div key={f.label} className="grid grid-cols-[90px_1fr] gap-2 py-1.5 border-b border-border/50 text-sm items-baseline">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase">{f.label}</span>
                                <span className="break-words">{f.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Roles */}
                    {d.roles?.length > 0 && (
                        <div>
                            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 pb-1.5 border-b">Roles</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {d.roles.map(r => (
                                    <Badge key={r.roleId} variant="secondary" className="text-xs gap-1">
                                        <Shield className="h-2.5 w-2.5" />{r.businessLabel}
                                        {r.requiresApproval && <AlertTriangle className="h-2.5 w-2.5 text-amber-500" />}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {d.canRevoke && onRevoke && (
                        <div className="pt-3 border-t">
                            <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => onRevoke(d)}>
                                <RotateCcw className="h-3.5 w-3.5" /> Revoke
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

// ==================== Main Component ====================

export default function DelegationTab({ ouId, ouName, canManage, addNotification, refreshTrigger }: DelegationTabProps) {
    const [activeView, setActiveView] = useState<'outgoing' | 'incoming'>('outgoing');

    // Paged data
    const [outData, setOutData] = useState<PageResponse<DelegationResponse> | null>(null);
    const [inData, setInData] = useState<PageResponse<DelegationResponse> | null>(null);
    const [outLoading, setOutLoading] = useState(true);
    const [inLoading, setInLoading] = useState(true);

    const defaultFilter = (): UserDelegationFilter => ({
        page: 0, size: 15, sortBy: 'createdAt', sortDir: 'desc',
    });
    const [outFilters, setOutFilters] = useState<UserDelegationFilter>(defaultFilter());
    const [inFilters, setInFilters] = useState<UserDelegationFilter>(defaultFilter());

    // Drawer
    const [selectedRow, setSelectedRow] = useState<DelegationResponse | null>(null);

    // Wizard state
    const [wizardOpen, setWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [delegableRoles, setDelegableRoles] = useState<DelegableRoleResponse[]>([]);
    const [eligibleDelegates, setEligibleDelegates] = useState<EligibleDelegateResponse[]>([]);
    const [delegateSearch, setDelegateSearch] = useState('');
    const [selectedDelegate, setSelectedDelegate] = useState<EligibleDelegateResponse | null>(null);
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loadingDelegates, setLoadingDelegates] = useState(false);

    // Revoke dialog
    const [revokeTarget, setRevokeTarget] = useState<DelegationResponse | null>(null);
    const [revokeReason, setRevokeReason] = useState('');
    const [revoking, setRevoking] = useState(false);

    // ==================== Data Loading ====================

    const fetchOutgoing = useCallback(async () => {
        setOutLoading(true);
        try {
            const result = await delegationService.getOutgoingForOuPaged(ouId, outFilters);
            setOutData(result);
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Error', message: err?.message || 'Failed to load outgoing' });
        } finally {
            setOutLoading(false);
        }
    }, [ouId, outFilters, addNotification]);

    const fetchIncoming = useCallback(async () => {
        setInLoading(true);
        try {
            const result = await delegationService.getIncomingForOuPaged(ouId, inFilters);
            setInData(result);
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Error', message: err?.message || 'Failed to load incoming' });
        } finally {
            setInLoading(false);
        }
    }, [ouId, inFilters, addNotification]);

    useEffect(() => { fetchOutgoing(); }, [fetchOutgoing]);
    useEffect(() => { fetchIncoming(); }, [fetchIncoming]);
    useEffect(() => {
        // Re-fetch on external trigger (e.g. wizard create)
        setOutFilters(defaultFilter());
        setInFilters(defaultFilter());
    }, [refreshTrigger]);

    const refreshAll = () => { fetchOutgoing(); fetchIncoming(); };

    // ==================== Wizard ====================

    const openWizard = async () => {
        setWizardStep(1);
        setSelectedDelegate(null);
        setSelectedRoleIds([]);
        setStartDate('');
        setEndDate('');
        setReason('');
        setDelegateSearch('');

        try {
            const roles = await delegationService.getDelegableRoles(ouId);
            setDelegableRoles(roles);
            if (roles.length === 0) {
                addNotification({ type: 'warning', title: 'No Delegable Roles', message: 'You do not have any delegable responsibilities in this unit.' });
                return;
            }
            setWizardOpen(true);
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Error', message: err?.message || 'Failed to load delegable roles' });
        }
    };

    const searchDelegates = async (query: string) => {
        setDelegateSearch(query);
        try {
            setLoadingDelegates(true);
            const delegates = await delegationService.getEligibleDelegates(ouId, query);
            setEligibleDelegates(delegates);
        } catch (err: any) {
            console.error('Failed to search delegates', err);
        } finally {
            setLoadingDelegates(false);
        }
    };

    useEffect(() => {
        if (wizardStep === 2) { searchDelegates(''); }
    }, [wizardStep]);

    const submitDelegation = async () => {
        if (!selectedDelegate || selectedRoleIds.length === 0 || !startDate || !endDate) return;
        try {
            setSubmitting(true);
            const request: CreateDelegationRequest = {
                delegateUserId: selectedDelegate.userId,
                roleIds: selectedRoleIds,
                startAt: new Date(startDate).toISOString(),
                endAt: new Date(endDate).toISOString(),
                reason,
            };
            const result = await delegationService.createOuDelegation(ouId, request);
            const statusMsg = result.status === 'PENDING_APPROVAL'
                ? 'Delegation requires admin approval before activation.'
                : 'Delegation is now active.';
            addNotification({ type: 'success', title: 'Delegation Created', message: statusMsg });
            setWizardOpen(false);
            refreshAll();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Delegation Failed', message: err?.message || 'Failed to create delegation' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleRevoke = async () => {
        if (!revokeTarget) return;
        try {
            setRevoking(true);
            await delegationService.revokeDelegation(revokeTarget.id, revokeReason);
            addNotification({ type: 'success', title: 'Delegation Revoked', message: 'The delegation has been revoked and permissions removed.' });
            setRevokeTarget(null);
            setRevokeReason('');
            setSelectedRow(null);
            refreshAll();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Revoke Failed', message: err?.message || 'Failed to revoke delegation' });
        } finally {
            setRevoking(false);
        }
    };

    const hasApprovalRequired = selectedRoleIds.some(id =>
        delegableRoles.find(r => r.roleId === id)?.requiresApproval
    );

    // ==================== Current tab ====================

    const isOutgoing = activeView === 'outgoing';
    const data = isOutgoing ? outData : inData;
    const loading = isOutgoing ? outLoading : inLoading;
    const filters = isOutgoing ? outFilters : inFilters;
    const setFilters = isOutgoing ? setOutFilters : setInFilters;
    const rows = data?.content || [];
    const totalPages = data?.totalPages || 0;

    // ==================== Render ====================

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-sm">Delegations</h3>
                    <p className="text-xs text-muted-foreground">Manage responsibility delegations for {ouName}</p>
                </div>
                {canManage && (
                    <Button size="sm" onClick={openWizard} className="gap-1.5">
                        <Plus className="h-3.5 w-3.5" /> Delegate
                    </Button>
                )}
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-1 border-b">
                <button onClick={() => setActiveView('outgoing')}
                    className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${activeView === 'outgoing' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Outgoing ({outData?.totalElements ?? 0})
                </button>
                <button onClick={() => setActiveView('incoming')}
                    className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${activeView === 'incoming' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                    <ArrowDownLeft className="h-3.5 w-3.5" />
                    Incoming ({inData?.totalElements ?? 0})
                </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-2 items-center">
                <Filter className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <Select value={filters.status || '_all'} onValueChange={v => setFilters(f => ({ ...f, status: v === '_all' ? undefined : v, page: 0 }))}>
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_OPTIONS.map(o => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search name or reason..."
                        className="h-8 text-xs pl-8 w-[190px]"
                        value={filters.search || ''}
                        onChange={e => setFilters(f => ({ ...f, search: e.target.value || undefined, page: 0 }))}
                    />
                </div>
                <Input
                    type="date"
                    className="h-8 text-xs w-[130px]"
                    value={filters.dateFrom ? filters.dateFrom.split('T')[0] : ''}
                    onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value ? new Date(e.target.value).toISOString() : undefined, page: 0 }))}
                    title="From date"
                />
                <Input
                    type="date"
                    className="h-8 text-xs w-[130px]"
                    value={filters.dateTo ? filters.dateTo.split('T')[0] : ''}
                    onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value ? new Date(e.target.value).toISOString() : undefined, page: 0 }))}
                    title="To date"
                />
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => setFilters(defaultFilter())}>
                    <RotateCcw className="h-3 w-3" /> Reset
                </Button>
            </div>

            {/* Table */}
            <Card>
                <div className="overflow-auto">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    )}
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/30">
                                <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    {isOutgoing ? 'Delegate' : 'Delegator'}
                                </th>
                                <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                                <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Roles</th>
                                <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Period</th>
                                {isOutgoing && <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[80px]"></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && rows.length === 0 && (
                                <tr>
                                    <td colSpan={isOutgoing ? 5 : 4} className="text-center py-12">
                                        <Handshake className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-20" />
                                        <p className="text-sm text-muted-foreground">
                                            {isOutgoing ? 'No outgoing delegations for this unit.' : 'No incoming delegations for this unit.'}
                                        </p>
                                    </td>
                                </tr>
                            )}
                            {rows.map(d => {
                                const person = isOutgoing
                                    ? { name: d.delegateName, img: d.delegateImgUrl }
                                    : { name: d.delegatorName, img: d.delegatorImgUrl };

                                return (
                                    <tr
                                        key={d.id}
                                        className={`border-b hover:bg-muted/30 cursor-pointer transition-colors ${selectedRow?.id === d.id ? 'bg-primary/5 shadow-[inset_3px_0_0_hsl(var(--primary))]' : ''}`}
                                        onClick={() => setSelectedRow(d)}
                                    >
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <UserAvatar user={{ displayName: person.name, imgUrl: person.img ?? undefined }} size="xs" />
                                                <span className="font-medium text-sm">{person.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">{getStatusBadge(d.status)}</td>
                                        <td className="px-3 py-2">
                                            <div className="flex flex-wrap gap-1">
                                                {d.roles.slice(0, 2).map(r => (
                                                    <Badge key={r.roleId} variant="secondary" className="text-[10px] gap-0.5">
                                                        <Shield className="h-2 w-2" />{r.businessLabel}
                                                    </Badge>
                                                ))}
                                                {d.roles.length > 2 && (
                                                    <Badge variant="secondary" className="text-[10px]">+{d.roles.length - 2}</Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(d.startAt)} — {formatDate(d.endAt)}
                                            </span>
                                        </td>
                                        {isOutgoing && (
                                            <td className="px-3 py-2">
                                                {d.canRevoke && (
                                                    <Button
                                                        variant="ghost" size="sm"
                                                        className="h-7 text-xs text-destructive hover:text-destructive gap-1"
                                                        onClick={e => { e.stopPropagation(); setRevokeTarget(d); setRevokeReason(''); }}
                                                    >
                                                        <RotateCcw className="h-3 w-3" /> Revoke
                                                    </Button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                {totalPages > 0 && (
                    <div className="flex items-center justify-between px-3 py-2 border-t text-xs text-muted-foreground">
                        <span>Page {(data?.number ?? 0) + 1} of {Math.max(totalPages, 1)} ({data?.totalElements ?? 0} total)</span>
                        <div className="flex items-center gap-1.5">
                            <Button variant="outline" size="icon" className="h-7 w-7" disabled={filters.page === 0}
                                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-7 w-7" disabled={filters.page >= totalPages - 1}
                                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Detail Drawer */}
            <DelegationDrawer
                delegation={selectedRow}
                onClose={() => setSelectedRow(null)}
                onRevoke={isOutgoing ? (d) => { setSelectedRow(null); setRevokeTarget(d); setRevokeReason(''); } : undefined}
            />

            {/* ==================== Create Delegation Wizard ==================== */}
            <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Handshake className="h-5 w-5" />
                            Delegate Responsibilities
                        </DialogTitle>
                        <DialogDescription>
                            Step {wizardStep} of 4 — {ouName}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Step 1: Select Roles */}
                    {wizardStep === 1 && (
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">What do you want to delegate?</Label>
                            <p className="text-xs text-muted-foreground">
                                Select the responsibilities you want to temporarily hand over.
                            </p>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {delegableRoles.map(role => (
                                    <Card key={role.roleId}
                                        className={`cursor-pointer transition-all ${selectedRoleIds.includes(role.roleId) ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-accent/50'}`}
                                        onClick={() => {
                                            setSelectedRoleIds(prev =>
                                                prev.includes(role.roleId)
                                                    ? prev.filter(id => id !== role.roleId)
                                                    : [...prev, role.roleId]
                                            );
                                        }}>
                                        <CardContent className="p-3 flex items-start gap-3">
                                            <Checkbox
                                                checked={selectedRoleIds.includes(role.roleId)}
                                                className="mt-0.5"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="font-medium text-sm">{role.businessLabel}</span>
                                                    {role.requiresApproval && (
                                                        <Badge variant="outline" className="text-xs gap-1 text-amber-600 border-amber-300">
                                                            <AlertTriangle className="h-2.5 w-2.5" /> Needs Approval
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">{role.description}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">Max: {role.maxDelegationDays} days</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Select Delegate */}
                    {wizardStep === 2 && (
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Who should receive these responsibilities?</Label>
                            <p className="text-xs text-muted-foreground">
                                Only active members of this unit are eligible.
                            </p>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search members..."
                                    value={delegateSearch}
                                    onChange={e => searchDelegates(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                                {loadingDelegates ? (
                                    <div className="flex justify-center py-6">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : eligibleDelegates.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-6">No eligible delegates found</p>
                                ) : eligibleDelegates.map(del => (
                                    <Card key={del.userId}
                                        className={`cursor-pointer transition-all ${selectedDelegate?.userId === del.userId ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-accent/50'}`}
                                        onClick={() => setSelectedDelegate(del)}>
                                        <CardContent className="p-3 flex items-center gap-3">
                                            <UserCheck className={`h-4 w-4 ${selectedDelegate?.userId === del.userId ? 'text-primary' : 'text-muted-foreground'}`} />
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{del.displayName}</p>
                                                <p className="text-xs text-muted-foreground">{del.email}</p>
                                            </div>
                                            {selectedDelegate?.userId === del.userId && (
                                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Dates & Reason */}
                    {wizardStep === 3 && (
                        <div className="space-y-4">
                            <Label className="text-sm font-medium">When and why?</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Start Date</Label>
                                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">End Date</Label>
                                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Reason (required)</Label>
                                <Textarea
                                    placeholder="e.g., Going on medical leave, vacation, etc."
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 4: Review */}
                    {wizardStep === 4 && (
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Review & Confirm</Label>

                            <Card>
                                <CardContent className="p-3 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Delegate:</span>
                                        <span className="font-medium">{selectedDelegate?.displayName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Unit:</span>
                                        <span className="font-medium">{ouName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Period:</span>
                                        <span className="font-medium">
                                            {startDate && new Date(startDate).toLocaleDateString()} — {endDate && new Date(endDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="border-t pt-2">
                                        <span className="text-muted-foreground text-xs">Responsibilities:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {selectedRoleIds.map(id => {
                                                const role = delegableRoles.find(r => r.roleId === id);
                                                return role ? (
                                                    <Badge key={id} variant="secondary" className="text-xs gap-1">
                                                        {role.businessLabel}
                                                        {role.requiresApproval && <AlertTriangle className="h-2.5 w-2.5 text-amber-500" />}
                                                    </Badge>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                    {reason && (
                                        <div className="border-t pt-2">
                                            <span className="text-muted-foreground text-xs">Reason:</span>
                                            <p className="text-sm">{reason}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {hasApprovalRequired && (
                                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-amber-800 dark:text-amber-300">
                                        Some selected responsibilities require admin approval. This delegation will not activate until approved.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="flex justify-between">
                        {wizardStep > 1 && (
                            <Button variant="outline" onClick={() => setWizardStep(s => s - 1)}>
                                Back
                            </Button>
                        )}
                        <div className="flex gap-2 ml-auto">
                            <Button variant="ghost" onClick={() => setWizardOpen(false)}>Cancel</Button>
                            {wizardStep < 4 ? (
                                <Button
                                    onClick={() => setWizardStep(s => s + 1)}
                                    disabled={
                                        (wizardStep === 1 && selectedRoleIds.length === 0) ||
                                        (wizardStep === 2 && !selectedDelegate) ||
                                        (wizardStep === 3 && (!startDate || !endDate || !reason))
                                    }>
                                    Next <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            ) : (
                                <Button onClick={submitDelegation} disabled={submitting}>
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Handshake className="h-4 w-4 mr-1" />}
                                    {hasApprovalRequired ? 'Submit for Approval' : 'Activate Delegation'}
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ==================== Revoke Dialog ==================== */}
            <Dialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Revoke Delegation</DialogTitle>
                        <DialogDescription>
                            This will immediately remove all delegated permissions from {revokeTarget?.delegateName}.
                        </DialogDescription>
                    </DialogHeader>
                    <div>
                        <Label className="text-xs text-muted-foreground">Reason</Label>
                        <Textarea
                            placeholder="Reason for revocation..."
                            value={revokeReason}
                            onChange={e => setRevokeReason(e.target.value)}
                            rows={2}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setRevokeTarget(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleRevoke} disabled={revoking}>
                            {revoking ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RotateCcw className="h-4 w-4 mr-1" />}
                            Revoke
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
