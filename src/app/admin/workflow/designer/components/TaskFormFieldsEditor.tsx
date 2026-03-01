'use client';

import React from 'react';
import { Plus, Trash2, GripVertical, Variable, Link2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { TaskFormField } from '@/types/workflow';
import { VariableDefinition } from './variables/types';

const FIELD_TYPES = [
    { value: 'STRING', label: 'Text' },
    { value: 'TEXT', label: 'Text (Multi Line)' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'NUMBER', label: 'Number' },
    { value: 'DECIMAL', label: 'Decimal' },
    { value: 'BOOLEAN', label: 'Yes/No' },
    { value: 'DATE', label: 'Date' },
    { value: 'TIME', label: 'Time' },
    { value: 'DATETIME', label: 'Date & Time' },
    { value: 'FILE', label: 'File Upload (Attachment)' },
];

// Type compatibility mapping
const TYPE_COMPATIBILITY: Record<string, string[]> = {
    STRING: ['STRING', 'TEXT'],
    TEXT: ['STRING', 'TEXT'],
    EMAIL: ['STRING', 'EMAIL'],
    NUMBER: ['NUMBER', 'DECIMAL'],
    DECIMAL: ['NUMBER', 'DECIMAL'],
    BOOLEAN: ['BOOLEAN'],
    DATE: ['DATE', 'DATETIME'],
    TIME: ['TIME', 'DATETIME'],
    DATETIME: ['DATETIME'],
    FILE: ['FILE'],
};

interface TaskFormFieldsEditorProps {
    fields: TaskFormField[];
    onChange: (fields: TaskFormField[]) => void;
    workflowId?: number;
    /** Local variables from the designer (for new workflows without ID) */
    localVariables?: VariableDefinition[];
}

export default function TaskFormFieldsEditor({ fields, onChange, workflowId, localVariables }: TaskFormFieldsEditorProps) {
    // Always use local variables from the designer (passed as prop)
    const variables: VariableDefinition[] = localVariables || [];


    const addField = () => {
        const newField: TaskFormField = {
            fieldKey: `field_${Date.now()}`,
            label: '',
            type: 'STRING',
            isRequired: false,
            placeholder: '',
            mappedVariableKey: undefined,
        };
        onChange([...fields, newField]);
    };

    const updateField = (index: number, updates: Partial<TaskFormField>) => {
        const updated = fields.map((f, i) => (i === index ? { ...f, ...updates } : f));
        onChange(updated);
    };

    const removeField = (index: number) => {
        onChange(fields.filter((_, i) => i !== index));
    };

    // Get compatible variables for a field type
    const getCompatibleVariables = (fieldType: string) => {
        const compatible = TYPE_COMPATIBILITY[fieldType] || [fieldType];
        return variables.filter(v => compatible.includes(v.type));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                    <Variable className="w-4 h-4" />
                    Form Fields
                </h4>
                <Button variant="outline" size="sm" onClick={addField}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Field
                </Button>
            </div>

            {fields.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4 border border-dashed rounded-lg">
                    No form fields configured. Users will only see the comment box when completing this task.
                </p>
            ) : (
                <div className="space-y-3">
                    {fields.map((field, idx) => {
                        const isMappingMissing = !field.mappedVariableKey;
                        const compatibleVars = getCompatibleVariables(field.type);

                        return (
                            <div
                                key={field.fieldKey}
                                className={`border rounded-lg p-3 bg-white transition-colors space-y-3 ${isMappingMissing ? 'border-red-300 hover:border-red-400' : 'hover:border-blue-200'
                                    }`}
                            >
                                {/* Row 1: Label + Type + Required + Delete */}
                                <div className="flex items-start gap-2">
                                    <GripVertical className="w-4 h-4 text-gray-300 mt-2.5 flex-shrink-0 cursor-grab" />
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-xs">Label *</Label>
                                            <Input
                                                value={field.label}
                                                onChange={(e) => updateField(idx, { label: e.target.value })}
                                                placeholder="e.g. Approval Comments"
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Type *</Label>
                                            <Select
                                                value={field.type}
                                                onValueChange={(val) => {
                                                    const updates: Partial<TaskFormField> = { type: val as TaskFormField['type'] };
                                                    if (field.mappedVariableKey) {
                                                        const newCompatible = variables.filter(v =>
                                                            (TYPE_COMPATIBILITY[val] || [val]).includes(v.type)
                                                        );
                                                        if (!newCompatible.find(v => v.variableKey === field.mappedVariableKey)) {
                                                            updates.mappedVariableKey = undefined;
                                                            updates.mappedVariableLabel = undefined;
                                                        }
                                                    }
                                                    updateField(idx, updates);
                                                }}
                                            >
                                                <SelectTrigger className="h-8 text-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {FIELD_TYPES.map(t => (
                                                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-5">
                                        <div className="flex items-center gap-1">
                                            <Switch
                                                checked={field.isRequired}
                                                onCheckedChange={(val) => updateField(idx, { isRequired: val })}
                                                className="scale-75"
                                            />
                                            <span className="text-xs text-gray-500">Req</span>
                                        </div>
                                        <button
                                            onClick={() => removeField(idx)}
                                            className="p-1 rounded hover:bg-red-50"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                        </button>
                                    </div>
                                </div>

                                {/* Row 2: Placeholder + Variable Mapping (Required) */}
                                <div className="flex items-end gap-2 ml-6">
                                    <div className="flex-1">
                                        <Label className="text-xs">Placeholder</Label>
                                        <Input
                                            value={field.placeholder || ''}
                                            onChange={(e) => updateField(idx, { placeholder: e.target.value })}
                                            placeholder="Hint text for the user..."
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Label className="text-xs flex items-center gap-1">
                                            <Link2 className="w-3 h-3" /> Map to Variable <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            value={field.mappedVariableKey || '_none_'}
                                            onValueChange={(val) => {
                                                if (val === '_none_') {
                                                    updateField(idx, { mappedVariableKey: undefined, mappedVariableLabel: undefined });
                                                } else {
                                                    const v = variables.find(v => v.variableKey === val);
                                                    updateField(idx, {
                                                        mappedVariableKey: val,
                                                        mappedVariableLabel: v?.label || val,
                                                    });
                                                }
                                            }}
                                        >
                                            <SelectTrigger className={`h-8 text-sm ${isMappingMissing ? 'border-red-300' : ''}`}>
                                                <SelectValue placeholder="Select variable..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {compatibleVars.map(v => (
                                                    <SelectItem key={v.variableKey} value={v.variableKey}>
                                                        <span className="flex items-center gap-1">
                                                            <Variable className="w-3 h-3 text-blue-500" />
                                                            {v.label} <span className="text-xs text-gray-400">({v.type})</span>
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                                {compatibleVars.length === 0 && (
                                                    <div className="px-2 py-1.5 text-xs text-gray-400">
                                                        No compatible variables (type: {field.type}). Add one in the Variables tab.
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Mapping status */}
                                {isMappingMissing ? (
                                    <div className="ml-6 flex items-center gap-1.5 text-xs text-red-500 bg-red-50 rounded px-2 py-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Variable mapping is required. Select a variable to store this field's value.
                                    </div>
                                ) : (
                                    <div className="ml-6 flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 rounded px-2 py-1">
                                        <Link2 className="w-3 h-3" />
                                        Value saved to: <code className="font-mono">${'{'}var.{field.mappedVariableKey}{'}'}</code>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
