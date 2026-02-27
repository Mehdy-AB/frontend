'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Eye, Check, X, RotateCcw, AlertCircle, FileText, Clock, Loader2,
    ChevronRight, ChevronLeft, Calendar, Users, MoreVertical,
    FolderOpen, UserPlus, ArrowLeft, ArrowRight, Shield, User,
    CheckCircle2, XCircle, Ban, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { workflowAdminService } from '@/api/services/workflowAdminService';
import { WorkflowNodeInstanceResponse } from '@/types/workflow';
import UserAvatar from '@/components/main/UserAvatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AssigneeSelector from '@/components/workflow/AssigneeSelector';
import InstanceDetailView from './InstanceDetailView';

interface NodeInstancesPanelProps {
    workflowId: number;
    nodeId: string;
    nodeType: string;
    documentId?: number;
}

interface SelectedInstance {
    id: number;
    instanceId: number;
    documentTitle?: string;
    documentId: number;
}

type StatusFilter = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'FAILED' | 'REJECTED';

const STATUS_TABS: { key: StatusFilter; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'ALL', label: 'All', icon: <Filter className="w-3.5 h-3.5" />, color: 'text-gray-600 bg-gray-100 border-gray-300' },
    { key: 'ACTIVE', label: 'Active', icon: <Clock className="w-3.5 h-3.5" />, color: 'text-blue-600 bg-blue-50 border-blue-300' },
    { key: 'COMPLETED', label: 'Completed', icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-green-600 bg-green-50 border-green-300' },
    { key: 'REJECTED', label: 'Rejected', icon: <XCircle className="w-3.5 h-3.5" />, color: 'text-red-600 bg-red-50 border-red-300' },
    { key: 'CANCELLED', label: 'Cancelled', icon: <Ban className="w-3.5 h-3.5" />, color: 'text-gray-500 bg-gray-50 border-gray-300' },
    { key: 'FAILED', label: 'Failed', icon: <AlertCircle className="w-3.5 h-3.5" />, color: 'text-orange-600 bg-orange-50 border-orange-300' },
];

