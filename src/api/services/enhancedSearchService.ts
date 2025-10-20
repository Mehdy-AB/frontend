import { notificationApiClient } from '../notificationClient';
import { 
  GlobalSearchResultDto, 
  AdvancedSearchResponseDto,
  UnifiedSearchRequestDto,
  AdvancedSearchRequestDto,
  SearchRequestDto
} from '../../types/api';

// Search history item interface
export interface SearchHistoryItem {
  id: string;
  query: string;
  searchType: 'basic' | 'advanced' | 'unified';
  filters?: any;
  timestamp: number;
  resultCount?: number;
}

// Search configuration interface for URL sharing
export interface SearchConfiguration {
  query?: string;
  searchType: 'basic' | 'advanced' | 'unified';
  filters?: {
    // Basic search filters
    lookUpFolderName?: boolean;
    lookUpDocumentName?: boolean;
    lookUpMetadataKey?: boolean;
    lookUpMetadataValue?: boolean;
    lookUpCategoryName?: boolean;
    lookUpOcrContent?: boolean;
    lookUpDescription?: boolean;
    lookUpTags?: boolean;
    includeFolders?: boolean;
    includeDocuments?: boolean;
    sortBy?: string;
    sortDesc?: boolean;
    
    // Advanced search filters
    selectedCategories?: Array<{
      id: string;
      name: string;
      metadataFilters?: Array<{
        fieldName: string;
        fieldType: string;
        operator: string;
        value: string;
      }>;
    }>;
    searchScope?: {
      searchInName: boolean;
      searchInDescription: boolean;
      searchInMetadata: boolean;
      searchInOcrText: boolean;
    };
    contentType?: 'documents' | 'folders' | 'both';
    dateRange?: {
      from?: string;
      to?: string;
      enabled: boolean;
    };
  };
  page?: number;
  size?: number;
}

export class EnhancedSearchService {
  private static readonly SEARCH_HISTORY_KEY = 'search_history';
  private static readonly MAX_HISTORY_ITEMS = 20;

  /**
   * Unified smart search with automatic routing
   */
  static async unifiedSearch(data: UnifiedSearchRequestDto, options?: any): Promise<GlobalSearchResultDto> {
    return notificationApiClient.unifiedSearch(data, options);
  }


  /**
   * Save search to local storage history
   */
  static saveSearchToHistory(searchItem: Omit<SearchHistoryItem, 'id' | 'timestamp'>): void {
    if (typeof window === 'undefined') return;

    try {
      const history = this.getSearchHistory();
      const newItem: SearchHistoryItem = {
        ...searchItem,
        id: Date.now().toString(),
        timestamp: Date.now()
      };

      // Remove duplicate searches (same query and filters)
      const filteredHistory = history.filter(item => 
        !(item.query === newItem.query && 
          JSON.stringify(item.filters) === JSON.stringify(newItem.filters))
      );

      // Add new item at the beginning
      const updatedHistory = [newItem, ...filteredHistory].slice(0, this.MAX_HISTORY_ITEMS);

      localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to save search to history:', error);
    }
  }

