'use client';

import { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserDto, RoleDto, GroupDto } from '@/types/api';
import { WorkflowNodeData, NotificationRecipient } from '../nodes/types';
import AssigneeSelector, { StepAssignment, GranteeType } from '@/components/workflow/AssigneeSelector';

interface NotificationNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

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

export default function NotificationNodeModal({ isOpen, onClose, nodeData, onSave }: NotificationNodeModalProps) {
    const [assignments, setAssignments] = useState<StepAssignment[]>([]);
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationMessage, setNotificationMessage] = useState('');

    // Initialize from nodeData
    useEffect(() => {
        if (isOpen) {
            setAssignments(recipientsToAssignments(nodeData.recipients));
            setNotificationTitle(nodeData.notificationTitle || '');
            setNotificationMessage(nodeData.notificationMessage || '');
        }
    }, [isOpen, nodeData]);

    const handleSave = () => {
        onSave({
            recipients: assignmentsToRecipients(assignments),
            notificationTitle,
            notificationMessage,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full h-[80vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-amber-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                            <Bell className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Configure Notification</h3>
                            <p className="text-sm text-gray-500">Set recipients and message</p>
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
                    {/* Recipients Section using reusable component */}
                    <AssigneeSelector
                        assignments={assignments}
                        onChange={setAssignments}
                        label="Recipients"
                        accentColor="amber"
                    />

                    {/* Notification Content */}
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="title">Notification Title</Label>
                            <Input
                                id="title"
                                value={notificationTitle}
                                onChange={(e) => setNotificationTitle(e.target.value)}
                                placeholder="Workflow notification"
                                className="mt-1"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                Use {'${doc.name}'} for document name
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                                id="message"
                                value={notificationMessage}
                                onChange={(e) => setNotificationMessage(e.target.value)}
                                placeholder="Enter notification message..."
                                rows={4}
                                className="mt-1"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                Variables: {'${doc.name}'}, {'${user.name}'}, {'${workflow.name}'}
                            </p>
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
