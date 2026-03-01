'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, FileEdit, Plus, Trash2, Loader2, Variable } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { filingCategoryService } from '@/api/services/filingCategoryService';
import { FilingCategoryResponseDto, CategoryMetadataDefinitionDto } from '@/types/api';
import { WorkflowNodeData } from '../nodes/types';
import { Node } from '@xyflow/react';

interface MetadataFieldUpdate {
    id: string;
    fieldId: number | null;
    fieldKey: string;
    fieldType: string;
    value: string;
    valueType: 'static' | 'expression' | 'variable';
    variableKey?: string;
    listOptions?: string[];
    mandatory?: boolean;
}

// Type compatibility mapping: metadata dataType → compatible workflow variable types
const TYPE_COMPATIBILITY: Record<string, string[]> = {
    'STRING': ['STRING', 'TEXT', 'EMAIL'],
    'TEXT': ['STRING', 'TEXT', 'EMAIL'],
    'NUMBER': ['NUMBER', 'DECIMAL'],
    'FLOAT': ['NUMBER', 'DECIMAL'],
    'BOOLEAN': ['BOOLEAN'],
    'DATE': ['DATE', 'DATETIME'],
    'DATETIME': ['DATE', 'DATETIME'],
    'LIST': ['STRING', 'TEXT', 'LIST'],
};

interface UpdateMetadataNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
    allNodes?: Node[];
}

/**
 * UpdateMetadataNodeModal - Configuration for UPDATE_METADATA node.
 * Supports three value sources:
 *   - Static: user enters a fixed value
 *   - Expression: template expression like ${document.name}
 *   - Variable: picks a workflow variable key (runtime resolved, type-checked)
 */
