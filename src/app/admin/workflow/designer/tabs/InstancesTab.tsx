'use client';

import { useState, useEffect } from 'react';
import {
    Search, RefreshCw, Filter, Check, Ban, Trash2,
    AlertTriangle, Clock, FileText, CheckCircle, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { workflowAdminService } from '@/api/services/workflowAdminService';
import { WorkflowInstanceResponse } from '@/types/api';
import UserAvatar from '@/components/main/UserAvatar';
import Pagination from '@/components/main/Pagination';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface InstancesTabProps {
    workflowId: number;
}

export default function InstancesTab({ workflowId }: InstancesTabProps) {
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
    }, [workflowId, page, pageSize, search, statusFilter]);

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
            setInstances(response.content);
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

    const executeBulkAction = async () => {
        if (!confirmAction.type) return;
        setActionLoading(true);

        try {
            let result;
            if (confirmAction.type === 'cancel') {
                result = await workflowAdminService.bulkCancelInstances(
                    workflowId,
                    confirmAction.instanceIds,
                    actionReason || 'Cancelled by admin'
                );
            } else if (confirmAction.type === 'complete') {
                result = await workflowAdminService.bulkForceCompleteInstances(
                    workflowId,
                    confirmAction.instanceIds,
                    actionReason || 'Force completed by admin'
                );
            } else if (confirmAction.type === 'delete') {
                result = await workflowAdminService.bulkDeleteInstances(
                    workflowId,
                    confirmAction.instanceIds
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

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'default'; // blue/primary
            case 'COMPLETED': return 'success'; // green
            case 'CANCELLED': return 'secondary'; // gray
            case 'FAILED': return 'destructive'; // red
            default: return 'outline';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'CANCELLED': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
            case 'FAILED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-4">
            {/* Search & Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
                <div className="flex flex-1 gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search instances..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            <SelectItem value="FAILED">Failed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {selectedIds.size > 0 && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                        <span className="text-sm font-medium whitespace-nowrap hidden sm:inline">
                            {selectedIds.size} selected
                        </span>
                        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2 hidden sm:block" />

                        <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => setConfirmAction({ type: 'complete', instanceIds: Array.from(selectedIds) })}
                        >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            onClick={() => setConfirmAction({ type: 'cancel', instanceIds: Array.from(selectedIds) })}
                        >
                            <Ban className="h-4 w-4 mr-1" />
                            Cancel
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setConfirmAction({ type: 'delete', instanceIds: Array.from(selectedIds) })}
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                        </Button>
                    </div>
                )}

                <Button variant="ghost" size="icon" onClick={() => loadInstances()}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {/* Instances Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40px]">
                                <Checkbox
                                    checked={selectedIds.size === instances.length && instances.length > 0}
                                    onCheckedChange={handleSelectAll}
                                />
                            </TableHead>
                            <TableHead>Instance / Document</TableHead>
                            <TableHead>Current Step</TableHead>
                            <TableHead>Started By</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Created</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Loading instances...
                                </TableCell>
                            </TableRow>
                        ) : instances.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                                    No instances found matching your criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            instances.map((instance) => (
                                <TableRow key={instance.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.has(instance.id)}
                                            onCheckedChange={(checked) => handleSelectOne(instance.id, !!checked)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium flex items-center gap-2">
                                                {instance.document?.name || 'Unknown Document'}
                                            </span>
                                            <span className="text-xs text-gray-500">ID: #{instance.id}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {instance.currentNodeLabel || instance.currentNodeId ? (
                                            <Badge variant="outline" className="font-normal">
                                                {instance.currentNodeLabel || instance.currentNodeId}
                                            </Badge>
                                        ) : (
                                            <span className="text-gray-400 text-sm">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {instance.startedBy ? (
                                            <div className="flex items-center gap-2">
                                                <UserAvatar
                                                    user={instance.startedBy}
                                                    size="xs"
                                                />
                                                <span className="text-sm">{instance.startedBy.displayName}</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-500">System</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={cn("font-medium", getStatusColor(instance.status))}>
                                            {instance.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end text-sm">
                                            <span className="text-gray-900 dark:text-gray-100">
                                                {(instance.createdAt || instance.startedAt) ?
                                                    format(new Date(instance.createdAt || instance.startedAt!), 'MMM d, yyyy') : '-'}
                                            </span>
                                            <span className="text-gray-500 text-xs">
                                                {(instance.createdAt || instance.startedAt) ?
                                                    format(new Date(instance.createdAt || instance.startedAt!), 'HH:mm') : ''}
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                <div className="p-4 border-t">
                    <Pagination
                        currentPage={page + 1}
                        totalPages={totalPages}
                        totalElements={totalElements}
                        pageSize={pageSize}
                        onPageChange={(p) => setPage(p - 1)}
                        onPageSizeChange={setPageSize}
                    />
                </div>
            </div>

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
                        <label className="text-sm font-medium">
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
