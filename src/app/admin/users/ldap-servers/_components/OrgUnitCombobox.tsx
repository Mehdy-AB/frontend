'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Building2, ChevronDown, X, Loader2 } from 'lucide-react';
import { ldapServerService, type OrgUnitSearchResult } from '@/api/services/ldapServerService';
import { cn } from '@/lib/utils';

interface OrgUnitComboboxProps {
    value: string; // orgUnit ID
    displayValue?: string; // orgUnit name for display
    onChange: (orgUnit: OrgUnitSearchResult | null) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export default function OrgUnitCombobox({
    value,
    displayValue,
    onChange,
    placeholder = 'Search OrgUnits...',
    disabled = false,
    className,
}: OrgUnitComboboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<OrgUnitSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState(displayValue || '');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Update label when displayValue changes externally
    useEffect(() => {
        if (displayValue) setSelectedLabel(displayValue);
    }, [displayValue]);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const doSearch = useCallback(async (searchQuery: string) => {
        setIsLoading(true);
        try {
            const data = await ldapServerService.searchOrgUnits(searchQuery || '', 15);
            setResults(data);
        } catch {
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => doSearch(val), 250);
    };

    const handleOpen = () => {
        if (disabled) return;
        setIsOpen(true);
        setQuery('');
        doSearch('');
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleSelect = (ou: OrgUnitSearchResult) => {
        onChange(ou);
        setSelectedLabel(ou.name);
        setIsOpen(false);
        setQuery('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
        setSelectedLabel('');
    };

    const formatPath = (ou: OrgUnitSearchResult) => {
        const parts: string[] = [];
        if (ou.typeName) parts.push(ou.typeName);
        if (ou.parentName) parts.push(`under ${ou.parentName}`);
        return parts.join(' · ');
    };

    return (
        <div ref={containerRef} className={cn('relative', className)}>
            {/* Trigger button */}
            {!isOpen && (
                <button
                    type="button"
                    onClick={handleOpen}
                    disabled={disabled}
                    className={cn(
                        'flex h-9 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm',
                        'ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                        'hover:bg-accent/50 transition-colors',
                        disabled && 'opacity-50 cursor-not-allowed',
                        !value && 'text-muted-foreground'
                    )}
                >
                    <span className="flex items-center gap-2 truncate">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {selectedLabel || placeholder}
                    </span>
                    <div className="flex items-center gap-1">
                        {value && !disabled && (
                            <X
                                className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer"
                                onClick={handleClear}
                            />
                        )}
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </div>
                </button>
            )}

            {/* Search input (visible when open) */}
            {isOpen && (
                <div className="flex h-9 w-full items-center rounded-md border border-ring bg-background px-3 gap-2">
                    <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        placeholder={placeholder}
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                    {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                </div>
            )}

            {/* Dropdown results */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-[240px] overflow-y-auto">
                    {results.length === 0 && !isLoading && (
                        <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                            No OrgUnits found
                        </div>
                    )}
                    {results.map((ou) => {
                        const isSelected = ou.id === value;
                        const path = formatPath(ou);
                        return (
                            <button
                                key={ou.id}
                                type="button"
                                onClick={() => handleSelect(ou)}
                                className={cn(
                                    'flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm transition-colors',
                                    'hover:bg-accent/60 focus:bg-accent/60 outline-none',
                                    isSelected && 'bg-primary/10'
                                )}
                            >
                                <Building2 className={cn(
                                    'h-4 w-4 mt-0.5 shrink-0',
                                    isSelected ? 'text-primary' : 'text-muted-foreground'
                                )} />
                                <div className="min-w-0 flex-1">
                                    <div className={cn(
                                        'font-medium truncate',
                                        isSelected && 'text-primary'
                                    )}>
                                        {ou.name}
                                    </div>
                                    {path && (
                                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                                            {path}
                                        </div>
                                    )}
                                    {ou.code && (
                                        <div className="text-xs text-muted-foreground/60 font-mono mt-0.5">
                                            {ou.code}
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
