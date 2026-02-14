'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from "@/lib/utils";
import { Search, X } from 'lucide-react';

export interface VariableDefinition {
    key: string;
    label: string;
    example: string;
    category: string;
    dynamic?: boolean;
}

interface VariablePickerProps {
    variables: VariableDefinition[];
    onSelect: (variable: VariableDefinition) => void;
    onClose: () => void;
}

/**
 * Dropdown picker for inserting template variables.
 * Groups variables by category with search functionality.
 */
export function VariablePicker({ variables, onSelect, onClose }: VariablePickerProps) {
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Filter variables by search
    const filteredVariables = variables.filter(v =>
        v.key.toLowerCase().includes(search.toLowerCase()) ||
        v.label.toLowerCase().includes(search.toLowerCase())
    );

    // Group by category
    const groupedVariables = filteredVariables.reduce((acc, v) => {
        if (!acc[v.category]) acc[v.category] = [];
        acc[v.category].push(v);
        return acc;
    }, {} as Record<string, VariableDefinition[]>);

    const categoryLabels: Record<string, string> = {
        recipient: '👤 Recipient',
        sender: '📤 Sender',
        campaign: '📧 Campaign',
        now: '📅 Date/Time',
    };

    return (
        <div
            ref={containerRef}
            className="absolute top-full left-0 mt-2 w-80 bg-popover border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden flex flex-col"
        >
            {/* Search */}
            <div className="p-2 border-b">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search variables..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 pr-8"
                        autoFocus
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                        >
                            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </button>
                    )}
                </div>
            </div>

            {/* Variable list */}
            <div className="overflow-y-auto flex-1">
                {Object.keys(groupedVariables).length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                        No variables found
                    </div>
                ) : (
                    Object.entries(groupedVariables).map(([category, vars]) => (
                        <div key={category}>
                            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted sticky top-0">
                                {categoryLabels[category] || category}
                            </div>
                            {vars.map((variable) => (
                                <button
                                    key={variable.key}
                                    type="button"
                                    onClick={() => onSelect(variable)}
                                    className={cn(
                                        "w-full px-3 py-2 text-left hover:bg-accent transition-colors",
                                        "flex items-center justify-between gap-2"
                                    )}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded text-primary">
                                                {`{{${variable.key}}}`}
                                            </code>
                                            {variable.dynamic && (
                                                <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">custom</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5 truncate">
                                            {variable.label}
                                            {variable.example && (
                                                <span className="ml-1 italic">e.g., "{variable.example}"</span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ))
                )}
            </div>

            {/* Footer hint */}
            <div className="px-3 py-2 text-[10px] text-muted-foreground border-t bg-muted/50">
                Click a variable to insert it into your email
            </div>
        </div>
    );
}
