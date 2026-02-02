'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, GitBranch, Plus, Trash2, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { filingCategoryService } from '@/api/services/filingCategoryService';
import { FilingCategoryResponseDto, CategoryMetadataDefinitionDto } from '@/types/api';
import { WorkflowNodeData, WorkflowCondition, ConditionGroup, ConditionProperty, ConditionOperator } from '../nodes/types';

interface ConditionNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

const PROPERTY_OPTIONS: { value: ConditionProperty; label: string }[] = [
    { value: 'documentName', label: 'Document Name' },
    { value: 'fileSize', label: 'File Size' },
    { value: 'mimeType', label: 'File Type (MIME)' },
    { value: 'filingCategory', label: 'Models' },
    { value: 'metadata', label: 'Metadata Field' },
    { value: 'createdDate', label: 'Created Date' },
];

const getOperatorsForProperty = (property: ConditionProperty): { value: ConditionOperator; label: string }[] => {
    switch (property) {
        case 'documentName':
            return [
                { value: 'equals', label: 'Equals' },
                { value: 'notEquals', label: 'Not Equals' },
                { value: 'contains', label: 'Contains' },
                { value: 'startsWith', label: 'Starts With' },
                { value: 'endsWith', label: 'Ends With' },
            ];
        case 'fileSize':
            return [
                { value: 'equals', label: 'Equals' },
                { value: 'greaterThan', label: 'Greater Than' },
                { value: 'lessThan', label: 'Less Than' },
                { value: 'between', label: 'Between' },
            ];
        case 'mimeType':
            return [
                { value: 'equals', label: 'Equals' },
                { value: 'in', label: 'In List' },
            ];
        case 'filingCategory':
            return [
                { value: 'equals', label: 'Equals' },
                { value: 'notEquals', label: 'Not Equals' },
            ];
        case 'metadata':
            // Operators depend on metadata field type, handled separately
            return [
                { value: 'equals', label: 'Equals' },
                { value: 'notEquals', label: 'Not Equals' },
            ];
        case 'createdDate':
            return [
                { value: 'equals', label: 'Equals' },
                { value: 'before', label: 'Before' },
                { value: 'after', label: 'After' },
                { value: 'between', label: 'Between' },
            ];
        default:
            return [{ value: 'equals', label: 'Equals' }];
    }
};