export default function UpdateMetadataNodeModal({ isOpen, onClose, nodeData, onSave, allNodes = [] }: UpdateMetadataNodeModalProps) {
    const [label, setLabel] = useState(nodeData.label || 'Update Metadata');
    const [fields, setFields] = useState<MetadataFieldUpdate[]>([]);

    // Category state
    const [categories, setCategories] = useState<FilingCategoryResponseDto[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(nodeData.metadataCategoryId || null);
    const [loading, setLoading] = useState(false);

    // Extract workflow variables from all SET_VARIABLE nodes in the designer
    const workflowVariables = useMemo(() => {
        const vars: { key: string; type: string; label: string }[] = [];
        try {
            for (const node of allNodes) {
                if (node.type === 'setVariableNode' && node.data) {
                    const d = node.data as any;
                    if (d.variableKey && d.variableType) {
                        vars.push({
                            key: d.variableKey,
                            type: d.variableType,
                            label: d.label || d.variableKey,
                        });
                    }
                }
                // Also pick up variables from formRequest mapped fields
                if (node.data && (node.data as any).formFields) {
                    const formFields = (node.data as any).formFields;
                    if (Array.isArray(formFields)) {
                        for (const ff of formFields) {
                            if (ff.mappedVariableKey) {
                                vars.push({
                                    key: ff.mappedVariableKey,
                                    type: ff.type || 'STRING',
                                    label: ff.label || ff.mappedVariableKey,
                                });
                            }
                        }
                    }
                }
            }
        } catch (e) {
            // Fallback: no variables found
        }
        // Deduplicate by key
        const seen = new Set<string>();
        return vars.filter(v => {
            if (seen.has(v.key)) return false;
            seen.add(v.key);
            return true;
        });
    }, [allNodes, isOpen]);

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
            setLabel(nodeData.label || 'Update Metadata');
            setSelectedCategoryId(nodeData.metadataCategoryId || null);

            if (nodeData.metadataFields && nodeData.metadataFields.length > 0) {
                const convertedFields = nodeData.metadataFields.map((f: any) => ({
                    id: f.id || Date.now().toString(),
                    fieldId: f.fieldId || null,
                    fieldKey: f.key || f.fieldKey || '',
                    fieldType: f.fieldType || 'STRING',
                    value: f.value || '',
                    valueType: f.type || f.valueType || 'static',
                    variableKey: f.variableKey || '',
                    listOptions: f.listOptions || [],
                    mandatory: f.mandatory || false,
                }));
                setFields(convertedFields);
            } else {
                setFields([]);
            }
        }
    }, [isOpen, nodeData]);

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    const metadataDefinitions = selectedCategory?.metadataDefinitions || [];

    const handleCategoryChange = (categoryId: string) => {
        const numId = parseInt(categoryId);
        setSelectedCategoryId(numId);
        setFields([]);
    };

    const addField = () => {
        setFields([...fields, {
            id: Date.now().toString(),
            fieldId: null,
            fieldKey: '',
            fieldType: 'STRING',
            value: '',
            valueType: 'static',
            variableKey: '',
            listOptions: [],
            mandatory: false,
        }]);
    };

    const removeField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
    };

    const updateFieldSelection = (fieldUpdateId: string, metadataFieldId: string) => {
        const numId = parseInt(metadataFieldId);
        const metadataField = metadataDefinitions.find(m => m.id === numId);

        if (metadataField) {
            setFields(fields.map(f => {
                if (f.id === fieldUpdateId) {
                    return {
                        ...f,
                        fieldId: numId,
                        fieldKey: metadataField.key,
                        fieldType: metadataField.dataType,
                        value: '',
                        variableKey: '',
                        listOptions: metadataField.list?.option || [],
                        mandatory: metadataField.mandatory,
                    };
                }
                return f;
            }));
        }
    };

    const updateFieldValue = (id: string, value: string) => {
        setFields(fields.map(f => f.id === id ? { ...f, value } : f));
    };

    const updateFieldValueType = (id: string, valueType: 'static' | 'expression' | 'variable') => {
        setFields(fields.map(f => f.id === id ? { ...f, valueType, value: '', variableKey: '' } : f));
    };

    const updateFieldVariableKey = (id: string, variableKey: string) => {
        setFields(fields.map(f => f.id === id ? { ...f, variableKey } : f));
    };

    // Get compatible variables for a metadata field type
    const getCompatibleVariables = (fieldType: string) => {
        const compatibleTypes = TYPE_COMPATIBILITY[fieldType] || [fieldType];
        return workflowVariables.filter(v => compatibleTypes.includes(v.type));
    };

    const handleSave = () => {
        onSave({
            label,
            metadataCategoryId: selectedCategoryId,
            metadataFields: fields.filter(f => f.fieldKey.trim()).map(f => ({
                id: f.id,
                fieldId: f.fieldId,
                key: f.fieldKey,
                fieldType: f.fieldType,
                value: f.valueType === 'variable' ? '' : f.value,
                type: f.valueType,
                variableKey: f.valueType === 'variable' ? f.variableKey : undefined,
                listOptions: f.listOptions,
                mandatory: f.mandatory,
            })),
        });
        onClose();
    };

    // Render value input based on field type and value type
    const renderValueInput = (field: MetadataFieldUpdate) => {
        // Variable mode
        if (field.valueType === 'variable') {
            const compatibleVars = getCompatibleVariables(field.fieldType);
            return (
                <div className="space-y-2">
                    {compatibleVars.length > 0 ? (
                        <Select value={field.variableKey || ''} onValueChange={(v) => updateFieldVariableKey(field.id, v)}>
                            <SelectTrigger className="text-sm">
                                <SelectValue placeholder="Select workflow variable..." />
                            </SelectTrigger>
                            <SelectContent>
                                {compatibleVars.map((v) => (
                                    <SelectItem key={v.key} value={v.key}>
                                        <div className="flex items-center gap-2">
                                            <Variable className="w-3 h-3 text-purple-500" />
                                            <span>{v.key}</span>
                                            <span className="text-xs text-gray-400 bg-gray-100 px-1 py-0.5 rounded">
                                                {v.type}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <div className="space-y-2">
                            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                                No compatible variables found for type "{field.fieldType}".
                                You can type a variable key manually.
                            </div>
                            <Input
                                value={field.variableKey || ''}
                                onChange={(e) => updateFieldVariableKey(field.id, e.target.value)}
                                placeholder="Variable key (e.g. approverName)"
                                className="text-sm font-mono"
                            />
                        </div>
                    )}
                    {field.variableKey && (
                        <div className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded flex items-center gap-1">
                            <Variable className="w-3 h-3" />
                            Will use value of <strong className="font-mono">${'{'}var.{field.variableKey}{'}'}</strong> at runtime
                        </div>
                    )}
                </div>
            );
        }

        // Expression mode
        if (field.valueType === 'expression') {
            return (
                <Textarea
                    value={field.value}
                    onChange={(e) => updateFieldValue(field.id, e.target.value)}
                    placeholder="${document.name}"
                    rows={2}
                    className="font-mono text-sm"
                />
            );
        }

        // Static mode - LIST type with options
        if (field.fieldType === 'LIST' && field.listOptions && field.listOptions.length > 0) {
            if (!field.mandatory) {
                return (
                    <div className="space-y-2">
                        <Select value={field.value} onValueChange={(v) => updateFieldValue(field.id, v)}>
                            <SelectTrigger className="text-sm">
                                <SelectValue placeholder="Select value..." />
                            </SelectTrigger>
                            <SelectContent>
                                {field.listOptions.map((opt) => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            value={field.value}
                            onChange={(e) => updateFieldValue(field.id, e.target.value)}
                            placeholder="Or enter custom..."
                            className="text-sm"
                        />
                    </div>
                );
            }
            return (
                <Select value={field.value} onValueChange={(v) => updateFieldValue(field.id, v)}>
                    <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Select value..." />
                    </SelectTrigger>
                    <SelectContent>
                        {field.listOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        }

        // Static mode - Other types
        switch (field.fieldType) {
            case 'BOOLEAN':
                return (
                    <Select value={field.value || 'true'} onValueChange={(v) => updateFieldValue(field.id, v)}>
                        <SelectTrigger className="text-sm">
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
                        step={field.fieldType === 'FLOAT' ? '0.01' : '1'}
                        value={field.value}
                        onChange={(e) => updateFieldValue(field.id, e.target.value)}
                        placeholder="Enter number..."
                        className="text-sm"
                    />
                );
            case 'DATE':
                return (
                    <Input
                        type="date"
                        value={field.value}
                        onChange={(e) => updateFieldValue(field.id, e.target.value)}
                        className="text-sm"
                    />
                );
            case 'DATETIME':
                return (
                    <Input
                        type="datetime-local"
                        value={field.value}
                        onChange={(e) => updateFieldValue(field.id, e.target.value)}
                        className="text-sm"
                    />
                );
            default: // STRING
                return (
                    <Input
                        value={field.value}
                        onChange={(e) => updateFieldValue(field.id, e.target.value)}
                        placeholder="Enter value..."
                        className="text-sm"
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
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-teal-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
                            <FileEdit className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Update Metadata</h3>
                            <p className="text-sm text-gray-500">Set document metadata fields</p>
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
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div>
                        <Label htmlFor="label">Node Label</Label>
                        <Input
                            id="label"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="Update Metadata"
                            className="mt-1"
                        />
                    </div>

                    {/* Category Selection */}
                    {loading ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                            <span className="ml-2 text-sm text-gray-500">Loading models...</span>
                        </div>
                    ) : (
                        <div>
                            <Label>Model (Filing Category)</Label>
                            <Select
                                value={selectedCategoryId?.toString() || ''}
                                onValueChange={handleCategoryChange}
                            >
                                <SelectTrigger className="mt-1">
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
                    )}

                    {/* Metadata Fields */}
                    {selectedCategoryId && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label>Metadata Fields to Update</Label>
                                <Button variant="outline" size="sm" onClick={addField}>
                                    <Plus className="w-4 h-4 mr-1" /> Add Field
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {fields.length === 0 && (
                                    <div className="text-center py-4 text-sm text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                                        No fields configured. Click &quot;Add Field&quot; to start.
                                    </div>
                                )}

                                {fields.map((field) => (
                                    <div key={field.id} className="p-3 border rounded-lg bg-gray-50 space-y-2">
                                        {/* Field selector row */}
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <Select
                                                    value={field.fieldId?.toString() || ''}
                                                    onValueChange={(v) => updateFieldSelection(field.id, v)}
                                                >
                                                    <SelectTrigger className="text-sm">
                                                        <SelectValue placeholder="Select field..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {metadataDefinitions.map((meta) => (
                                                            <SelectItem key={meta.id} value={meta.id!.toString()}>
                                                                <div className="flex items-center gap-2">
                                                                    <span>{meta.key}</span>
                                                                    <span className="text-xs text-gray-400 bg-gray-100 px-1 py-0.5 rounded">
                                                                        {meta.dataType}
                                                                    </span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Select
                                                value={field.valueType}
                                                onValueChange={(v) => updateFieldValueType(field.id, v as any)}
                                            >
                                                <SelectTrigger className="w-28 text-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="static">Static</SelectItem>
                                                    <SelectItem value="variable">Variable</SelectItem>
                                                    <SelectItem value="expression">Expression</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <button
                                                onClick={() => removeField(field.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded shrink-0"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Value input */}
                                        {field.fieldId && (
                                            <div>
                                                {renderValueInput(field)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
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
