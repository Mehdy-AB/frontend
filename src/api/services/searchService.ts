import { notificationApiClient } from '../notificationClient';
import { GlobalSearchResultDto, Filters } from '../../types/api';

export class SearchService {
  /**
   * Enhanced search with version support
   */
  static async enhancedSearch(
    query: string,
    params: {
      page?: number;
      size?: number;
      lookUpFolderName?: boolean;
      lookUpDocumentName?: boolean;
      lookUpMetadataKey?: boolean;
      lookUpMetadataValue?: boolean;
      lookUpCategoryName?: boolean;
      lookUpOcrContent?: boolean;
      lookUpDescription?: boolean;
      includeFolders?: boolean;
      includeDocuments?: boolean;
    } = {},
    options?: any
  ): Promise<GlobalSearchResultDto> {
    return notificationApiClient.enhancedSearch(query, params, options);
  }

  /**
   * Search in document versions
   */
  static async searchInVersions(
    query: string,
    params: {
      page?: number;
      size?: number;
      lookUpDocumentName?: boolean;
      lookUpOcrContent?: boolean;
    } = {},
    options?: any
  ): Promise<GlobalSearchResultDto> {
    return notificationApiClient.searchInVersions(query, params, options);
  }

  /**
   * Get document versions
   */
  static async getDocumentVersions(
    documentId: number,
    query?: string,
    options?: any
  ): Promise<GlobalSearchResultDto> {
    return notificationApiClient.getDocumentVersions(documentId, query, options);
  }

  /**
   * Global search (legacy)
   */
  static async globalSearch(
    params: {
      page?: number;
      size?: number;
      query?: string;
      lookUpFolderName?: boolean;
      lookUpDocumentName?: boolean;
      lookUpMetadataKey?: boolean;
      lookUpMetadataValue?: boolean;
      lookUpCategoryName?: boolean;
      lookUpOcrContent?: boolean;
      lookUpDescription?: boolean;
      includeFolders?: boolean;
      includeDocuments?: boolean;
      sortBy?: string;
      sortDesc?: boolean;
    } = {},
    options?: any
  ): Promise<GlobalSearchResultDto> {
    return notificationApiClient.globalSearch(params, options);
  }
}

export default SearchService;