const MIME_OPTIONS = [
    { value: 'application/pdf', label: 'PDF' },
    { value: 'application/msword', label: 'Word (.doc)' },
    { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'Word (.docx)' },
    { value: 'application/vnd.ms-excel', label: 'Excel (.xls)' },
    { value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel (.xlsx)' },
    { value: 'image/jpeg', label: 'JPEG Image' },
    { value: 'image/png', label: 'PNG Image' },
    { value: 'text/plain', label: 'Text File' },
];

// Get operators based on metadata field type
const getOperatorsForMetadataType = (dataType: string): { value: ConditionOperator; label: string }[] => {
    switch (dataType) {
        case 'STRING':
        case 'LIST':
            return [
                { value: 'equals', label: 'Equals' },
                { value: 'notEquals', label: 'Not Equals' },
                { value: 'contains', label: 'Contains' },
                { value: 'startsWith', label: 'Starts With' },
                { value: 'endsWith', label: 'Ends With' },
            ];
        case 'NUMBER':
        case 'FLOAT':
            return [
                { value: 'equals', label: 'Equals' },
                { value: 'notEquals', label: 'Not Equals' },
                { value: 'greaterThan', label: 'Greater Than' },
                { value: 'lessThan', label: 'Less Than' },
                { value: 'between', label: 'Between' },
            ];
        case 'DATE':
        case 'DATETIME':
            return [
                { value: 'equals', label: 'Equals' },
                { value: 'before', label: 'Before' },
                { value: 'after', label: 'After' },
                { value: 'between', label: 'Between' },
            ];
        case 'BOOLEAN':
            return [
                { value: 'equals', label: 'Equals' },
            ];
        default:
            return [
                { value: 'equals', label: 'Equals' },
                { value: 'notEquals', label: 'Not Equals' },
            ];
    }
};

export default function ConditionNodeModal({ isOpen, onClose, nodeData, onSave }: ConditionNodeModalProps) {
    const [conditionGroups, setConditionGroups] = useState<ConditionGroup[]>([]);
    const [categories, setCategories] = useState<FilingCategoryResponseDto[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<FilingCategoryResponseDto | null>(null);
    const [loading, setLoading] = useState(false);

    // Load categories
    useEffect(() => {
        const loadCategories = async () => {
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

        if (isOpen) {
            loadCategories();
        }
    }, [isOpen]);

    // Initialize from nodeData
    useEffect(() => {
        if (isOpen) {
            if (nodeData.conditionGroups && nodeData.conditionGroups.length > 0) {
                setConditionGroups(nodeData.conditionGroups);
            } else {
                // Default to one empty condition
                setConditionGroups([{
                    logic: 'AND',
                    conditions: [{
                        id: `cond_${Date.now()}`,
                        property: 'documentName',
                        operator: 'contains',
                        value: '',
                    }],
                }]);
            }
        }
    }, [isOpen, nodeData]);

    const addCondition = (groupIndex: number) => {
        const newGroups = [...conditionGroups];
        newGroups[groupIndex].conditions.push({
            id: `cond_${Date.now()}`,
            property: 'documentName',
            operator: 'contains',
            value: '',
        });
        setConditionGroups(newGroups);
    };

    const removeCondition = (groupIndex: number, conditionIndex: number) => {
        const newGroups = [...conditionGroups];
        newGroups[groupIndex].conditions.splice(conditionIndex, 1);

        // Remove group if no conditions left
        if (newGroups[groupIndex].conditions.length === 0) {
            newGroups.splice(groupIndex, 1);
        }

        // Ensure at least one group with one condition
        if (newGroups.length === 0) {
            newGroups.push({
                logic: 'AND',
                conditions: [{
                    id: `cond_${Date.now()}`,
                    property: 'documentName',
                    operator: 'contains',
                    value: '',
                }],
            });
        }

        setConditionGroups(newGroups);
    };

    const updateCondition = (
        groupIndex: number,
        conditionIndex: number,
        field: keyof WorkflowCondition,
        value: any
    ) => {
        const newGroups = [...conditionGroups];
        const condition = newGroups[groupIndex].conditions[conditionIndex];

        // Reset operator and value when property changes
        if (field === 'property') {
            condition.property = value;
            condition.operator = getOperatorsForProperty(value)[0].value;
            condition.value = '';

            // Load category metadata if metadata property selected
            if (value === 'metadata' && categories.length > 0) {
                setSelectedCategory(categories[0]);
            }
        } else {
            (condition as any)[field] = value;
        }

        setConditionGroups(newGroups);
    };

    const updateGroupLogic = (groupIndex: number, logic: 'AND' | 'OR') => {
        const newGroups = [...conditionGroups];
        newGroups[groupIndex].logic = logic;
        setConditionGroups(newGroups);
    };

    const buildExpressionString = (): string => {
        return conditionGroups.map((group, gi) => {
            const groupStr = group.conditions.map((c, ci) => {
                let expr = `${c.property === 'filingCategory' ? 'Model' : c.property} ${c.operator}`;
                if (c.value) {
                    let displayValue = c.value;
                    // For filingCategory, try to find name
                    if (c.property === 'filingCategory') {
                        const cat = categories.find(cat => String(cat.id) === String(c.value));
                        if (cat) displayValue = cat.name;
                    }
                    expr += ` "${displayValue}"`;
                }
                return expr;
            }).join(` ${group.logic} `);
            return `(${groupStr})`;
        }).join(' AND ');
    };

    const handleSave = () => {
        onSave({
            conditionGroups,
            conditionExpression: buildExpressionString(),
        });
        onClose();
    };

    const renderValueInput = (condition: WorkflowCondition, groupIndex: number, conditionIndex: number) => {
        const { property, operator } = condition;

        // Category picker
        if (property === 'filingCategory') {
            return (
                <Select
                    value={String(condition.value || '')}
                    onValueChange={(v) => updateCondition(groupIndex, conditionIndex, 'value', v)}
                >
                    <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent className="z-[200]">
                        {categories.map((cat) => (
                            <SelectItem key={cat.id} value={String(cat.id)}>
                                {cat.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        }

        // Metadata field picker - shows category selector then metadata field selector
        if (property === 'metadata') {
            const selectedCat = categories.find(c => c.id === condition.categoryId);
            const metadataFields = selectedCat?.metadataDefinitions || [];
            const selectedField = metadataFields.find(m => m.id === condition.metadataFieldId);

            return (
                <div className="flex-1 flex flex-wrap items-center gap-2">
                    {/* Category Selection */}
                    <Select
                        value={condition.categoryId ? String(condition.categoryId) : ''}
                        onValueChange={(v) => {
                            const cat = categories.find(c => c.id === Number(v));
                            updateCondition(groupIndex, conditionIndex, 'categoryId', Number(v));
                            // Reset metadata field when category changes
                            updateCondition(groupIndex, conditionIndex, 'metadataFieldId', undefined);
                            updateCondition(groupIndex, conditionIndex, 'metadataFieldName', undefined);
                            updateCondition(groupIndex, conditionIndex, 'value', '');
                        }}
                    >
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder="Category..." />
                        </SelectTrigger>
                        <SelectContent className="z-[200]">
                            {categories.map((cat) => (
                                <SelectItem key={cat.id} value={String(cat.id)}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Metadata Field Selection */}
                    {condition.categoryId && (
                        <Select
                            value={condition.metadataFieldId ? String(condition.metadataFieldId) : ''}
                            onValueChange={(v) => {
                                const field = metadataFields.find(m => m.id === Number(v));
                                updateCondition(groupIndex, conditionIndex, 'metadataFieldId', Number(v));
                                updateCondition(groupIndex, conditionIndex, 'metadataFieldName', field?.key || '');
                                updateCondition(groupIndex, conditionIndex, 'value', '');
                                // Update operator based on metadata type
                                if (field) {
                                    const ops = getOperatorsForMetadataType(field.dataType);
                                    updateCondition(groupIndex, conditionIndex, 'operator', ops[0].value);
                                }
                            }}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Field..." />
                            </SelectTrigger>
                            <SelectContent className="z-[200]">
                                {metadataFields.map((field) => (
                                    <SelectItem key={field.id} value={String(field.id)}>
                                        {field.key}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* Value Input based on metadata type */}
                    {condition.metadataFieldId && selectedField && (
                        <>
                            {selectedField.dataType === 'BOOLEAN' ? (
                                <Select
                                    value={String(condition.value || '')}
                                    onValueChange={(v) => updateCondition(groupIndex, conditionIndex, 'value', v)}
                                >
                                    <SelectTrigger className="w-24">
                                        <SelectValue placeholder="Value" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[200]">
                                        <SelectItem value="true">True</SelectItem>
                                        <SelectItem value="false">False</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : selectedField.dataType === 'NUMBER' || selectedField.dataType === 'FLOAT' ? (
                                <Input
                                    type="number"
                                    value={String(condition.value || '')}
                                    onChange={(e) => updateCondition(groupIndex, conditionIndex, 'value', e.target.value)}
                                    placeholder="Value..."
                                    className="w-24"
                                />
                            ) : selectedField.dataType === 'DATE' || selectedField.dataType === 'DATETIME' ? (
                                <Input
                                    type={selectedField.dataType === 'DATETIME' ? 'datetime-local' : 'date'}
                                    value={String(condition.value || '')}
                                    onChange={(e) => updateCondition(groupIndex, conditionIndex, 'value', e.target.value)}
                                    className="w-40"
                                />
                            ) : selectedField.dataType === 'LIST' && selectedField.list?.option ? (
                                <Select
                                    value={String(condition.value || '')}
                                    onValueChange={(v) => updateCondition(groupIndex, conditionIndex, 'value', v)}
                                >
                                    <SelectTrigger className="w-36">
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent className="z-[200]">
                                        {selectedField.list.option.map((val: string, idx: number) => (
                                            <SelectItem key={idx} value={val}>
                                                {val}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input
                                    value={String(condition.value || '')}
                                    onChange={(e) => updateCondition(groupIndex, conditionIndex, 'value', e.target.value)}
                                    placeholder="Value..."
                                    className="flex-1 min-w-[100px]"
                                />
                            )}
                        </>
                    )}
                </div>
            );
        }

        // MIME type picker
        if (property === 'mimeType') {
            return (
                <Select
                    value={String(condition.value || '')}
                    onValueChange={(v) => updateCondition(groupIndex, conditionIndex, 'value', v)}
                >
                    <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent className="z-[200]">
                        {MIME_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        }

        // Date picker
        if (property === 'createdDate') {
            return (
                <Input
                    type="date"
                    value={String(condition.value || '')}
                    onChange={(e) => updateCondition(groupIndex, conditionIndex, 'value', e.target.value)}
                    className="flex-1"
                />
            );
        }

        // Number input for file size
        if (property === 'fileSize') {
            return (
                <div className="flex-1 flex items-center gap-2">
                    <Input
                        type="number"
                        value={String(condition.value || '')}
                        onChange={(e) => updateCondition(groupIndex, conditionIndex, 'value', e.target.value)}
                        placeholder="Size..."
                        className="flex-1"
                    />
                    <Select defaultValue="KB">
                        <SelectTrigger className="w-20">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[200]">
                            <SelectItem value="KB">KB</SelectItem>
                            <SelectItem value="MB">MB</SelectItem>
                            <SelectItem value="GB">GB</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            );
        }

        // Default text input
        return (
            <Input
                value={String(condition.value || '')}
                onChange={(e) => updateCondition(groupIndex, conditionIndex, 'value', e.target.value)}
                placeholder="Value..."
                className="flex-1"
            />
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-purple-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                            <GitBranch className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Configure Condition</h3>
                            <p className="text-sm text-gray-500">Define branching logic</p>
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
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                        </div>
                    ) : (
                        <>
                            {conditionGroups.map((group, groupIndex) => (
                                <div key={groupIndex} className="space-y-3">
                                    {groupIndex > 0 && (
                                        <div className="flex items-center gap-2 text-sm font-medium text-purple-600">
                                            <div className="flex-1 h-px bg-purple-200" />
                                            AND
                                            <div className="flex-1 h-px bg-purple-200" />
                                        </div>
                                    )}

                                    <div className="border border-purple-200 rounded-xl p-4 bg-purple-50/50">
                                        {/* Logic selector */}
                                        {group.conditions.length > 1 && (
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-sm text-gray-600">Match</span>
                                                <Select
                                                    value={group.logic}
                                                    onValueChange={(v) => updateGroupLogic(groupIndex, v as 'AND' | 'OR')}
                                                >
                                                    <SelectTrigger className="w-24">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="z-[200]">
                                                        <SelectItem value="AND">All</SelectItem>
                                                        <SelectItem value="OR">Any</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <span className="text-sm text-gray-600">of the following:</span>
                                            </div>
                                        )}

                                        {/* Conditions */}
                                        <div className="space-y-3">
                                            {group.conditions.map((condition, conditionIndex) => (
                                                <div key={condition.id} className="flex items-center gap-2">
                                                    {/* Property */}
                                                    <Select
                                                        value={condition.property}
                                                        onValueChange={(v) => updateCondition(groupIndex, conditionIndex, 'property', v)}
                                                    >
                                                        <SelectTrigger className="w-40">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="z-[200]">
                                                            {PROPERTY_OPTIONS.map((opt) => (
                                                                <SelectItem key={opt.value} value={opt.value}>
                                                                    {opt.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>

                                                    {/* Operator */}
                                                    <Select
                                                        value={condition.operator}
                                                        onValueChange={(v) => updateCondition(groupIndex, conditionIndex, 'operator', v)}
                                                    >
                                                        <SelectTrigger className="w-36">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="z-[200]">
                                                            {(() => {
                                                                // For metadata, use type-specific operators if field is selected
                                                                if (condition.property === 'metadata' && condition.metadataFieldId) {
                                                                    const selectedCat = categories.find(c => c.id === condition.categoryId);
                                                                    const metadataFields = selectedCat?.metadataDefinitions || [];
                                                                    const selectedField = metadataFields.find(m => m.id === condition.metadataFieldId);
                                                                    if (selectedField) {
                                                                        return getOperatorsForMetadataType(selectedField.dataType).map((opt) => (
                                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                                {opt.label}
                                                                            </SelectItem>
                                                                        ));
                                                                    }
                                                                }
                                                                // Default: use property-based operators
                                                                return getOperatorsForProperty(condition.property).map((opt) => (
                                                                    <SelectItem key={opt.value} value={opt.value}>
                                                                        {opt.label}
                                                                    </SelectItem>
                                                                ));
                                                            })()}
                                                        </SelectContent>
                                                    </Select>

                                                    {/* Value */}
                                                    {renderValueInput(condition, groupIndex, conditionIndex)}

                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => removeCondition(groupIndex, conditionIndex)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Add condition */}
                                        <button
                                            onClick={() => addCondition(groupIndex)}
                                            className="mt-3 flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add condition
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Preview */}
                            <div className="bg-gray-100 rounded-lg p-4">
                                <Label className="text-sm text-gray-600 mb-2 block">Expression Preview</Label>
                                <code className="text-sm font-mono text-purple-700 break-all">
                                    {buildExpressionString() || 'No conditions defined'}
                                </code>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-purple-500 hover:bg-purple-600">
                        Save Condition
                    </Button>
                </div>
            </div>
        </div>
    );
}
