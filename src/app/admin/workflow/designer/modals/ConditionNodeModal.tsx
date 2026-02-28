'use client';

import { useState, useEffect } from 'react';
import { X, GitBranch, Plus, Trash2, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchSelect } from '@/components/main/SearchSelect';
import { filingCategoryService } from '@/api/services/filingCategoryService';
import { FilingCategoryResponseDto, CategoryMetadataDefinitionDto } from '@/types/api';
import { WorkflowNodeData, WorkflowCondition, ConditionGroup, ConditionProperty, ConditionOperator } from '../nodes/types';

interface ConditionNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

// Property options with icons/colors for visual distinction
const PROPERTY_OPTIONS: { value: ConditionProperty; label: string; color: string }[] = [
    { value: 'documentName', label: 'Document Name', color: 'blue' },
    { value: 'fileSize', label: 'File Size', color: 'orange' },
    { value: 'mimeType', label: 'File Type', color: 'green' },
    { value: 'filingCategory', label: 'Model', color: 'purple' },
    { value: 'metadata', label: 'Metadata Field', color: 'indigo' },
    { value: 'createdDate', label: 'Created Date', color: 'rose' },
];

// Operators organized by data type
const OPERATORS = {
    text: [
        { value: 'equals', label: 'equals' },
        { value: 'notEquals', label: 'does not equal' },
        { value: 'contains', label: 'contains' },
        { value: 'startsWith', label: 'starts with' },
        { value: 'endsWith', label: 'ends with' },
    ],
    number: [
        { value: 'equals', label: 'equals' },
        { value: 'notEquals', label: 'does not equal' },
        { value: 'greaterThan', label: 'is greater than' },
        { value: 'lessThan', label: 'is less than' },
        { value: 'between', label: 'is between' },
    ],
    date: [
        { value: 'equals', label: 'is on' },
        { value: 'before', label: 'is before' },
        { value: 'after', label: 'is after' },
        { value: 'between', label: 'is between' },
    ],
    boolean: [
        { value: 'equals', label: 'is' },
    ],
    select: [
        { value: 'equals', label: 'equals' },
        { value: 'notEquals', label: 'does not equal' },
    ],
    list: [
        { value: 'equals', label: 'equals' },
        { value: 'notEquals', label: 'does not equal' },
        { value: 'contains', label: 'contains' },
    ],
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

// Get operators based on property type
function getOperatorsForProperty(property: ConditionProperty): { value: string; label: string }[] {
    switch (property) {
        case 'documentName': return OPERATORS.text;
        case 'fileSize': return OPERATORS.number;
        case 'mimeType': return OPERATORS.select;
        case 'filingCategory': return OPERATORS.select;
        case 'createdDate': return OPERATORS.date;
        case 'metadata': return OPERATORS.text; // Default, will be overridden by metadata type
        default: return OPERATORS.text;
    }
}

// Get operators based on metadata field type
function getOperatorsForMetadataType(dataType: string): { value: string; label: string }[] {
    switch (dataType) {
        case 'STRING': return OPERATORS.text;
        case 'NUMBER':
        case 'FLOAT': return OPERATORS.number;
        case 'DATE':
        case 'DATETIME': return OPERATORS.date;
        case 'BOOLEAN': return OPERATORS.boolean;
        case 'LIST': return OPERATORS.list;
        default: return OPERATORS.text;
    }
}

export default function ConditionNodeModal({ isOpen, onClose, nodeData, onSave }: ConditionNodeModalProps) {
    const [conditionGroups, setConditionGroups] = useState<ConditionGroup[]>([]);
    const [categories, setCategories] = useState<FilingCategoryResponseDto[]>([]);
    const [loading, setLoading] = useState(false);

    // Load categories on open
    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            filingCategoryService.getAllFilingCategories({ page: 0, size: 100 })
                .then(response => setCategories(response.content))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

    // Initialize from nodeData
    useEffect(() => {
        if (isOpen) {
            if (nodeData.conditionGroups?.length) {
                setConditionGroups(nodeData.conditionGroups);
            } else {
                setConditionGroups([{
                    logic: 'AND',
                    conditions: [createEmptyCondition()],
                }]);
            }
        }
    }, [isOpen, nodeData]);

    function createEmptyCondition(): WorkflowCondition {
        return {
            id: `cond_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            property: 'documentName',
            operator: 'contains',
            value: '',
        };
    }

    function addCondition(groupIndex: number) {
        const newGroups = [...conditionGroups];
        newGroups[groupIndex].conditions.push(createEmptyCondition());
        setConditionGroups(newGroups);
    }

    function removeCondition(groupIndex: number, conditionIndex: number) {
        const newGroups = [...conditionGroups];
        newGroups[groupIndex].conditions.splice(conditionIndex, 1);
        if (newGroups[groupIndex].conditions.length === 0) {
            newGroups.splice(groupIndex, 1);
        }
        if (newGroups.length === 0) {
            newGroups.push({ logic: 'AND', conditions: [createEmptyCondition()] });
        }
        setConditionGroups(newGroups);
    }

    function updateCondition(groupIndex: number, conditionIndex: number, updates: Partial<WorkflowCondition>) {
        const newGroups = [...conditionGroups];
        const condition = newGroups[groupIndex].conditions[conditionIndex];

        // When property changes, reset dependent fields
        if (updates.property && updates.property !== condition.property) {
            const operators = getOperatorsForProperty(updates.property);
            Object.assign(condition, {
                property: updates.property,
                operator: operators[0].value,
                value: '',
                secondaryValue: undefined,
                categoryId: undefined,
                metadataFieldId: undefined,
                metadataFieldName: undefined,
                metadataDataType: undefined,
            });
        } else {
            // When operator changes away from 'between', clear secondaryValue
            if (updates.operator && updates.operator !== 'between') {
                updates.secondaryValue = undefined;
            }
            Object.assign(condition, updates);
        }

        setConditionGroups(newGroups);
    }

    function updateGroupLogic(groupIndex: number, logic: 'AND' | 'OR') {
        const newGroups = [...conditionGroups];
        newGroups[groupIndex].logic = logic;
        setConditionGroups(newGroups);
    }

    function buildExpressionString(): string {
        return conditionGroups.map(group => {
            const groupStr = group.conditions.map(c => {
                let propName = c.property === 'filingCategory' ? 'Model' : c.property;
                if (c.property === 'metadata' && c.metadataFieldName) {
                    propName = `metadata.${c.metadataFieldName}`;
                }
                let displayValue = c.value;
                if (c.property === 'filingCategory') {
                    const cat = categories.find(cat => String(cat.id) === String(c.value));
                    if (cat) displayValue = cat.name;
                }
                return `${propName} ${c.operator} "${displayValue}"`;
            }).join(` ${group.logic} `);
            return `(${groupStr})`;
        }).join(' AND ');
    }

    function handleSave() {
        onSave({
            conditionGroups,
            conditionExpression: buildExpressionString(),
        });
        onClose();
    }

    // Get the current operators for a condition
    function getOperatorsForCondition(condition: WorkflowCondition): { value: string; label: string }[] {
        if (condition.property === 'metadata' && condition.metadataFieldId) {
            const cat = categories.find(c => c.id === condition.categoryId);
            const field = cat?.metadataDefinitions?.find(m => m.id === condition.metadataFieldId);
            if (field) {
                return getOperatorsForMetadataType(field.dataType);
            }
        }
        return getOperatorsForProperty(condition.property);
    }

    // Render value input based on property type
    function renderValueInput(condition: WorkflowCondition, groupIndex: number, conditionIndex: number) {
        const { property } = condition;

        // Model/Filing Category
        if (property === 'filingCategory') {
            return (
                <div className="w-full">
                    <SearchSelect
                        items={categories}
                        fetchFunction={async (query: string) => {
                            const response = await filingCategoryService.getAllFilingCategories({ page: 0, size: 100, name: query });
                            return response.content;
                        }}
                        onSelect={(cat) => updateCondition(groupIndex, conditionIndex, { value: String(cat.id) })}
                        valueLabel={categories.find(c => String(c.id) === String(condition.value))?.name || (condition.value ? 'Unknown Model' : '')}
                        placeholder="Search document models..."
                        displayField="name"
                        openUpward={true}
                    />
                </div>
            );
        }

        // Metadata
        if (property === 'metadata') {
            const selectedCat = categories.find(c => c.id === condition.categoryId);
            const metadataFields = selectedCat?.metadataDefinitions || [];
            const selectedField = metadataFields.find(m => m.id === condition.metadataFieldId);

            return (
                <div className="space-y-3">
                    {/* Model Selection */}
                    <div>
                        <Label className="text-xs text-gray-500 mb-1 block">Model</Label>
                        <SearchSelect
                            items={categories}
                            fetchFunction={async (query: string) => {
                                const response = await filingCategoryService.getAllFilingCategories({ page: 0, size: 100, name: query });
                                return response.content;
                            }}
                            onSelect={(cat) => {
                                updateCondition(groupIndex, conditionIndex, {
                                    categoryId: Number(cat.id),
                                    metadataFieldId: undefined,
                                    metadataFieldName: undefined,
                                    value: '',
                                });
                            }}
                            valueLabel={categories.find(c => c.id === condition.categoryId)?.name || (condition.categoryId ? 'Unknown Model' : '')}
                            placeholder="Search document models..."
                            displayField="name"
                        />
                    </div>

                    {/* Field Selection */}
                    {condition.categoryId && (
                        <div>
                            <Label className="text-xs text-gray-500 mb-1 block">Field</Label>
                            <Select
                                value={condition.metadataFieldId ? String(condition.metadataFieldId) : ''}
                                onValueChange={(v) => {
                                    const field = metadataFields.find(m => m.id === Number(v));
                                    const ops = field ? getOperatorsForMetadataType(field.dataType) : OPERATORS.text;
                                    updateCondition(groupIndex, conditionIndex, {
                                        metadataFieldId: Number(v),
                                        metadataFieldName: field?.key || '',
                                        metadataDataType: field?.dataType || 'STRING',
                                        value: '',
                                        secondaryValue: undefined,
                                        operator: ops[0].value as ConditionOperator,
                                    });
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select field..." />
                                </SelectTrigger>
                                <SelectContent className="z-[200]">
                                    {metadataFields.map(field => (
                                        <SelectItem key={field.id} value={String(field.id)}>
                                            {field.key} <span className="text-gray-400 text-xs">({field.dataType})</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Value based on field type */}
                    {condition.metadataFieldId && selectedField && (
                        <div>
                            <Label className="text-xs text-gray-500 mb-1 block">Value</Label>
                            {renderMetadataValueInput(selectedField, condition, groupIndex, conditionIndex)}
                        </div>
                    )}
                </div>
            );
        }

        // MIME type
        if (property === 'mimeType') {
            return (
                <Select
                    value={String(condition.value || '')}
                    onValueChange={(v) => updateCondition(groupIndex, conditionIndex, { value: v })}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select file type..." />
                    </SelectTrigger>
                    <SelectContent className="z-[200]">
                        {MIME_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        }

        // Date
        if (property === 'createdDate') {
            if (condition.operator === 'between') {
                return (
                    <div className="flex items-center gap-2">
                        <Input
                            type="date"
                            value={String(condition.value || '')}
                            onChange={(e) => updateCondition(groupIndex, conditionIndex, { value: e.target.value })}
                            className="flex-1"
                        />
                        <span className="text-xs text-gray-500 font-medium">to</span>
                        <Input
                            type="date"
                            value={String(condition.secondaryValue || '')}
                            onChange={(e) => updateCondition(groupIndex, conditionIndex, { secondaryValue: e.target.value })}
                            className="flex-1"
                        />
                    </div>
                );
            }
            return (
                <Input
                    type="date"
                    value={String(condition.value || '')}
                    onChange={(e) => updateCondition(groupIndex, conditionIndex, { value: e.target.value })}
                    className="w-full"
                />
            );
        }

        // File size
        if (property === 'fileSize') {
            if (condition.operator === 'between') {
                return (
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            value={String(condition.value || '')}
                            onChange={(e) => updateCondition(groupIndex, conditionIndex, { value: e.target.value })}
                            placeholder="Min size..."
                            className="flex-1"
                        />
                        <span className="text-xs text-gray-500 font-medium">to</span>
                        <Input
                            type="number"
                            value={String(condition.secondaryValue || '')}
                            onChange={(e) => updateCondition(groupIndex, conditionIndex, { secondaryValue: e.target.value })}
                            placeholder="Max size..."
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
            return (
                <div className="flex gap-2">
                    <Input
                        type="number"
                        value={String(condition.value || '')}
                        onChange={(e) => updateCondition(groupIndex, conditionIndex, { value: e.target.value })}
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
                onChange={(e) => updateCondition(groupIndex, conditionIndex, { value: e.target.value })}
                placeholder="Enter value..."
                className="w-full"
            />
        );
    }

    // Render value input for metadata field based on its data type
    function renderMetadataValueInput(
        field: CategoryMetadataDefinitionDto,
        condition: WorkflowCondition,
        groupIndex: number,
        conditionIndex: number
    ) {
        switch (field.dataType) {
            case 'BOOLEAN':
                return (
                    <Select
                        value={String(condition.value || '')}
                        onValueChange={(v) => updateCondition(groupIndex, conditionIndex, { value: v })}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="z-[200]">
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                        </SelectContent>
                    </Select>
                );
            case 'NUMBER':
            case 'FLOAT':
                if (condition.operator === 'between') {
                    return (
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                value={String(condition.value || '')}
                                onChange={(e) => updateCondition(groupIndex, conditionIndex, { value: e.target.value })}
                                placeholder="Min..."
                                className="flex-1"
                            />
                            <span className="text-xs text-gray-500 font-medium">to</span>
                            <Input
                                type="number"
                                value={String(condition.secondaryValue || '')}
                                onChange={(e) => updateCondition(groupIndex, conditionIndex, { secondaryValue: e.target.value })}
                                placeholder="Max..."
                                className="flex-1"
                            />
                        </div>
                    );
                }
                return (
                    <Input
                        type="number"
                        value={String(condition.value || '')}
                        onChange={(e) => updateCondition(groupIndex, conditionIndex, { value: e.target.value })}
                        placeholder="Enter number..."
                        className="w-full"
                    />
                );
            case 'DATE':
                if (condition.operator === 'between') {
                    return (
                        <div className="flex items-center gap-2">
                            <Input
                                type="date"
                                value={String(condition.value || '')}
                                onChange={(e) => updateCondition(groupIndex, conditionIndex, { value: e.target.value })}
                                className="flex-1"
                            />
                            <span className="text-xs text-gray-500 font-medium">to</span>
                            <Input
                                type="date"
                                value={String(condition.secondaryValue || '')}
                                onChange={(e) => updateCondition(groupIndex, conditionIndex, { secondaryValue: e.target.value })}
                                className="flex-1"
                            />
                        </div>
                    );
                }
                return (
                    <Input
                        type="date"
                        value={String(condition.value || '')}
                        onChange={(e) => updateCondition(groupIndex, conditionIndex, { value: e.target.value })}
                        className="w-full"
                    />
                );
            case 'DATETIME':
                if (condition.operator === 'between') {
                    return (
                        <div className="flex items-center gap-2">
                            <Input
                                type="datetime-local"
                                value={String(condition.value || '')}
                                onChange={(e) => updateCondition(groupIndex, conditionIndex, { value: e.target.value })}
                                className="flex-1"
                            />
                            <span className="text-xs text-gray-500 font-medium">to</span>
                            <Input
                                type="datetime-local"
                                value={String(condition.secondaryValue || '')}
                                onChange={(e) => updateCondition(groupIndex, conditionIndex, { secondaryValue: e.target.value })}
                                className="flex-1"
                            />
                        </div>
                    );
                }
                return (
                    <Input
                        type="datetime-local"
                        value={String(condition.value || '')}
                        onChange={(e) => updateCondition(groupIndex, conditionIndex, { value: e.target.value })}
                        className="w-full"
                    />
                );
            case 'LIST':
                if (field.list?.option) {
                    return (
                        <Select
                            value={String(condition.value || '')}
                            onValueChange={(v) => updateCondition(groupIndex, conditionIndex, { value: v })}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select option..." />
                            </SelectTrigger>
                            <SelectContent className="z-[200]">
                                {field.list.option.map((val: string, idx: number) => (
                                    <SelectItem key={idx} value={val}>{val}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    );
                }
            // Fall through to default if no options
            default:
                return (
                    <Input
                        value={String(condition.value || '')}
                        onChange={(e) => updateCondition(groupIndex, conditionIndex, { value: e.target.value })}
                        placeholder="Enter value..."
                        className="w-full"
                    />
                );
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <GitBranch className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Configure Conditions</h3>
                            <p className="text-sm text-gray-500">Define when documents should follow this path</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl hover:bg-white/60 flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {conditionGroups.map((group, groupIndex) => (
                                <div key={groupIndex}>
                                    {/* Group separator */}
                                    {groupIndex > 0 && (
                                        <div className="flex items-center gap-3 my-4">
                                            <div className="flex-1 h-px bg-gray-200" />
                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AND</span>
                                            <div className="flex-1 h-px bg-gray-200" />
                                        </div>
                                    )}

                                    {/* Condition cards in group */}
                                    <div className="space-y-3">
                                        {/* Logic selector when multiple conditions */}
                                        {group.conditions.length > 1 && (
                                            <div className="flex items-center gap-2 mb-3 p-3 bg-purple-50 rounded-lg">
                                                <span className="text-sm text-gray-600">Match</span>
                                                <Select
                                                    value={group.logic}
                                                    onValueChange={(v) => updateGroupLogic(groupIndex, v as 'AND' | 'OR')}
                                                >
                                                    <SelectTrigger className="w-20 h-8 text-sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="z-[200]">
                                                        <SelectItem value="AND">All</SelectItem>
                                                        <SelectItem value="OR">Any</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <span className="text-sm text-gray-600">of the following conditions</span>
                                            </div>
                                        )}

                                        {group.conditions.map((condition, conditionIndex) => (
                                            <div
                                                key={condition.id}
                                                className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                                            >
                                                {/* Property selector - prominent row */}
                                                <div className="flex items-center justify-between mb-4">
                                                    <Select
                                                        value={condition.property}
                                                        onValueChange={(v) => updateCondition(groupIndex, conditionIndex, { property: v as ConditionProperty })}
                                                    >
                                                        <SelectTrigger className="w-48 font-medium">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="z-[200]">
                                                            {PROPERTY_OPTIONS.map(opt => (
                                                                <SelectItem key={opt.value} value={opt.value}>
                                                                    {opt.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>

                                                    <button
                                                        onClick={() => removeCondition(groupIndex, conditionIndex)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Operator + Value row (except for metadata which has its own layout) */}
                                                {condition.property !== 'metadata' && (
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <Label className="text-xs text-gray-500 mb-1 block">Operator</Label>
                                                            <Select
                                                                value={condition.operator}
                                                                onValueChange={(v) => updateCondition(groupIndex, conditionIndex, { operator: v as ConditionOperator })}
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="z-[200]">
                                                                    {getOperatorsForCondition(condition).map(opt => (
                                                                        <SelectItem key={opt.value} value={opt.value}>
                                                                            {opt.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label className="text-xs text-gray-500 mb-1 block">Value</Label>
                                                            {renderValueInput(condition, groupIndex, conditionIndex)}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Metadata has a special layout with model → field → operator → value */}
                                                {condition.property === 'metadata' && (
                                                    <div className="space-y-3">
                                                        {renderValueInput(condition, groupIndex, conditionIndex)}

                                                        {/* Operator for metadata (show after field is selected) */}
                                                        {condition.metadataFieldId && (
                                                            <div>
                                                                <Label className="text-xs text-gray-500 mb-1 block">Operator</Label>
                                                                <Select
                                                                    value={condition.operator}
                                                                    onValueChange={(v) => updateCondition(groupIndex, conditionIndex, { operator: v as ConditionOperator })}
                                                                >
                                                                    <SelectTrigger className="w-full">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="z-[200]">
                                                                        {getOperatorsForCondition(condition).map(opt => (
                                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                                {opt.label}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Add condition button */}
                                        <button
                                            onClick={() => addCondition(groupIndex)}
                                            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50/50 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span className="text-sm font-medium">Add Condition</span>
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Expression Preview */}
                            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <Label className="text-xs text-gray-500 mb-2 block uppercase tracking-wider">Expression Preview</Label>
                                <code className="text-sm font-mono text-purple-700 break-all block">
                                    {buildExpressionString() || 'No conditions defined'}
                                </code>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
                        Save Conditions
                    </Button>
                </div>
            </div>
        </div>
    );
}
