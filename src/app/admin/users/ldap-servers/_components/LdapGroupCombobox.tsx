'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Check, ChevronsUpDown, Loader2, Search } from 'lucide-react';
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

interface LdapGroupComboboxProps {
    serverId: string;
    value: string;        // current ldapGroupDn
    displayName: string;  // current ldapGroupName (from saved data)
    onSelect: (dn: string, name: string) => void;
    placeholder?: string;
    className?: string;
    triggerClassName?: string;
    /** If true, this DN is already used in another row (conflict) */
    hasConflict?: boolean;
}

export default function LdapGroupCombobox({
    serverId,
    value,
    displayName,
    onSelect,
    placeholder = 'Search LDAP groups...',
    className,
    triggerClassName,
    hasConflict = false,
}: LdapGroupComboboxProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ dn: string; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced search — fires 300ms after user stops typing
    const searchGroups = useCallback(async (searchQuery: string) => {
        if (!serverId) return;
        setIsLoading(true);
        try {
            const { ldapServerService } = await import('@/api/services/ldapServerService');
            const groups = await ldapServerService.searchLdapGroups(serverId, searchQuery, 15);
            setResults(groups);
        } catch (err) {
            console.error('Failed to search LDAP groups:', err);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [serverId]);

    // On query change, debounce the search
    useEffect(() => {
        if (!open) return;

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            searchGroups(query);
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, open, searchGroups]);

    // Load initial results when popover opens
    useEffect(() => {
        if (open && results.length === 0) {
            searchGroups('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Determine displayed label
    const label = displayName || (value ? value.split(',')[0]?.replace('cn=', '') : '');

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
                        hasConflict && 'border-red-500 bg-red-50/50 dark:bg-red-950/20',
                        triggerClassName,
                    )}
                >
                    <span className="truncate">
                        {label || placeholder}
                    </span>
                    <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className={cn('p-0', className)} align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Type to search..."
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
                                {query ? 'No groups found' : 'Type to search LDAP groups'}
                            </CommandEmpty>
                        ) : (
                            <CommandGroup>
                                {results.map((group) => (
                                    <CommandItem
                                        key={group.dn}
                                        value={group.dn}
                                        onSelect={() => {
                                            onSelect(group.dn, group.name);
                                            setOpen(false);
                                            setQuery('');
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                value === group.dn ? 'opacity-100' : 'opacity-0'
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
