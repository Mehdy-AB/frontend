'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Paperclip, Variable } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkflowNodeData } from '../nodes/types';
import { VariableDefinition } from '../components/variables/types';
import { Node } from '@xyflow/react';

interface AttachDocumentNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
    allNodes?: Node[];
    localVariables?: VariableDefinition[];
}

export default function AttachDocumentNodeModal({ isOpen, onClose, nodeData, onSave, allNodes = [], localVariables = [] }: AttachDocumentNodeModalProps) {
    const [label, setLabel] = useState(nodeData.label || 'Attach Document');
    const [fileVariableKey, setFileVariableKey] = useState<string>((nodeData as any).fileVariableKey || '');
    const [attachmentName, setAttachmentName] = useState<string>((nodeData as any).attachmentName || '');
    const [description, setDescription] = useState<string>((nodeData as any).description || '');
    const [resultVariableKey, setResultVariableKey] = useState<string>((nodeData as any).resultVariableKey || '');

    // Extract FILE-type variables from VariablesPanel definitions + nodes
    const fileVariables = useMemo(() => {
        const vars: { key: string; label: string; source: string }[] = [];

        // Variables from VariablesPanel (workflow definitions)
        for (const v of localVariables) {
            if (v.type === 'FILE' || v.type === 'DOCUMENT') {
                vars.push({
                    key: v.variableKey,
                    label: v.label || v.variableKey,
                    source: 'Defined',
                });
            }
        }

        // Variables from formRequest/formFields with type FILE
        try {
            for (const node of allNodes) {
                const d = node.data as any;
                if (d?.formFields && Array.isArray(d.formFields)) {
                    for (const ff of d.formFields) {
                        const varKey = ff.variableKey || ff.mappedVariableKey;
                        if (varKey && (ff.type === 'FILE' || ff.type === 'file')) {
                            vars.push({
                                key: varKey,
                                label: ff.label || varKey,
                                source: d.label || node.type || 'Form',
                            });
                        }
                    }
                }
            }
        } catch (e) {
            // Ignore
        }
        // Deduplicate by key
        const seen = new Set<string>();
        return vars.filter(v => {
            if (seen.has(v.key)) return false;
            seen.add(v.key);
            return true;
        });
    }, [localVariables, allNodes, isOpen]);

    // Initialize form from nodeData
    useEffect(() => {
        if (isOpen) {
            setLabel(nodeData.label || 'Attach Document');
            setFileVariableKey((nodeData as any).fileVariableKey || '');
            setAttachmentName((nodeData as any).attachmentName || '');
            setDescription((nodeData as any).description || '');
            setResultVariableKey((nodeData as any).resultVariableKey || '');
        }
    }, [isOpen, nodeData]);

    const handleSave = () => {
        onSave({
            label,
            fileVariableKey,
            attachmentName,
            description,
            resultVariableKey,
        } as any);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col"
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-indigo-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                            <Paperclip className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Attach Document</h3>
                            <p className="text-sm text-gray-500">Upload file variable as document attachment</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl hover:bg-indigo-100 flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                    {/* Node Label */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Node Label</Label>
                        <Input
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="Attach Document"
                        />
                    </div>

                    {/* File Variable Selection */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            File Variable <span className="text-red-500">*</span>
                        </Label>
                        <p className="text-xs text-gray-400 mb-2">
                            Select a FILE-type workflow variable that holds the file to attach
                        </p>
                        {fileVariables.length > 0 ? (
                            <Select value={fileVariableKey} onValueChange={setFileVariableKey}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select file variable..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {fileVariables.map((v) => (
                                        <SelectItem key={v.key} value={v.key}>
                                            <div className="flex items-center gap-2">
                                                <Variable className="w-3 h-3 text-indigo-500" />
                                                <span className="font-mono text-sm">{v.key}</span>
                                                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                                    {v.source}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="space-y-2">
                                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                                    No FILE-type variables found. Add a Form Request node with a FILE field,
                                    or a Set Variable node with type FILE, then come back here.
                                </div>
                                <Input
                                    value={fileVariableKey}
                                    onChange={(e) => setFileVariableKey(e.target.value)}
                                    placeholder="Variable key (e.g. uploaded_file)"
                                    className="font-mono"
                                />
                            </div>
                        )}
                        {fileVariableKey && (
                            <div className="mt-2 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded flex items-center gap-1">
                                <Variable className="w-3 h-3" />
                                Will use file from <strong className="font-mono">${'{'}var.{fileVariableKey}{'}'}</strong>
                            </div>
                        )}
                    </div>

                    {/* Attachment Name */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Attachment Name</Label>
                        <p className="text-xs text-gray-400 mb-2">
                            Name for the new document. Leave empty to use the original filename. Supports {'${var}'} templates.
                        </p>
                        <Input
                            value={attachmentName}
                            onChange={(e) => setAttachmentName(e.target.value)}
                            placeholder="e.g. Invoice_${'{'}var.name{'}'}.pdf"
                            className="font-mono text-sm"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Link Description</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Workflow attachment"
                            rows={2}
                            className="text-sm"
                        />
                    </div>

                    {/* Result Variable (optional) */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Result Variable (optional)</Label>
                        <p className="text-xs text-gray-400 mb-2">
                            Store the new document ID in this variable for use in later nodes
                        </p>
                        <Input
                            value={resultVariableKey}
                            onChange={(e) => setResultVariableKey(e.target.value.replace(/\s/g, '_'))}
                            placeholder="attached_doc_id"
                            className="font-mono text-sm"
                        />
                    </div>

                    {/* Preview */}
                    {fileVariableKey && (
                        <div className="bg-indigo-50 rounded-lg p-4 text-sm space-y-1">
                            <div className="font-medium text-indigo-700">Summary</div>
                            <div className="text-gray-600">
                                📎 File from variable: <code className="bg-white px-1 rounded">{fileVariableKey}</code>
                            </div>
                            {attachmentName && (
                                <div className="text-gray-600">
                                    📄 Name: <code className="bg-white px-1 rounded">{attachmentName}</code>
                                </div>
                            )}
                            <div className="text-gray-600">
                                🔗 Creates ATTACHMENT link to workflow document
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-indigo-500 hover:bg-indigo-600"
                        disabled={!fileVariableKey}
                    >
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
