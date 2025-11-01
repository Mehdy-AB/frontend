/**
 * Custom hook for infinite scroll functionality
 * 
 * This hook handles:
 * - Initial data loading
 * - Loading more data when scrolling to bottom
 * - Loading states
 * - End of data detection
 * - Error handling
 * 
 * @example
 * const {
 *   data,
 *   loading,
 *   loadingMore,
 *   hasMore,
 *   error,
 *   fetchMore,
 *   refresh
 * } = useInfiniteScroll({
 *   fetchFunction: async (page, size) => {
 *     return await api.getComments(page, size);
 *   },
 *   pageSize: 20
 * });
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseInfiniteScrollOptions<T> {
  /** 
   * Function to fetch data from API
   * Should return paginated data with content array, totalPages, totalElements
   */
  fetchFunction: (page: number, size: number) => Promise<{
    content: T[];
    totalPages: number;
    totalElements: number;
    number?: number; // current page number from backend
  }>;
  
  /** Number of items per page (default: 20) */
  pageSize?: number;
  
  /** Whether to fetch on mount (default: true) */
  fetchOnMount?: boolean;
  
  /** Initial page (default: 0) */
  initialPage?: number;
  
  /** Callback when data changes */
  onDataChange?: (data: T[]) => void;
}

export interface UseInfiniteScrollReturn<T> {
  /** All loaded data */
  data: T[];
  
  /** Initial loading state (first page) */
  loading: boolean;
  
  /** Loading more data (subsequent pages) */
  loadingMore: boolean;
  
  /** Whether there's more data to load */
  hasMore: boolean;
  
  /** Current page number */
  currentPage: number;
  
  /** Total pages available */
  totalPages: number;
  
  /** Total elements available */
  totalElements: number;
  
  /** Error state */
  error: string | null;
  
  /** Fetch next page of data */
  fetchMore: () => Promise<void>;
  
  /** Refresh data (reset to first page) */
  refresh: () => Promise<void>;
  
  /** Clear error */
  clearError: () => void;
  
  /** Add item optimistically */
  addItem: (item: T, position?: 'start' | 'end') => void;
  
  /** Update item optimistically */
  updateItem: (itemId: any, updater: (item: T) => T, idGetter?: (item: T) => any) => void;
  
  /** Remove item optimistically */
  removeItem: (itemId: any, idGetter?: (item: T) => any) => void;
  
  /** Directly set data */
  setData: (newData: T[]) => void;
}

export function useInfiniteScroll<T>({
  fetchFunction,
  pageSize = 20,
  fetchOnMount = true,
  initialPage = 0,
  onDataChange
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [data, setDataState] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(fetchOnMount);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  // Track if we're fetching to prevent duplicate requests
  const isFetchingRef = useRef(false);

  /** Update data and trigger callback */
  const setData = useCallback((newData: T[] | ((prev: T[]) => T[])) => {
    setDataState(prev => {
      const updated = typeof newData === 'function' ? newData(prev) : newData;
      if (onDataChange) {
        onDataChange(updated);
      }
      return updated;
    });
  }, [onDataChange]);

  /** Fetch data for a specific page */
  const fetchPage = useCallback(async (page: number, append: boolean = true) => {
    if (isFetchingRef.current) {
      return;
    }

    try {
      isFetchingRef.current = true;
      setError(null);
      
      if (append && page > initialPage) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const result = await fetchFunction(page, pageSize);
      
      setTotalPages(result.totalPages || 1);
      setTotalElements(result.totalElements || 0);
      setCurrentPage(result.number !== undefined ? result.number : page);
      
      // Update data
      if (append && page > initialPage) {
        setData(prev => [...prev, ...result.content]);
      } else {
        setData(result.content);
      }
      
      // Check if there's more data
      const hasMoreData = result.totalPages ? page + 1 < result.totalPages : false;
      setHasMore(hasMoreData);
      
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [fetchFunction, pageSize, initialPage, setData]);

  /** Fetch next page */
  const fetchMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading || isFetchingRef.current) {
      return;
    }
    
    await fetchPage(currentPage + 1, true);
  }, [hasMore, loadingMore, loading, currentPage, fetchPage]);

  /** Refresh data (reset to first page) */
  const refresh = useCallback(async () => {
    setCurrentPage(initialPage);
    setData([]);
    await fetchPage(initialPage, false);
  }, [initialPage, fetchPage, setData]);

  /** Initial data fetch on mount */
  useEffect(() => {
    if (fetchOnMount) {
      fetchPage(initialPage, false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /** Add item optimistically */
  const addItem = useCallback((item: T, position: 'start' | 'end' = 'start') => {
    setData(prev => position === 'start' ? [item, ...prev] : [...prev, item]);
    setTotalElements(prev => prev + 1);
  }, [setData]);

  /** Update item optimistically */
  const updateItem = useCallback((itemId: any, updater: (item: T) => T, idGetter?: (item: T) => any) => {
    const getId = idGetter || ((item: any) => item.id);
    setData(prev => prev.map(item => getId(item) === itemId ? updater(item) : item));
  }, [setData]);

  /** Remove item optimistically */
  const removeItem = useCallback((itemId: any, idGetter?: (item: T) => any) => {
    const getId = idGetter || ((item: any) => item.id);
    setData(prev => prev.filter(item => getId(item) !== itemId));
    setTotalElements(prev => Math.max(0, prev - 1));
  }, [setData]);

  return {
    data,
    loading,
    loadingMore,
    hasMore,
    currentPage,
    totalPages,
    totalElements,
    error,
    fetchMore,
    refresh,
    clearError,
    addItem,
    updateItem,
    removeItem,
    setData
  };
}







