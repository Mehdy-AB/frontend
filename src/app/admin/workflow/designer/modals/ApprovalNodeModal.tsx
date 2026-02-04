'use client';

import { useState, useEffect } from 'react';
import { X, UserCheck, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { WorkflowNodeData } from '../nodes/types';
import AssigneeSelector, {
    StepAssignment,
    fromAssignmentEntities,
    toAssignmentRequests,
    toAssignmentEntities
} from '@/components/workflow/AssigneeSelector';

interface ApprovalNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

const APPROVAL_POLICIES = [
    { value: 'ANY', label: 'Any (one approval sufficient)' },
    { value: 'ALL', label: 'All (everyone must approve)' },
    { value: 'MAJORITY', label: 'Majority (>50% must approve)' },
    { value: 'MIN_N', label: 'Minimum N (set threshold)' },
];

const REJECT_POLICIES = [
    { value: 'ANY_REJECTS', label: 'Any rejection rejects' },
    { value: 'MAJORITY_REJECTS', label: 'Majority must reject' },
];

const TIMEOUT_ACTIONS = [
    { value: 'REMIND', label: 'Send Reminder', description: 'Notify assignees and continue waiting' },
    { value: 'AUTO_APPROVE', label: 'Auto Approve', description: 'Automatically approve the task' },
    { value: 'AUTO_REJECT', label: 'Auto Reject', description: 'Automatically reject the task' },
    { value: 'ESCALATE', label: 'Escalate', description: 'Reassign to manager or escalation path' },
    { value: 'CANCEL_WORKFLOW', label: 'Cancel Workflow', description: 'Cancel the entire workflow' },
    { value: 'FAIL', label: 'Fail Workflow', description: 'Mark workflow as failed' },
];

export default function ApprovalNodeModal({ isOpen, onClose, nodeData, onSave }: ApprovalNodeModalProps) {
    // Basic settings
    const [label, setLabel] = useState(nodeData.label || 'Approval');
    const [description, setDescription] = useState(nodeData.description || '');
    const [notificationSubject, setNotificationSubject] = useState(nodeData.notificationSubject || 'Approval Required: ${doc.name}');
    const [notificationBody, setNotificationBody] = useState(nodeData.notificationBody || 'Please review and approve the document.');

    // Policy settings
    const [approvalPolicy, setApprovalPolicy] = useState(nodeData.approvalPolicy || 'ANY');
    const [rejectPolicy, setRejectPolicy] = useState(nodeData.rejectPolicy || 'ANY_REJECTS');
    const [minApprovalsNeeded, setMinApprovalsNeeded] = useState(nodeData.minApprovalsNeeded || 1);

    // Timeout settings
    const [timeoutEnabled, setTimeoutEnabled] = useState(nodeData.timeoutEnabled || false);
    const [timeoutValue, setTimeoutValue] = useState(nodeData.timeoutValue || 48);
    const [timeoutUnit, setTimeoutUnit] = useState<'HOURS' | 'DAYS'>(nodeData.timeoutUnit || 'HOURS');
    const [timeoutAction, setTimeoutAction] = useState(nodeData.timeoutAction || 'REMIND');
    const [useTimeoutExit, setUseTimeoutExit] = useState(nodeData.useTimeoutExit || false);

    // Escalation target (when ESCALATE action is selected)
    const [escalationTarget, setEscalationTarget] = useState<StepAssignment[]>([]);

    // Assignments
    const [assignments, setAssignments] = useState<StepAssignment[]>([]);

    useEffect(() => {
        if (isOpen) {
            setLabel(nodeData.label || 'Approval');
            setDescription(nodeData.description || '');
            setNotificationSubject(nodeData.notificationSubject || 'Approval Required: ${doc.name}');
            setNotificationBody(nodeData.notificationBody || 'Please review and approve the document.');
            setApprovalPolicy(nodeData.approvalPolicy || 'ANY');
            setRejectPolicy(nodeData.rejectPolicy || 'ANY_REJECTS');
            setMinApprovalsNeeded(nodeData.minApprovalsNeeded || 1);
            setTimeoutEnabled(nodeData.timeoutEnabled || false);
            setTimeoutValue(nodeData.timeoutValue || 48);
            setTimeoutUnit(nodeData.timeoutUnit || 'HOURS');
            setTimeoutAction(nodeData.timeoutAction || 'REMIND');
            setUseTimeoutExit(nodeData.useTimeoutExit || false);
            setEscalationTarget(fromAssignmentEntities(nodeData.escalationTargetEntities));
            setAssignments(fromAssignmentEntities(nodeData.assignmentEntities));
        }
    }, [isOpen, nodeData]);

    // Determine if timeout exit makes sense for the action
    const canUseTimeoutExit = ['ESCALATE', 'FAIL'].includes(timeoutAction);
    const showEscalationTarget = timeoutEnabled && timeoutAction === 'ESCALATE';

    const handleSave = () => {
        onSave({
            label,
            description,
            notificationSubject,
            notificationBody,
            approvalPolicy,
            rejectPolicy,
            minApprovalsNeeded: approvalPolicy === 'MIN_N' ? minApprovalsNeeded : undefined,
            timeoutEnabled,
            timeoutValue: timeoutEnabled ? timeoutValue : undefined,
            timeoutUnit: timeoutEnabled ? timeoutUnit : undefined,
            timeoutAction: timeoutEnabled ? timeoutAction : undefined,
            useTimeoutExit: timeoutEnabled && canUseTimeoutExit ? useTimeoutExit : false,
            assignments: toAssignmentRequests(assignments),
            assignmentEntities: toAssignmentEntities(assignments),
            // Also store in config format for backend
            'policy.type': approvalPolicy,
            'policy.min': minApprovalsNeeded,
            'timeout.value': timeoutValue,
            'timeout.unit': timeoutUnit,
            'timeout.action': timeoutAction,
            'timeout.useTimeoutExit': useTimeoutExit,
            // Escalation target configuration
            escalationTarget: showEscalationTarget ? toAssignmentRequests(escalationTarget) : undefined,
            escalationTargetEntities: showEscalationTarget ? toAssignmentEntities(escalationTarget) : undefined,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-blue-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <UserCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Configure Approval</h3>
                            <p className="text-sm text-gray-500">Multi-user approval settings</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-gray-200 flex items-center justify-center">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Basic Settings */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Basic Settings</h4>
                        <div className="grid gap-4">
                            <div>
                                <Label>Step Name</Label>
                                <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Approval Step" />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Instructions for approvers..." rows={2} />
                            </div>
                        </div>
                    </div>

                    {/* Approval Policy */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Approval Policy</h4>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label>Approval Threshold</Label>
                                <Select value={approvalPolicy} onValueChange={setApprovalPolicy}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {APPROVAL_POLICIES.map(p => (
                                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Rejection Policy</Label>
                                <Select value={rejectPolicy} onValueChange={setRejectPolicy}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {REJECT_POLICIES.map(p => (
                                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {approvalPolicy === 'MIN_N' && (
                            <div className="w-32">
                                <Label>Minimum Approvals</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={minApprovalsNeeded}
                                    onChange={(e) => setMinApprovalsNeeded(parseInt(e.target.value) || 1)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Notification Settings */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Notification</h4>
                        <div className="grid gap-4">
                            <div>
                                <Label>Email Subject</Label>
                                <Input value={notificationSubject} onChange={(e) => setNotificationSubject(e.target.value)} />
                            </div>
                            <div>
                                <Label>Email Body</Label>
                                <Textarea value={notificationBody} onChange={(e) => setNotificationBody(e.target.value)} rows={2} />
                            </div>
                        </div>
                    </div>

                    {/* Timeout Settings */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Timeout / Expiration
                            </h4>
                            <Switch checked={timeoutEnabled} onCheckedChange={setTimeoutEnabled} />
                        </div>

                        {timeoutEnabled && (
                            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label>Timeout After</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                min={1}
                                                value={timeoutValue}
                                                onChange={(e) => setTimeoutValue(parseInt(e.target.value) || 1)}
                                                className="w-24"
                                            />
                                            <Select value={timeoutUnit} onValueChange={(v) => setTimeoutUnit(v as 'HOURS' | 'DAYS')}>
                                                <SelectTrigger className="w-28">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="HOURS">Hours</SelectItem>
                                                    <SelectItem value="DAYS">Days</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div>
                                        <Label>On Timeout</Label>
                                        <Select value={timeoutAction} onValueChange={setTimeoutAction}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TIMEOUT_ACTIONS.map(a => (
                                                    <SelectItem key={a.value} value={a.value}>
                                                        <div className="flex flex-col">
                                                            <span>{a.label}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Timeout action description */}
                                <div className="text-xs text-orange-700 bg-orange-100 px-3 py-2 rounded">
                                    {TIMEOUT_ACTIONS.find(a => a.value === timeoutAction)?.description}
                                </div>

                                {/* Use TIMEOUT exit option */}
                                {canUseTimeoutExit && (
                                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                                            <div>
                                                <Label className="text-sm">Use TIMEOUT Exit Path</Label>
                                                <p className="text-xs text-gray-500">Creates a separate exit for timeout flow</p>
                                            </div>
                                        </div>
                                        <Switch checked={useTimeoutExit} onCheckedChange={setUseTimeoutExit} />
                                    </div>
                                )}

                                {/* Escalation Target Selector - shown when ESCALATE action is selected */}
                                {showEscalationTarget && (
                                    <div className="bg-white rounded-lg border border-orange-200 p-4 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                                            <Label className="text-sm font-medium">Escalate To (Required)</Label>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Select who should receive the task when escalated due to timeout.
                                        </p>
                                        <AssigneeSelector
                                            assignments={escalationTarget}
                                            onChange={setEscalationTarget}
                                            label=""
                                            accentColor="orange"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Assignments Section using reusable component */}
                    <AssigneeSelector
                        assignments={assignments}
                        onChange={setAssignments}
                        label="Approvers"
                        accentColor="blue"
                    />
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600">
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
