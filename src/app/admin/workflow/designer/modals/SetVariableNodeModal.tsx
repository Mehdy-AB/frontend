'use client';

import { useState, useEffect } from 'react';
import { X, Variable, ChevronDown, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { filingCategoryService } from '@/api/services/filingCategoryService';
import { FilingCategoryResponseDto, CategoryMetadataDefinitionDto, MetadataType } from '@/types/api';
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

    // Document metadata state
    const [categories, setCategories] = useState<FilingCategoryResponseDto[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(nodeData.metadataCategoryId || null);
    const [selectedMetadataField, setSelectedMetadataField] = useState<CategoryMetadataDefinitionDto | null>(null);
    const [selectedMetadataFieldId, setSelectedMetadataFieldId] = useState<number | null>(nodeData.metadataFieldId || null);
    const [loading, setLoading] = useState(false);
    const [listOptions, setListOptions] = useState<string[]>([]);
    const [allowCustomValue, setAllowCustomValue] = useState(false);

    // Load categories when modal opens
    useEffect(() => {
        const loadCategories = async () => {
            if (!isOpen) return;
            setLoading(true);
            try {
                const response = await filingCategoryService.getAllFilingCategories({ page: 0, size: 100 });
                setCategories(response.content);
            } catch (error) {
                console.error('Failed to load categories:', error);
            } finally {
                setLoading(false);
            }
        };
        loadCategories();
    }, [isOpen]);

    // Initialize form from nodeData
    useEffect(() => {
        if (isOpen) {
            setVariableName(nodeData.variableName || '');
            setVariableValue(nodeData.variableValue || '');
            setVariableType(nodeData.variableType || 'STRING');
            setVariableScope(nodeData.variableScope || 'WORKFLOW');
            setSelectedCategoryId(nodeData.metadataCategoryId || null);
            setSelectedMetadataFieldId(nodeData.metadataFieldId || null);
        }
    }, [isOpen, nodeData]);

    // Find selected category and metadata field
    useEffect(() => {
        if (selectedCategoryId && categories.length > 0) {
            const cat = categories.find(c => c.id === selectedCategoryId);
            if (cat && selectedMetadataFieldId && cat.metadataDefinitions) {
                const field = cat.metadataDefinitions.find(f => f.id === selectedMetadataFieldId);
                if (field) {
                    setSelectedMetadataField(field);
                    setVariableType(field.dataType);

                    // If LIST type, set options
                    if (field.dataType === 'LIST' && field.list?.option) {
                        setListOptions(field.list.option);
                        setAllowCustomValue(!field.mandatory);
                    }
                }
            }
        }
    }, [selectedCategoryId, selectedMetadataFieldId, categories]);

    const handleCategoryChange = (categoryId: string) => {
        const numId = parseInt(categoryId);
        setSelectedCategoryId(numId);
        setSelectedMetadataFieldId(null);
        setSelectedMetadataField(null);
        setVariableName('');
        setListOptions([]);
    };

    const handleMetadataFieldChange = (fieldId: string) => {
        const numId = parseInt(fieldId);
        setSelectedMetadataFieldId(numId);

        const cat = categories.find(c => c.id === selectedCategoryId);
        if (cat?.metadataDefinitions) {
            const field = cat.metadataDefinitions.find(f => f.id === numId);
            if (field) {
                setSelectedMetadataField(field);
                setVariableName(field.key);
                setVariableType(field.dataType);
                setVariableValue('');

                // If LIST type, set options
                if (field.dataType === 'LIST' && field.list?.option) {
                    setListOptions(field.list.option);
                    setAllowCustomValue(!field.mandatory);
                } else {
                    setListOptions([]);
                    setAllowCustomValue(false);
                }
            }
        }
    };

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    const metadataFields = selectedCategory?.metadataDefinitions || [];

    const handleSave = () => {
        onSave({
            variableName,
            variableValue,
            variableType,
            variableScope,
            metadataCategoryId: variableScope === 'DOCUMENT' ? selectedCategoryId : undefined,
            metadataFieldId: variableScope === 'DOCUMENT' ? selectedMetadataFieldId : undefined,
        });
        onClose();
    };

    // Render value input based on type
    const renderValueInput = () => {
        // For LIST type with options
        if (variableType === 'LIST' && listOptions.length > 0) {
            if (allowCustomValue) {
                // Editable combo - user can select from list or type custom
                return (
                    <div className="space-y-2">
                        <Select value={variableValue} onValueChange={setVariableValue}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select or type custom value..." />
                            </SelectTrigger>
                            <SelectContent>
                                {listOptions.map((opt) => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            value={variableValue}
                            onChange={(e) => setVariableValue(e.target.value)}
                            placeholder="Or enter custom value..."
                            className="text-sm"
                        />
                        <p className="text-xs text-gray-400">Custom values allowed (field not mandatory)</p>
                    </div>
                );
            } else {
                // Strict dropdown
                return (
                    <Select value={variableValue} onValueChange={setVariableValue}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select value..." />
                        </SelectTrigger>
                        <SelectContent>
                            {listOptions.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            }
        }

        // Other types
        switch (variableType) {
            case 'EXPRESSION':
                return (
                    <Textarea
                        value={variableValue}
                        onChange={(e) => setVariableValue(e.target.value)}
                        placeholder="${document.title} + '_processed'"
                        rows={3}
                        className="font-mono text-sm"
                    />
                );
            case 'BOOLEAN':
                return (
                    <Select value={variableValue || 'true'} onValueChange={setVariableValue}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                        </SelectContent>
                    </Select>
                );
            case 'NUMBER':
            case 'FLOAT':
                return (
                    <Input
                        type="number"
                        step={variableType === 'FLOAT' ? '0.01' : '1'}
                        value={variableValue}
                        onChange={(e) => setVariableValue(e.target.value)}
                        placeholder="Enter number..."
                    />
                );
            case 'DATE':
                return (
                    <Input
                        type="date"
                        value={variableValue}
                        onChange={(e) => setVariableValue(e.target.value)}
                    />
                );
            case 'DATETIME':
                return (
                    <Input
                        type="datetime-local"
                        value={variableValue}
                        onChange={(e) => setVariableValue(e.target.value)}
                    />
                );
            default: // STRING
                return (
                    <Input
                        type="text"
                        value={variableValue}
                        onChange={(e) => setVariableValue(e.target.value)}
                        placeholder="Enter value..."
                    />
                );
        }
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
                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                    {/* Scope */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Scope</Label>
                        <Select value={variableScope} onValueChange={(v) => {
                            setVariableScope(v);
                            if (v !== 'DOCUMENT') {
                                setSelectedCategoryId(null);
                                setSelectedMetadataFieldId(null);
                                setSelectedMetadataField(null);
                                setListOptions([]);
                            }
                        }}>
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

                    {/* Document Metadata Selection */}
                    {variableScope === 'DOCUMENT' && (
                        <>
                            {loading ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                                    <span className="ml-2 text-sm text-gray-500">Loading models...</span>
                                </div>
                            ) : (
                                <>
                                    {/* Category Selection */}
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Model (Filing Category)</Label>
                                        <Select
                                            value={selectedCategoryId?.toString() || ''}
                                            onValueChange={handleCategoryChange}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a model..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id.toString()}>
                                                        {cat.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Metadata Field Selection */}
                                    {selectedCategoryId && (
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Metadata Field</Label>
                                            <Select
                                                value={selectedMetadataFieldId?.toString() || ''}
                                                onValueChange={handleMetadataFieldChange}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a field..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {metadataFields.map((field) => (
                                                        <SelectItem key={field.id} value={field.id!.toString()}>
                                                            <div className="flex items-center gap-2">
                                                                <span>{field.key}</span>
                                                                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                                                    {field.dataType}
                                                                </span>
                                                                {field.mandatory && (
                                                                    <span className="text-xs text-red-500">*</span>
                                                                )}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {/* Variable Name (for non-document scope) */}
                    {variableScope !== 'DOCUMENT' && (
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Variable Name</Label>
                            <Input
                                value={variableName}
                                onChange={(e) => setVariableName(e.target.value.replace(/\s/g, '_'))}
                                placeholder="my_variable"
                                className="font-mono"
                            />
                        </div>
                    )}

                    {/* Type (for non-document scope) */}
                    {variableScope !== 'DOCUMENT' && (
                        <div>
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
                    )}

                    {/* Value */}
                    {(variableScope !== 'DOCUMENT' || selectedMetadataField) && (
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                {variableType === 'EXPRESSION' ? 'Expression' : 'Value'}
                            </Label>
                            {renderValueInput()}
                        </div>
                    )}

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
