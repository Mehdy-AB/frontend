'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';

interface LdapDepartmentComboboxProps {
    serverId: string;
    value: string;
    onSelect: (value: string) => void;
    placeholder?: string;
    className?: string;
    triggerClassName?: string;
    hasConflict?: boolean;
}

export default function LdapDepartmentCombobox({
    serverId,
    value,
    onSelect,
    placeholder = 'Type or search department...',
    className,
    triggerClassName,
    hasConflict = false,
}: LdapDepartmentComboboxProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced search
    const searchDepartments = useCallback(async (searchQuery: string) => {
        if (!serverId) return;
        setIsLoading(true);
        try {
            const { ldapServerService } = await import('@/api/services/ldapServerService');
            const depts = await ldapServerService.searchLdapDepartments(serverId, searchQuery, 5);
            setResults(depts);
        } catch (err) {
            console.error('Failed to search LDAP departments:', err);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [serverId]);

    // Trigger search when query changes
    useEffect(() => {
        if (!open) return;

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            searchDepartments(query);
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, open, searchDepartments]);

    // Load initial empty search when popover opens
    useEffect(() => {
        if (open && results.length === 0 && !query) {
            searchDepartments('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'justify-between font-normal w-full',
                        !value && 'text-muted-foreground',
                        hasConflict && 'border-red-500 bg-red-50/50 dark:bg-red-950/20',
                        triggerClassName,
                    )}
                >
                    <span className="truncate">
                        {value || placeholder}
                    </span>
                    <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className={cn('p-0', className)} align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Type department..."
                        value={query}
                        onValueChange={setQuery}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && query.trim()) {
                                onSelect(query.trim());
                                setOpen(false);
                                setQuery('');
                            }
                        }}
                    />
                    <CommandList>
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Searching...
                            </div>
                        ) : (
                            <>
                                {query.trim() && !results.includes(query.trim()) && (
                                    <CommandGroup heading="Create new">
                                        <CommandItem
                                            value={query.trim()}
                                            onSelect={() => {
                                                onSelect(query.trim());
                                                setOpen(false);
                                                setQuery('');
                                            }}
                                            className="font-medium text-primary"
                                        >
                                            Use &quot;{query.trim()}&quot;
                                        </CommandItem>
                                    </CommandGroup>
                                )}
                                
                                {results.length > 0 ? (
                                    <CommandGroup heading="LDAP Suggestions">
                                        {results.map((dept) => (
                                            <CommandItem
                                                key={dept}
                                                value={dept}
                                                onSelect={() => {
                                                    onSelect(dept);
                                                    setOpen(false);
                                                    setQuery('');
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        'mr-2 h-4 w-4',
                                                        value === dept ? 'opacity-100' : 'opacity-0'
                                                    )}
                                                />
                                                <span className="truncate">{dept}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                ) : !query.trim() ? (
                                    <CommandEmpty>
                                        Type to search departments
                                    </CommandEmpty>
                                ) : null}
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
