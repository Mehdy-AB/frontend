'use client';

import { useState, useEffect } from 'react';
import {
    ArrowLeft, Eye, Check, X, Clock, Calendar, Users, FileText,
    FolderOpen, Loader2, Edit2, Save, UserPlus, ChevronRight,
    Shield, User, RotateCcw, CheckCircle2, XCircle, AlertCircle, RefreshCw, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { workflowAdminService } from '@/api/services/workflowAdminService';
import { WorkflowNodeInstanceResponse, WorkflowTimelineResponse, WorkflowHistoryResponse } from '@/types/workflow';
import UserAvatar from '@/components/main/UserAvatar';
import { WorkflowTimeline } from '@/components/workflow/WorkflowTimeline';
import AssigneeSelector from '@/components/workflow/AssigneeSelector';
import { apiClient } from '@/api/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


interface InstanceDetailViewProps {
    instance: WorkflowNodeInstanceResponse;
    canApproveReject: boolean;
    canComplete: boolean;
    nodeType: string;
    onBack: () => void;
    onRefresh: () => void;
}

export default function InstanceDetailView({
    instance,
    canApproveReject,
    canComplete,
    nodeType,
    onBack,
    onRefresh
}: InstanceDetailViewProps) {
    const [timeline, setTimeline] = useState<WorkflowTimelineResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Inline edit states
    const [isEditingDueDate, setIsEditingDueDate] = useState(false);
    const [newDueDate, setNewDueDate] = useState(instance.dueDate?.split('T')[0] || '');
    const [isEditingAssignees, setIsEditingAssignees] = useState(false);
    const [newAssignees, setNewAssignees] = useState<any[]>([]);

    // Action states
    const [showApproveForm, setShowApproveForm] = useState(false);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [approveComment, setApproveComment] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [rollbackReason, setRollbackReason] = useState('');
    const [showRollbackForm, setShowRollbackForm] = useState(false);
    const [rollbackTargetNodeId, setRollbackTargetNodeId] = useState<string>('');
    const [showCancelForm, setShowCancelForm] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [showRestartConfirm, setShowRestartConfirm] = useState(false);
    const [showForceCompleteForm, setShowForceCompleteForm] = useState(false);
    const [forceCompleteComment, setForceCompleteComment] = useState('');

    // Live Variables state
    const [liveVariables, setLiveVariables] = useState<any[]>([]);
    const [liveVarLoading, setLiveVarLoading] = useState(false);
    const [editingVarKey, setEditingVarKey] = useState<string | null>(null);
    const [editingVarValue, setEditingVarValue] = useState<string>('');


    useEffect(() => {
        fetchTimeline();
        fetchLiveVariables();
    }, [instance.workflowInstanceId]);

    const fetchTimeline = async () => {
        try {
            setLoading(true);
            const data = await workflowAdminService.getInstanceTimeline(instance.workflowInstanceId);
            setTimeline(data);
        } catch (err) {
            console.error('Failed to fetch timeline:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDocument = () => {
        window.open(`/documents/${instance.documentId}`, '_blank');
    };

    const handleApprove = async () => {
        try {
            setActionLoading(true);
            await workflowAdminService.completeNode(instance.id, {
                comment: approveComment || 'Force approved by admin'
            });
            setShowApproveForm(false);
            setApproveComment('');
            onRefresh();
            onBack();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to approve');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        try {
            setActionLoading(true);
            // API expects: rejectNode(nodeInstanceId, { rejectionReason })
            await workflowAdminService.rejectNode(instance.id, {
                rejectionReason: rejectReason || 'Rejected by admin'
            });
            setShowRejectForm(false);
            setRejectReason('');
            onRefresh();
            onBack();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to reject');
        } finally {
            setActionLoading(false);
        }
    };


    const handleSaveDueDate = async () => {
        if (!newDueDate) return;
        try {
            setActionLoading(true);
            await workflowAdminService.updateNodeDueDate(instance.workflowInstanceId, instance.id, {
                dueDate: new Date(newDueDate).toISOString()
            });
            setIsEditingDueDate(false);
            onRefresh();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update due date');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveAssignees = async () => {
        if (newAssignees.length === 0) return;
        try {
            setActionLoading(true);
            await workflowAdminService.reassignNode(instance.workflowInstanceId, instance.id, {
                assignments: newAssignees.map(a => {
                    const typeUpper = (a.type as string).toUpperCase() as 'USER' | 'ROLE' | 'GROUP';
                    return {
                        assigneeType: typeUpper,
                        userId: typeUpper === 'USER' ? a.entity.id : undefined,
                        roleId: typeUpper === 'ROLE' ? a.entity.id : undefined,
                        groupId: typeUpper === 'GROUP' ? a.entity.id : undefined
                    };
                })
            });
            setIsEditingAssignees(false);
            setNewAssignees([]);
            onRefresh();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to reassign');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRollback = async () => {
        try {
            if (!rollbackTargetNodeId) {
                alert('Please select a step to roll back to.');
                return;
            }

            setActionLoading(true);
            await workflowAdminService.rollbackToNode(instance.workflowInstanceId, {
                targetNodeId: rollbackTargetNodeId,
                reason: rollbackReason || 'Sent back by admin'
            });
            setShowRollbackForm(false);
            setRollbackReason('');
            setRollbackTargetNodeId('');
            onRefresh();
            onBack();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to send back');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelWorkflow = async () => {
        if (!cancelReason.trim()) {
            alert('Please provide a reason for cancellation.');
            return;
        }
        try {
            setActionLoading(true);
            await workflowAdminService.cancelInstance(instance.workflowInstanceId, {
                cancellationReason: cancelReason
            });
            setShowCancelForm(false);
            setCancelReason('');
            onRefresh();
            onBack();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to cancel workflow');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRestart = async () => {
        try {
            setActionLoading(true);
            const newInstance = await workflowAdminService.restartWorkflowInstance(instance.workflowInstanceId);
            setShowRestartConfirm(false);
            alert(`Workflow restarted! New instance ID: ${newInstance.id}`);
            onRefresh();
            onBack();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to restart workflow');
        } finally {
            setActionLoading(false);
        }
    };

    const handleForceComplete = async () => {
        try {
            setActionLoading(true);
            await workflowAdminService.forceCompleteWorkflowInstance(instance.workflowInstanceId, {
                comment: forceCompleteComment || 'Force completed by admin'
            });
            setShowForceCompleteForm(false);
            setForceCompleteComment('');
            onRefresh();
            onBack();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to force complete');
        } finally {
            setActionLoading(false);
        }
    };

    // Live Variables fetch and update
    const fetchLiveVariables = async () => {
        try {
            setLiveVarLoading(true);
            const data = await apiClient.get<any[]>(`/api/v1/workflows/instances/${instance.workflowInstanceId}/variables`);
            setLiveVariables(data);
        } catch (err) {
            console.error('Failed to fetch live variables:', err);
        } finally {
            setLiveVarLoading(false);
        }
    };

    const handleSaveVariable = async (variableKey: string) => {
        try {
            setActionLoading(true);
            const variable = liveVariables.find(v => v.variableKey === variableKey);
            let jsonValue: any;
            if (variable?.type === 'NUMBER') jsonValue = parseInt(editingVarValue) || 0;
            else if (variable?.type === 'DECIMAL') jsonValue = parseFloat(editingVarValue) || 0;
            else if (variable?.type === 'BOOLEAN') jsonValue = editingVarValue === 'true';
            else jsonValue = editingVarValue;

            await apiClient.put(`/api/v1/workflows/instances/${instance.workflowInstanceId}/variables/${variableKey}`, {
                value: jsonValue
            });
            setEditingVarKey(null);
            setEditingVarValue('');
            await fetchLiveVariables();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update variable');
        } finally {
            setActionLoading(false);
        }
    };

    const isOverdue = instance.isOverdue || (instance.dueDate && isPast(new Date(instance.dueDate)));

    // Get completed steps from timeline
    const completedSteps = timeline?.nodes.filter(n =>
        n.status === 'COMPLETED' || n.status === 'SKIPPED'
    ) || [];

    return (
        <div className="space-y-4">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4 pb-3 border-b">
                <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to List
                </Button>
                <div className="flex-1">
                    <h2 className="text-lg font-semibold truncate">
                        {instance.documentTitle || `Document #${instance.documentId}`}
                    </h2>
                    <p className="text-sm text-gray-500">
                        Instance #{instance.workflowInstanceId} • Node: {instance.nodeName}
                    </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${isOverdue
                    ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
                    }`}>
                    {instance.status}
                </span>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column: Document + Timeline */}
                <div className="space-y-4">
                    {/* Document Info Card */}
                    <div className="bg-white rounded-xl border p-4 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                            Document Info
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <FileText className="w-8 h-8 text-blue-500 mt-1" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{instance.documentTitle}</p>
                                    <p className="text-xs text-gray-500">ID: {instance.documentId}</p>
                                </div>
                            </div>
                            {instance.document && (
                                <>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-500">Type:</span>
                                            <span className="ml-2 font-medium">{instance.document.mimeType?.split('/')[1]?.toUpperCase() || 'Unknown'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Size:</span>
                                            <span className="ml-2 font-medium">{((instance.document.sizeBytes || 0) / 1024).toFixed(1)} KB</span>
                                        </div>
                                    </div>
                                    {instance.document.folderName && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <FolderOpen className="w-4 h-4 text-amber-500" />
                                            <span>{instance.document.folderName}</span>
                                        </div>
                                    )}
                                    {instance.document.ownedBy && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-gray-500">Owner:</span>
                                            <UserAvatar user={instance.document.ownedBy} size="xs" />
                                            <span>{instance.document.ownedBy.firstName} {instance.document.ownedBy.lastName}</span>
                                        </div>
                                    )}
                                </>
                            )}
                            <Button variant="outline" size="sm" onClick={handleViewDocument} className="w-full mt-2">
                                <Eye className="w-4 h-4 mr-2" />
                                Open Document
                            </Button>
                        </div>
                    </div>

                    {/* Workflow Timeline - Detailed Steps View */}
                    <div className="bg-white rounded-xl border p-4 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                            Workflow Steps & Activity
                        </h3>

                        {/* Progress Bar - Improved for tree workflows */}
                        {timeline && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Workflow Progress</span>
                                    {timeline.status === 'COMPLETED' ? (
                                        <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
                                            <CheckCircle2 className="h-4 w-4" />
                                            Completed
                                        </span>
                                    ) : timeline.status === 'CANCELLED' ? (
                                        <span className="text-sm font-semibold text-gray-500 flex items-center gap-1">
                                            <XCircle className="h-4 w-4" />
                                            Cancelled
                                        </span>
                                    ) : timeline.status === 'FAILED' ? (
                                        <span className="text-sm font-semibold text-red-600 flex items-center gap-1">
                                            <AlertCircle className="h-4 w-4" />
                                            Failed
                                        </span>
                                    ) : (
                                        <span className="text-sm text-gray-500">
                                            {timeline.completedNodes} of {timeline.totalNodes} nodes executed
                                        </span>
                                    )}
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${timeline.status === 'COMPLETED' ? 'bg-emerald-500' :
                                            timeline.status === 'CANCELLED' ? 'bg-gray-400' :
                                                timeline.status === 'FAILED' ? 'bg-red-500' :
                                                    'bg-blue-500'
                                            }`}
                                        style={{ width: timeline.status === 'COMPLETED' || timeline.status === 'CANCELLED' || timeline.status === 'FAILED' ? '100%' : `${timeline.progressPercentage}%` }}
                                    />
                                </div>
                                {timeline.status === 'ACTIVE' && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        Progress shows steps executed in the current path (some branches may be skipped)
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Detailed Timeline using WorkflowTimeline component */}
                        <WorkflowTimeline
                            workflowInstanceId={instance.workflowInstanceId}
                            documentId={instance.documentId}
                        />
                    </div>

                </div>



                {/* Right Column: Current Node Details + Actions */}
                <div className="space-y-4">
                    {/* Due Date Card */}
                    <div className="bg-white rounded-xl border p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                                Due Date
                            </h3>
                            {!isEditingDueDate && (
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditingDueDate(true)}>
                                    <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                            )}
                        </div>
                        {isEditingDueDate ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    type="datetime-local"
                                    value={newDueDate}
                                    onChange={(e) => setNewDueDate(e.target.value)}
                                    className="flex-1"
                                />
                                <Button size="sm" onClick={handleSaveDueDate} disabled={actionLoading}>
                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setIsEditingDueDate(false)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className={`flex items-center gap-2 text-lg ${isOverdue ? 'text-red-600' : ''}`}>
                                <Calendar className="w-5 h-5" />
                                <span className="font-medium">
                                    {instance.dueDate
                                        ? format(new Date(instance.dueDate), 'MMM d, yyyy HH:mm')
                                        : 'No due date set'}
                                </span>
                                {instance.dueDate && (
                                    <span className={`text-sm ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                                        ({formatDistanceToNow(new Date(instance.dueDate), { addSuffix: true })})
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Assignees Card */}
                    <div className="bg-white rounded-xl border p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                                Current Assignees
                            </h3>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditingAssignees(!isEditingAssignees)}>
                                <UserPlus className="w-3.5 h-3.5" />
                            </Button>
                        </div>

                        {isEditingAssignees ? (
                            <div className="space-y-3">
                                <AssigneeSelector
                                    assignments={newAssignees}
                                    onChange={setNewAssignees}
                                />
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={handleSaveAssignees} disabled={actionLoading || newAssignees.length === 0}>
                                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        Save Assignees
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => {
                                        setIsEditingAssignees(false);
                                        setNewAssignees([]);
                                    }}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {instance.assignments && instance.assignments.length > 0 ? (
                                    instance.assignments.map((a, i) => {
                                        const displayName = a.assigneeType === 'USER'
                                            ? (a.assigneeName || a.user?.firstName || 'Unknown User')
                                            : a.assigneeType === 'ROLE'
                                                ? (a.role?.name || a.assigneeName || 'Unknown Role')
                                                : (a.group?.name || a.assigneeName || 'Unknown Group');

                                        const bgColor = a.assigneeType === 'USER'
                                            ? 'bg-blue-100 text-blue-600'
                                            : a.assigneeType === 'ROLE'
                                                ? 'bg-purple-100 text-purple-600'
                                                : 'bg-green-100 text-green-600';

                                        return (
                                            <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                                {a.assigneeType === 'USER' && a.user ? (
                                                    <UserAvatar user={a.user} size="sm" />
                                                ) : (
                                                    <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center`}>
                                                        {a.assigneeType === 'ROLE' ? <Shield className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{displayName}</p>
                                                    <p className="text-xs text-gray-500 capitalize">{a.assigneeType.toLowerCase()}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-gray-400 text-center py-2">No assignees</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Live Variables Card */}
                    {liveVariables.length > 0 && (
                        <div className="bg-white rounded-xl border p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                                    Live Variables
                                </h3>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fetchLiveVariables}>
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                            {liveVarLoading ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {liveVariables.map((v) => (
                                        <div key={v.variableKey} className="border rounded-lg p-3 hover:bg-gray-50/50 transition-colors">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-800">{v.label || v.variableKey}</span>
                                                    <span className="text-xs bg-blue-50 text-blue-600 rounded px-1.5 py-0.5">{v.type}</span>
                                                    {v.isRequired && <span className="text-xs bg-red-50 text-red-500 rounded px-1 py-0.5">*</span>}
                                                </div>
                                                {editingVarKey !== v.variableKey && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => {
                                                            setEditingVarKey(v.variableKey);
                                                            const val = v.value;
                                                            setEditingVarValue(val !== null && val !== undefined ? String(typeof val === 'object' ? JSON.stringify(val) : val) : '');
                                                        }}
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                            {editingVarKey === v.variableKey ? (
                                                <div className="flex items-center gap-2 mt-2">
                                                    {v.type === 'BOOLEAN' ? (
                                                        <Select value={editingVarValue} onValueChange={setEditingVarValue}>
                                                            <SelectTrigger className="h-8 text-sm flex-1"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="true">True</SelectItem>
                                                                <SelectItem value="false">False</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <Input
                                                            value={editingVarValue}
                                                            onChange={(e) => setEditingVarValue(e.target.value)}
                                                            type={v.type === 'NUMBER' || v.type === 'DECIMAL' ? 'number' : v.type === 'DATE' ? 'date' : v.type === 'TIME' ? 'time' : v.type === 'DATETIME' ? 'datetime-local' : v.type === 'EMAIL' ? 'email' : 'text'}
                                                            className="h-8 text-sm flex-1"
                                                        />
                                                    )}
                                                    <Button size="sm" className="h-8" onClick={() => handleSaveVariable(v.variableKey)} disabled={actionLoading}>
                                                        <Save className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingVarKey(null)}>
                                                        <X className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-600 font-mono bg-gray-50 rounded px-2 py-1 mt-1">
                                                    {v.value !== null && v.value !== undefined ? String(v.value) : <span className="text-gray-300 italic">empty</span>}
                                                </div>
                                            )}
                                            {v.updatedBy && (
                                                <div className="text-xs text-gray-400 mt-1">Last updated by: {v.updatedBy}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions Card */}
                    {canApproveReject && (
                        <div className="bg-white rounded-xl border p-4 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                                Admin Actions
                            </h3>

                            <div className="space-y-3">
                                {/* Approve Form */}
                                {showApproveForm ? (
                                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                        <Label className="text-green-700">Comment (optional)</Label>
                                        <Textarea
                                            value={approveComment}
                                            onChange={(e) => setApproveComment(e.target.value)}
                                            placeholder="Add a comment for this approval..."
                                            rows={2}
                                            className="mt-1 mb-2"
                                        />
                                        <div className="flex gap-2">
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={actionLoading}>
                                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                                Confirm Approve
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setShowApproveForm(false)}>Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        className="w-full bg-green-600 hover:bg-green-700"
                                        onClick={() => setShowApproveForm(true)}
                                        disabled={actionLoading}
                                    >
                                        <Check className="w-4 h-4 mr-2" />
                                        Force Approve
                                    </Button>
                                )}

                                {/* Reject Form */}
                                {showRejectForm ? (
                                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                        <Label className="text-red-700">Rejection Reason (optional)</Label>
                                        <Textarea
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                            placeholder="Why is this being rejected?"
                                            rows={2}
                                            className="mt-1 mb-2"
                                        />
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="destructive" onClick={handleReject} disabled={actionLoading}>
                                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <X className="w-4 h-4 mr-2" />}
                                                Confirm Reject
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setShowRejectForm(false)}>Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        variant="destructive"
                                        className="w-full"
                                        onClick={() => setShowRejectForm(true)}
                                        disabled={actionLoading}
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Reject
                                    </Button>
                                )}

                                {/* Rollback/Send Back with Node Selection */}
                                {showRollbackForm ? (
                                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                                        <Label className="text-amber-700">Select Step to Roll Back To</Label>
                                        <select
                                            value={rollbackTargetNodeId}
                                            onChange={(e) => setRollbackTargetNodeId(e.target.value)}
                                            className="w-full mt-1 mb-2 p-2 border border-amber-300 rounded-md bg-white text-sm"
                                        >
                                            <option value="">-- Select a step --</option>
                                            {completedSteps.map(node => (
                                                <option key={node.id} value={node.nodeId}>
                                                    {node.nodeName || node.nodeId}
                                                </option>
                                            ))}
                                        </select>
                                        <Label className="text-amber-700">Reason (optional)</Label>
                                        <Textarea
                                            value={rollbackReason}
                                            onChange={(e) => setRollbackReason(e.target.value)}
                                            placeholder="Why is this being sent back?"
                                            rows={2}
                                            className="mt-1 mb-2"
                                        />
                                        <div className="flex gap-2">
                                            <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={handleRollback} disabled={actionLoading || !rollbackTargetNodeId}>
                                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                                                Confirm Send Back
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => { setShowRollbackForm(false); setRollbackTargetNodeId(''); }}>Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                                        onClick={() => setShowRollbackForm(true)}
                                        disabled={actionLoading || completedSteps.length === 0}
                                    >
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        Send Back to Step
                                    </Button>
                                )}

                                {/* Force Complete Workflow */}
                                {showForceCompleteForm ? (
                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <Label className="text-blue-700">Comment (optional)</Label>
                                        <Textarea
                                            value={forceCompleteComment}
                                            onChange={(e) => setForceCompleteComment(e.target.value)}
                                            placeholder="Why is this workflow being force completed?"
                                            rows={2}
                                            className="mt-1 mb-2"
                                        />
                                        <div className="flex gap-2">
                                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleForceComplete} disabled={actionLoading}>
                                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                                Confirm Force Complete
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setShowForceCompleteForm(false)}>Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                                        onClick={() => setShowForceCompleteForm(true)}
                                        disabled={actionLoading}
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Force Complete Workflow
                                    </Button>
                                )}

                                {/* Cancel Workflow Form */}
                                {showCancelForm ? (
                                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                        <Label className="text-red-700">Cancellation Reason (required)</Label>
                                        <Textarea
                                            value={cancelReason}
                                            onChange={(e) => setCancelReason(e.target.value)}
                                            placeholder="Why is this workflow being cancelled?"
                                            rows={2}
                                            className="mt-1 mb-2"
                                            required
                                        />
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="destructive" onClick={handleCancelWorkflow} disabled={actionLoading || !cancelReason.trim()}>
                                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                                                Confirm Cancel
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setShowCancelForm(false)}>Back</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="w-full border-red-300 text-red-700 hover:bg-red-50"
                                        onClick={() => setShowCancelForm(true)}
                                        disabled={actionLoading}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Cancel Workflow
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Admin Actions Card for Review/ManualTask nodes */}
                    {canComplete && (
                        <div className="bg-white rounded-xl border p-4 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                                Admin Actions
                            </h3>

                            <div className="space-y-3">
                                {/* Done Form */}
                                {showApproveForm ? (
                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <Label className="text-blue-700">Comment (optional)</Label>
                                        <Textarea
                                            value={approveComment}
                                            onChange={(e) => setApproveComment(e.target.value)}
                                            placeholder="Add a comment for completing this task..."
                                            rows={2}
                                            className="mt-1 mb-2"
                                        />
                                        <div className="flex gap-2">
                                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleApprove} disabled={actionLoading}>
                                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                                Confirm Done
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setShowApproveForm(false)}>Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                        onClick={() => setShowApproveForm(true)}
                                        disabled={actionLoading}
                                    >
                                        <Check className="w-4 h-4 mr-2" />
                                        Mark as Done
                                    </Button>
                                )}

                                {/* Send Back */}
                                {showRollbackForm ? (
                                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                                        <Label className="text-amber-700">Reason (optional)</Label>
                                        <Textarea
                                            value={rollbackReason}
                                            onChange={(e) => setRollbackReason(e.target.value)}
                                            placeholder="Why is this being sent back?"
                                            rows={2}
                                            className="mt-1 mb-2"
                                        />
                                        <div className="flex gap-2">
                                            <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={handleRollback} disabled={actionLoading}>
                                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
                                                Confirm Send Back
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setShowRollbackForm(false)}>Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                                        onClick={() => setShowRollbackForm(true)}
                                        disabled={actionLoading}
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Send Back
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Restart Workflow Card - For completed/cancelled/failed workflows */}
                    {!canApproveReject && (
                        <div className="bg-white rounded-xl border p-4 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                                Workflow Actions
                            </h3>
                            <div className="space-y-3">
                                {showRestartConfirm ? (
                                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                        <p className="text-sm text-green-700 mb-2">
                                            This will create a new workflow instance for the same document.
                                        </p>
                                        <div className="flex gap-2">
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleRestart} disabled={actionLoading}>
                                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                                Confirm Restart
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setShowRestartConfirm(false)}>Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="w-full border-green-300 text-green-700 hover:bg-green-50"
                                        onClick={() => setShowRestartConfirm(true)}
                                        disabled={actionLoading}
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Restart Workflow
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Activity Log - Full History */}
                    <div className="bg-white rounded-xl border p-4 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                            Activity Log
                        </h3>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                            </div>
                        ) : timeline?.recentHistory && timeline.recentHistory.length > 0 ? (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                                {timeline.recentHistory.map((history, idx) => {
                                    // Determine action type styling
                                    const actionConfig: Record<string, { icon: React.ReactNode; bg: string; text: string; label: string }> = {
                                        'APPROVED': { icon: <Check className="w-3 h-3" />, bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
                                        'REJECTED': { icon: <X className="w-3 h-3" />, bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
                                        'COMPLETED': { icon: <CheckCircle2 className="w-3 h-3" />, bg: 'bg-blue-100', text: 'text-blue-700', label: 'Completed' },
                                        'STARTED': { icon: <Clock className="w-3 h-3" />, bg: 'bg-gray-100', text: 'text-gray-700', label: 'Started' },
                                        'REASSIGNED': { icon: <Users className="w-3 h-3" />, bg: 'bg-purple-100', text: 'text-purple-700', label: 'Reassigned' },
                                        'ROLLBACK': { icon: <RotateCcw className="w-3 h-3" />, bg: 'bg-amber-100', text: 'text-amber-700', label: 'Sent Back' },
                                        'ROLLED_BACK': { icon: <RotateCcw className="w-3 h-3" />, bg: 'bg-amber-100', text: 'text-amber-700', label: 'Sent Back' },
                                        'CANCELLED': { icon: <XCircle className="w-3 h-3" />, bg: 'bg-gray-100', text: 'text-gray-600', label: 'Cancelled' },
                                        'NODE_STARTED': { icon: <ChevronRight className="w-3 h-3" />, bg: 'bg-blue-50', text: 'text-blue-600', label: 'Step Started' },
                                        'NODE_COMPLETED': { icon: <CheckCircle2 className="w-3 h-3" />, bg: 'bg-green-50', text: 'text-green-600', label: 'Step Completed' },
                                    };
                                    const config = actionConfig[history.action] || { icon: <AlertCircle className="w-3 h-3" />, bg: 'bg-gray-100', text: 'text-gray-700', label: history.action };

                                    return (
                                        <div
                                            key={history.id || idx}
                                            className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                        >
                                            {/* User Avatar */}
                                            {history.performedBy ? (
                                                <UserAvatar
                                                    user={{
                                                        id: history.performedBy.id,
                                                        username: history.performedBy.username,
                                                        firstName: history.performedBy.firstName,
                                                        lastName: history.performedBy.lastName,
                                                        displayName: history.performedBy.displayName,
                                                    }}
                                                    size="sm"
                                                />
                                            ) : (
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${config.bg} ${config.text} flex items-center justify-center`}>
                                                    {config.icon}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${config.bg} ${config.text}`}>
                                                        {config.label}
                                                    </span>
                                                    {history.nodeName && (
                                                        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                            {history.nodeName}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs font-medium text-gray-700">
                                                        {history.performedBy?.displayName || history.performedBy?.firstName || history.performedBy?.username || 'System'}
                                                    </span>
                                                    <span className="text-xs text-gray-400">•</span>
                                                    <span className="text-xs text-gray-500">
                                                        {format(new Date(history.performedAt), 'MMM d, yyyy HH:mm')}
                                                    </span>
                                                </div>
                                                {history.comment && (
                                                    <p className="text-xs text-gray-600 mt-1.5 italic bg-gray-50 p-2 rounded border border-gray-100">
                                                        "{history.comment}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 text-center py-4">No activity recorded yet</p>
                        )}
                    </div>

                </div>

            </div>
        </div >
    );
}
