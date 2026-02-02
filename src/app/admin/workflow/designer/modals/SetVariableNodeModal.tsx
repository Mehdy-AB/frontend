'use client';

import { useState, useEffect } from 'react';
import { X, Variable } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkflowNodeData } from '../nodes/types';

interface SetVariableNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

const VARIABLE_TYPES = [
    { value: 'STRING', label: 'String' },
    { value: 'NUMBER', label: 'Number' },
    { value: 'BOOLEAN', label: 'Boolean' },
    { value: 'DATE', label: 'Date' },
    { value: 'EXPRESSION', label: 'Expression' },
];

const SCOPE_OPTIONS = [
    { value: 'WORKFLOW', label: 'Workflow Scope' },
    { value: 'DOCUMENT', label: 'Document Metadata' },
    { value: 'GLOBAL', label: 'Global Variable' },
];

export default function SetVariableNodeModal({ isOpen, onClose, nodeData, onSave }: SetVariableNodeModalProps) {
    const [variableName, setVariableName] = useState<string>(nodeData.variableName || '');
    const [variableValue, setVariableValue] = useState<string>(nodeData.variableValue || '');
    const [variableType, setVariableType] = useState<string>(nodeData.variableType || 'STRING');
    const [variableScope, setVariableScope] = useState<string>(nodeData.variableScope || 'WORKFLOW');

    useEffect(() => {
        if (isOpen) {
            setVariableName(nodeData.variableName || '');
            setVariableValue(nodeData.variableValue || '');
            setVariableType(nodeData.variableType || 'STRING');
            setVariableScope(nodeData.variableScope || 'WORKFLOW');
        }
    }, [isOpen, nodeData]);

    const handleSave = () => {
        onSave({
            variableName,
            variableValue,
            variableType,
            variableScope,
        });
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
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-teal-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
                            <Variable className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Set Variable</h3>
                            <p className="text-sm text-gray-500">Define workflow variable</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl hover:bg-teal-100 flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Variable Name */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Variable Name</Label>
                        <Input
                            value={variableName}
                            onChange={(e) => setVariableName(e.target.value.replace(/\s/g, '_'))}
                            placeholder="my_variable"
                            className="font-mono"
                        />
                    </div>

                    {/* Type and Scope */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Type</Label>
                            <Select value={variableType} onValueChange={setVariableType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {VARIABLE_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Scope</Label>
                            <Select value={variableScope} onValueChange={setVariableScope}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SCOPE_OPTIONS.map((scope) => (
                                        <SelectItem key={scope.value} value={scope.value}>{scope.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Value */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            {variableType === 'EXPRESSION' ? 'Expression' : 'Value'}
                        </Label>
                        {variableType === 'EXPRESSION' ? (
                            <Textarea
                                value={variableValue}
                                onChange={(e) => setVariableValue(e.target.value)}
                                placeholder="${document.title} + '_processed'"
                                rows={3}
                                className="font-mono text-sm"
                            />
                        ) : variableType === 'BOOLEAN' ? (
                            <Select value={variableValue || 'true'} onValueChange={setVariableValue}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">True</SelectItem>
                                    <SelectItem value="false">False</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input
                                type={variableType === 'NUMBER' ? 'number' : variableType === 'DATE' ? 'date' : 'text'}
                                value={variableValue}
                                onChange={(e) => setVariableValue(e.target.value)}
                                placeholder="Enter value..."
                            />
                        )}
                    </div>

                    {/* Preview */}
                    {variableName && (
                        <div className="bg-teal-50 rounded-lg p-4 font-mono text-sm">
                            <span className="text-teal-600">${'{'}${variableName}{'}'}</span>
                            <span className="text-gray-500"> = </span>
                            <span className="text-teal-800">{variableValue || 'undefined'}</span>
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
                        className="bg-teal-500 hover:bg-teal-600"
                        disabled={!variableName}
                    >
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