export default function NodeInstancesPanel({ workflowId, nodeId, nodeType, documentId }: NodeInstancesPanelProps) {
    const [instances, setInstances] = useState<WorkflowNodeInstanceResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    // Modal states
    const [reassignModal, setReassignModal] = useState<SelectedInstance | null>(null);
    const [dueDateModal, setDueDateModal] = useState<SelectedInstance | null>(null);
    const [rejectModal, setRejectModal] = useState<SelectedInstance | null>(null);
    const [rollbackModal, setRollbackModal] = useState<SelectedInstance | null>(null);

    // Selected instance for detail view
    const [selectedInstance, setSelectedInstance] = useState<WorkflowNodeInstanceResponse | null>(null);

    // Form states
    const [newAssignees, setNewAssignees] = useState<any[]>([]);
    const [newDueDate, setNewDueDate] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [rollbackReason, setRollbackReason] = useState('');

    const fetchInstances = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const apiStatus = statusFilter === 'ALL' ? undefined : statusFilter;
            const data = await workflowAdminService.getInstancesAtNode(workflowId, nodeId, apiStatus, documentId);
            setInstances(data);

            // Update selectedInstance with fresh data if it's still in the list
            setSelectedInstance(prev => {
                if (!prev) return null;
                const updated = data.find(inst => inst.id === prev.id);
                return updated || null;
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load instances');
        } finally {
            setLoading(false);
        }
    }, [workflowId, nodeId, statusFilter, documentId]);

    useEffect(() => {
        fetchInstances();
    }, [fetchInstances]);

    // Actions
    const handleApprove = async (inst: WorkflowNodeInstanceResponse) => {
        if (!confirm('Force approve this task and advance to next step?')) return;
        try {
            setActionLoading(inst.id);
            await workflowAdminService.completeNode(inst.id, { comment: 'Force approved by admin' });
            await fetchInstances();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to approve');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async () => {
        if (!rejectModal || !rejectReason.trim()) return;
        try {
            setActionLoading(rejectModal.id);
            await workflowAdminService.rejectNode(rejectModal.id, { rejectionReason: rejectReason });
            setRejectModal(null);
            setRejectReason('');
            await fetchInstances();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to reject');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReassign = async () => {
        if (!reassignModal || newAssignees.length === 0) return;
        try {
            setActionLoading(reassignModal.id);
            await workflowAdminService.reassignNode(
                reassignModal.instanceId,
                reassignModal.id,
                {
                    assignments: newAssignees.map(a => {
                        const typeUpper = (a.type as string).toUpperCase() as 'USER' | 'ROLE' | 'GROUP';
                        return {
                            assigneeType: typeUpper,
                            userId: typeUpper === 'USER' ? a.entity.id : undefined,
                            roleId: typeUpper === 'ROLE' ? a.entity.id : undefined,
                            groupId: typeUpper === 'GROUP' ? a.entity.id : undefined
                        };
                    })
                }
            );
            setReassignModal(null);
            setNewAssignees([]);
            await fetchInstances();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to reassign');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateDueDate = async () => {
        if (!dueDateModal || !newDueDate) return;
        try {
            setActionLoading(dueDateModal.id);
            await workflowAdminService.updateNodeDueDate(
                dueDateModal.instanceId,
                dueDateModal.id,
                { dueDate: newDueDate }
            );
            setDueDateModal(null);
            setNewDueDate('');
            await fetchInstances();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update due date');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRollback = async () => {
        if (!rollbackModal) return;
        try {
            setActionLoading(rollbackModal.id);
            await workflowAdminService.rollbackToNode(
                rollbackModal.instanceId,
                { targetNodeId: '', reason: rollbackReason || 'Sent back by admin' }
            );
            setRollbackModal(null);
            setRollbackReason('');
            await fetchInstances();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to rollback');
        } finally {
            setActionLoading(null);
        }
    };

    const handleViewDocument = (documentId: number) => {
        window.open(`/documents/${documentId}`, '_blank');
    };

    const filteredInstances = instances.filter((inst) =>
        inst.documentTitle?.toLowerCase().includes(search.toLowerCase())
    );

    const canApproveReject = nodeType === 'approvalNode';
    const canComplete = ['reviewNode', 'manualTaskNode'].includes(nodeType);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
                <p className="text-red-600 font-medium">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchInstances} className="mt-4">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retry
                </Button>
            </div>
        );
    }

    // Show detail view when an instance is selected
    if (selectedInstance) {
        return (
            <InstanceDetailView
                instance={selectedInstance}
                canApproveReject={canApproveReject}
                canComplete={canComplete}
                nodeType={nodeType}
                onBack={() => setSelectedInstance(null)}
                onRefresh={fetchInstances}
            />
        );
    }

    return (
        <div className="space-y-4">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
                {STATUS_TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setStatusFilter(tab.key)}
                        className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                            ${statusFilter === tab.key
                                ? `${tab.color} border-current shadow-sm`
                                : 'text-gray-500 bg-white border-gray-200 hover:bg-gray-50'
                            }
                        `}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Input
                        placeholder="Search documents..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-64"
                    />
                    <Button variant="outline" size="icon" onClick={fetchInstances} title="Refresh">
                        <RotateCcw className="w-4 h-4" />
                    </Button>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                        <FileText className="w-4 h-4" />
                        <strong>{filteredInstances.length}</strong> document(s)
                    </span>
                    {filteredInstances.filter((i) => i.isOverdue).length > 0 && (
                        <span className="flex items-center gap-2 text-red-600">
                            <Clock className="w-4 h-4" />
                            <strong>{filteredInstances.filter((i) => i.isOverdue).length}</strong> overdue
                        </span>
                    )}
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredInstances.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <FileText className="w-7 h-7 text-gray-400" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900 mb-1">
                        {statusFilter === 'ALL' ? 'No Instances' : `No ${statusFilter.charAt(0) + statusFilter.slice(1).toLowerCase()} Instances`}
                    </h3>
                    <p className="text-gray-500 text-sm">
                        {statusFilter === 'ALL'
                            ? 'No documents have been processed at this node yet'
                            : `There are no ${statusFilter.toLowerCase()} instances at this node`
                        }
                    </p>
                </div>
            )}

            {/* Cards Grid */}
            {!loading && filteredInstances.length > 0 && (
                <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-1">
                    {filteredInstances.map((inst) => {
                        const isActionable = inst.status === 'ACTIVE' || inst.status === 'PENDING' || inst.status === 'SCHEDULED';
                        return (
                            <InstanceCard
                                key={inst.id}
                                instance={inst}
                                isLoading={actionLoading === inst.id}
                                isSelected={false}
                                canApproveReject={canApproveReject && isActionable}
                                canComplete={canComplete && isActionable}
                                nodeType={nodeType}
                                onSelect={() => setSelectedInstance(inst)}
                                onView={() => handleViewDocument(inst.documentId)}
                                onApprove={() => handleApprove(inst)}
                                onReject={() => setRejectModal({
                                    id: inst.id,
                                    instanceId: inst.workflowInstanceId,
                                    documentTitle: inst.documentTitle,
                                    documentId: inst.documentId
                                })}
                                onReassign={() => setReassignModal({
                                    id: inst.id,
                                    instanceId: inst.workflowInstanceId,
                                    documentTitle: inst.documentTitle,
                                    documentId: inst.documentId
                                })}
                                onUpdateDueDate={() => {
                                    setNewDueDate(inst.dueDate ? inst.dueDate.split('T')[0] : '');
                                    setDueDateModal({
                                        id: inst.id,
                                        instanceId: inst.workflowInstanceId,
                                        documentTitle: inst.documentTitle,
                                        documentId: inst.documentId
                                    });
                                }}
                                onSendBack={() => setRollbackModal({
                                    id: inst.id,
                                    instanceId: inst.workflowInstanceId,
                                    documentTitle: inst.documentTitle,
                                    documentId: inst.documentId
                                })}
                            />
                        );
                    })}
                </div>
            )}

            {/* Reject Modal */}
            <Dialog open={!!rejectModal} onOpenChange={() => setRejectModal(null)}>
                <DialogContent className="z-[100]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <X className="w-5 h-5" />
                            Reject Document
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-gray-600">
                            Rejecting: <strong>{rejectModal?.documentTitle}</strong>
                        </p>
                        <div>
                            <Label>Rejection Reason *</Label>
                            <Textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Enter the reason for rejection..."
                                rows={3}
                                className="mt-1"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectModal(null)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={!rejectReason.trim() || actionLoading !== null}
                        >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reassign Modal */}
            <Dialog open={!!reassignModal} onOpenChange={() => setReassignModal(null)}>
                <DialogContent className="max-w-lg z-[100]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-blue-600" />
                            Reassign Task
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-gray-600">
                            Reassigning: <strong>{reassignModal?.documentTitle}</strong>
                        </p>
                        <div>
                            <Label>New Assignee(s) *</Label>
                            <div className="mt-2">
                                <AssigneeSelector
                                    assignments={newAssignees}
                                    onChange={setNewAssignees}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReassignModal(null)}>Cancel</Button>
                        <Button
                            onClick={handleReassign}
                            disabled={newAssignees.length === 0 || actionLoading !== null}
                        >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Reassign
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Due Date Modal */}
            <Dialog open={!!dueDateModal} onOpenChange={() => setDueDateModal(null)}>
                <DialogContent className="z-[100]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-orange-600" />
                            Update Due Date
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-gray-600">
                            Document: <strong>{dueDateModal?.documentTitle}</strong>
                        </p>
                        <div>
                            <Label>New Due Date *</Label>
                            <Input
                                type="datetime-local"
                                value={newDueDate}
                                onChange={(e) => setNewDueDate(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDueDateModal(null)}>Cancel</Button>
                        <Button
                            onClick={handleUpdateDueDate}
                            disabled={!newDueDate || actionLoading !== null}
                        >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Update
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rollback Modal */}
            <Dialog open={!!rollbackModal} onOpenChange={() => setRollbackModal(null)}>
                <DialogContent className="z-[100]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                            <ArrowLeft className="w-5 h-5" />
                            Send Back to Previous Step
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-gray-600">
                            Document: <strong>{rollbackModal?.documentTitle}</strong>
                        </p>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <p className="text-sm text-amber-700">
                                This will send the document back to the previous step in the workflow.
                            </p>
                        </div>
                        <div>
                            <Label>Reason (optional)</Label>
                            <Textarea
                                value={rollbackReason}
                                onChange={(e) => setRollbackReason(e.target.value)}
                                placeholder="Why is this being sent back?"
                                rows={2}
                                className="mt-1"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRollbackModal(null)}>Cancel</Button>
                        <Button
                            onClick={handleRollback}
                            disabled={actionLoading !== null}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Send Back
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Instance Card Component
interface InstanceCardProps {
    instance: WorkflowNodeInstanceResponse;
    isLoading: boolean;
    isSelected: boolean;
    canApproveReject: boolean;
    canComplete: boolean;
    nodeType: string;
    onSelect: () => void;
    onView: () => void;
    onApprove: () => void;
    onReject: () => void;
    onReassign: () => void;
    onUpdateDueDate: () => void;
    onSendBack: () => void;
}

function InstanceCard({
    instance,
    isLoading,
    isSelected,
    canApproveReject,
    canComplete,
    nodeType,
    onSelect,
    onView,
    onApprove,
    onReject,
    onReassign,
    onUpdateDueDate,
    onSendBack
}: InstanceCardProps) {
    const isOverdue = instance.isOverdue || (instance.dueDate && isPast(new Date(instance.dueDate)));

    return (
        <div
            className={`
                border rounded-xl p-4 transition-all duration-200 cursor-pointer
                ${isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : isOverdue
                        ? 'border-red-200 bg-red-50/50 hover:border-red-300'
                        : 'border-gray-200 bg-white hover:border-blue-200 hover:shadow-md'
                }
            `}
            onClick={onSelect}
        >
            <div className="flex items-start gap-4">
                {/* Document Icon */}
                <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                    ${isOverdue ? 'bg-red-100' : 'bg-blue-100'}
                `}>
                    <FileText className={`w-6 h-6 ${isOverdue ? 'text-red-600' : 'text-blue-600'}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            {/* Document Title - Clickable */}
                            <h4
                                className="font-semibold text-gray-900 truncate cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                                onClick={onView}
                                title="Click to open document"
                            >
                                {instance.documentTitle || 'Untitled Document'}
                            </h4>
                            {/* Meta */}
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                {/* Folder info from new API */}
                                {instance.document?.folderName && (
                                    <>
                                        <span className="flex items-center gap-1">
                                            <FolderOpen className="w-3 h-3" />
                                            {instance.document.folderName}
                                        </span>
                                        <span>•</span>
                                    </>
                                )}
                                <span className="flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    ID: {instance.documentId}
                                </span>
                                <span>•</span>
                                <span>Arrived {formatDistanceToNow(new Date(instance.startedAt), { addSuffix: true })}</span>
                            </div>
                            {/* Owner info from new API */}
                            {instance.document?.ownedBy && (
                                <div className="flex items-center gap-1.5 mt-1.5">
                                    <span className="text-xs text-gray-400">Owner:</span>
                                    <div className="flex items-center gap-1">
                                        {instance.document.ownedBy.imgUrl ? (
                                            <img
                                                src={instance.document.ownedBy.imgUrl}
                                                alt=""
                                                className="w-4 h-4 rounded-full"
                                            />
                                        ) : (
                                            <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-600">
                                                {(instance.document.ownedBy.firstName || '?').charAt(0)}
                                            </div>
                                        )}
                                        <span className="text-xs text-gray-600">
                                            {instance.document.ownedBy.firstName} {instance.document.ownedBy.lastName}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Status Badge */}
                        <div className={`
                            flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0
                            ${isOverdue ? 'bg-red-100 text-red-700'
                                : instance.status === 'COMPLETED' ? 'bg-green-100 text-green-700'
                                    : instance.status === 'REJECTED' ? 'bg-red-100 text-red-700'
                                        : instance.status === 'CANCELLED' ? 'bg-gray-100 text-gray-600'
                                            : instance.status === 'FAILED' ? 'bg-orange-100 text-orange-700'
                                                : 'bg-blue-100 text-blue-700'
                            }
                        `}>
                            {isOverdue && <Clock className="w-3 h-3" />}
                            {instance.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3" />}
                            {instance.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                            {instance.status === 'CANCELLED' && <Ban className="w-3 h-3" />}
                            {isOverdue ? 'Overdue' : instance.status}
                        </div>
                    </div>

                    {/* Details Row */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        {/* Due Date */}
                        <div className="flex items-center gap-4">
                            <div>
                                <span className="text-xs text-gray-400 uppercase tracking-wide">Due Date</span>
                                <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                                    {instance.dueDate
                                        ? format(new Date(instance.dueDate), 'MMM d, yyyy HH:mm')
                                        : 'No deadline'}
                                </p>
                            </div>

                            {/* Assignees */}
                            <div className="flex items-center gap-2">
                                <div>
                                    <span className="text-xs text-gray-400 uppercase tracking-wide">Assignees</span>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        {instance.assignments?.slice(0, 4).map((a, i) => (
                                            <div key={i} title={a.assigneeName || a.userId || 'Unknown'} className="relative">
                                                <UserAvatar user={a.user} size="xs" />
                                            </div>
                                        ))}
                                        {instance.assignments && instance.assignments.length > 4 && (
                                            <span className="text-xs text-gray-500 ml-1">
                                                +{instance.assignments.length - 4}
                                            </span>
                                        )}
                                        {(!instance.assignments || instance.assignments.length === 0) && (
                                            <span className="text-xs text-gray-400">None</span>
                                        )}
                                    </div>
                                </div>
                                {/* Edit Assignees Button */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onReassign}
                                    className="h-6 w-6 text-gray-400 hover:text-blue-600"
                                    title="Modify assignees"
                                >
                                    <UserPlus className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onView}
                                className="h-8"
                            >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                            </Button>

                            {canApproveReject && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onApprove}
                                        disabled={isLoading}
                                        className="h-8 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4 mr-1" />
                                                Approve
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onReject}
                                        disabled={isLoading}
                                        className="h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                    >
                                        <X className="w-4 h-4 mr-1" />
                                        Reject
                                    </Button>
                                </>
                            )}

                            {canComplete && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onApprove}
                                    disabled={isLoading}
                                    className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4 mr-1" />
                                            Done
                                        </>
                                    )}
                                </Button>
                            )}

                            {/* More Actions */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={onReassign}>
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Reassign
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={onUpdateDueDate}>
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Update Due Date
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={onSendBack} className="text-amber-600">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Send Back
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
