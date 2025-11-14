/**
 * Entity Search Service - Search for users, roles, and groups for workflow assignment
 */

import { apiClient } from '../client';
import { PageResponse } from '../../types/api';
import { EntitySearchResult } from '../../types/workflow-admin';

class EntitySearchService {
  private baseUrl = '/api/v1/workflow/search';

  /**
   * Search users by username or email
   */
  async searchUsers(
    query: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<EntitySearchResult>> {
    const response = await apiClient.get<PageResponse<EntitySearchResult>>(`${this.baseUrl}/users`, {
      params: { query, page, size },
    });
    return response.data;
  }

  /**
   * Search roles by name
   */
  async searchRoles(
    query: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<EntitySearchResult>> {
    const response = await apiClient.get<PageResponse<EntitySearchResult>>(`${this.baseUrl}/roles`, {
      params: { query, page, size },
    });
    return response.data;
  }

  /**
   * Search groups by name
   */
  async searchGroups(
    query: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<EntitySearchResult>> {
    const response = await apiClient.get<PageResponse<EntitySearchResult>>(`${this.baseUrl}/groups`, {
      params: { query, page, size },
    });
    return response.data;
  }

  /**
   * Search all entity types at once
   */
  async searchAll(query: string, limit: number = 30): Promise<EntitySearchResult[]> {
    const response = await apiClient.get<EntitySearchResult[]>(`${this.baseUrl}/all`, {
      params: { query, limit },
    });
    return response.data;
  }

  /**
   * Search entities by type
   */
  async searchByType(
    type: 'USER' | 'ROLE' | 'GROUP',
    query: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<EntitySearchResult>> {
    switch (type) {
      case 'USER':
        return this.searchUsers(query, page, size);
      case 'ROLE':
        return this.searchRoles(query, page, size);
      case 'GROUP':
        return this.searchGroups(query, page, size);
      default:
        throw new Error(`Unknown entity type: ${type}`);
    }
  }
}

export const entitySearchService = new EntitySearchService();

