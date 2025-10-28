/**
 * Custom hook for server-side search with local filtering first
 * 
 * This hook implements a two-phase search strategy:
 * 1. Immediate local filtering on cached data (instant feedback)
 * 2. Debounced API fetch for comprehensive results
 * 
 * Features:
 * - StartsWith filtering logic
 * - Separate loading states (full page vs table-only)
 * - No reload when clearing search (fetches default data)
 * - Pagination support
 * 
 * @example
 * const {
 *   displayData,
 *   searchQuery,
 *   setSearchQuery,
 *   tableLoading,
 *   fetchData
 * } = useServerSideSearch({
 *   fetchFunction: async (page, searchTerm) => {
 *     return await api.getRoles(page, 20, searchTerm);
 *   },
 *   searchFields: (role) => [role.name, role.description, role.id],
 *   debounceMs: 800
 * });
 */

import { useState, useEffect, useCallback } from 'react';

export interface UseServerSideSearchOptions<T> {
  /** Function to fetch data from API. Should accept page and optional search term */
  fetchFunction: (page: number, searchTerm?: string) => Promise<T[] | { content: T[], totalPages: number, totalElements: number }>;
  
  /** Function to extract searchable fields from an item */
  searchFields: (item: T) => string[];
  
  /** Debounce delay in milliseconds (default: 800) */
  debounceMs?: number;
  
  /** Initial page (default: 0) */
  initialPage?: number;
  
  /** Whether to fetch on mount (default: true) */
  fetchOnMount?: boolean;
}

export interface UseServerSideSearchReturn<T> {
  /** Data to display (either local filtered results or API results) */
  displayData: T[];
  
  /** All cached data from API */
  allData: T[];
  
  /** Current search query */
  searchQuery: string;
  
  /** Update search query */
  setSearchQuery: (query: string) => void;
  
  /** Current page */
  page: number;
  
  /** Update page */
  setPage: (page: number) => void;
  
  /** Total pages from API */
  totalPages: number;
  
  /** Total elements from API */
  totalElements: number;
  
  /** Full page loading state (for initial load) */
  loading: boolean;
  
  /** Table-only loading state (for search/pagination) */
  tableLoading: boolean;
  
  /** Whether currently showing local filtered results */
  isLocalFiltering: boolean;
  
  /** Error state */
  error: string | null;
  
  /** Manually trigger data fetch */
  fetchData: (isSearchRequest?: boolean) => Promise<void>;
  
  /** Clear error */
  clearError: () => void;
  
  /** Update a single item in the local data (optimistic update) */
  updateItem: (itemId: any, updater: (item: T) => T, idGetter?: (item: T) => any) => void;
  
  /** Add a new item to the local data (optimistic update) */
  addItem: (item: T) => void;
  
  /** Remove an item from the local data (optimistic update) */
  removeItem: (itemId: any, idGetter?: (item: T) => any) => void;
  
  /** Directly set the data array (useful for bulk updates) */
  setDataDirectly: (newData: T[]) => void;
}

