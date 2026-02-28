'use client';

import { useState, useEffect } from 'react';
import {
    Search, RefreshCw, Filter, Check, Ban, Trash2,
    AlertTriangle, Clock, FileText, CheckCircle, XCircle,
    ChevronRight, Calendar, User, MoreVertical, Eye, ExternalLink,
    CalendarDays, X as XIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { workflowAdminService } from '@/api/services/workflowAdminService';
import { WorkflowInstanceResponse, InstanceStatus } from '@/types/workflow';
import UserAvatar from '@/components/main/UserAvatar';
import Pagination from '@/components/main/Pagination';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow, format, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface InstancesTabProps {
    workflowId: number;
}

export default function InstancesTab({ workflowId }: InstancesTabProps) {
    const router = useRouter();
    const { showSuccess, showError } = useNotifications();
    const [instances, setInstances] = useState<WorkflowInstanceResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // Confirmations
    const [confirmAction, setConfirmAction] = useState<{
        type: 'cancel' | 'complete' | 'delete' | null;
        instanceIds: number[];
    }>({ type: null, instanceIds: [] });
    const [actionReason, setActionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadInstances();
    }, [workflowId, page, pageSize, search, statusFilter, dateFrom, dateTo]);

    const loadInstances = async () => {
        setLoading(true);
        try {
            const response = await workflowAdminService.getWorkflowInstances(
                workflowId,
                page,
                pageSize,
                search || undefined,
                statusFilter !== 'all' ? statusFilter as any : undefined
            );

            // Client-side date filtering
            let filtered = response.content;
            if (dateFrom || dateTo) {
                filtered = filtered.filter(inst => {
                    if (!inst.startedAt) return false;
                    const instDate = parseISO(inst.startedAt);
                    if (dateFrom && dateTo) {
                        return isWithinInterval(instDate, {
                            start: parseISO(dateFrom),
                            end: parseISO(dateTo + 'T23:59:59')
                        });
                    }
                    if (dateFrom) return instDate >= parseISO(dateFrom);
                    if (dateTo) return instDate <= parseISO(dateTo + 'T23:59:59');
                    return true;
                });
            }

            setInstances(filtered);
            setTotalElements(response.totalElements);
            setTotalPages(response.totalPages);
        } catch (error) {
            showError('Failed to load instances');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(instances.map(i => i.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        const newSet = new Set(selectedIds);
        if (checked) {
            newSet.add(id);
        } else {
            newSet.delete(id);
        }
        setSelectedIds(newSet);
    };

    const handleOpenInstance = (instanceId: number) => {
        router.push(`/admin/workflow/instance/${instanceId}`);
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setDateFrom('');
        setDateTo('');
    };

    const hasActiveFilters = search || statusFilter !== 'all' || dateFrom || dateTo;

    const executeBulkAction = async () => {
        if (!confirmAction.type) return;
        setActionLoading(true);

        try {
            let result;
            if (confirmAction.type === 'cancel') {
                result = await workflowAdminService.bulkCancelInstances(
                    workflowId,
                    {
                        instanceIds: confirmAction.instanceIds,
                        reason: actionReason || 'Cancelled by admin'
                    }
                );
            } else if (confirmAction.type === 'complete') {
                result = await workflowAdminService.bulkForceCompleteInstances(
                    workflowId,
                    {
                        instanceIds: confirmAction.instanceIds,
                        comment: actionReason || 'Force completed by admin'
                    }
                );
            } else if (confirmAction.type === 'delete') {
                result = await workflowAdminService.bulkDeleteInstances(
                    workflowId,
                    { instanceIds: confirmAction.instanceIds }
                );
            }

            if (result) {
                showSuccess(
                    `Operation completed: ${result.successCount} successful, ${result.failureCount} failed`
                );
            }

            setConfirmAction({ type: null, instanceIds: [] });
            setActionReason('');
            setSelectedIds(new Set());
            loadInstances();
        } catch (error) {
            showError('Operation failed');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'RUNNING':
            case 'ACTIVE':
                return {
                    color: 'bg-blue-100 text-blue-700 border-blue-200',
                    icon: <Clock className="h-3 w-3" />,
                    label: 'Running'
                };
            case 'COMPLETED':
                return {
                    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                    icon: <CheckCircle className="h-3 w-3" />,
                    label: 'Completed'
                };
            case 'CANCELLED':
                return {
                    color: 'bg-gray-100 text-gray-700 border-gray-200',
                    icon: <XCircle className="h-3 w-3" />,
                    label: 'Cancelled'
                };
            case 'FAILED':
                return {
                    color: 'bg-red-100 text-red-700 border-red-200',
                    icon: <AlertTriangle className="h-3 w-3" />,
                    label: 'Failed'
                };
            case 'REJECTED':
                return {
                    color: 'bg-orange-100 text-orange-700 border-orange-200',
                    icon: <XCircle className="h-3 w-3" />,
                    label: 'Rejected'
                };
            default:
                return {
                    color: 'bg-gray-100 text-gray-700 border-gray-200',
                    icon: <FileText className="h-3 w-3" />,
                    label: status
                };
        }
    };

    // Better progress calculation for tree workflows
    const getProgressInfo = (instance: WorkflowInstanceResponse) => {
        const completed = instance.completedNodesCount || 0;
        const total = instance.totalNodesCount || 0;
        const status = instance.status;

        // For completed/cancelled/failed - show as 100% or final state
        if (status === 'COMPLETED') {
            return { percentage: 100, label: 'Completed', color: 'bg-emerald-500' };
        }
        if (status === 'CANCELLED') {
            return { percentage: 100, label: 'Cancelled', color: 'bg-gray-400' };
        }
        if (status === 'FAILED') {
            return { percentage: 100, label: 'Failed', color: 'bg-red-500' };
        }

        // For active instances, show actual progress
        if (total === 0) return { percentage: 0, label: '0 steps', color: 'bg-blue-500' };

        const percentage = Math.round((completed / total) * 100);
        return {
            percentage,
            label: `${completed} / ${total} steps`,
            color: 'bg-blue-500'
        };
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Search & Actions Bar - Fixed */}
            <div className="flex-none bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4">
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    <div className="flex flex-wrap gap-3 items-center">
                        {/* Search */}
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by document..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-white border-gray-300"
                            />
                        </div>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px] bg-white border-gray-300">
                                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="ACTIVE">Running</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                <SelectItem value="FAILED">Failed</SelectItem>
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
                    </div>

                    <div className="flex items-center gap-2">
                        {selectedIds.size > 0 && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                                <Badge variant="secondary" className="px-3 py-1 bg-blue-100 text-blue-700">
                                    {selectedIds.size} selected
                                </Badge>
                                <div className="h-6 w-px bg-gray-300 mx-1" />

                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-300"
                                    onClick={() => setConfirmAction({ type: 'complete', instanceIds: Array.from(selectedIds) })}
                                >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Complete
                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-300"
                                    onClick={() => setConfirmAction({ type: 'cancel', instanceIds: Array.from(selectedIds) })}
                                >
                                    <Ban className="h-4 w-4 mr-1" />
                                    Cancel
                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                                    onClick={() => setConfirmAction({ type: 'delete', instanceIds: Array.from(selectedIds) })}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                </Button>
                            </div>
                        )}

                        <Button variant="ghost" size="icon" onClick={() => loadInstances()} className="text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="flex-none flex items-center gap-2 text-sm text-gray-600 px-1 mb-2">
                <span>Showing {instances.length} of {totalElements} instances</span>
            </div>

            {/* Instances Cards - Scrollable */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {loading ? (
                    <div className="flex items-center justify-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
                        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                        Loading instances...
                    </div>
                ) : instances.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p className="font-medium">No instances found</p>
                        <p className="text-sm mt-1">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    instances.map((instance) => {
                        const statusConfig = getStatusConfig(instance.status);
                        const progressInfo = getProgressInfo(instance);
                        const isSelected = selectedIds.has(instance.id);

                        return (
                            <div
                                key={instance.id}
                                className={cn(
                                    "group bg-white rounded-xl border p-4 transition-all duration-200 cursor-pointer shadow-sm",
                                    isSelected
                                        ? "border-blue-400 ring-2 ring-blue-100"
                                        : "border-gray-200 hover:border-blue-300 hover:shadow-md"
                                )}
                                onClick={() => handleOpenInstance(instance.id)}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Checkbox */}
                                    <div className="flex-shrink-0 pt-1" onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={(checked) => handleSelectOne(instance.id, !!checked)}
                                        />
                                    </div>

                                    {/* Main Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Header Row */}
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                                    <h4 className="font-semibold text-gray-900 truncate">
                                                        {instance.document?.name || 'Unknown Document'}
                                                    </h4>
                                                    <Badge className={cn("font-medium text-xs flex items-center gap-1 border", statusConfig.color)}>
                                                        {statusConfig.icon}
                                                        {statusConfig.label}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    Instance #{instance.id}
                                                </p>
                                            </div>

                                            {/* Actions Menu */}
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-gray-700">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-white">
                                                        <DropdownMenuItem onClick={() => handleOpenInstance(instance.id)} className="text-gray-700">
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => window.open(`/documents/preview/${instance.documentId}`, '_blank')} className="text-gray-700">
                                                            <ExternalLink className="h-4 w-4 mr-2" />
                                                            Open Document
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {instance.status === InstanceStatus.ACTIVE && (
                                                            <>
                                                                <DropdownMenuItem
                                                                    onClick={() => setConfirmAction({ type: 'complete', instanceIds: [instance.id] })}
                                                                    className="text-emerald-600"
                                                                >
                                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                                    Force Complete
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => setConfirmAction({ type: 'cancel', instanceIds: [instance.id] })}
                                                                    className="text-amber-600"
                                                                >
                                                                    <Ban className="h-4 w-4 mr-2" />
                                                                    Cancel
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() => setConfirmAction({ type: 'delete', instanceIds: [instance.id] })}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>

                                        {/* Info Row */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                            {/* Current Step */}
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Current Step</p>
                                                <Badge variant="outline" className="font-normal text-xs bg-gray-50 text-gray-700 border-gray-200">
                                                    {instance.currentNodeLabel || instance.currentNodeId || '-'}
                                                </Badge>
                                            </div>

                                            {/* Started At */}
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Started</p>
                                                <div className="flex items-center gap-1 text-sm text-gray-700">
                                                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                    {instance.startedAt ? format(new Date(instance.startedAt), 'MMM d, HH:mm') : '-'}
                                                </div>
                                            </div>

                                            {/* Started By */}
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Started By</p>
                                                {instance.startedBy ? (
                                                    <div className="flex items-center gap-2">
                                                        <UserAvatar user={instance.startedBy} size="xs" showTooltip />
                                                        <span className="text-sm text-gray-700 truncate">
                                                            {instance.startedBy.displayName || instance.startedBy.username}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500">System</span>
                                                )}
                                            </div>

                                            {/* Duration */}
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Duration</p>
                                                <div className="flex items-center gap-1 text-sm text-gray-700">
                                                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                    {instance.startedAt
                                                        ? formatDistanceToNow(new Date(instance.startedAt), { addSuffix: false })
                                                        : '-'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar - Improved for tree workflows */}
                                        <div className="mt-4 pt-3 border-t border-gray-100">
                                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                                <span>Progress</span>
                                                <span className="font-medium text-gray-700">
                                                    {instance.status === 'COMPLETED' ? (
                                                        <span className="text-emerald-600">✓ Completed</span>
                                                    ) : instance.status === 'CANCELLED' ? (
                                                        <span className="text-gray-500">Cancelled</span>
                                                    ) : instance.status === 'FAILED' ? (
                                                        <span className="text-red-600">Failed</span>
                                                    ) : (
                                                        progressInfo.label
                                                    )}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full transition-all", progressInfo.color)}
                                                    style={{ width: `${progressInfo.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Open Arrow */}
                                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination - Fixed */}
            {totalPages > 1 && (
                <div className="flex-none bg-white rounded-xl border border-gray-200 p-4 mt-4">
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

            {/* Confirmation Modals */}
            <ConfirmationModal
                isOpen={confirmAction.type !== null}
                title={
                    confirmAction.type === 'cancel' ? "Cancel Instances" :
                        confirmAction.type === 'complete' ? "Force Complete Instances" :
                            "Delete Instances"
                }
                message={
                    confirmAction.type === 'delete'
                        ? `WARNING: This will PERMANENTLY delete ${confirmAction.instanceIds.length} instances and all their history. This cannot be undone.`
                        : `Are you sure you want to ${confirmAction.type} ${confirmAction.instanceIds.length} instances?`
                }
                confirmText={
                    confirmAction.type === 'cancel' ? "Confirm Cancel" :
                        confirmAction.type === 'complete' ? "Force Complete" :
                            "Delete Forever"
                }
                variant={confirmAction.type === 'complete' ? 'default' : 'destructive'}
                onConfirm={executeBulkAction}
                onClose={() => setConfirmAction({ type: null, instanceIds: [] })}
                loading={actionLoading}
            >
                {confirmAction.type !== 'delete' && (
                    <div className="mt-4">
                        <label className="text-sm font-medium text-gray-700">
                            {confirmAction.type === 'cancel' ? 'Reason for cancellation:' : 'Comment:'}
                        </label>
                        <Input
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                            placeholder="Enter details..."
                            className="mt-1"
                        />
                    </div>
                )}
            </ConfirmationModal>
        </div>
    );
}
