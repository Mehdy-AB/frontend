'use client';

import { useState, useEffect } from 'react';
import { X, List, Clock, Plus, Trash2, GripVertical, Settings, ChevronDown, ChevronUp } from 'lucide-react';
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
import { TaskFormField } from '@/types/workflow';
import AssigneeSelector, {
    StepAssignment,
    fromAssignmentEntities,
    toAssignmentRequests,
    toAssignmentEntities
} from '@/components/workflow/AssigneeSelector';
import NodeInstancesPanel from '../components/NodeInstancesPanel';
import TaskFormFieldsEditor from '../components/TaskFormFieldsEditor';

interface MultiChoiceNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
    workflowId?: number;
    nodeId?: string;
}

interface Choice {
    id: number;
    label: string;
    formFields?: TaskFormField[];
}

const TIMEOUT_ACTIONS = [
    { value: 'REMIND', label: 'Send Reminder', description: 'Notify assignees and continue waiting' },
    { value: 'AUTO_APPROVE', label: 'Auto-Select Default', description: 'Automatically select the first choice' },
    { value: 'CANCEL_WORKFLOW', label: 'Cancel Workflow', description: 'Cancel the entire workflow' },
    { value: 'FAIL', label: 'Fail Workflow', description: 'Mark workflow as failed' },
    { value: 'FOLLOW_TIMEOUT_PATH', label: 'Follow Timeout Path', description: 'Exit via the TIMEOUT path for custom handling' },
];

const MAX_CHOICES = 10;

