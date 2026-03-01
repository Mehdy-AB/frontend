'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Bell, AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserDto, RoleDto, GroupDto } from '@/types/api';
import { WorkflowNodeData, NotificationRecipient } from '../nodes/types';
import AssigneeSelector, { StepAssignment, GranteeType } from '@/components/workflow/AssigneeSelector';
import VariableInsertButton from '../components/VariableInsertButton';
import { VariableDefinition } from '../components/variables/types';

interface NotificationNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
    localVariables?: VariableDefinition[];
}

const SEVERITY_OPTIONS = [
    { value: 'INFO', label: 'Info', icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' },
    { value: 'SUCCESS', label: 'Success', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 border-green-200' },
    { value: 'WARNING', label: 'Warning', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' },
    { value: 'ERROR', label: 'Error', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
];

// Convert NotificationRecipient[] to StepAssignment[]
function recipientsToAssignments(recipients: NotificationRecipient[] | undefined): StepAssignment[] {
    if (!recipients) return [];
    return recipients.map(r => ({
        id: `${r.type.toLowerCase()}-${r.id}`,
        type: r.type.toLowerCase() as GranteeType,
        entity: r.entity!,
        canEdit: true,
    }));
}

// Convert StepAssignment[] to NotificationRecipient[]
function assignmentsToRecipients(assignments: StepAssignment[]): NotificationRecipient[] {
    return assignments.map(a => {
        const name = 'username' in a.entity
            ? (a.entity as UserDto).displayName || (a.entity as UserDto).username
            : (a.entity as RoleDto | GroupDto).name;
        return {
            id: a.entity.id,
            type: a.type.toUpperCase() as 'USER' | 'ROLE' | 'GROUP',
            name,
            entity: a.entity,
        };
    });
}

export default function NotificationNodeModal({ isOpen, onClose, nodeData, onSave, localVariables = [] }: NotificationNodeModalProps) {
    const [assignments, setAssignments] = useState<StepAssignment[]>([]);
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationMessage, setNotificationMessage] = useState('');
    const [severity, setSeverity] = useState('INFO');

    const titleRef = useRef<HTMLInputElement>(null);
    const messageRef = useRef<HTMLTextAreaElement>(null);
    const [activeField, setActiveField] = useState<'title' | 'message'>('title');

    // Initialize from nodeData
    useEffect(() => {
        if (isOpen) {
            const nd = nodeData as any;
            setAssignments(recipientsToAssignments(nodeData.recipients));
            setNotificationTitle(nodeData.notificationTitle || nd.subject || '');
            setNotificationMessage(nodeData.notificationMessage || nd.body || '');
            setSeverity(nd.severity || 'INFO');
        }
    }, [isOpen, nodeData]);

    const handleVariableInsert = (expression: string) => {
        if (activeField === 'title') {
            const el = titleRef.current;
            if (el) {
                const start = el.selectionStart || notificationTitle.length;
                const newVal = notificationTitle.slice(0, start) + expression + notificationTitle.slice(start);
                setNotificationTitle(newVal);
            } else {
                setNotificationTitle(notificationTitle + expression);
            }
        } else {
            const el = messageRef.current;
            if (el) {
                const start = el.selectionStart || notificationMessage.length;
                const newVal = notificationMessage.slice(0, start) + expression + notificationMessage.slice(start);
                setNotificationMessage(newVal);
            } else {
                setNotificationMessage(notificationMessage + expression);
            }
        }
    };

    const handleSave = () => {
        onSave({
            recipients: assignmentsToRecipients(assignments),
            notificationTitle,
            notificationMessage,
            severity,
            // In-app only — always set channel to IN_APP
            channel: 'IN_APP',
            sendInApp: true,
            sendEmail: false,
            // Backend aliases
            subject: notificationTitle,
            body: notificationMessage,
            // User IDs for in-app notifications
            'recipients.users': assignments.filter(a => a.type === 'user').map(a => a.entity.id),
        } as any);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-amber-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                            <Bell className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Configure Notification</h3>
                            <p className="text-sm text-gray-500">In-app notification for users, roles, or groups</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Recipients */}
                    <div className="space-y-2">
                        <AssigneeSelector
                            assignments={assignments}
                            onChange={setAssignments}
                            label="Notification Recipients"
                            accentColor="amber"
                        />
                    </div>

                    {/* Severity */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Severity</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {SEVERITY_OPTIONS.map(opt => {
                                const Icon = opt.icon;
                                const isSelected = severity === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() => setSeverity(opt.value)}
                                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${isSelected
                                            ? `${opt.bg} border-current ring-1 ring-offset-1`
                                            : 'bg-white border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 ${isSelected ? opt.color : 'text-gray-400'}`} />
                                        <span className={`text-xs font-medium ${isSelected ? opt.color : 'text-gray-500'}`}>
                                            {opt.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Notification Content */}
                    <div className="space-y-4">
                        {/* Variable insert helper */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Insert variable into:</span>
                            <div className="flex gap-1">
                                <button
                                    className={`px-2 py-0.5 text-xs rounded ${activeField === 'title' ? 'bg-amber-100 text-amber-700 font-medium' : 'bg-gray-100 text-gray-500'}`}
                                    onClick={() => setActiveField('title')}
                                >
                                    Title
                                </button>
                                <button
                                    className={`px-2 py-0.5 text-xs rounded ${activeField === 'message' ? 'bg-amber-100 text-amber-700 font-medium' : 'bg-gray-100 text-gray-500'}`}
                                    onClick={() => setActiveField('message')}
                                >
                                    Message
                                </button>
                            </div>
                            <VariableInsertButton
                                variables={localVariables}
                                onInsert={handleVariableInsert}
                            />
                        </div>

                        <div>
                            <Label htmlFor="title">Title</Label>
                            <Input
                                ref={titleRef}
                                id="title"
                                value={notificationTitle}
                                onChange={(e) => setNotificationTitle(e.target.value)}
                                onFocus={() => setActiveField('title')}
                                placeholder="Workflow notification: ${doc.name}"
                                className="mt-1 font-mono text-sm"
                            />
                        </div>

                        <div>
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                                ref={messageRef}
                                id="message"
                                value={notificationMessage}
                                onChange={(e) => setNotificationMessage(e.target.value)}
                                onFocus={() => setActiveField('message')}
                                placeholder="Enter notification message... Use ${var.name} for variables"
                                rows={4}
                                className="mt-1 font-mono text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600">
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
