'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Variable, Loader2, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { filingCategoryService } from '@/api/services/filingCategoryService';
import { FilingCategoryResponseDto, CategoryMetadataDefinitionDto } from '@/types/api';
import { WorkflowNodeData } from '../nodes/types';
import { VariableDefinition } from '../components/variables/types';
import { Node } from '@xyflow/react';

interface SetVariableNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
    workflowVariables?: VariableDefinition[];
    allNodes?: Node[];
}

// Type compatibility: which types can be cast to which target
// key = target variable type, value = list of value types that can be assigned to it
const TYPE_COMPATIBILITY: Record<string, string[]> = {
    'STRING': ['STRING', 'TEXT', 'EMAIL', 'NUMBER', 'DECIMAL', 'BOOLEAN', 'DATE', 'TIME', 'DATETIME'],
    'TEXT': ['STRING', 'TEXT', 'EMAIL', 'NUMBER', 'DECIMAL', 'BOOLEAN', 'DATE', 'TIME', 'DATETIME'],
    'EMAIL': ['STRING', 'TEXT', 'EMAIL'],
    'NUMBER': ['NUMBER', 'DECIMAL'],
    'DECIMAL': ['NUMBER', 'DECIMAL'],
    'BOOLEAN': ['BOOLEAN', 'STRING', 'TEXT'],
    'DATE': ['DATE', 'DATETIME', 'STRING', 'TEXT'],
    'TIME': ['TIME', 'STRING', 'TEXT'],
    'DATETIME': ['DATE', 'DATETIME', 'STRING', 'TEXT'],
    'FILE': ['FILE', 'STRING', 'NUMBER'],
};

// Type label for display
const TYPE_LABELS: Record<string, string> = {
    'STRING': 'Text',
    'TEXT': 'Multi-line Text',
    'EMAIL': 'Email',
    'NUMBER': 'Number',
    'DECIMAL': 'Decimal',
    'BOOLEAN': 'Boolean',
    'DATE': 'Date',
    'TIME': 'Time',
    'DATETIME': 'Date & Time',
    'FILE': 'File',
};

const SCOPE_OPTIONS = [
    { value: 'WORKFLOW', label: 'Workflow Scope' },
    { value: 'DOCUMENT', label: 'Document Metadata' },
];

