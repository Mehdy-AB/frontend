/**
 * InfiniteScrollContainer - A reusable component for infinite scroll functionality
 * 
 * This component handles:
 * - Scroll detection
 * - Automatic loading when reaching bottom
 * - Loading indicators
 * - Empty state
 * - Error handling
 * 
 * @example
 * ```tsx
 * <InfiniteScrollContainer
 *   fetchFunction={async (page, size) => {
 *     return await commentService.getCommentsByEntity('FOLDER', folderId, {
 *       page, size, sortBy: 'createdAt', sortDir: 'desc'
 *     });
 *   }}
 *   pageSize={20}
 *   renderItem={(comment) => <CommentItem comment={comment} />}
 *   loadingComponent={<CommentSkeleton />}
 *   emptyComponent={<EmptyComments />}
 * />
 * ```
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useInfiniteScroll, UseInfiniteScrollOptions } from './useInfiniteScroll';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollContainerProps<T> extends Omit<UseInfiniteScrollOptions<T>, 'onDataChange'> {
  /** Function to render each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  
  /** Component to show when loading initial data */
  loadingComponent?: React.ReactNode;
  
  /** Component to show when there's no data */
  emptyComponent?: React.ReactNode;
  
  /** Component to show when there's an error */
  errorComponent?: (error: string, retry: () => void) => React.ReactNode;
  
  /** Class name for the container */
  className?: string;
  
  /** Class name for the items container */
  itemsClassName?: string;
  
  /** Distance from bottom (in pixels) to trigger loading more (default: 100) */
  threshold?: number;
  
  /** Whether to show loading indicator when loading more (default: true) */
  showLoadingMore?: boolean;
  
  /** Custom loading more component */
  loadingMoreComponent?: React.ReactNode;
  
  /** Key extractor for list items (for React keys) */
  keyExtractor?: (item: T, index: number) => string | number;
  
  /** Callback when data changes */
  onDataChange?: (data: T[]) => void;
  
  /** Expose infinite scroll hook return values to parent */
  onInfiniteScrollInit?: (scrollUtils: ReturnType<typeof useInfiniteScroll<T>>) => void;
}

export function InfiniteScrollContainer<T>({
  fetchFunction,
  pageSize = 20,
  fetchOnMount = true,
  initialPage = 0,
  renderItem,
  loadingComponent,
  emptyComponent,
  errorComponent,
  className = '',
  itemsClassName = '',
  threshold = 100,
  showLoadingMore = true,
  loadingMoreComponent,
  keyExtractor,
  onDataChange,
  onInfiniteScrollInit
}: InfiniteScrollContainerProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollUtils = useInfiniteScroll<T>({
    fetchFunction,
    pageSize,
    fetchOnMount,
    initialPage,
    onDataChange
  });

  const {
    data,
    loading,
    loadingMore,
    hasMore,
    error,
    fetchMore,
    refresh
  } = scrollUtils;

  // Expose scroll utils to parent
  useEffect(() => {
    if (onInfiniteScrollInit) {
      onInfiniteScrollInit(scrollUtils);
    }
  }, [onInfiniteScrollInit, scrollUtils]);

  /** Handle scroll event */
  const handleScroll = useCallback(() => {
    if (!containerRef.current || loadingMore || !hasMore) {
      return;
    }

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // Check if user has scrolled near the bottom
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    
    if (distanceFromBottom < threshold) {
      fetchMore();
    }
  }, [loadingMore, hasMore, threshold, fetchMore]);

  /** Attach scroll listener */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  /** Default key extractor */
  const getKey = useCallback((item: T, index: number): string | number => {
    if (keyExtractor) {
      return keyExtractor(item, index);
    }
    // Try to use id property if it exists
    if (item && typeof item === 'object' && 'id' in item) {
      return (item as any).id;
    }
    return index;
  }, [keyExtractor]);

  /** Default loading component */
  const defaultLoadingComponent = (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );

  /** Default empty component */
  const defaultEmptyComponent = (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-muted-foreground mb-2">No data available</div>
      <p className="text-xs text-muted-foreground">There are no items to display</p>
    </div>
  );

  /** Default error component */
  const defaultErrorComponent = (error: string, retry: () => void) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-destructive mb-4">{error}</div>
      <button
        onClick={retry}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        Retry
      </button>
    </div>
  );

  /** Default loading more component */
  const defaultLoadingMoreComponent = (
    <div className="flex items-center justify-center py-4">
      <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
      <span className="text-sm text-muted-foreground">Loading more...</span>
    </div>
  );

  // Show error state
  if (error && !data.length) {
    return (
      <div className={className}>
        {errorComponent ? errorComponent(error, refresh) : defaultErrorComponent(error, refresh)}
      </div>
    );
  }

  // Show loading state for initial load
  if (loading && !data.length) {
    return (
      <div className={className}>
        {loadingComponent || defaultLoadingComponent}
      </div>
    );
  }

  // Show empty state
  if (!loading && !data.length) {
    return (
      <div className={className}>
        {emptyComponent || defaultEmptyComponent}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
    >
      <div className={itemsClassName}>
        {data.map((item, index) => (
          <div key={getKey(item, index)}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Loading more indicator */}
      {showLoadingMore && loadingMore && (
        loadingMoreComponent || defaultLoadingMoreComponent
      )}

      {/* End of data indicator */}
      {!hasMore && data.length > 0 && (
        <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
          No more items to load
        </div>
      )}
    </div>
  );
}

export default InfiniteScrollContainer;






