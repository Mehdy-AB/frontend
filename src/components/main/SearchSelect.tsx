'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';

// Generic type for items
interface SearchSelectProps<T> {
  items: T[];
  fetchFunction?: (query: string) => Promise<T[]>;
  onSelect: (item: T) => void;
  placeholder?: string;
  debounceMs?: number;
  displayField: keyof T; // which field to show as label (e.g. 'name')
  descriptionField?: keyof T; // optional description field
}

export function SearchSelect<T extends { id: string | number }>({
  items,
  fetchFunction,
  onSelect,
  placeholder = 'Search...',
  debounceMs = 400,
  displayField,
  descriptionField,
}: SearchSelectProps<T>) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredItems, setFilteredItems] = useState<T[]>(items);
  const [loading, setLoading] = useState(false);

  // Update filtered items when items change
  useEffect(() => {
    setFilteredItems(items);
  }, [items]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.searchable-select-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounce for remote fetch
  useEffect(() => {
    if (!fetchFunction) return;

    const handler = setTimeout(async () => {
      if (query.trim().length === 0) {
        setFilteredItems(items);
        return;
      }

      setLoading(true);
      try {
        const remoteResults = await fetchFunction(query);
        setFilteredItems((prev) => {
          // merge without duplicates
          const all = [...prev, ...remoteResults];
          const unique = Array.from(new Map(all.map((i) => [i.id, i])).values());
          return unique;
        });
      } catch (err) {
        console.error('SearchSelect fetch error:', err);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [query, fetchFunction, debounceMs]);

  // Local filtering (instant)
  useEffect(() => {
    if (query.trim().length === 0) {
      setFilteredItems(items);
    } else {
      const q = query.toLowerCase();
      setFilteredItems(
        items.filter((i) => {
          const displayValue = String(i[displayField]).toLowerCase();
          const descriptionValue = descriptionField ? String(i[descriptionField]).toLowerCase() : '';
          return displayValue.includes(q) || descriptionValue.includes(q);
        })
      );
    }
  }, [query, items, displayField, descriptionField]);

  const handleSelect = (item: T) => {
    onSelect(item);
    setQuery(String(item[displayField]));
    setShowDropdown(false);
  };

  return (
    <div className="relative searchable-select-container">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          </div>
        )}
      </div>
      
      {showDropdown && filteredItems.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(item);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-b-0"
            >
              <div className="flex flex-col">
                <span className="font-medium">{String(item[displayField])}</span>
                {descriptionField && item[descriptionField] && (
                  <span className="text-xs text-gray-500 truncate">
                    {String(item[descriptionField])}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
