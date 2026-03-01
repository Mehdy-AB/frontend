'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Variable, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SystemVariables from './variables/SystemVariables';
import VariableItem from './variables/VariableItem';
import VariableForm from './variables/VariableForm';
import { VariableDefinition } from './variables/types';

// Re-export for backward compatibility
export type { VariableDefinition } from './variables/types';

// ======= Component =======

interface VariablesPanelProps {
    workflowId?: number | null;
    onLocalVariablesChange?: (variables: VariableDefinition[]) => void;
    localVariables?: VariableDefinition[];
}

export default function VariablesPanel({ onLocalVariablesChange, localVariables }: VariablesPanelProps) {
    const [variables, setVariables] = useState<VariableDefinition[]>(localVariables || []);
    const [showSystemVars, setShowSystemVars] = useState(true);
    const [showCustomVars, setShowCustomVars] = useState(true);

    const [isAdding, setIsAdding] = useState(false);
    const [editingVariable, setEditingVariable] = useState<VariableDefinition | null>(null);

    useEffect(() => {
        if (localVariables) setVariables(localVariables);
    }, [localVariables]);

    const notifyLocalChange = (updated: VariableDefinition[]) => {
        setVariables(updated);
        onLocalVariablesChange?.(updated);
    };

    const handleSave = (data: Partial<VariableDefinition>) => {
        if (editingVariable) {
            const updated = variables.map(v =>
                v.variableKey === editingVariable.variableKey
                    ? { ...v, ...data } as VariableDefinition
                    : v
            );
            notifyLocalChange(updated);
        } else {
            const newVar: VariableDefinition = {
                variableKey: data.variableKey!,
                label: data.label!,
                type: data.type!,
                defaultValue: data.defaultValue,
            };
            notifyLocalChange([...variables, newVar]);
        }
        setIsAdding(false);
        setEditingVariable(null);
    };

    const handleEdit = (v: VariableDefinition) => {
        setEditingVariable(v);
        setIsAdding(true);
    };

    const handleDelete = (v: VariableDefinition) => {
        notifyLocalChange(variables.filter(x => x.variableKey !== v.variableKey));
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingVariable(null);
    };

    const existingKeys = variables
        .filter(v => v.variableKey !== editingVariable?.variableKey)
        .map(v => v.variableKey);

    return (
        <div className="p-4 space-y-4">
            {/* System Variables */}
            <SystemVariables
                expanded={showSystemVars}
                onToggle={() => setShowSystemVars(!showSystemVars)}
            />

            {/* Custom Variables */}
            <div className="border-t pt-4">
                <button
                    onClick={() => setShowCustomVars(!showCustomVars)}
                    className="flex items-center gap-2 w-full text-left font-semibold text-sm mb-2"
                >
                    {showCustomVars ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <Variable className="h-4 w-4 text-blue-500" />
                    Custom Variables
                    <span className="text-xs text-gray-400 font-normal ml-auto">{variables.length}</span>
                </button>

                {showCustomVars && (
                    <div className="space-y-2 ml-2">
                        {variables.map((v) => (
                            <VariableItem
                                key={v.id || v.variableKey}
                                variable={v}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}

                        {variables.length === 0 && !isAdding && (
                            <p className="text-sm text-gray-400 text-center py-3">No custom variables defined</p>
                        )}

                        {/* Add/Edit Form */}
                        {isAdding ? (
                            <VariableForm
                                editingVariable={editingVariable}
                                existingKeys={existingKeys}
                                onSave={handleSave}
                                onCancel={handleCancel}
                            />
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-8 text-xs"
                                onClick={() => { setEditingVariable(null); setIsAdding(true); }}
                            >
                                <Plus className="h-3 w-3 mr-1" /> Add Variable
                            </Button>
                        )}

                        {variables.length > 0 && (
                            <p className="text-xs text-blue-500 text-center py-1">
                                Variables will be saved when you save the workflow
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
