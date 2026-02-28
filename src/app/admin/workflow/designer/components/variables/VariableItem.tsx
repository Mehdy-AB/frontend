'use client';

import { Edit2, Trash2 } from 'lucide-react';
import { VariableDefinition, VARIABLE_TYPES } from './types';

interface VariableItemProps {
    variable: VariableDefinition;
    onEdit: (variable: VariableDefinition) => void;
    onDelete: (variable: VariableDefinition) => void;
}

export default function VariableItem({ variable, onEdit, onDelete }: VariableItemProps) {
    const typeLabel = VARIABLE_TYPES.find(t => t.value === variable.type)?.label || variable.type;

    return (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm group hover:border-blue-200 transition-colors">
            <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 truncate">{variable.label}</div>
                <div className="text-xs text-gray-400 font-mono truncate">
                    ${'{'}var.{variable.variableKey}{'}'}
                </div>
                {variable.defaultValue !== null && variable.defaultValue !== undefined && variable.defaultValue !== '' && (
                    <div className="text-xs text-gray-400 mt-0.5">
                        Default: <span className="text-gray-600">{String(variable.defaultValue)}</span>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                <span className="text-xs bg-blue-50 text-blue-600 rounded px-2 py-0.5">
                    {typeLabel}
                </span>
                <button
                    onClick={() => onEdit(variable)}
                    className="p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Edit2 className="h-3.5 w-3.5 text-gray-500" />
                </button>
                <button
                    onClick={() => onDelete(variable)}
                    className="p-1 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </button>
            </div>
        </div>
    );
}