export function useServerSideSearch<T>({
  fetchFunction,
  searchFields,
  debounceMs = 800,
  initialPage = 0,
  fetchOnMount = true
}: UseServerSideSearchOptions<T>): UseServerSideSearchReturn<T> {
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<T[]>([]);
  const [allData, setAllData] = useState<T[]>([]);
  const [localSearchResults, setLocalSearchResults] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(fetchOnMount);
  const [tableLoading, setTableLoading] = useState(false);
  const [isLocalFiltering, setIsLocalFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Get display data (local search results or API results) */
  const getDisplayData = useCallback((): T[] => {
    if (isLocalFiltering) {
      return localSearchResults;
    }
    return data;
  }, [isLocalFiltering, localSearchResults, data]);

  /** Local filtering function using startsWith logic */
  const filterDataLocally = useCallback((query: string, allData: T[]): T[] => {
    if (!query.trim()) {
      return allData;
    }
    
    const lowerQuery = query.toLowerCase();
    return allData.filter(item => {
      const fields = searchFields(item);
      return fields.some(field => 
        (field || '').toLowerCase().startsWith(lowerQuery)
      );
    });
  }, [searchFields]);

  /** Fetch data from API */
  const fetchData = useCallback(async (isSearchRequest = false) => {
    try {
      if (isSearchRequest) {
        setTableLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const result = await fetchFunction(page, searchQuery || undefined);
      
      // Handle paginated responses
      if (Array.isArray(result)) {
        setData(result);
        setTotalPages(1);
        setTotalElements(result.length);
      } else {
        setData(result.content || []);
        setTotalPages(result.totalPages || 1);
        setTotalElements(result.totalElements || (result.content?.length || 0));
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      if (isSearchRequest) {
        setTableLoading(false);
      } else {
        setLoading(false);
      }
    }
  }, [page, searchQuery, fetchFunction]);

  /** Update allData when data changes */
  useEffect(() => {
    if (data) {
      setAllData(data);
    }
  }, [data]);

  /** Initial data fetch on mount */
  useEffect(() => {
    if (fetchOnMount) {
      fetchData(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Fetch data when page changes */
  useEffect(() => {
    // Skip initial load (already handled above)
    if (page === initialPage && fetchOnMount) return;
    // Use table loading for pagination changes
    fetchData(true);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Handle search with local filtering first, then API fetch */
  useEffect(() => {
    if (!searchQuery.trim()) {
      // If search is cleared, fetch default data (no filter)
      setLocalSearchResults([]);
      setIsLocalFiltering(false);
      
      // Fetch default data without search filter
      fetchData(true);
      return;
    }

    // Reset to first page when starting a search
    if (page !== initialPage) {
      setPage(initialPage);
    }

    // First, filter locally for immediate response
    setIsLocalFiltering(true);
    const localResults = filterDataLocally(searchQuery, allData);
    setLocalSearchResults(localResults);

    // Then, after a delay, fetch from API for more comprehensive results
    const timer = setTimeout(() => {
      fetchData(true).finally(() => {
        setIsLocalFiltering(false);
        setLocalSearchResults([]); // Clear local results when API results come in
      });
    }, debounceMs);
    
    return () => clearTimeout(timer);
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /** Update a single item in the local data */
  const updateItem = useCallback((itemId: any, updater: (item: T) => T, idGetter?: (item: T) => any) => {
    const getId = idGetter || ((item: any) => item.id);
    
    setData(prevData => 
      prevData.map(item => getId(item) === itemId ? updater(item) : item)
    );
    
    setAllData(prevData => 
      prevData.map(item => getId(item) === itemId ? updater(item) : item)
    );
    
    // Also update local search results if actively filtering
    if (isLocalFiltering) {
      setLocalSearchResults(prevResults => 
        prevResults.map(item => getId(item) === itemId ? updater(item) : item)
      );
    }
  }, [isLocalFiltering]);

  /** Add a new item to the local data */
  const addItem = useCallback((item: T) => {
    setData(prevData => [item, ...prevData]);
    setAllData(prevData => [item, ...prevData]);
    setTotalElements(prev => prev + 1);
    
    // If actively filtering, check if new item matches search
    if (isLocalFiltering && searchQuery) {
      const fields = searchFields(item);
      const lowerQuery = searchQuery.toLowerCase();
      const matches = fields.some(field => 
        (field || '').toLowerCase().startsWith(lowerQuery)
      );
      
      if (matches) {
        setLocalSearchResults(prevResults => [item, ...prevResults]);
      }
    }
  }, [isLocalFiltering, searchQuery, searchFields]);

  /** Remove an item from the local data */
  const removeItem = useCallback((itemId: any, idGetter?: (item: T) => any) => {
    const getId = idGetter || ((item: any) => item.id);
    
    setData(prevData => prevData.filter(item => getId(item) !== itemId));
    setAllData(prevData => prevData.filter(item => getId(item) !== itemId));
    setTotalElements(prev => Math.max(0, prev - 1));
    
    if (isLocalFiltering) {
      setLocalSearchResults(prevResults => 
        prevResults.filter(item => getId(item) !== itemId)
      );
    }
  }, [isLocalFiltering]);

  /** Directly set the data array */
  const setDataDirectly = useCallback((newData: T[]) => {
    setData(newData);
    setAllData(newData);
    setTotalElements(newData.length);
  }, []);

  return {
    displayData: getDisplayData(),
    allData,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    totalPages,
    totalElements,
    loading,
    tableLoading,
    isLocalFiltering,
    error,
    fetchData,
    clearError,
    updateItem,
    addItem,
    removeItem,
    setDataDirectly
  };
}