export default function MultiChoiceNodeModal({ isOpen, onClose, nodeData, onSave, workflowId, nodeId }: MultiChoiceNodeModalProps) {
    // Tab state
    const [activeTab, setActiveTab] = useState<'config' | 'instances'>('config');
    const showInstancesTab = !!workflowId && !!nodeId;

    // Basic settings
    const [label, setLabel] = useState(nodeData.label || 'Multi-Choice');
    const [description, setDescription] = useState(nodeData.description || '');
    const [notificationSubject, setNotificationSubject] = useState(nodeData.notificationSubject || 'Choice Required: ${doc.name}');
    const [notificationBody, setNotificationBody] = useState(nodeData.notificationBody || 'Please select one of the available choices.');

    // Choices
    const [choices, setChoices] = useState<Choice[]>(
        nodeData.choices || [{ id: 1, label: 'Continue' }]
    );

    // Track which choice has its form fields expanded
    const [expandedChoiceId, setExpandedChoiceId] = useState<number | null>(null);

    // Timeout settings
    const [timeoutEnabled, setTimeoutEnabled] = useState(nodeData.timeoutEnabled || false);
    const [timeoutValue, setTimeoutValue] = useState(nodeData.timeoutValue || 48);
    const [timeoutUnit, setTimeoutUnit] = useState<'HOURS' | 'DAYS'>(nodeData.timeoutUnit || 'HOURS');
    const [timeoutAction, setTimeoutAction] = useState(nodeData.timeoutAction || 'REMIND');

    // Assignments
    const [assignments, setAssignments] = useState<StepAssignment[]>([]);

    useEffect(() => {
        if (isOpen) {
            setLabel(nodeData.label || 'Multi-Choice');
            setDescription(nodeData.description || '');
            setNotificationSubject(nodeData.notificationSubject || 'Choice Required: ${doc.name}');
            setNotificationBody(nodeData.notificationBody || 'Please select one of the available choices.');
            setChoices(nodeData.choices || [{ id: 1, label: 'Continue' }]);
            setExpandedChoiceId(null);
            setTimeoutEnabled(nodeData.timeoutEnabled || false);
            setTimeoutValue(nodeData.timeoutValue || 48);
            setTimeoutUnit(nodeData.timeoutUnit || 'HOURS');
            setTimeoutAction(nodeData.timeoutAction || 'REMIND');
            setAssignments(fromAssignmentEntities(nodeData.assignmentEntities));
        }
    }, [isOpen, nodeData]);

    const useTimeoutExit = timeoutAction === 'FOLLOW_TIMEOUT_PATH';

    // Add a new choice
    const handleAddChoice = () => {
        if (choices.length >= MAX_CHOICES) return;
        const newId = Math.max(...choices.map(c => c.id), 0) + 1;
        setChoices([...choices, { id: newId, label: `Option ${choices.length + 1}`, formFields: [] }]);
    };

    // Update form fields for a specific choice
    const handleUpdateChoiceFormFields = (choiceId: number, fields: TaskFormField[]) => {
        setChoices(choices.map(c => c.id === choiceId ? { ...c, formFields: fields } : c));
    };

    // Update choice label
    const handleUpdateChoice = (id: number, newLabel: string) => {
        setChoices(choices.map(c => c.id === id ? { ...c, label: newLabel } : c));
    };

    // Delete choice (cannot delete if only 1 left)
    const handleDeleteChoice = (id: number) => {
        if (choices.length <= 1) return;
        setChoices(choices.filter(c => c.id !== id));
    };

    const handleSave = () => {
        // Normalize choice IDs to sequential 1..N
        const normalizedChoices = choices.map((c, i) => ({ ...c, id: i + 1 }));

        onSave({
            label,
            description,
            notificationSubject,
            notificationBody,
            choices: normalizedChoices,
            timeoutEnabled,
            timeoutValue: timeoutEnabled ? timeoutValue : undefined,
            timeoutUnit: timeoutEnabled ? timeoutUnit : undefined,
            timeoutAction: timeoutEnabled ? timeoutAction : undefined,
            useTimeoutExit: timeoutEnabled && useTimeoutExit,
            assignments: toAssignmentRequests(assignments),
            assignmentEntities: toAssignmentEntities(assignments),
            // Backend config format
            'timeout.value': timeoutValue,
            'timeout.unit': timeoutUnit,
            'timeout.action': timeoutAction,
            'timeout.useTimeoutExit': timeoutEnabled && useTimeoutExit,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-teal-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
                            <List className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Configure Multi-Choice</h3>
                            <p className="text-sm text-gray-500">Define choices and exit paths</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-gray-200 flex items-center justify-center">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                {showInstancesTab && (
                    <div className="flex border-b bg-gray-50">
                        <button
                            onClick={() => setActiveTab('config')}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'config'
                                ? 'border-teal-500 text-teal-600 bg-white'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Settings className="w-4 h-4" />
                            Configuration
                        </button>
                        <button
                            onClick={() => setActiveTab('instances')}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'instances'
                                ? 'border-teal-500 text-teal-600 bg-white'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <List className="w-4 h-4" />
                            Active Instances
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {activeTab === 'instances' && showInstancesTab ? (
                        <NodeInstancesPanel workflowId={workflowId!} nodeId={nodeId!} nodeType="multiChoiceNode" />
                    ) : (
                        <>
                            {/* Basic Settings */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Basic Settings</h4>
                                <div className="grid gap-4">
                                    <div>
                                        <Label>Step Name</Label>
                                        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Multi-Choice Step" />
                                    </div>
                                    <div>
                                        <Label>Description</Label>
                                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Instructions for users..." rows={2} />
                                    </div>
                                </div>
                            </div>

                            {/* Choices Configuration */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                        <List className="w-4 h-4" />
                                        Choices ({choices.length}/{MAX_CHOICES})
                                    </h4>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddChoice}
                                        disabled={choices.length >= MAX_CHOICES}
                                        className="gap-1"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Choice
                                    </Button>
                                </div>
                                <div className="bg-teal-50 border border-teal-100 rounded-lg p-4 space-y-2">
                                    {choices.map((choice, index) => (
                                        <div key={choice.id} className="space-y-0">
                                            <div className="flex items-center gap-2 bg-white rounded-lg p-2 border border-gray-200">
                                                <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                                                <div className="w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-bold flex items-center justify-center">
                                                    {index + 1}
                                                </div>
                                                <Input
                                                    value={choice.label}
                                                    onChange={(e) => handleUpdateChoice(choice.id, e.target.value)}
                                                    placeholder={`Choice ${index + 1}`}
                                                    className="flex-1"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setExpandedChoiceId(expandedChoiceId === choice.id ? null : choice.id)}
                                                    className="text-gray-500 hover:text-teal-600"
                                                    title="Configure form fields for this choice"
                                                >
                                                    📝
                                                    {expandedChoiceId === choice.id ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteChoice(choice.id)}
                                                    disabled={choices.length <= 1}
                                                    className="text-gray-400 hover:text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            {/* Per-choice form fields editor */}
                                            {expandedChoiceId === choice.id && (
                                                <div className="ml-8 mt-1 mb-2 p-3 bg-white border border-teal-200 rounded-lg">
                                                    <p className="text-xs font-medium text-teal-700 mb-2">Form fields for "{choice.label}"</p>
                                                    <TaskFormFieldsEditor
                                                        fields={choice.formFields || []}
                                                        onChange={(fields) => handleUpdateChoiceFormFields(choice.id, fields)}
                                                        workflowId={workflowId}
                                                        localVariables={(nodeData as any).localVariables}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <p className="text-xs text-teal-600 mt-2">
                                        Each choice creates a separate exit path. Click 📝 to add form fields per choice.
                                    </p>
                                </div>
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
                                                                {a.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="text-xs text-orange-700 bg-orange-100 px-3 py-2 rounded">
                                            {TIMEOUT_ACTIONS.find(a => a.value === timeoutAction)?.description}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Assignments Section */}
                            <AssigneeSelector
                                assignments={assignments}
                                onChange={setAssignments}
                                label="Decision Makers"
                                accentColor="teal"
                            />
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-teal-500 hover:bg-teal-600">
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
