/**
 * Simple search input component that works with useServerSideSearch hook
 * 
 * Features:
 * - Search icon on the left
 * - Clear button (X) on the right when there's text
 * - Integrates seamlessly with useServerSideSearch hook
 * 
 * @example
 * const { searchQuery, setSearchQuery } = useServerSideSearch({...});
 * 
 * <ServerSearchInput
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   placeholder="Search roles by name, description, or ID..."
 * />
 */

'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ServerSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onFocus?: () => void;
}

export default function ServerSearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  onFocus
}: ServerSearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        className="pl-10"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

