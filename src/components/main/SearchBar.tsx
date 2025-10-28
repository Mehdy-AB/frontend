'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface SearchBarProps {
  sourceData: any[];
  getFields: (item: any) => string[]; // fields to search in
  onLocalFilter: (filtered: any[]) => void; // filtered locally by startsWith
  onRemoteSearch?: (query: string) => void | Promise<void>; // debounced to 1s by default
  delayMs?: number; // default 1000ms
  placeholder?: string;
  showCountBadge?: boolean;
}

export default function SearchBar({
  sourceData,
  getFields,
  onLocalFilter,
  onRemoteSearch,
  delayMs = 1000,
  placeholder = 'Search...',
  showCountBadge = true,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [count, setCount] = useState(0);
  const isFirstRender = useRef(true);
  
  // Use refs to store latest callbacks without causing re-renders
  const onLocalFilterRef = useRef(onLocalFilter);
  const onRemoteSearchRef = useRef(onRemoteSearch);

  useEffect(() => {
    onLocalFilterRef.current = onLocalFilter;
    onRemoteSearchRef.current = onRemoteSearch;
  }, [onLocalFilter, onRemoteSearch]);

  // Local filtering: case-insensitive startsWith on any provided field
  const locallyFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sourceData;
    const filtered = sourceData.filter((item) => {
      const fields = getFields(item) || [];
      return fields.some((f) => (f || '').toString().toLowerCase().startsWith(q));
    });
    return filtered;
  }, [query, sourceData, getFields]);

  useEffect(() => {
    onLocalFilterRef.current(locallyFiltered);
    setCount(locallyFiltered.length);
  }, [locallyFiltered]);

  // Debounced remote search trigger
  useEffect(() => {
    if (!onRemoteSearchRef.current) return;
    
    // Skip the first render to prevent duplicate API call on mount
    // The parent component's useEffect handles the initial data fetch
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    const handle = setTimeout(() => {
      onRemoteSearchRef.current?.(query);
    }, delayMs);
    return () => clearTimeout(handle);
  }, [query, delayMs]);

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
        {!!query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {showCountBadge && (
        <Badge variant="secondary" className="gap-2 whitespace-nowrap">
          {count} result{count !== 1 ? 's' : ''}
        </Badge>
      )}
    </div>
  );
}


