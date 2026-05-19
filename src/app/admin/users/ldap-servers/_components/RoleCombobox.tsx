'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Check, ChevronsUpDown, Loader2, Shield } from 'lucide-react';
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

interface RoleComboboxProps {
    value: string;           // roleId
    displayName?: string;    // roleName
    onSelect: (id: string, name: string) => void;
    placeholder?: string;
    className?: string;
    triggerClassName?: string;
}

export default function RoleCombobox({
    value,
    displayName,
    onSelect,
    placeholder = 'Search roles...',
    className,
    triggerClassName,
}: RoleComboboxProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ id: string; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const searchRoles = useCallback(async (searchQuery: string) => {
        setIsLoading(true);
        try {
            const { roleManagementService } = await import('@/api/services/roleManagementService');
            const result = await roleManagementService.getRoles(0, 20, 'name', 'asc', searchQuery || undefined);
            const roles = (result as any).content || result;
            setResults(Array.isArray(roles) ? roles.map((r: any) => ({ id: r.id, name: r.name })) : []);
        } catch {
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!open) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchRoles(query), 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query, open, searchRoles]);

    useEffect(() => {
        if (open && results.length === 0) searchRoles('');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const label = displayName || '';

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'justify-between font-normal',
                        !label && 'text-muted-foreground',
                        triggerClassName,
                    )}
                >
                    <span className="flex items-center gap-2 truncate">
                        <Shield className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {label || placeholder}
                    </span>
                    <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className={cn('p-0', className)} align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Type to search roles..."
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Searching...
                            </div>
                        ) : results.length === 0 ? (
                            <CommandEmpty>
                                {query ? 'No roles found' : 'Type to search roles'}
                            </CommandEmpty>
                        ) : (
                            <CommandGroup>
                                {results.map((role) => (
                                    <CommandItem
                                        key={role.id}
                                        value={role.id}
                                        onSelect={() => {
                                            onSelect(role.id, role.name);
                                            setOpen(false);
                                            setQuery('');
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                value === role.id ? 'opacity-100' : 'opacity-0'
                                            )}
                                        />
                                        <span className="truncate">{role.name}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
