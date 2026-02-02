'use client';

import { useState, useEffect } from 'react';
import { X, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkflowNodeData } from '../nodes/types';

interface GetContextNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

const CONTEXT_SOURCES = [
    { value: 'doc.id', label: 'Document ID' },
    { value: 'doc.name', label: 'Document Name' },
    { value: 'doc.status', label: 'Document Status' },
    { value: 'doc.folderId', label: 'Folder ID' },
    { value: 'doc.size', label: 'File Size' },
    { value: 'doc.contentType', label: 'Content Type' },
    { value: 'wf.id', label: 'Workflow ID' },
    { value: 'wf.name', label: 'Workflow Name' },
    { value: 'wf.instanceId', label: 'Instance ID' },
    { value: 'user.id', label: 'User ID' },
    { value: 'user.email', label: 'User Email' },
];

/**
 * GetContextNodeModal - Configuration for GET_CONTEXT node
 * Read document/workflow context into a variable
 */
export default function GetContextNodeModal({ isOpen, onClose, nodeData, onSave }: GetContextNodeModalProps) {
    const [label, setLabel] = useState(nodeData.label || 'Get Context');
    const [contextSource, setContextSource] = useState(nodeData.contextSource || 'doc.name');
    const [variableName, setVariableName] = useState(nodeData.contextVariable || 'myVariable');

    useEffect(() => {
        if (isOpen) {
            setLabel(nodeData.label || 'Get Context');
            setContextSource(nodeData.contextSource || 'doc.name');
            setVariableName(nodeData.contextVariable || 'myVariable');
        }
    }, [isOpen, nodeData]);

    const handleSave = () => {
        onSave({
            label,
            contextSource,
            contextVariable: variableName,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-emerald-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                            <Database className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Get Context</h3>
                            <p className="text-sm text-gray-500">Read context variable</p>
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
                <div className="p-6 space-y-4">
                    <div>
                        <Label htmlFor="label">Node Label</Label>
                        <Input
                            id="label"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="Get Context"
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label>Context Source</Label>
                        <Select value={contextSource} onValueChange={setContextSource}>
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                            <SelectContent>
                                {CONTEXT_SOURCES.map((source) => (
                                    <SelectItem key={source.value} value={source.value}>
                                        {source.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="variable">Store In Variable</Label>
                        <Input
                            id="variable"
                            value={variableName}
                            onChange={(e) => setVariableName(e.target.value)}
                            placeholder="myVariable"
                            className="mt-1 font-mono"
                        />
                        <p className="text-xs text-gray-400 mt-1">Access later as ${'{vars.' + variableName + '}'}</p>
                    </div>

                    {/* Preview */}
                    <div className="bg-emerald-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600">
                            <span className="font-mono text-emerald-700">${'{' + contextSource + '}'}</span>
                            <span className="mx-2">→</span>
                            <span className="font-mono text-emerald-700">${'{vars.' + variableName + '}'}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600">
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
