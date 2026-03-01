'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Mail, Plus, Paperclip, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { UserDto, RoleDto, GroupDto } from '@/types/api';
import { WorkflowNodeData, NotificationRecipient } from '../nodes/types';
import AssigneeSelector, { StepAssignment, GranteeType } from '@/components/workflow/AssigneeSelector';
import VariableInsertButton from '../components/VariableInsertButton';
import { VariableDefinition } from '../components/variables/types';

interface EmailNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
    localVariables?: VariableDefinition[];
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

export default function EmailNodeModal({ isOpen, onClose, nodeData, onSave, localVariables = [] }: EmailNodeModalProps) {
    const [toAssignments, setToAssignments] = useState<StepAssignment[]>([]);
    const [ccAssignments, setCcAssignments] = useState<StepAssignment[]>([]);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [attachDocument, setAttachDocument] = useState(false);
    const [showCc, setShowCc] = useState(false);
    const [attachVariableKeys, setAttachVariableKeys] = useState<string[]>([]);

    // Static email recipients
    const [staticEmails, setStaticEmails] = useState<string[]>([]);
    const [newStaticEmail, setNewStaticEmail] = useState('');
    // EMAIL-type workflow variable recipients
    const [emailVarKeys, setEmailVarKeys] = useState<string[]>([]);

    const subjectRef = useRef<HTMLInputElement>(null);
    const bodyRef = useRef<HTMLTextAreaElement>(null);
    const [activeField, setActiveField] = useState<'subject' | 'body'>('subject');

    // FILE type variables for attachment picker
    const fileVariables = localVariables.filter(v => v.type === 'FILE' || v.type === 'DOCUMENT');
    // EMAIL type variables for recipient picker
    const emailVariables = localVariables.filter(v => v.type === 'EMAIL');

    // Initialize from nodeData
    useEffect(() => {
        if (isOpen) {
            const nd = nodeData as any;
            setToAssignments(recipientsToAssignments(nodeData.emailRecipients));
            setCcAssignments(recipientsToAssignments(nodeData.ccRecipients));
            setEmailSubject(nodeData.emailSubject || '');
            setEmailBody(nodeData.emailBody || '');
            setAttachDocument(nodeData.attachDocument || false);
            setShowCc((nodeData.ccRecipients?.length || 0) > 0);
            setAttachVariableKeys(nd.attachVariableKeys || []);
            setStaticEmails(nd.staticEmails || nd['recipients.emails'] || []);
            setNewStaticEmail('');
            setEmailVarKeys(nd.emailVarKeys || []);
        }
    }, [isOpen, nodeData]);

    const handleVariableInsert = (expression: string) => {
        if (activeField === 'subject') {
            const el = subjectRef.current;
            if (el) {
                const start = el.selectionStart || emailSubject.length;
                const newVal = emailSubject.slice(0, start) + expression + emailSubject.slice(start);
                setEmailSubject(newVal);
            } else {
                setEmailSubject(emailSubject + expression);
            }
        } else {
            const el = bodyRef.current;
            if (el) {
                const start = el.selectionStart || emailBody.length;
                const newVal = emailBody.slice(0, start) + expression + emailBody.slice(start);
                setEmailBody(newVal);
            } else {
                setEmailBody(emailBody + expression);
            }
        }
    };

    const toggleVariableAttachment = (varKey: string) => {
        setAttachVariableKeys(prev =>
            prev.includes(varKey)
                ? prev.filter(k => k !== varKey)
                : [...prev, varKey]
        );
    };

    const handleSave = () => {
        onSave({
            emailRecipients: assignmentsToRecipients(toAssignments),
            ccRecipients: showCc ? assignmentsToRecipients(ccAssignments) : [],
            emailSubject,
            emailBody,
            attachDocument,
            attachVariableKeys,
            // Static emails and EMAIL variable keys for backend
            staticEmails,
            'recipients.emails': staticEmails,
            emailVarKeys,
        } as any);
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
                            <p className="text-sm text-gray-500">Set recipients, content, and attachments</p>
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
                    {/* TO Recipients Section (User/Role/Group) */}
                    <AssigneeSelector
                        assignments={toAssignments}
                        onChange={setToAssignments}
                        label="To Recipients (Users / Roles / Groups)"
                        accentColor="sky"
                    />

                    {/* Static Email Recipients */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" />
                            Custom Email Addresses
                        </Label>
                        <p className="text-xs text-gray-500">Add email addresses directly (not from the system users).</p>
                        <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-white border rounded-lg">
                            {staticEmails.map((email, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-100 text-sky-800 rounded-full text-xs">
                                    {email}
                                    <button onClick={() => setStaticEmails(prev => prev.filter((_, i) => i !== idx))} className="hover:text-red-600">
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
                                            if (newStaticEmail.includes('@') && !staticEmails.includes(newStaticEmail.trim())) {
                                                setStaticEmails(prev => [...prev, newStaticEmail.trim()]);
                                                setNewStaticEmail('');
                                            }
                                        }
                                    }}
                                    placeholder="type email & press Enter"
                                    className="border-none outline-none text-xs bg-transparent min-w-[160px] flex-1"
                                />
                                <button type="button" onClick={() => {
                                    if (newStaticEmail.trim() && newStaticEmail.includes('@') && !staticEmails.includes(newStaticEmail.trim())) {
                                        setStaticEmails(prev => [...prev, newStaticEmail.trim()]);
                                        setNewStaticEmail('');
                                    }
                                }} className="p-0.5 text-sky-600 hover:text-sky-800">
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* EMAIL-type workflow variable recipients */}
                    {emailVariables.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5" />
                                Recipients from Workflow Variables
                            </Label>
                            <p className="text-xs text-gray-500">Select EMAIL-type variables whose runtime value will be used as recipient.</p>
                            {emailVariables.map(v => (
                                <label key={v.variableKey} className="flex items-center gap-2 p-2 bg-white rounded-lg border cursor-pointer hover:bg-sky-50/50">
                                    <input
                                        type="checkbox"
                                        checked={emailVarKeys.includes(v.variableKey)}
                                        onChange={() => setEmailVarKeys(prev => prev.includes(v.variableKey) ? prev.filter(k => k !== v.variableKey) : [...prev, v.variableKey])}
                                        className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                    />
                                    <Mail className="w-3.5 h-3.5 text-sky-500" />
                                    <span className="text-sm">{v.label}</span>
                                    <span className="text-xs text-gray-400 font-mono ml-auto">{'${var.' + v.variableKey + '}'}</span>
                                </label>
                            ))}
                        </div>
                    )}

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
                        {/* Variable insert helper */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Insert variable into:</span>
                            <div className="flex gap-1">
                                <button
                                    className={`px-2 py-0.5 text-xs rounded ${activeField === 'subject' ? 'bg-sky-100 text-sky-700 font-medium' : 'bg-gray-100 text-gray-500'}`}
                                    onClick={() => setActiveField('subject')}
                                >
                                    Subject
                                </button>
                                <button
                                    className={`px-2 py-0.5 text-xs rounded ${activeField === 'body' ? 'bg-sky-100 text-sky-700 font-medium' : 'bg-gray-100 text-gray-500'}`}
                                    onClick={() => setActiveField('body')}
                                >
                                    Body
                                </button>
                            </div>
                            <VariableInsertButton
                                variables={localVariables}
                                onInsert={handleVariableInsert}
                            />
                        </div>

                        <div>
                            <Label htmlFor="subject">Email Subject</Label>
                            <Input
                                ref={subjectRef}
                                id="subject"
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                                onFocus={() => setActiveField('subject')}
                                placeholder="Workflow notification: ${doc.name}"
                                className="mt-1 font-mono text-sm"
                            />
                        </div>

                        <div>
                            <Label htmlFor="body">Email Body (HTML)</Label>
                            <Textarea
                                ref={bodyRef}
                                id="body"
                                value={emailBody}
                                onChange={(e) => setEmailBody(e.target.value)}
                                onFocus={() => setActiveField('body')}
                                placeholder="Enter email body... Use ${var.name} for variables"
                                rows={6}
                                className="mt-1 font-mono text-sm"
                            />
                        </div>

                        {/* Attachments Section */}
                        <div className="space-y-3 border rounded-lg p-4 bg-gray-50/50">
                            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Paperclip className="w-4 h-4" />
                                Attachments
                            </h4>

                            {/* Attach workflow document */}
                            <div className="flex items-center justify-between p-2 bg-white rounded-lg border">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm">Attach Workflow Document</span>
                                </div>
                                <Switch
                                    checked={attachDocument}
                                    onCheckedChange={setAttachDocument}
                                />
                            </div>

                            {/* Attach file variables */}
                            {fileVariables.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs text-gray-500">
                                        Attach files from workflow variables (FILE type fields):
                                    </p>
                                    {fileVariables.map(v => (
                                        <label
                                            key={v.variableKey}
                                            className="flex items-center gap-2 p-2 bg-white rounded-lg border cursor-pointer hover:bg-blue-50/50 transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={attachVariableKeys.includes(v.variableKey)}
                                                onChange={() => toggleVariableAttachment(v.variableKey)}
                                                className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                            />
                                            <Paperclip className="w-3.5 h-3.5 text-sky-500" />
                                            <div className="flex-1">
                                                <span className="text-sm">{v.label}</span>
                                                <span className="text-xs text-gray-400 ml-2 font-mono">${'{var.' + v.variableKey + '}'}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {fileVariables.length === 0 && (
                                <p className="text-xs text-gray-400 italic">
                                    No FILE type variables defined. Add FILE variables to your workflow to enable file attachments from task forms.
                                </p>
                            )}
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