export default function SetVariableNodeModal({
    isOpen,
    onClose,
    nodeData,
    onSave,
    workflowVariables = [],
    allNodes = [],
}: SetVariableNodeModalProps) {
    const [variableName, setVariableName] = useState<string>(nodeData.variableName || '');
    const [variableValue, setVariableValue] = useState<string>(nodeData.variableValue || '');
    const [variableType, setVariableType] = useState<string>(nodeData.variableType || 'STRING');
    const [variableScope, setVariableScope] = useState<string>(nodeData.variableScope || 'WORKFLOW');
    const [useExpression, setUseExpression] = useState<boolean>(nodeData.variableType === 'EXPRESSION' || false);
    const [typeError, setTypeError] = useState<string>('');

    // Document metadata state
    const [categories, setCategories] = useState<FilingCategoryResponseDto[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(nodeData.metadataCategoryId || null);
    const [selectedMetadataField, setSelectedMetadataField] = useState<CategoryMetadataDefinitionDto | null>(null);
    const [selectedMetadataFieldId, setSelectedMetadataFieldId] = useState<number | null>(nodeData.metadataFieldId || null);
    const [loading, setLoading] = useState(false);
    const [listOptions, setListOptions] = useState<string[]>([]);

    // Merge all available workflow variables: from VariablesPanel + from nodes
    const allWorkflowVariables = useMemo(() => {
        const vars: { key: string; type: string; label: string; source: string }[] = [];

        // Variables from VariablesPanel (passed via props)
        for (const v of workflowVariables) {
            vars.push({
                key: v.variableKey,
                type: v.type,
                label: v.label || v.variableKey,
                source: 'defined',
            });
        }

        // Variables from form request nodes (mapped fields)
        try {
            for (const node of allNodes) {
                if (node.data && (node.data as any).formFields) {
                    const formFields = (node.data as any).formFields;
                    if (Array.isArray(formFields)) {
                        for (const ff of formFields) {
                            if (ff.mappedVariableKey) {
                                vars.push({
                                    key: ff.mappedVariableKey,
                                    type: ff.type || 'STRING',
                                    label: ff.label || ff.mappedVariableKey,
                                    source: 'form',
                                });
                            }
                        }
                    }
                }
            }
        } catch {
            // Fallback: no extra variables
        }

        // Deduplicate by key
        const seen = new Set<string>();
        return vars.filter(v => {
            if (seen.has(v.key)) return false;
            seen.add(v.key);
            return true;
        });
    }, [workflowVariables, allNodes, isOpen]);

    // Get compatible source variables for expression interpolation
    const getCompatibleSourceVariables = (targetType: string) => {
        const compatible = TYPE_COMPATIBILITY[targetType] || [targetType];
        return allWorkflowVariables.filter(v => compatible.includes(v.type));
    };

    // Validate type compatibility for expression value
    const validateExpression = (value: string, targetType: string): string => {
        if (!value || !value.includes('{var.')) return '';

        const varPattern = /\{var\.(\w+)\}/g;
        let match;
        const errors: string[] = [];

        while ((match = varPattern.exec(value)) !== null) {
            const refKey = match[1];
            const refVar = allWorkflowVariables.find(v => v.key === refKey);
            if (!refVar) {
                errors.push(`Variable "${refKey}" not found`);
            } else {
                const compatible = TYPE_COMPATIBILITY[targetType] || [targetType];
                if (!compatible.includes(refVar.type)) {
                    errors.push(`"${refKey}" (${TYPE_LABELS[refVar.type] || refVar.type}) cannot be assigned to ${TYPE_LABELS[targetType] || targetType}`);
                }
            }
        }

        return errors.join('; ');
    };

    // Validate static value against target type
    const validateStaticValue = (value: string, targetType: string): string => {
        if (!value) return '';

        switch (targetType) {
            case 'NUMBER':
                if (!/^-?\d+$/.test(value.trim())) return 'Must be a whole number';
                break;
            case 'DECIMAL':
                if (!/^-?\d+(\.\d+)?$/.test(value.trim())) return 'Must be a valid number';
                break;
            case 'EMAIL':
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) && !value.includes('{var.'))
                    return 'Must be a valid email address';
                break;
            case 'BOOLEAN':
                if (!['true', 'false'].includes(value.trim().toLowerCase()) && !value.includes('{var.'))
                    return 'Must be true or false';
                break;
        }
        return '';
    };

    // Load categories when in DOCUMENT scope
    useEffect(() => {
        const loadCategories = async () => {
            if (!isOpen || variableScope !== 'DOCUMENT') return;
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
    }, [isOpen, variableScope]);

    // Initialize form from nodeData
    useEffect(() => {
        if (isOpen) {
            setVariableName(nodeData.variableName || '');
            setVariableValue(nodeData.variableValue || '');
            setVariableType(nodeData.variableType || 'STRING');
            setVariableScope(nodeData.variableScope || 'WORKFLOW');
            setUseExpression(nodeData.variableType === 'EXPRESSION' || false);
            setSelectedCategoryId(nodeData.metadataCategoryId || null);
            setSelectedMetadataFieldId(nodeData.metadataFieldId || null);
            setTypeError('');
        }
    }, [isOpen, nodeData]);

    // Find selected metadata field when category/field changes
    useEffect(() => {
        if (selectedCategoryId && categories.length > 0) {
            const cat = categories.find(c => c.id === selectedCategoryId);
            if (cat && selectedMetadataFieldId && cat.metadataDefinitions) {
                const field = cat.metadataDefinitions.find(f => f.id === selectedMetadataFieldId);
                if (field) {
                    setSelectedMetadataField(field);
                    setVariableType(field.dataType);
                    if (field.dataType === 'LIST' && field.list?.option) {
                        setListOptions(field.list.option);
                    }
                }
            }
        }
    }, [selectedCategoryId, selectedMetadataFieldId, categories]);

    // Validate on value change
    useEffect(() => {
        if (useExpression || variableValue.includes('{var.')) {
            setTypeError(validateExpression(variableValue, variableType));
        } else {
            setTypeError(validateStaticValue(variableValue, variableType));
        }
    }, [variableValue, variableType, useExpression]);

    const handleVariableSelect = (varKey: string) => {
        const selected = allWorkflowVariables.find(v => v.key === varKey);
        if (selected) {
            setVariableName(selected.key);
            setVariableType(selected.type);
            setVariableValue('');
            setTypeError('');
        }
    };

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
                if (field.dataType === 'LIST' && field.list?.option) {
                    setListOptions(field.list.option);
                } else {
                    setListOptions([]);
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
            variableType: useExpression ? 'EXPRESSION' : variableType,
            variableScope,
            metadataCategoryId: variableScope === 'DOCUMENT' ? selectedCategoryId : undefined,
            metadataFieldId: variableScope === 'DOCUMENT' ? selectedMetadataFieldId : undefined,
        });
        onClose();
    };

    // Render value input based on type
    const renderValueInput = () => {
        // Expression mode
        if (useExpression) {
            return (
                <div className="space-y-2">
                    <Textarea
                        value={variableValue}
                        onChange={(e) => setVariableValue(e.target.value)}
                        placeholder="Hello {var.user_name}, your invoice #{var.invoice_number} is ready"
                        rows={3}
                        className="font-mono text-sm"
                    />
                    {/* Quick insert variable buttons */}
                    {getCompatibleSourceVariables(variableType).length > 0 && (
                        <div className="space-y-1">
                            <span className="text-[10px] text-gray-400 font-medium uppercase">Insert Variable:</span>
                            <div className="flex flex-wrap gap-1">
                                {getCompatibleSourceVariables(variableType).map((v) => (
                                    <button
                                        key={v.key}
                                        type="button"
                                        onClick={() => setVariableValue(prev => prev + `{var.${v.key}}`)}
                                        className="px-2 py-1 text-[11px] bg-purple-50 text-purple-700 rounded border border-purple-200 hover:bg-purple-100 transition-colors flex items-center gap-1"
                                    >
                                        <Variable className="w-3 h-3" />
                                        {v.key}
                                        <span className="text-purple-400">({TYPE_LABELS[v.type] || v.type})</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // LIST type
        if (variableType === 'LIST' && listOptions.length > 0) {
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

        // Boolean
        if (variableType === 'BOOLEAN') {
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
        }

        // Number / Decimal
        if (variableType === 'NUMBER' || variableType === 'DECIMAL') {
            return (
                <Input
                    type="number"
                    step={variableType === 'DECIMAL' ? '0.01' : '1'}
                    value={variableValue}
                    onChange={(e) => setVariableValue(e.target.value)}
                    placeholder="Enter number..."
                />
            );
        }

        // Date / DateTime / Time
        if (variableType === 'DATE') {
            return <Input type="date" value={variableValue} onChange={(e) => setVariableValue(e.target.value)} />;
        }
        if (variableType === 'DATETIME') {
            return <Input type="datetime-local" value={variableValue} onChange={(e) => setVariableValue(e.target.value)} />;
        }
        if (variableType === 'TIME') {
            return <Input type="time" value={variableValue} onChange={(e) => setVariableValue(e.target.value)} />;
        }

        // Default: STRING / TEXT / EMAIL
        return (
            <Input
                type={variableType === 'EMAIL' ? 'email' : 'text'}
                value={variableValue}
                onChange={(e) => setVariableValue(e.target.value)}
                placeholder={variableType === 'EMAIL' ? 'user@example.com' : 'Enter value...'}
            />
        );
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
                            <p className="text-sm text-gray-500">Assign a value to a workflow variable</p>
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
                            setVariableName('');
                            setVariableValue('');
                            setTypeError('');
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

                    {/* WORKFLOW scope: Select from workflow variables */}
                    {variableScope === 'WORKFLOW' && (
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Variable</Label>
                            {allWorkflowVariables.length > 0 ? (
                                <Select value={variableName} onValueChange={handleVariableSelect}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a workflow variable..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allWorkflowVariables.map((v) => (
                                            <SelectItem key={v.key} value={v.key}>
                                                <div className="flex items-center gap-2">
                                                    <Variable className="w-3 h-3 text-teal-500" />
                                                    <span className="font-mono text-sm">{v.key}</span>
                                                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                                        {TYPE_LABELS[v.type] || v.type}
                                                    </span>
                                                    {v.source === 'form' && (
                                                        <span className="text-[10px] text-blue-500 bg-blue-50 px-1 py-0.5 rounded">form</span>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium">No workflow variables defined</p>
                                        <p className="text-xs mt-1">Add variables in the Variables panel before using this node.</p>
                                    </div>
                                </div>
                            )}
                            {/* Show selected variable type */}
                            {variableName && variableType && (
                                <div className="mt-2 flex items-center gap-2 text-xs text-teal-600 bg-teal-50 px-3 py-2 rounded-lg">
                                    <Info className="w-3 h-3" />
                                    <span>Type: <strong>{TYPE_LABELS[variableType] || variableType}</strong></span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* DOCUMENT scope: Category + Field selection */}
                    {variableScope === 'DOCUMENT' && (
                        <>
                            {loading ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                                    <span className="ml-2 text-sm text-gray-500">Loading models...</span>
                                </div>
                            ) : (
                                <>
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

                    {/* Value Section (only show when variable is selected) */}
                    {variableName && (
                        <div>
                            {/* Expression toggle */}
                            <div className="flex items-center justify-between mb-2">
                                <Label className="text-sm font-medium text-gray-700">
                                    {useExpression ? 'Expression' : 'Value'}
                                </Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Expression</span>
                                    <Switch
                                        checked={useExpression}
                                        onCheckedChange={(v) => {
                                            setUseExpression(v);
                                            setVariableValue('');
                                            setTypeError('');
                                        }}
                                    />
                                </div>
                            </div>
                            {renderValueInput()}

                            {/* Type error */}
                            {typeError && (
                                <div className="mt-2 flex items-start gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                    <span>{typeError}</span>
                                </div>
                            )}

                            {/* Expression hint */}
                            {useExpression && (
                                <p className="mt-1.5 text-[11px] text-gray-400">
                                    Use <code className="bg-gray-100 px-1 rounded">{'{var.name}'}</code> to reference other variables.
                                    Arithmetic operators (+, -, *, /) work for numeric targets.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Preview */}
                    {variableName && (
                        <div className="bg-teal-50 rounded-lg p-4 font-mono text-sm">
                            <span className="text-teal-600">${'{' + variableName + '}'}</span>
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
                        disabled={!variableName || !!typeError}
                    >
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
