'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ClipboardCheck, Clock, AlertTriangle, Settings, List, Bell, Mail, Paperclip, FileText, Plus } from 'lucide-react';
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
import NodeInstancesPanel from '../components/NodeInstancesPanel';
import TaskFormFieldsEditor from '../components/TaskFormFieldsEditor';
import { TaskFormField } from '@/types/workflow';
import { VariableDefinition } from '../components/variables/types';
import VariableInsertButton from '../components/VariableInsertButton';

interface ManualTaskNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
    workflowId?: number;
    nodeId?: string;
    localVariables?: VariableDefinition[];
}

const TIMEOUT_ACTIONS = [
    { value: 'REMIND', label: 'Send Reminder', description: 'Notify assignees and continue waiting' },
    { value: 'ESCALATE', label: 'Escalate', description: 'Reassign task to another user' },
    { value: 'FAIL', label: 'Fail Workflow', description: 'Stop workflow with failure status' },
    { value: 'FOLLOW_TIMEOUT_PATH', label: 'Follow Timeout Path', description: 'Exit via the TIMEOUT path for custom handling' },
];

export default function ManualTaskNodeModal({ isOpen, onClose, nodeData, onSave, workflowId, nodeId, localVariables = [] }: ManualTaskNodeModalProps) {
    // Tab state for admin monitoring
    const [activeTab, setActiveTab] = useState<'config' | 'notifications' | 'instances'>('config');
    const showInstancesTab = !!workflowId && !!nodeId; // Only show when editing existing workflow

    const [label, setLabel] = useState(nodeData.label || 'Manual Task');
    const [instructions, setInstructions] = useState(nodeData.instructions || '');
    const [description, setDescription] = useState(nodeData.description || '');

    // Timeout settings
    const [timeoutEnabled, setTimeoutEnabled] = useState(nodeData.timeoutEnabled || false);
    const [timeoutValue, setTimeoutValue] = useState(nodeData.timeoutValue || 48);
    const [timeoutUnit, setTimeoutUnit] = useState<'HOURS' | 'DAYS'>(nodeData.timeoutUnit || 'HOURS');
    const [timeoutAction, setTimeoutAction] = useState(nodeData.timeoutAction || 'REMIND');

    // Escalation target (when ESCALATE action is selected)
    const [escalationTarget, setEscalationTarget] = useState<StepAssignment[]>([]);
    const [assignments, setAssignments] = useState<StepAssignment[]>([]);

    // Form fields
    const [formFields, setFormFields] = useState<TaskFormField[]>([]);

    // Notification settings
    const [notifyOnAssignInApp, setNotifyOnAssignInApp] = useState(true);
    const [notifyOnAssignEmail, setNotifyOnAssignEmail] = useState(false);
    const [assignNotifSubject, setAssignNotifSubject] = useState('');
    const [assignNotifBody, setAssignNotifBody] = useState('');
    // Email recipients
    const [assignStaticEmails, setAssignStaticEmails] = useState<string[]>([]);
    const [assignEmailVarKeys, setAssignEmailVarKeys] = useState<string[]>([]);
    const [newStaticEmail, setNewStaticEmail] = useState('');
    // Email attachments
    const [assignAttachDocument, setAssignAttachDocument] = useState(false);
    const [assignAttachVarKeys, setAssignAttachVarKeys] = useState<string[]>([]);

    const assignSubjectRef = useRef<HTMLInputElement>(null);
    const assignBodyRef = useRef<HTMLTextAreaElement>(null);

    const fileVariables = localVariables.filter(v => v.type === 'FILE' || v.type === 'DOCUMENT');
    const emailVariables = localVariables.filter(v => v.type === 'EMAIL');

    useEffect(() => {
        if (isOpen) {
            setLabel(nodeData.label || 'Manual Task');
            setInstructions(nodeData.instructions || '');
            setDescription(nodeData.description || '');
            setTimeoutEnabled(nodeData.timeoutEnabled || false);
            setTimeoutValue(nodeData.timeoutValue || 48);
            setTimeoutUnit(nodeData.timeoutUnit || 'HOURS');
            setTimeoutAction(nodeData.timeoutAction || 'REMIND');
            setEscalationTarget(fromAssignmentEntities(nodeData.escalationTargetEntities));
            setAssignments(fromAssignmentEntities(nodeData.assignmentEntities));
            setFormFields(nodeData.formFields || []);

            // Notification settings
            const nd = nodeData as any;
            setNotifyOnAssignInApp(nd.notifyOnAssignInApp ?? true);
            setNotifyOnAssignEmail(nd.notifyOnAssignEmail ?? false);
            setAssignNotifSubject(nd.assignNotifSubject || '');
            setAssignNotifBody(nd.assignNotifBody || '');
            setAssignStaticEmails(nd.assignStaticEmails || []);
            setAssignEmailVarKeys(nd.assignEmailVarKeys || []);
            setNewStaticEmail('');
            setAssignAttachDocument(nd.assignAttachDocument ?? false);
            setAssignAttachVarKeys(nd.assignAttachVarKeys || []);
        }
    }, [isOpen, nodeData]);

    // Determine derived values
    const useTimeoutExit = timeoutAction === 'FOLLOW_TIMEOUT_PATH';
    const showEscalationTarget = timeoutEnabled && timeoutAction === 'ESCALATE';

    const handleSave = () => {
        onSave({
            label,
            instructions,
            description,
            timeoutEnabled,
            timeoutValue: timeoutEnabled ? timeoutValue : undefined,
            timeoutUnit: timeoutEnabled ? timeoutUnit : undefined,
            timeoutAction: timeoutEnabled ? timeoutAction : undefined,
            useTimeoutExit: timeoutEnabled && useTimeoutExit,
            assignments: toAssignmentRequests(assignments),
            assignmentEntities: toAssignmentEntities(assignments),
            'timeout.value': timeoutValue,
            'timeout.unit': timeoutUnit,
            'timeout.action': timeoutAction,
            'timeout.useTimeoutExit': timeoutEnabled && useTimeoutExit,
            escalationTarget: showEscalationTarget ? toAssignmentRequests(escalationTarget) : undefined,
            escalationTargetEntities: showEscalationTarget ? toAssignmentEntities(escalationTarget) : undefined,
            formFields,
            // Notification settings
            notifyOnAssignInApp,
            notifyOnAssignEmail,
            assignNotifSubject: assignNotifSubject || `Task Assigned: ${label}`,
            assignNotifBody: assignNotifBody || `You have been assigned a task: ${label}. Please complete it at your earliest convenience.`,
            assignStaticEmails,
            assignEmailVarKeys,
            assignAttachDocument,
            assignAttachVarKeys,

        } as any);
        onClose();
    };

    if (!isOpen) return null;

    const insertVariable = (expression: string, target: 'assignSubject' | 'assignBody') => {
        const refMap = {
            assignSubject: { ref: assignSubjectRef, getter: assignNotifSubject, setter: setAssignNotifSubject },
            assignBody: { ref: assignBodyRef, getter: assignNotifBody, setter: setAssignNotifBody },
        };
        const { ref, getter, setter } = refMap[target];
        const el = ref.current;
        if (el) {
            const start = (el as any).selectionStart || getter.length;
            setter(getter.slice(0, start) + expression + getter.slice(start));
        } else {
            setter(getter + expression);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-violet-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-500 rounded-lg flex items-center justify-center">
                            <ClipboardCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Configure Manual Task</h3>
                            <p className="text-sm text-gray-500">Human confirmation task</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-gray-200 flex items-center justify-center">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b bg-gray-50">
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'config'
                            ? 'border-violet-500 text-violet-600 bg-white'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Settings className="w-4 h-4" />
                        Configuration
                    </button>
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'notifications'
                            ? 'border-violet-500 text-violet-600 bg-white'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Bell className="w-4 h-4" />
                        Notifications & Email
                    </button>
                    {showInstancesTab && (
                        <button
                            onClick={() => setActiveTab('instances')}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'instances'
                                ? 'border-violet-500 text-violet-600 bg-white'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <List className="w-4 h-4" />
                            Active Instances
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {activeTab === 'instances' && showInstancesTab ? (
                        <NodeInstancesPanel workflowId={workflowId!} nodeId={nodeId!} nodeType="manualTaskNode" />
                    ) : activeTab === 'notifications' ? (
                        /* ========== NOTIFICATIONS TAB ========== */
                        <div className="space-y-6">
                            {/* On Assignment */}
                            <div className="border rounded-xl overflow-hidden">
                                <div className="bg-violet-50 px-4 py-3 border-b">
                                    <h4 className="text-sm font-semibold text-violet-800 flex items-center gap-2">
                                        <Bell className="w-4 h-4" />
                                        On Assignment
                                    </h4>
                                    <p className="text-xs text-violet-600 mt-0.5">
                                        Notify when the task is assigned to users
                                    </p>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <Bell className="w-4 h-4 text-amber-500" />
                                            <span className="text-sm">In-App Notification</span>
                                        </div>
                                        <Switch checked={notifyOnAssignInApp} onCheckedChange={setNotifyOnAssignInApp} />
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-sky-500" />
                                            <span className="text-sm">Email Notification</span>
                                        </div>
                                        <Switch checked={notifyOnAssignEmail} onCheckedChange={setNotifyOnAssignEmail} />
                                    </div>

                                    {(notifyOnAssignInApp || notifyOnAssignEmail) && (
                                        <div className="space-y-4 pt-3 border-t">
                                            {/* Subject & Body */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">Insert variable:</span>
                                                    <VariableInsertButton
                                                        variables={localVariables}
                                                        onInsert={(expr) => insertVariable(expr, 'assignSubject')}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Subject / Title</Label>
                                                    <Input
                                                        ref={assignSubjectRef}
                                                        value={assignNotifSubject}
                                                        onChange={(e) => setAssignNotifSubject(e.target.value)}
                                                        placeholder="Task assigned: ${doc.name}"
                                                        className="mt-1 font-mono text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Message / Body</Label>
                                                    <Textarea
                                                        ref={assignBodyRef}
                                                        value={assignNotifBody}
                                                        onChange={(e) => setAssignNotifBody(e.target.value)}
                                                        placeholder="You have been assigned a task for document ${doc.name}"
                                                        rows={3}
                                                        className="mt-1 font-mono text-sm"
                                                    />
                                                </div>
                                            </div>

                                            {/* Email-specific: Recipients & Attachments */}
                                            {notifyOnAssignEmail && (
                                                <div className="space-y-4">
                                                    {/* To Recipients */}
                                                    <div className="space-y-2">
                                                        <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                                                            <Mail className="w-3.5 h-3.5" />
                                                            To Recipients
                                                        </h5>
                                                        <p className="text-xs text-gray-500">
                                                            Assigned users&apos; emails are always included. Add extra recipients below.
                                                        </p>

                                                        {/* Static emails */}
                                                        <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-white border rounded-lg">
                                                            {assignStaticEmails.map((email, idx) => (
                                                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-100 text-sky-800 rounded-full text-xs">
                                                                    {email}
                                                                    <button
                                                                        onClick={() => setAssignStaticEmails(prev => prev.filter((_, i) => i !== idx))}
                                                                        className="hover:text-red-600"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </span>
                                                            ))}
                                                            <div className="flex items-center gap-1">
                                                                <input
                                                                    type="email"
                                                                    value={newStaticEmail}
                                                                    onChange={(e) => setNewStaticEmail(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter' && newStaticEmail.trim()) {
                                                                            e.preventDefault();
                                                                            if (newStaticEmail.includes('@') && !assignStaticEmails.includes(newStaticEmail.trim())) {
                                                                                setAssignStaticEmails(prev => [...prev, newStaticEmail.trim()]);
                                                                                setNewStaticEmail('');
                                                                            }
                                                                        }
                                                                    }}
                                                                    placeholder="type email & press Enter"
                                                                    className="border-none outline-none text-xs bg-transparent min-w-[160px] flex-1"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (newStaticEmail.trim() && newStaticEmail.includes('@') && !assignStaticEmails.includes(newStaticEmail.trim())) {
                                                                            setAssignStaticEmails(prev => [...prev, newStaticEmail.trim()]);
                                                                            setNewStaticEmail('');
                                                                        }
                                                                    }}
                                                                    className="p-0.5 text-sky-600 hover:text-sky-800"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* EMAIL-type variables */}
                                                        {emailVariables.length > 0 && (
                                                            <div className="space-y-1.5 mt-2">
                                                                <span className="text-xs text-gray-500">From workflow variables (EMAIL type):</span>
                                                                {emailVariables.map(v => (
                                                                    <label key={v.variableKey} className="flex items-center gap-2 p-2 bg-white rounded-lg border cursor-pointer hover:bg-sky-50/50">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={assignEmailVarKeys.includes(v.variableKey)}
                                                                            onChange={() => {
                                                                                setAssignEmailVarKeys(prev =>
                                                                                    prev.includes(v.variableKey)
                                                                                        ? prev.filter(k => k !== v.variableKey)
                                                                                        : [...prev, v.variableKey]
                                                                                );
                                                                            }}
                                                                            className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                                                        />
                                                                        <Mail className="w-3.5 h-3.5 text-sky-500" />
                                                                        <span className="text-sm">{v.label}</span>
                                                                        <span className="text-xs text-gray-400 font-mono ml-auto">
                                                                            {'${var.' + v.variableKey + '}'}
                                                                        </span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Attachments */}
                                                    <div className="space-y-2 pt-3 border-t">
                                                        <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                                                            <Paperclip className="w-3.5 h-3.5" />
                                                            Email Attachments
                                                        </h5>
                                                        <label className="flex items-center gap-2 p-2 bg-white rounded-lg border cursor-pointer hover:bg-blue-50/50">
                                                            <input
                                                                type="checkbox"
                                                                checked={assignAttachDocument}
                                                                onChange={(e) => setAssignAttachDocument(e.target.checked)}
                                                                className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                                            />
                                                            <FileText className="w-3.5 h-3.5 text-gray-500" />
                                                            <span className="text-sm">Attach Workflow Document</span>
                                                        </label>
                                                        {fileVariables.length > 0 && fileVariables.map(v => (
                                                            <label
                                                                key={v.variableKey}
                                                                className="flex items-center gap-2 p-2 bg-white rounded-lg border cursor-pointer hover:bg-blue-50/50"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={assignAttachVarKeys.includes(v.variableKey)}
                                                                    onChange={() => {
                                                                        setAssignAttachVarKeys(prev =>
                                                                            prev.includes(v.variableKey)
                                                                                ? prev.filter(k => k !== v.variableKey)
                                                                                : [...prev, v.variableKey]
                                                                        );
                                                                    }}
                                                                    className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                                                />
                                                                <Paperclip className="w-3.5 h-3.5 text-sky-500" />
                                                                <span className="text-sm">{v.label}</span>
                                                                <span className="text-xs text-gray-400 font-mono ml-auto">
                                                                    {'${var.' + v.variableKey + '}'}
                                                                </span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ========== CONFIG TAB ========== */
                        <>
                            <div className="grid gap-4">
                                <div>
                                    <Label>Task Name</Label>
                                    <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Manual Task" />
                                </div>
                                <div>
                                    <Label>Description</Label>
                                    <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" />
                                </div>
                                <div>
                                    <Label>Task Instructions</Label>
                                    <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Detailed instructions..." rows={4} />
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
                                                            <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="text-xs text-orange-700 bg-orange-100 px-3 py-2 rounded">
                                            {TIMEOUT_ACTIONS.find(a => a.value === timeoutAction)?.description}
                                        </div>

                                        {/* Escalation Target Selector */}
                                        {showEscalationTarget && (
                                            <div className="bg-white rounded-lg border border-orange-200 p-4 space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                                                    <Label className="text-sm font-medium">Escalate To (Required)</Label>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    Select who should receive the task when escalated.
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
                                label="Task Assignees"
                                accentColor="violet"
                            />

                            {/* Form Fields Section */}
                            <TaskFormFieldsEditor
                                fields={formFields}
                                onChange={setFormFields}
                                workflowId={workflowId}
                                localVariables={localVariables}
                            />
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-violet-500 hover:bg-violet-600">
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
