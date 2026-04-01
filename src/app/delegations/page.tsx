'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Handshake, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2,
    XCircle, AlertTriangle, Shield, Calendar, RotateCcw,
    Loader2, Inbox, Send, RefreshCw, Search, ChevronLeft,
    ChevronRight, X, Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
    delegationService,
    type DelegationResponse,
    type UserDelegationFilter,
    type PageResponse,
} from '@/api/services/delegationService';
import { useNotification } from '@/contexts/NotificationContext';
import UserAvatar from '@/components/main/UserAvatar';

// ==================== Status Helpers ====================

const STATUS_OPTIONS = [
    { value: '_all', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
    { value: 'EXPIRED', label: 'Expired' },
    { value: 'REVOKED', label: 'Revoked' },
    { value: 'REJECTED', label: 'Rejected' },
];

const TYPE_OPTIONS = [
    { value: '_all', label: 'All Types' },
    { value: 'OU_OPERATIONAL', label: 'OU Operational' },
    { value: 'WORKFLOW_TASKS', label: 'Workflow Tasks' },
    { value: 'WORKFLOW_APPROVALS', label: 'Workflow Approvals' },
    { value: 'FORM_ADMIN', label: 'Form Admin' },
    { value: 'WORKFLOW_ADMIN', label: 'Workflow Admin' },
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

const getDomainLabel = (type: string) => {
    const map: Record<string, string> = {
        OU_OPERATIONAL: 'OU Operational',
        WORKFLOW_TASKS: 'Workflow Tasks',
        WORKFLOW_APPROVALS: 'Workflow Approvals',
        FORM_ADMIN: 'Form Admin',
        WORKFLOW_ADMIN: 'Workflow Admin',
    };
    return map[type] || type;
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
        { label: 'Delegation ID', value: <span className="font-mono text-[11px] text-muted-foreground">{d.id}</span> },
        { label: 'Type', value: <Badge variant="outline" className="text-xs">{getDomainLabel(d.delegationType)}</Badge> },
        { label: 'Status', value: getStatusBadge(d.status) },
        { label: 'Scope', value: d.scopes?.[0]?.scopeLabel || '—' },
        { label: 'Start Date', value: formatDate(d.startAt) },
        { label: 'End Date', value: formatDate(d.endAt) },
        { label: 'Requested', value: new Date(d.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) },
        { label: 'Reason', value: d.reason || '—' },
    ];

    if (d.revocationReason) fields.push({ label: 'Revoke Reason', value: <span className="text-destructive">{d.revocationReason}</span> });
    if (d.approvedAt) fields.push({ label: 'Approved At', value: new Date(d.approvedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) });

    return (
        <>
            <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50" onClick={onClose} />
            <div className="fixed top-0 right-0 bottom-0 w-[460px] max-w-[92vw] bg-background border-l z-50 flex flex-col animate-in slide-in-from-right duration-200 shadow-2xl">
                <div className="flex justify-between items-center px-5 py-3.5 border-b bg-muted/30">
                    <h2 className="text-sm font-bold tracking-tight">Delegation Detail</h2>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* Identity bar */}
                    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/40 border">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${d.status === 'ACTIVE' ? 'bg-green-500' : d.status === 'PENDING_APPROVAL' ? 'bg-amber-500' : 'bg-red-500'}`} />
                        <UserAvatar user={{ displayName: d.delegatorName, imgUrl: d.delegatorImgUrl ?? undefined }} size="xs" />
                        <span className="text-sm font-semibold">{d.delegatorName}</span>
                        <span className="text-violet-600 font-bold text-xs">→</span>
                        <UserAvatar user={{ displayName: d.delegateName, imgUrl: d.delegateImgUrl ?? undefined }} size="xs" />
                        <span className="text-sm font-semibold">{d.delegateName}</span>
                    </div>

                    {/* Fields */}
                    <div>
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5 pb-1.5 border-b">Details</h3>
                        <div className="space-y-0">
                            {fields.map(f => (
                                <div key={f.label} className="grid grid-cols-[110px_1fr] gap-2.5 py-1.5 border-b border-border/50 text-sm items-baseline">
                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{f.label}</span>
                                    <span className="break-words">{f.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Roles */}
                    {d.roles && d.roles.length > 0 && (
                        <div>
                            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5 pb-1.5 border-b">Delegated Roles</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {d.roles.map(r => (
                                    <Badge key={r.roleId} variant="secondary" className="text-xs gap-1">
                                        <Shield className="h-2.5 w-2.5" />
                                        {r.businessLabel}
                                        {r.requiresApproval && <AlertTriangle className="h-2.5 w-2.5 text-amber-500" />}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Revoke action */}
                    {d.canRevoke && onRevoke && (
                        <div className="pt-3 border-t">
                            <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => onRevoke(d)}>
                                <RotateCcw className="h-3.5 w-3.5" /> Revoke Delegation
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

// ==================== Main Component ====================

export default function DelegationsPage() {
    const [activeView, setActiveView] = useState<'outgoing' | 'incoming'>('outgoing');
    const { addNotification } = useNotification();

    // Server-side pagination state (separate per tab)
    const [outData, setOutData] = useState<PageResponse<DelegationResponse> | null>(null);
    const [inData, setInData] = useState<PageResponse<DelegationResponse> | null>(null);
    const [outLoading, setOutLoading] = useState(true);
    const [inLoading, setInLoading] = useState(true);

    const defaultFilter = (): UserDelegationFilter => ({
        page: 0, size: 15, sortBy: 'createdAt', sortDir: 'desc',
    });

    const [outFilters, setOutFilters] = useState<UserDelegationFilter>(defaultFilter());
    const [inFilters, setInFilters] = useState<UserDelegationFilter>(defaultFilter());

    // Drawer & Revoke
    const [selectedRow, setSelectedRow] = useState<DelegationResponse | null>(null);
    const [revokeTarget, setRevokeTarget] = useState<DelegationResponse | null>(null);
    const [revokeReason, setRevokeReason] = useState('');
    const [revoking, setRevoking] = useState(false);

    // ==================== Data Loading ====================

    const fetchOutgoing = useCallback(async () => {
        setOutLoading(true);
        try {
            const result = await delegationService.getMyOutgoingPaged(outFilters);
            setOutData(result);
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Error', message: err?.message || 'Failed to load outgoing' });
        } finally {
            setOutLoading(false);
        }
    }, [outFilters, addNotification]);

    const fetchIncoming = useCallback(async () => {
        setInLoading(true);
        try {
            const result = await delegationService.getMyIncomingPaged(inFilters);
            setInData(result);
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Error', message: err?.message || 'Failed to load incoming' });
        } finally {
            setInLoading(false);
        }
    }, [inFilters, addNotification]);

    useEffect(() => { fetchOutgoing(); }, [fetchOutgoing]);
    useEffect(() => { fetchIncoming(); }, [fetchIncoming]);

    const refreshAll = () => {
        fetchOutgoing();
        fetchIncoming();
    };

    // ==================== Revoke ====================

    const handleRevoke = async () => {
        if (!revokeTarget) return;
        try {
            setRevoking(true);
            await delegationService.revokeDelegation(revokeTarget.id, revokeReason);
            addNotification({ type: 'success', title: 'Delegation Revoked', message: 'Permissions have been removed.' });
            setRevokeTarget(null);
            setRevokeReason('');
            setSelectedRow(null);
            refreshAll();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Revoke Failed', message: err?.message || 'Failed to revoke' });
        } finally {
            setRevoking(false);
        }
    };

    // ==================== Current tab data ====================

    const isOutgoing = activeView === 'outgoing';
    const data = isOutgoing ? outData : inData;
    const loading = isOutgoing ? outLoading : inLoading;
    const filters = isOutgoing ? outFilters : inFilters;
    const setFilters = isOutgoing ? setOutFilters : setInFilters;
    const rows = data?.content || [];
    const totalPages = data?.totalPages || 0;

    const activeOut = outData?.content?.filter(d => d.status === 'ACTIVE').length ?? 0;
    const activeIn = inData?.content?.filter(d => d.status === 'ACTIVE').length ?? 0;
    const pendingCount = outData?.content?.filter(d => d.status === 'PENDING_APPROVAL').length ?? 0;

    // ==================== Filter Bar ====================

    const renderFilterBar = () => (
        <div className="flex flex-wrap gap-2 items-center">
            <Select value={filters.status || '_all'} onValueChange={v => setFilters(f => ({ ...f, status: v === '_all' ? undefined : v, page: 0 }))}>
                <SelectTrigger className="w-[150px] h-8 text-xs">
                    <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                    {STATUS_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value || '_all'}>{o.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={filters.delegationType || '_all'} onValueChange={v => setFilters(f => ({ ...f, delegationType: v === '_all' ? undefined : v, page: 0 }))}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                    <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                    {TYPE_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value || '_all'}>{o.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search name or reason..."
                    className="h-8 text-xs pl-8 w-[200px]"
                    value={filters.search || ''}
                    onChange={e => setFilters(f => ({ ...f, search: e.target.value || undefined, page: 0 }))}
                />
            </div>

            <Input
                type="date"
                className="h-8 text-xs w-[140px]"
                value={filters.dateFrom ? filters.dateFrom.split('T')[0] : ''}
                onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value ? new Date(e.target.value).toISOString() : undefined, page: 0 }))}
                title="From date"
            />
            <Input
                type="date"
                className="h-8 text-xs w-[140px]"
                value={filters.dateTo ? filters.dateTo.split('T')[0] : ''}
                onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value ? new Date(e.target.value).toISOString() : undefined, page: 0 }))}
                title="To date"
            />

            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => setFilters(defaultFilter())}>
                <RotateCcw className="h-3 w-3" /> Reset
            </Button>
        </div>
    );

    // ==================== Table ====================

    const renderTable = () => (
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
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                {isOutgoing ? 'Delegate' : 'Delegator'}
                            </th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Scope</th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Roles</th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Period</th>
                            {isOutgoing && <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[80px]"></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {!loading && rows.length === 0 && (
                            <tr>
                                <td colSpan={isOutgoing ? 7 : 6} className="text-center py-16">
                                    <Handshake className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-20" />
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {isOutgoing ? 'No outgoing delegations' : 'No incoming delegations'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {isOutgoing ? "You haven't delegated any responsibilities." : "No one has delegated responsibilities to you yet."}
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
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <UserAvatar user={{ displayName: person.name, imgUrl: person.img ?? undefined }} size="xs" />
                                            <span className="font-medium text-sm">{person.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <Badge variant="outline" className="text-xs">{getDomainLabel(d.delegationType)}</Badge>
                                    </td>
                                    <td className="px-4 py-2.5">{getStatusBadge(d.status)}</td>
                                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{d.scopes?.[0]?.scopeLabel || '—'}</td>
                                    <td className="px-4 py-2.5">
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
                                    <td className="px-4 py-2.5">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(d.startAt)} — {formatDate(d.endAt)}
                                        </span>
                                    </td>
                                    {isOutgoing && (
                                        <td className="px-4 py-2.5">
                                            {d.canRevoke && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
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
                <div className="flex items-center justify-between px-4 py-2.5 border-t text-xs text-muted-foreground">
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
    );

    // ==================== Render ====================

    return (
        <div className="space-y-4 p-4 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 border border-violet-500/20 flex items-center justify-center">
                        <Handshake className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Delegations</h1>
                        <p className="text-xs text-muted-foreground">Manage all your responsibility delegations</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={refreshAll} className="gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Send className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{outData?.totalElements ?? 0}</p>
                            <p className="text-xs text-muted-foreground">Total Outgoing</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <Inbox className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{inData?.totalElements ?? 0}</p>
                            <p className="text-xs text-muted-foreground">Total Incoming</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{pendingCount}</p>
                            <p className="text-xs text-muted-foreground">Pending Approval</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b">
                <button onClick={() => setActiveView('outgoing')}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${activeView === 'outgoing' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                    <ArrowUpRight className="h-4 w-4" />
                    Outgoing ({outData?.totalElements ?? 0})
                </button>
                <button onClick={() => setActiveView('incoming')}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${activeView === 'incoming' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                    <ArrowDownLeft className="h-4 w-4" />
                    Incoming ({inData?.totalElements ?? 0})
                </button>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                {renderFilterBar()}
            </div>

            {/* Table */}
            {renderTable()}

            {/* Detail Drawer */}
            <DelegationDrawer
                delegation={selectedRow}
                onClose={() => setSelectedRow(null)}
                onRevoke={isOutgoing ? (d) => { setSelectedRow(null); setRevokeTarget(d); setRevokeReason(''); } : undefined}
            />

            {/* Revoke Dialog */}
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
