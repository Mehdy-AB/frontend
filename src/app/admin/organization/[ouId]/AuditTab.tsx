'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Activity,
    Search,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    CheckCircle,
    XCircle,
    Clock,
    Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import UserAvatar from '@/components/main/UserAvatar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { auditLogService, AuditLogResponseDto } from '@/api/services/auditLogService';

// ==================== Constants ====================

const OU_ENTITY_TYPES = ['ORG_UNIT', 'ORG_POSITION', 'ORG_UNIT_GROUP', 'ORG_UNIT_GROUP_MEMBER'];

const OU_AUDIT_ACTIONS = [
    { value: 'ALL', label: 'All Actions' },
    { value: 'ORG_UNIT_CREATE', label: 'Unit Created' },
    { value: 'ORG_UNIT_UPDATE', label: 'Unit Updated' },
    { value: 'ORG_UNIT_DELETE', label: 'Unit Deleted' },
    { value: 'ORG_UNIT_MOVE', label: 'Unit Moved' },
    { value: 'ORG_UNIT_USER_ASSIGN', label: 'User Assigned' },
    { value: 'ORG_UNIT_USER_REMOVE', label: 'User Removed' },
    { value: 'ORG_UNIT_HEAD_SET', label: 'Head Set' },
    { value: 'ORG_GROUP_CREATE', label: 'Group Created' },
    { value: 'ORG_GROUP_UPDATE', label: 'Group Updated' },
    { value: 'ORG_GROUP_DELETE', label: 'Group Deleted' },
    { value: 'ORG_GROUP_MEMBER_ASSIGN', label: 'Group Member Added' },
    { value: 'ORG_GROUP_MEMBER_REMOVE', label: 'Group Member Removed' },
    { value: 'ORG_POSITION_CREATE', label: 'Position Created' },
    { value: 'ORG_POSITION_UPDATE', label: 'Position Updated' },
    { value: 'ORG_POSITION_DELETE', label: 'Position Deleted' },
];

function getActionColor(action: string | null): string {
    if (!action) return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300';
    if (action.includes('CREATE')) return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800';
    if (action.includes('UPDATE') || action.includes('MOVE')) return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800';
    if (action.includes('ASSIGN') || action.includes('SET')) return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800';
    if (action.includes('REMOVE')) return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800';
    return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300';
}

