'use client';

import { useState, useEffect } from 'react';
import {
    History, Clock, User, ArrowRight, FileText,
    Activity, CheckCircle, XCircle, RefreshCw, Filter,
    ChevronRight, RotateCcw, Users, AlertTriangle, Ban, Zap,
    CalendarDays, X as XIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { workflowAdminService } from '@/api/services/workflowAdminService';
import { WorkflowHistoryResponse } from '@/types/api';
import UserAvatar from '@/components/main/UserAvatar';
import Pagination from '@/components/main/Pagination';
import { useNotifications } from '@/hooks/useNotifications';
import { format, formatDistanceToNow, parseISO, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';

interface HistoryTabProps {
    workflowId: number;
}

export default function HistoryTab({ workflowId }: HistoryTabProps) {
    const { showError } = useNotifications();
    const [history, setHistory] = useState<WorkflowHistoryResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [actionFilter, setActionFilter] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        loadHistory();
    }, [workflowId, page, pageSize, actionFilter, dateFrom, dateTo]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const response = await workflowAdminService.getWorkflowHistory(
                workflowId,
                page,
                pageSize
            );

            // Client-side filtering
            let filtered = response.content;

            // Action filtering
            if (actionFilter !== 'all') {
                filtered = filtered.filter(h => h.action.includes(actionFilter));
            }

            // Date filtering
            if (dateFrom || dateTo) {
                filtered = filtered.filter(entry => {
                    if (!entry.performedAt) return false;
                    const entryDate = parseISO(entry.performedAt);
                    if (dateFrom && dateTo) {
                        return isWithinInterval(entryDate, {
                            start: parseISO(dateFrom),
                            end: parseISO(dateTo + 'T23:59:59')
                        });
                    }
                    if (dateFrom) return entryDate >= parseISO(dateFrom);
                    if (dateTo) return entryDate <= parseISO(dateTo + 'T23:59:59');
                    return true;
                });
            }

            setHistory(filtered);
            setTotalElements(response.totalElements);
            setTotalPages(response.totalPages);
        } catch (error) {
            showError('Failed to load history');
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setActionFilter('all');
        setDateFrom('');
        setDateTo('');
    };

    const hasActiveFilters = actionFilter !== 'all' || dateFrom || dateTo;

    const getActionConfig = (action: string) => {
        const actionLower = action.toUpperCase();

        if (actionLower.includes('APPROVED') || actionLower.includes('COMPLETED')) {
            return {
                color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                icon: <CheckCircle className="h-4 w-4" />,
                bgIcon: 'bg-emerald-100',
                textIcon: 'text-emerald-600'
            };
        }
        if (actionLower.includes('REJECTED') || actionLower.includes('FAILED')) {
            return {
                color: 'bg-red-100 text-red-700 border-red-200',
                icon: <XCircle className="h-4 w-4" />,
                bgIcon: 'bg-red-100',
                textIcon: 'text-red-600'
            };
        }
        if (actionLower.includes('ROLLBACK') || actionLower.includes('ROLLED_BACK')) {
            return {
                color: 'bg-amber-100 text-amber-700 border-amber-200',
                icon: <RotateCcw className="h-4 w-4" />,
                bgIcon: 'bg-amber-100',
                textIcon: 'text-amber-600'
            };
        }
        if (actionLower.includes('REASSIGNED')) {
            return {
                color: 'bg-purple-100 text-purple-700 border-purple-200',
                icon: <Users className="h-4 w-4" />,
                bgIcon: 'bg-purple-100',
                textIcon: 'text-purple-600'
            };
        }
        if (actionLower.includes('CANCELLED')) {
            return {
                color: 'bg-gray-100 text-gray-700 border-gray-200',
                icon: <Ban className="h-4 w-4" />,
                bgIcon: 'bg-gray-100',
                textIcon: 'text-gray-600'
            };
        }
        if (actionLower.includes('STARTED')) {
            return {
                color: 'bg-blue-100 text-blue-700 border-blue-200',
                icon: <Zap className="h-4 w-4" />,
                bgIcon: 'bg-blue-100',
                textIcon: 'text-blue-600'
            };
        }

        return {
            color: 'bg-gray-100 text-gray-700 border-gray-200',
            icon: <Activity className="h-4 w-4" />,
            bgIcon: 'bg-gray-100',
            textIcon: 'text-gray-600'
        };
    };

    const formatAction = (action: string) => {
        return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header & Filters - Fixed */}
            <div className="flex-none bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4">
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                            <History className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Activity History</h3>
                            <p className="text-sm text-gray-500">{totalElements} events recorded</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Action Filter */}
                        <Select value={actionFilter} onValueChange={setActionFilter}>
                            <SelectTrigger className="w-[160px] bg-white border-gray-300">
                                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                                <SelectValue placeholder="Filter by action" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="all">All Actions</SelectItem>
                                <SelectItem value="APPROVED">Approvals</SelectItem>
                                <SelectItem value="REJECTED">Rejections</SelectItem>
                                <SelectItem value="COMPLETED">Completions</SelectItem>
                                <SelectItem value="STARTED">Started</SelectItem>
                                <SelectItem value="ROLLBACK">Rollbacks</SelectItem>
                                <SelectItem value="REASSIGNED">Reassignments</SelectItem>
                                <SelectItem value="CANCELLED">Cancellations</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Date Range Filter */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn(
                                    "gap-2 bg-white border-gray-300",
                                    (dateFrom || dateTo) && "border-blue-400 text-blue-600"
                                )}>
                                    <CalendarDays className="h-4 w-4" />
                                    {dateFrom || dateTo ? 'Date Filtered' : 'Date Range'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 bg-white p-4" align="start">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">From</label>
                                        <Input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">To</label>
                                        <Input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    {(dateFrom || dateTo) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full text-gray-500"
                                            onClick={() => { setDateFrom(''); setDateTo(''); }}
                                        >
                                            Clear Date Filter
                                        </Button>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* Clear All Filters */}
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <XIcon className="h-4 w-4 mr-1" />
                                Clear All
                            </Button>
                        )}

                        <Button variant="ghost" size="icon" onClick={() => loadHistory()} className="text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Timeline - Scrollable */}
            <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center py-12 text-gray-500">
                        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                        Loading history...
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <History className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p className="font-medium">No history records found</p>
                        <p className="text-sm mt-1">Activity will appear here as workflow progresses</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {history.map((entry, index) => {
                            const actionConfig = getActionConfig(entry.action);

                            return (
                                <div
                                    key={entry.id}
                                    className="p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Timeline Icon */}
                                        <div className={cn(
                                            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                                            actionConfig.bgIcon, actionConfig.textIcon
                                        )}>
                                            {actionConfig.icon}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <Badge className={cn("font-medium text-xs border", actionConfig.color)}>
                                                    {formatAction(entry.action)}
                                                </Badge>

                                                {entry.nodeName && (
                                                    <Badge variant="outline" className="font-normal text-xs bg-gray-50 text-gray-700 border-gray-200">
                                                        <ChevronRight className="h-3 w-3 mr-1" />
                                                        {entry.nodeName}
                                                    </Badge>
                                                )}

                                                {!entry.nodeName && entry.nodeId && (
                                                    <Badge variant="outline" className="font-normal text-xs bg-gray-50 text-gray-700 border-gray-200">
                                                        Node: {entry.nodeId}
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Comment */}
                                            {entry.comment && (
                                                <p className="text-sm text-gray-600 mt-2 italic bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                    "{entry.comment}"
                                                </p>
                                            )}

                                            {/* User & Time */}
                                            <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
                                                {entry.performedBy ? (
                                                    <div className="flex items-center gap-2">
                                                        <UserAvatar user={entry.performedBy} size="xs" />
                                                        <div>
                                                            <span className="font-medium text-gray-700">
                                                                {entry.performedBy.displayName || entry.performedBy.username}
                                                            </span>
                                                            {entry.performedBy.jobTitle && (
                                                                <span className="text-gray-500 ml-1">
                                                                    · {entry.performedBy.jobTitle}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
                                                            <Activity className="h-3 w-3 text-gray-500" />
                                                        </div>
                                                        <span className="text-gray-500">System</span>
                                                    </div>
                                                )}

                                                <span className="text-gray-300">•</span>

                                                <div className="flex items-center gap-1 text-gray-500">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <span>{format(new Date(entry.performedAt), 'MMM d, yyyy HH:mm')}</span>
                                                    <span className="text-gray-400">
                                                        ({formatDistanceToNow(new Date(entry.performedAt), { addSuffix: true })})
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pagination - Fixed */}
            {totalPages > 1 && (
                <div className="flex-none p-4 border-t border-gray-100 bg-white rounded-b-xl mt-0">
                    <Pagination
                        currentPage={page + 1}
                        totalPages={totalPages}
                        totalElements={totalElements}
                        pageSize={pageSize}
                        onPageChange={(p) => setPage(p - 1)}
                        onPageSizeChange={setPageSize}
                    />
                </div>
            )}
        </div>
    );
}
