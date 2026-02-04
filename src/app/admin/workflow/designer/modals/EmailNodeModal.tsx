'use client';

import { useState, useEffect } from 'react';
import { X, Mail, Plus, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { UserDto, RoleDto, GroupDto } from '@/types/api';
import { WorkflowNodeData, NotificationRecipient } from '../nodes/types';
import AssigneeSelector, { StepAssignment, GranteeType } from '@/components/workflow/AssigneeSelector';

interface EmailNodeModalProps {
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

export default function EmailNodeModal({ isOpen, onClose, nodeData, onSave }: EmailNodeModalProps) {
    const [toAssignments, setToAssignments] = useState<StepAssignment[]>([]);
    const [ccAssignments, setCcAssignments] = useState<StepAssignment[]>([]);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [attachDocument, setAttachDocument] = useState(false);
    const [showCc, setShowCc] = useState(false);

    // Initialize from nodeData
    useEffect(() => {
        if (isOpen) {
            setToAssignments(recipientsToAssignments(nodeData.emailRecipients));
            setCcAssignments(recipientsToAssignments(nodeData.ccRecipients));
            setEmailSubject(nodeData.emailSubject || '');
            setEmailBody(nodeData.emailBody || '');
            setAttachDocument(nodeData.attachDocument || false);
            setShowCc((nodeData.ccRecipients?.length || 0) > 0);
        }
    }, [isOpen, nodeData]);

    const handleSave = () => {
        onSave({
            emailRecipients: assignmentsToRecipients(toAssignments),
            ccRecipients: showCc ? assignmentsToRecipients(ccAssignments) : [],
            emailSubject,
            emailBody,
            attachDocument,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-sky-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center">
                            <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Configure Email</h3>
                            <p className="text-sm text-gray-500">Set recipients and email content</p>
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
                    {/* TO Recipients Section */}
                    <AssigneeSelector
                        assignments={toAssignments}
                        onChange={setToAssignments}
                        label="To Recipients"
                        accentColor="sky"
                    />

                    {/* CC Toggle */}
                    {!showCc && (
                        <button
                            onClick={() => setShowCc(true)}
                            className="flex items-center gap-2 text-sm text-sky-600 hover:text-sky-700"
                        >
                            <Plus className="w-4 h-4" />
                            Add CC Recipients
                        </button>
                    )}

                    {/* CC Recipients Section */}
                    {showCc && (
                        <AssigneeSelector
                            assignments={ccAssignments}
                            onChange={setCcAssignments}
                            label="CC Recipients"
                            accentColor="sky"
                        />
                    )}

                    {/* Email Content */}
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="subject">Email Subject</Label>
                            <Input
                                id="subject"
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                                placeholder="Workflow notification: ${doc.name}"
                                className="mt-1"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                Use {'${doc.name}'} for document name, {'${workflow.name}'} for workflow name
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="body">Email Body</Label>
                            <Textarea
                                id="body"
                                value={emailBody}
                                onChange={(e) => setEmailBody(e.target.value)}
                                placeholder="Enter email body..."
                                rows={6}
                                className="mt-1"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                Variables: {'${doc.name}'}, {'${doc.link}'}, {'${user.name}'}, {'${workflow.name}'}
                            </p>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Paperclip className="w-4 h-4 text-gray-500" />
                                <Label>Attach Document</Label>
                            </div>
                            <Switch
                                checked={attachDocument}
                                onCheckedChange={setAttachDocument}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-sky-500 hover:bg-sky-600">
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
