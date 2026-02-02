'use client';

import { useState, useEffect } from 'react';
import { X, Search, FileText, Clock, AlertTriangle, Check, Ban, Users, RefreshCw, Loader2 } from 'lucide-react';
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
import { workflowAdminService, NodeDocumentResponse } from '@/api/services/workflowAdminService';
import UserAvatar from '@/components/main/UserAvatar';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

interface NodeDocumentsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    workflowId: number;
    nodeId: string;
    nodeName: string;
    nodeType: string;
}

export default function NodeDocumentsDrawer({
    isOpen,
    onClose,
    workflowId,
    nodeId,
    nodeName,
    nodeType,
}: NodeDocumentsDrawerProps) {
    const { showSuccess, showError } = useNotifications();
    const [documents, setDocuments] = useState<NodeDocumentResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Confirmation modals
    const [confirmAction, setConfirmAction] = useState<{
        type: 'cancel' | 'complete' | 'reassign' | null;
        instanceIds: number[];
    }>({ type: null, instanceIds: [] });
    const [actionReason, setActionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadDocuments();
        }
    }, [isOpen, workflowId, nodeId, page, search, statusFilter]);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const response = await workflowAdminService.getDocumentsAtNode(
                workflowId,
                nodeId,
                page,
                20,
                search || undefined,
                statusFilter !== 'all' ? statusFilter : undefined
            );
            setDocuments(response.content);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);
        } catch (error) {
            showError('Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(documents.map(d => d.instanceId)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (instanceId: number, checked: boolean) => {
        const newSet = new Set(selectedIds);
        if (checked) {
            newSet.add(instanceId);
        } else {
            newSet.delete(instanceId);
        }
        setSelectedIds(newSet);
    };

    const handleBulkCancel = async () => {
        if (confirmAction.type !== 'cancel') return;
        setActionLoading(true);
        try {
            const result = await workflowAdminService.bulkCancelInstances(
                workflowId,
                confirmAction.instanceIds,
                actionReason || 'Cancelled by admin'
            );
            showSuccess(`Cancelled ${result.successCount} instances`);
            setConfirmAction({ type: null, instanceIds: [] });
            setActionReason('');
            setSelectedIds(new Set());
            loadDocuments();
        } catch (error) {
            showError('Failed to cancel instances');
        } finally {
            setActionLoading(false);
        }
    };

    const handleBulkComplete = async () => {
        if (confirmAction.type !== 'complete') return;
        setActionLoading(true);
        try {
            const result = await workflowAdminService.bulkForceCompleteInstances(
                workflowId,
                confirmAction.instanceIds,
                actionReason || 'Force completed by admin'
            );
            showSuccess(`Completed ${result.successCount} instances`);
            setConfirmAction({ type: null, instanceIds: [] });
            setActionReason('');
            setSelectedIds(new Set());
            loadDocuments();
        } catch (error) {
            showError('Failed to complete instances');
        } finally {
            setActionLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-[600px] max-w-full bg-white dark:bg-gray-900 shadow-xl z-50 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h2 className="text-lg font-semibold">Documents at Node</h2>
                        <p className="text-sm text-gray-500">{nodeName} ({nodeType})</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Filters */}
                <div className="p-4 border-b space-y-3">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search documents..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Bulk Actions */}
                    {selectedIds.size > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <span className="text-sm font-medium">{selectedIds.size} selected</span>
                            <div className="flex-1" />
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setConfirmAction({ type: 'complete', instanceIds: Array.from(selectedIds) })}
                            >
                                <Check className="h-4 w-4 mr-1" />
                                Complete
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600"
                                onClick={() => setConfirmAction({ type: 'cancel', instanceIds: Array.from(selectedIds) })}
                            >
                                <Ban className="h-4 w-4 mr-1" />
                                Cancel
                            </Button>
                        </div>
                    )}
                </div>

                {/* Documents List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No documents at this node
                        </div>
                    ) : (
                        <>
                            {/* Select All */}
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <Checkbox
                                    checked={selectedIds.size === documents.length && documents.length > 0}
                                    onCheckedChange={handleSelectAll}
                                />
                                <span className="text-sm text-gray-500">
                                    Select all ({totalElements} total)
                                </span>
                                <Button variant="ghost" size="sm" onClick={loadDocuments}>
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Document Items */}
                            {documents.map((doc) => (
                                <div
                                    key={doc.instanceId}
                                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    <Checkbox
                                        checked={selectedIds.has(doc.instanceId)}
                                        onCheckedChange={(checked) => handleSelectOne(doc.instanceId, !!checked)}
                                    />

                                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium truncate">{doc.documentName}</span>
                                            {doc.isOverdue && (
                                                <Badge variant="destructive" className="text-xs">
                                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                                    Overdue
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="text-sm text-gray-500 mt-1">
                                            {doc.documentPath && (
                                                <span className="mr-3">📁 {doc.documentPath}</span>
                                            )}
                                            <span className="flex items-center gap-1 inline-flex">
                                                <Clock className="h-3 w-3" />
                                                {formatDistanceToNow(new Date(doc.arrivedAt), { addSuffix: true })}
                                            </span>
                                        </div>

                                        {doc.assignees.length > 0 && (
                                            <div className="flex items-center gap-1 mt-2">
                                                <Users className="h-3 w-3 text-gray-400" />
                                                <div className="flex -space-x-2">
                                                    {doc.assignees.slice(0, 3).map((assignee) => (
                                                        <UserAvatar
                                                            key={assignee.id}
                                                            user={assignee as any}
                                                            size="xs"
                                                        />
                                                    ))}
                                                    {doc.assignees.length > 3 && (
                                                        <span className="text-xs text-gray-500 ml-2">
                                                            +{doc.assignees.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <Badge variant="outline" className="text-xs">
                                        {doc.nodeInstanceStatus}
                                    </Badge>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t">
                        <span className="text-sm text-gray-500">
                            Page {page + 1} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={page === 0}
                                onClick={() => setPage(p => p - 1)}
                            >
                                Previous
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirmation Modals */}
            <ConfirmationModal
                isOpen={confirmAction.type === 'cancel'}
                title="Cancel Workflow Instances"
                message={`Are you sure you want to cancel ${confirmAction.instanceIds.length} workflow instance(s)? This action cannot be undone.`}
                confirmText="Cancel Instances"
                variant="destructive"
                onConfirm={handleBulkCancel}
                onClose={() => setConfirmAction({ type: null, instanceIds: [] })}
                loading={actionLoading}
            >
                <div className="mt-4">
                    <label className="text-sm font-medium">Reason (optional)</label>
                    <Input
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        placeholder="Enter cancellation reason..."
                        className="mt-1"
                    />
                </div>
            </ConfirmationModal>

            <ConfirmationModal
                isOpen={confirmAction.type === 'complete'}
                title="Force Complete Workflow Instances"
                message={`Are you sure you want to force complete ${confirmAction.instanceIds.length} workflow instance(s)? This will skip all remaining steps.`}
                confirmText="Force Complete"
                variant="default"
                onConfirm={handleBulkComplete}
                onClose={() => setConfirmAction({ type: null, instanceIds: [] })}
                loading={actionLoading}
            >
                <div className="mt-4">
                    <label className="text-sm font-medium">Comment (optional)</label>
                    <Input
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        placeholder="Enter completion comment..."
                        className="mt-1"
                    />
                </div>
            </ConfirmationModal>
        </>
    );
}
