'use client';

import { useState, useEffect, useMemo } from 'react';

interface UseDebouncedSearchOptions<T> {
  data: T[];
  searchQuery: string;
  debounceDelay?: number;
  searchFields?: (item: T) => string[];
}

export function useDebouncedSearch<T>({
  data,
  searchQuery,
  debounceDelay = 300,
  searchFields,
}: UseDebouncedSearchOptions<T>) {
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, debounceDelay);

    return () => clearTimeout(timer);
  }, [searchQuery, debounceDelay]);

  // Filter data locally based on debounced query
  const filteredData = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return data;
    }

    const query = debouncedQuery.toLowerCase();

    return data.filter((item) => {
      // If search fields function is provided, use it
      if (searchFields) {
        const fields = searchFields(item);
        return fields.some(field => field.toLowerCase().includes(query));
      }

      // Otherwise, try to convert the entire item to string and search in it
      try {
        const itemString = JSON.stringify(item).toLowerCase();
        return itemString.includes(query);
      } catch {
        return false;
      }
    });
  }, [data, debouncedQuery, searchFields]);

  return {
    filteredData,
    debouncedQuery,
    isLoading: searchQuery !== debouncedQuery
  };
}

export default useDebouncedSearch;
