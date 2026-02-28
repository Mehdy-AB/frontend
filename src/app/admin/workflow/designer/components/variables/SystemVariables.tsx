'use client';

import { Lock, ChevronDown, ChevronRight } from 'lucide-react';

const VARIABLE_TYPES_LABELS: Record<string, string> = {
    STRING: 'Text (Single Line)',
    TEXT: 'Text (Multi Line)',
    EMAIL: 'Email',
    NUMBER: 'Number',
    DECIMAL: 'Decimal',
    BOOLEAN: 'Boolean',
    DATE: 'Date',
    TIME: 'Time',
    DATETIME: 'Date & Time',
};

export const SYSTEM_VARIABLES = [
    { key: '${doc.name}', label: 'Document Name', type: 'STRING' },
    { key: '${doc.id}', label: 'Document ID', type: 'NUMBER' },
    { key: '${doc.category}', label: 'Document Category', type: 'STRING' },
    { key: '${doc.folder}', label: 'Document Folder', type: 'STRING' },
    { key: '${doc.createdBy}', label: 'Document Creator', type: 'STRING' },
    { key: '${doc.createdAt}', label: 'Document Created At', type: 'DATETIME' },
    { key: '${instance.id}', label: 'Instance ID', type: 'NUMBER' },
    { key: '${instance.startedAt}', label: 'Instance Started At', type: 'DATETIME' },
    { key: '${instance.startedBy}', label: 'Instance Started By', type: 'STRING' },
    { key: '${currentDate}', label: 'Current Date', type: 'DATE' },
    { key: '${currentDateTime}', label: 'Current Date & Time', type: 'DATETIME' },
];

interface SystemVariablesProps {
    expanded: boolean;
    onToggle: () => void;
}

export default function SystemVariables({ expanded, onToggle }: SystemVariablesProps) {
    return (
        <div>
            <button
                onClick={onToggle}
                className="flex items-center gap-2 w-full text-left font-semibold text-sm mb-2"
            >
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Lock className="h-4 w-4 text-gray-400" />
                System Variables
                <span className="text-xs text-gray-400 font-normal ml-auto">{SYSTEM_VARIABLES.length}</span>
            </button>
            {expanded && (
                <div className="space-y-1 ml-2">
                    {SYSTEM_VARIABLES.map((sv) => (
                        <div
                            key={sv.key}
                            className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-sm"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-700 truncate">{sv.label}</div>
                                <div className="text-xs text-gray-400 font-mono truncate">{sv.key}</div>
                            </div>
                            <span className="text-xs bg-gray-200 text-gray-600 rounded px-2 py-0.5 ml-2 flex-shrink-0">
                                {VARIABLE_TYPES_LABELS[sv.type] || sv.type}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
