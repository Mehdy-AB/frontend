'use client';

import { useState, useRef } from 'react';
import { Variable, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VariableDefinition } from './variables/types';

interface VariableInsertButtonProps {
    variables: VariableDefinition[];
    onInsert: (variableExpression: string) => void;
    /** Filter to only show variables of certain types */
    filterTypes?: string[];
    /** Custom label */
    label?: string;
    className?: string;
}

const SYSTEM_VARIABLES = [
    { key: 'doc.name', label: 'Document Name' },
    { key: 'doc.link', label: 'Document Link' },
    { key: 'doc.id', label: 'Document ID' },
    { key: 'user.name', label: 'Current User' },
    { key: 'workflow.name', label: 'Workflow Name' },
    { key: 'workflow.id', label: 'Workflow ID' },
    { key: 'node.name', label: 'Current Node' },
];

export default function VariableInsertButton({
    variables,
    onInsert,
    filterTypes,
    label = '${x}',
    className = '',
}: VariableInsertButtonProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const filteredVars = filterTypes
        ? variables.filter(v => filterTypes.includes(v.type))
        : variables;

    return (
        <div className={`relative inline-block ${className}`} ref={ref}>
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs font-mono text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                onClick={() => setOpen(!open)}
            >
                <Variable className="w-3 h-3 mr-1" />
                {label}
                <ChevronDown className="w-3 h-3 ml-1" />
            </Button>

            {open && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-50"
                        onClick={() => setOpen(false)}
                    />
                    {/* Dropdown */}
                    <div className="absolute z-50 mt-1 left-0 w-64 bg-white rounded-lg shadow-xl border border-gray-200 max-h-72 overflow-y-auto">
                        {/* System Variables */}
                        <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b">
                            System Variables
                        </div>
                        {SYSTEM_VARIABLES.map(sv => (
                            <button
                                key={sv.key}
                                className="w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 flex items-center justify-between group transition-colors"
                                onClick={() => {
                                    onInsert('${' + sv.key + '}');
                                    setOpen(false);
                                }}
                            >
                                <span className="text-gray-700">{sv.label}</span>
                                <code className="text-[10px] text-blue-500 bg-blue-50 px-1 rounded font-mono group-hover:bg-blue-100">
                                    {'${' + sv.key + '}'}
                                </code>
                            </button>
                        ))}

                        {/* Workflow Variables */}
                        {filteredVars.length > 0 && (
                            <>
                                <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-t border-b">
                                    Workflow Variables
                                </div>
                                {filteredVars.map(v => (
                                    <button
                                        key={v.variableKey}
                                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 flex items-center justify-between group transition-colors"
                                        onClick={() => {
                                            onInsert('${var.' + v.variableKey + '}');
                                            setOpen(false);
                                        }}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-gray-700">{v.label}</span>
                                            <span className="text-[10px] text-gray-400">{v.type}</span>
                                        </div>
                                        <code className="text-[10px] text-blue-500 bg-blue-50 px-1 rounded font-mono group-hover:bg-blue-100">
                                            {'${var.' + v.variableKey + '}'}
                                        </code>
                                    </button>
                                ))}
                            </>
                        )}

                        {filteredVars.length === 0 && variables.length === 0 && (
                            <div className="px-3 py-2 text-xs text-gray-400 italic border-t">
                                No workflow variables defined yet
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
