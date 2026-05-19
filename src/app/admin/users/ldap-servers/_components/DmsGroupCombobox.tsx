'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Check, ChevronsUpDown, Loader2, Users } from 'lucide-react';
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
import { apiClient } from '@/api/client';

interface DmsGroupComboboxProps {
    value: string;           // groupId
    displayName?: string;    // groupName
    onSelect: (id: string, name: string) => void;
    placeholder?: string;
    className?: string;
    triggerClassName?: string;
}

export default function DmsGroupCombobox({
    value,
    displayName,
    onSelect,
    placeholder = 'Search groups...',
    className,
    triggerClassName,
}: DmsGroupComboboxProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ id: string; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const searchGroups = useCallback(async (searchQuery: string) => {
        setIsLoading(true);
        try {
            if (searchQuery) {
                // Server-side search when query is provided
                const groups = await apiClient.get<{ id: string; name: string; description?: string }[]>(
                    `/api/v1/admin/groups/search?query=${encodeURIComponent(searchQuery)}`
                );
                setResults(groups.map(g => ({ id: g.id, name: g.name })));
            } else {
                // Fetch first page of groups when no query (paginated)
                const result = await apiClient.get<any>(
                    `/api/v1/admin/groups?page=0&size=20&sort=name,asc`
                );
                const groups = result.content || result;
                setResults(Array.isArray(groups) ? groups.map((g: any) => ({ id: g.id, name: g.name })) : []);
            }
        } catch {
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!open) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchGroups(query), 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query, open, searchGroups]);

    useEffect(() => {
        if (open && results.length === 0) searchGroups('');
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
                        <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {label || placeholder}
                    </span>
                    <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className={cn('p-0', className)} align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Type to search groups..."
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
                                {query ? 'No groups found' : 'Type to search groups'}
                            </CommandEmpty>
                        ) : (
                            <CommandGroup>
                                {results.map((group) => (
                                    <CommandItem
                                        key={group.id}
                                        value={group.id}
                                        onSelect={() => {
                                            onSelect(group.id, group.name);
                                            setOpen(false);
                                            setQuery('');
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                value === group.id ? 'opacity-100' : 'opacity-0'
                                            )}
                                        />
                                        <span className="truncate">{group.name}</span>
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
