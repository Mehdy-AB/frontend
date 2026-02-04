'use client';

import { useState, useEffect } from 'react';
import { X, FileEdit, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { filingCategoryService } from '@/api/services/filingCategoryService';
import { FilingCategoryResponseDto, CategoryMetadataDefinitionDto } from '@/types/api';
import { WorkflowNodeData } from '../nodes/types';

interface MetadataFieldUpdate {
    id: string;
    fieldId: number | null;
    fieldKey: string;
    fieldType: string;
    value: string;
    valueType: 'static' | 'expression';
    listOptions?: string[];
    mandatory?: boolean;
}

interface UpdateMetadataNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

/**
 * UpdateMetadataNodeModal - Configuration for UPDATE_METADATA node
 * Backend: SetMetadataNodeHandler
 * - fields: Map<String, Object> - Key-value pairs
 */
export default function UpdateMetadataNodeModal({ isOpen, onClose, nodeData, onSave }: UpdateMetadataNodeModalProps) {
    const [label, setLabel] = useState(nodeData.label || 'Update Metadata');
    const [fields, setFields] = useState<MetadataFieldUpdate[]>([]);

    // Category state
    const [categories, setCategories] = useState<FilingCategoryResponseDto[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(nodeData.metadataCategoryId || null);
    const [loading, setLoading] = useState(false);

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

            // Convert old format to new format
            if (nodeData.metadataFields && nodeData.metadataFields.length > 0) {
                const convertedFields = nodeData.metadataFields.map((f: any) => ({
                    id: f.id || Date.now().toString(),
                    fieldId: f.fieldId || null,
                    fieldKey: f.key || f.fieldKey || '',
                    fieldType: f.fieldType || 'STRING',
                    value: f.value || '',
                    valueType: f.type || f.valueType || 'static',
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
        setFields([]); // Reset fields when category changes
    };

    const addField = () => {
        setFields([...fields, {
            id: Date.now().toString(),
            fieldId: null,
            fieldKey: '',
            fieldType: 'STRING',
            value: '',
            valueType: 'static',
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

    const updateFieldValueType = (id: string, valueType: 'static' | 'expression') => {
        setFields(fields.map(f => f.id === id ? { ...f, valueType } : f));
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
                value: f.value,
                type: f.valueType,
                listOptions: f.listOptions,
                mandatory: f.mandatory,
            })),
        });
        onClose();
    };

    // Render value input based on field type
    const renderValueInput = (field: MetadataFieldUpdate) => {
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

        // LIST type with options
        if (field.fieldType === 'LIST' && field.listOptions && field.listOptions.length > 0) {
            if (!field.mandatory) {
                // Allow custom values
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
            // Strict dropdown
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

        // Other types
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
                                        No fields configured. Click "Add Field" to start.
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