function formatActionLabel(action: string | null): string {
    if (!action) return 'Unknown';
    return action
        .replace('ORG_UNIT_', '')
        .replace('ORG_GROUP_', 'GRP ')
        .replace('ORG_POSITION_', 'POS ')
        .replace('MEMBER_', 'MBR ')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

interface AuditTabProps {
    ouId: string;
}

// ==================== Component ====================

export default function AuditTab({ ouId }: AuditTabProps) {
    // State
    const [logs, setLogs] = useState<AuditLogResponseDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [actionFilter, setActionFilter] = useState('ALL');
    const [searchInput, setSearchInput] = useState('');
    const [searchDebounced, setSearchDebounced] = useState('');
    const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

    // ==================== Fetch Audit Logs (Server-side) ====================

    const fetchLogs = useCallback(async (p: number, action: string, search: string) => {
        try {
            setLoading(true);
            const result = await auditLogService.filter({
                entityTypes: OU_ENTITY_TYPES,
                actions: action && action !== 'ALL' ? [action] : undefined,
                search: search || undefined,
                page: p,
                size: 15,
                sortBy: 'timestamp',
                sortDir: 'desc',
            });
            setLogs(result.content || []);
            setTotalPages(result.totalPages || 0);
            setTotalElements(result.totalElements || 0);
        } catch {
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs(page, actionFilter, searchDebounced);
    }, [page, actionFilter, searchDebounced, fetchLogs]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchDebounced(searchInput);
            setPage(0);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Reset page on filter change
    const handleActionFilterChange = (val: string) => {
        setActionFilter(val);
        setPage(0);
    };

    const formatTimestamp = (ts: string) => {
        const d = new Date(ts);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
            ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    // ==================== Render ====================

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" />
                            Audit History
                            {totalElements > 0 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{totalElements}</Badge>
                            )}
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => fetchLogs(page, actionFilter, searchDebounced)} className="gap-1.5 text-xs">
                            <RefreshCw className="h-3 w-3" /> Refresh
                        </Button>
                    </div>
                    {/* Filters */}
                    <div className="flex items-center gap-2 mt-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search audit logs..."
                                className="pl-9 h-8 text-sm"
                            />
                        </div>
                        <Select value={actionFilter} onValueChange={handleActionFilterChange}>
                            <SelectTrigger className="w-48 h-8 text-sm">
                                <Filter className="h-3 w-3 mr-1.5 text-muted-foreground" />
                                <SelectValue placeholder="All Actions" />
                            </SelectTrigger>
                            <SelectContent>
                                {OU_AUDIT_ACTIONS.map(a => (
                                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
                            <p className="text-muted-foreground text-sm">Loading audit logs...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-10">
                            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                            <p className="text-muted-foreground">
                                {searchInput || (actionFilter && actionFilter !== 'ALL') ? 'No audit events match your filters' : 'No audit events recorded for this unit'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {logs.map(log => (
                                <div key={log.id} className="rounded-lg border overflow-hidden">
                                    <div
                                        className="flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors cursor-pointer"
                                        onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                                    >
                                        {/* Success indicator */}
                                        <div className="flex-shrink-0">
                                            {log.success === true ? (
                                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                            ) : log.success === false ? (
                                                <XCircle className="h-4 w-4 text-destructive" />
                                            ) : (
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </div>

                                        {/* Action badge */}
                                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 flex-shrink-0 ${getActionColor(log.action)}`}>
                                            {formatActionLabel(log.action)}
                                        </Badge>

                                        {/* Entity info */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 text-sm">
                                                {log.entityName && <span className="font-medium truncate">{log.entityName}</span>}
                                                {log.entityType && (
                                                    <span className="text-[10px] text-muted-foreground font-mono">{log.entityType}</span>
                                                )}
                                            </div>
                                            {log.actionDescription && (
                                                <p className="text-xs text-muted-foreground truncate">{log.actionDescription}</p>
                                            )}
                                        </div>

                                        {/* Actor */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {log.user ? (
                                                <div className="flex items-center gap-1.5">
                                                    <UserAvatar user={{ displayName: log.user.displayName, imgUrl: log.user.imgUrl }} size="sm" />
                                                    <span className="text-xs text-muted-foreground">{log.user.displayName || log.username}</span>
                                                </div>
                                            ) : log.username ? (
                                                <span className="text-xs text-muted-foreground">{log.username}</span>
                                            ) : null}
                                        </div>

                                        {/* Timestamp */}
                                        <span className="text-[10px] text-muted-foreground flex-shrink-0 tabular-nums">
                                            {formatTimestamp(log.timestamp)}
                                        </span>
                                    </div>

                                    {/* Expanded details */}
                                    {expandedLogId === log.id && (
                                        <div className="border-t bg-muted/20 p-3 text-xs space-y-1.5">
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                                                {log.httpMethod && (
                                                    <div className="flex gap-2">
                                                        <span className="text-muted-foreground">Method:</span>
                                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{log.httpMethod}</Badge>
                                                    </div>
                                                )}
                                                {log.endpoint && (
                                                    <div className="flex gap-2">
                                                        <span className="text-muted-foreground">Endpoint:</span>
                                                        <span className="font-mono text-[10px] truncate">{log.endpoint}</span>
                                                    </div>
                                                )}
                                                {log.ipAddress && (
                                                    <div className="flex gap-2">
                                                        <span className="text-muted-foreground">IP:</span>
                                                        <span className="font-mono">{log.ipAddress}</span>
                                                    </div>
                                                )}
                                                {log.responseStatus && (
                                                    <div className="flex gap-2">
                                                        <span className="text-muted-foreground">Status:</span>
                                                        <span className={log.responseStatus >= 400 ? 'text-destructive' : 'text-emerald-600'}>{log.responseStatus}</span>
                                                    </div>
                                                )}
                                                {log.durationMs != null && (
                                                    <div className="flex gap-2">
                                                        <span className="text-muted-foreground">Duration:</span>
                                                        <span>{log.durationMs}ms</span>
                                                    </div>
                                                )}
                                                {log.entityId && (
                                                    <div className="flex gap-2">
                                                        <span className="text-muted-foreground">Entity ID:</span>
                                                        <span className="font-mono text-[10px]">{log.entityId}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {log.details && (
                                                <div className="mt-2">
                                                    <span className="text-muted-foreground">Details:</span>
                                                    <pre className="mt-1 p-2 rounded bg-muted text-[10px] font-mono whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                                                        {log.details}
                                                    </pre>
                                                </div>
                                            )}
                                            {log.errorMessage && (
                                                <div className="mt-2">
                                                    <span className="text-destructive font-medium">Error:</span>
                                                    <p className="text-destructive/80 mt-0.5">{log.errorMessage}</p>
                                                </div>
                                            )}
                                            {log.user && (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="text-muted-foreground">Actor:</span>
                                                    <Link href={`/admin/users/${log.user.id}`} className="text-primary hover:underline">
                                                        {log.user.displayName || log.user.username} ({log.user.email})
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-3 border-t">
                            <p className="text-xs text-muted-foreground">
                                Page {page + 1} of {totalPages} · {totalElements} events
                            </p>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="sm" className="h-7 px-2" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="outline" size="sm" className="h-7 px-2" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
