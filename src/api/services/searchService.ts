import { apiClient } from '../client';
import {
  UnifiedSearchRequestDto,
  GlobalSearchResultDto,
  AdvancedSearchRequestDto,
  AdvancedSearchResponseDto,
  SearchRequestDto,
  DocumentSearchResponseDto,
  Filters,
  ModelMetadataFilterDto,
  MetadataFieldFilter,
} from '../../types/api';

export class SearchService {
  private baseUrl = '/api/v1/search';

  // Unified search (database + Elasticsearch)
  async unifiedSearch(searchData: UnifiedSearchRequestDto): Promise<GlobalSearchResultDto> {
    return apiClient.post<GlobalSearchResultDto>(`${this.baseUrl}/unified`, searchData);
  }

  // Advanced search
  async advancedSearch(searchData: AdvancedSearchRequestDto): Promise<AdvancedSearchResponseDto> {
    return apiClient.post<AdvancedSearchResponseDto>(`${this.baseUrl}/advanced`, searchData);
  }

  // Simple search
  async search(searchData: SearchRequestDto): Promise<GlobalSearchResultDto> {
    return apiClient.post<GlobalSearchResultDto>(`${this.baseUrl}`, searchData);
  }

  // Search documents only
  async searchDocuments(searchData: SearchRequestDto): Promise<DocumentSearchResponseDto> {
    return apiClient.post<DocumentSearchResponseDto>(`${this.baseUrl}/documents`, searchData);
  }

  // Search folders only
  async searchFolders(searchData: SearchRequestDto): Promise<{
    folders: any[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  }> {
    return apiClient.post(`${this.baseUrl}/folders`, searchData);
  }

  // Get search suggestions
  async getSearchSuggestions(query: string, limit: number = 10): Promise<string[]> {
    return apiClient.get<string[]>(`${this.baseUrl}/suggestions`, {
      params: { query, limit },
    });
  }

  // Get search filters
  async getSearchFilters(): Promise<{
    owners: Array<{ id: string; name: string; count: number }>;
    documentTypes: Array<{ type: string; count: number }>;
    dateRanges: Array<{ label: string; from: string; to: string }>;
    metadataFields: Array<{ id: number; name: string; type: string }>;
  }> {
    return apiClient.get(`${this.baseUrl}/filters`);
  }

  // Get search statistics
  async getSearchStatistics(): Promise<{
    totalSearches: number;
    searchesByType: Record<string, number>;
    popularQueries: Array<{ query: string; count: number }>;
    averageSearchTime: number;
  }> {
    return apiClient.get(`${this.baseUrl}/statistics`);
  }

  // Save search query
  async saveSearchQuery(query: string, filters?: Filters): Promise<{
    id: number;
    name: string;
    query: string;
    filters?: Filters;
    createdAt: string;
  }> {
    return apiClient.post(`${this.baseUrl}/saved`, {
      query,
      filters,
    });
  }

  // Get saved search queries
  async getSavedSearchQueries(): Promise<Array<{
    id: number;
    name: string;
    query: string;
    filters?: Filters;
    createdAt: string;
  }>> {
    return apiClient.get(`${this.baseUrl}/saved`);
  }

  // Delete saved search query
  async deleteSavedSearchQuery(queryId: number): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/saved/${queryId}`);
  }

  // Get search history
  async getSearchHistory(limit: number = 20): Promise<Array<{
    query: string;
    timestamp: string;
    resultCount: number;
  }>> {
    return apiClient.get(`${this.baseUrl}/history`, {
      params: { limit },
    });
  }

  // Clear search history
  async clearSearchHistory(): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/history`);
  }

  // Get metadata filters for search
  async getMetadataFilters(): Promise<ModelMetadataFilterDto[]> {
    return apiClient.get<ModelMetadataFilterDto[]>(`${this.baseUrl}/metadata-filters`);
  }

  // Apply metadata filters to search
  async applyMetadataFilters(filters: MetadataFieldFilter[]): Promise<GlobalSearchResultDto> {
    return apiClient.post<GlobalSearchResultDto>(`${this.baseUrl}/metadata-filters`, { filters });
  }
}

export const searchService = new SearchService();