  /**
   * Get search history from local storage
   */
  static getSearchHistory(): SearchHistoryItem[] {
    if (typeof window === 'undefined') return [];

    try {
      const history = localStorage.getItem(this.SEARCH_HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Failed to get search history:', error);
      return [];
    }
  }

  /**
   * Clear search history
   */
  static clearSearchHistory(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  }

  /**
   * Remove specific search from history
   */
  static removeSearchFromHistory(searchId: string): void {
    if (typeof window === 'undefined') return;

    try {
      const history = this.getSearchHistory();
      const updatedHistory = history.filter(item => item.id !== searchId);
      localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to remove search from history:', error);
    }
  }

  /**
   * Convert search configuration to URL parameters
   */
  static configurationToUrlParams(config: SearchConfiguration): URLSearchParams {
    const params = new URLSearchParams();

    if (config.query) {
      params.set('query', config.query);
    }

    params.set('searchType', config.searchType);

    if (config.filters) {
      // Basic search filters
      if (config.filters.lookUpFolderName !== undefined) {
        params.set('lookUpFolderName', config.filters.lookUpFolderName.toString());
      }
      if (config.filters.lookUpDocumentName !== undefined) {
        params.set('lookUpDocumentName', config.filters.lookUpDocumentName.toString());
      }
      if (config.filters.lookUpMetadataKey !== undefined) {
        params.set('lookUpMetadataKey', config.filters.lookUpMetadataKey.toString());
      }
      if (config.filters.lookUpMetadataValue !== undefined) {
        params.set('lookUpMetadataValue', config.filters.lookUpMetadataValue.toString());
      }
      if (config.filters.lookUpCategoryName !== undefined) {
        params.set('lookUpCategoryName', config.filters.lookUpCategoryName.toString());
      }
      if (config.filters.lookUpOcrContent !== undefined) {
        params.set('lookUpOcrContent', config.filters.lookUpOcrContent.toString());
      }
      if (config.filters.lookUpDescription !== undefined) {
        params.set('lookUpDescription', config.filters.lookUpDescription.toString());
      }
      if (config.filters.includeFolders !== undefined) {
        params.set('includeFolders', config.filters.includeFolders.toString());
      }
      if (config.filters.includeDocuments !== undefined) {
        params.set('includeDocuments', config.filters.includeDocuments.toString());
      }
      if (config.filters.sortBy) {
        params.set('sortBy', config.filters.sortBy);
      }
      if (config.filters.sortDesc !== undefined) {
        params.set('sortDesc', config.filters.sortDesc.toString());
      }

      // Advanced search filters
      if (config.filters.selectedCategories && config.filters.selectedCategories.length > 0) {
        params.set('selectedCategories', JSON.stringify(config.filters.selectedCategories));
      }
      if (config.filters.searchScope) {
        params.set('searchScope', JSON.stringify(config.filters.searchScope));
      }
      if (config.filters.contentType) {
        params.set('contentType', config.filters.contentType);
      }
      if (config.filters.dateRange) {
        params.set('dateRange', JSON.stringify(config.filters.dateRange));
      }
    }

    if (config.page !== undefined) {
      params.set('page', config.page.toString());
    }
    if (config.size !== undefined) {
      params.set('size', config.size.toString());
    }

    return params;
  }

  /**
   * Convert URL parameters to search configuration
   */
  static urlParamsToConfiguration(params: URLSearchParams): SearchConfiguration {
    const config: SearchConfiguration = {
      searchType: (params.get('searchType') as 'basic' | 'advanced' | 'unified') || 'basic',
      query: params.get('query') || undefined,
      filters: {},
      page: params.get('page') ? parseInt(params.get('page')!) : 0,
      size: params.get('size') ? parseInt(params.get('size')!) : 20
    };

    // Basic search filters
    if (params.get('lookUpFolderName')) {
      config.filters!.lookUpFolderName = params.get('lookUpFolderName') === 'true';
    }
    if (params.get('lookUpDocumentName')) {
      config.filters!.lookUpDocumentName = params.get('lookUpDocumentName') === 'true';
    }
    if (params.get('lookUpMetadataKey')) {
      config.filters!.lookUpMetadataKey = params.get('lookUpMetadataKey') === 'true';
    }
    if (params.get('lookUpMetadataValue')) {
      config.filters!.lookUpMetadataValue = params.get('lookUpMetadataValue') === 'true';
    }
    if (params.get('lookUpCategoryName')) {
      config.filters!.lookUpCategoryName = params.get('lookUpCategoryName') === 'true';
    }
    if (params.get('lookUpOcrContent')) {
      config.filters!.lookUpOcrContent = params.get('lookUpOcrContent') === 'true';
    }
    if (params.get('lookUpDescription')) {
      config.filters!.lookUpDescription = params.get('lookUpDescription') === 'true';
    }
    if (params.get('includeFolders')) {
      config.filters!.includeFolders = params.get('includeFolders') === 'true';
    }
    if (params.get('includeDocuments')) {
      config.filters!.includeDocuments = params.get('includeDocuments') === 'true';
    }
    if (params.get('sortBy')) {
      config.filters!.sortBy = params.get('sortBy')!;
    }
    if (params.get('sortDesc')) {
      config.filters!.sortDesc = params.get('sortDesc') === 'true';
    }

    // Advanced search filters
    if (params.get('selectedCategories')) {
      try {
        config.filters!.selectedCategories = JSON.parse(params.get('selectedCategories')!);
      } catch (error) {
        console.error('Failed to parse selectedCategories from URL:', error);
      }
    }
    if (params.get('searchScope')) {
      try {
        config.filters!.searchScope = JSON.parse(params.get('searchScope')!);
      } catch (error) {
        console.error('Failed to parse searchScope from URL:', error);
      }
    }
    if (params.get('contentType')) {
      config.filters!.contentType = params.get('contentType') as 'documents' | 'folders' | 'both';
    }
    if (params.get('dateRange')) {
      try {
        config.filters!.dateRange = JSON.parse(params.get('dateRange')!);
      } catch (error) {
        console.error('Failed to parse dateRange from URL:', error);
      }
    }

    return config;
  }

  /**
   * Generate shareable search URL
   */
  static generateSearchUrl(config: SearchConfiguration, baseUrl: string = ''): string {
    const params = this.configurationToUrlParams(config);
    return `${baseUrl}/search?${params.toString()}`;
  }

  /**
   * Execute search based on configuration
   */
  static async executeSearch(config: SearchConfiguration): Promise<GlobalSearchResultDto | AdvancedSearchResponseDto> {
    const { searchType, query, filters, page = 0, size = 20 } = config;

    switch (searchType) {
      case 'unified':
        const unifiedParams: UnifiedSearchRequestDto = {
          query,
          page,
          size,
          includeFolders: filters?.includeFolders ?? true,
          includeDocuments: filters?.includeDocuments ?? true,
          lookUpFolderName: filters?.lookUpFolderName ?? true,
          lookUpDocumentName: filters?.lookUpDocumentName ?? true,
          lookUpMetadataValue: filters?.lookUpMetadataValue ?? false,
          lookUpOcrContent: filters?.lookUpOcrContent ?? false,
          lookUpDescription: filters?.lookUpDescription ?? true,
          sortBy: filters?.sortBy ?? 'score',
          sortDesc: filters?.sortDesc ?? false,
          // Note: Category filtering is now handled through metadataOperations
          // in the new UnifiedSearchRequestDto structure
          createdAtFrom: filters?.dateRange?.from,
          createdAtTo: filters?.dateRange?.to
        };
        return this.unifiedSearch(unifiedParams);

      case 'advanced':
        const advancedParams: AdvancedSearchRequestDto = {
          query,
          page,
          size,
          includeFolders: filters?.includeFolders ?? true,
          includeDocuments: filters?.includeDocuments ?? true,
          searchScope: filters?.searchScope ?? {
            searchInName: true,
            searchInDescription: true,
            searchInMetadata: true,
            searchInOcrText: false
          },
          categoryFilter: filters?.selectedCategories && filters.selectedCategories.length > 0 ? {
            categoryId: parseInt(filters.selectedCategories[0].id),
            categoryName: filters.selectedCategories[0].name,
            metadataFilters: filters.selectedCategories[0].metadataFilters?.map(f => ({
              metadataDefinitionId: 0, // This would need to be mapped properly
              fieldName: f.fieldName,
              fieldType: f.fieldType as any,
              operator: f.operator as any,
              value: f.value,
              caseInsensitive: true,
              inclusive: true
            })) ?? []
          } : undefined,
          createdAt: filters?.dateRange?.enabled ? {
            from: filters.dateRange.from,
            to: filters.dateRange.to,
            inclusive: true
          } : undefined
        };
        return this.unifiedSearch(advancedParams);

      case 'basic':
      default:
        const basicParams: SearchRequestDto = {
          query: query || '',
          page,
          size,
          lookUpFolderName: filters?.lookUpFolderName ?? true,
          lookUpDocumentName: filters?.lookUpDocumentName ?? true,
          lookUpMetadataKey: filters?.lookUpMetadataKey ?? false,
          lookUpMetadataValue: filters?.lookUpMetadataValue ?? false,
          lookUpCategoryName: filters?.lookUpCategoryName ?? false,
          lookUpOcrContent: filters?.lookUpOcrContent ?? false,
          lookUpDescription: filters?.lookUpDescription ?? true,
          includeFolders: filters?.includeFolders ?? true,
          includeDocuments: filters?.includeDocuments ?? true,
          sortBy: filters?.sortBy as any ?? 'score',
          sortDesc: filters?.sortDesc ?? false
        };
        return this.unifiedSearch(basicParams);
    }
  }
}

export default EnhancedSearchService;
