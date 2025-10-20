import { notificationApiClient } from '../notificationClient';
import { 
  GlobalSearchResultDto, 
  UnifiedSearchRequestDto
} from '../../types/api';

export class SearchService {
  /**
   * Unified smart search with automatic routing
   */
  static async unifiedSearch(data: UnifiedSearchRequestDto, options?: any): Promise<GlobalSearchResultDto> {
    return notificationApiClient.unifiedSearch(data, options);
  }
}

export default SearchService;