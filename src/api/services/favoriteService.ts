import { apiClient } from '../client';
import {
  Favorite,
  FavoriteCheckResponse,
  FavoriteCountResponse,
  PageResponse,
} from '../../types/api';

export class FavoriteService {
  private baseUrl = '/api/v1/favorites';

  // Get user's favorites with pagination (combined documents + folders)
  async getFavorites(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'createdAt',
    sortDir: 'asc' | 'desc' = 'desc',
    query?: string,
    type: 'all' | 'documents' | 'folders' = 'all'
  ): Promise<PageResponse<any>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDir,
      type,
    });
    if (query && query.trim()) params.set('query', query.trim());

    return apiClient.get<PageResponse<any>>(`${this.baseUrl}/my-repo?${params}`);
  }

  // Add document to favorites
  async addDocumentToFavorites(documentId: number): Promise<Favorite> {
    return apiClient.post<Favorite>(`${this.baseUrl}/document/${documentId}`);
  }

  // Add folder to favorites
  async addFolderToFavorites(folderId: number): Promise<Favorite> {
    return apiClient.post<Favorite>(`${this.baseUrl}/folder/${folderId}`);
  }

  // Remove document from favorites
  async removeDocumentFromFavorites(documentId: number): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/document/${documentId}`);
  }

  // Remove folder from favorites
  async removeFolderFromFavorites(folderId: number): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/folder/${folderId}`);
  }

  // Check if document is favorite
  async checkDocumentFavorite(documentId: number): Promise<FavoriteCheckResponse> {
    return apiClient.get<FavoriteCheckResponse>(`${this.baseUrl}/document/${documentId}/check`);
  }

  // Check if folder is favorite
  async checkFolderFavorite(folderId: number): Promise<FavoriteCheckResponse> {
    return apiClient.get<FavoriteCheckResponse>(`${this.baseUrl}/folder/${folderId}/check`);
  }

  // Get favorite count (combined documents + folders)
  async getFavoriteCount(): Promise<FavoriteCountResponse> {
    return apiClient.get<FavoriteCountResponse>(`${this.baseUrl}/my-repo/count`);
  }
  
  // Get document favorites count
  async getDocumentFavoritesCount(): Promise<FavoriteCountResponse> {
    return apiClient.get<FavoriteCountResponse>(`${this.baseUrl}/my-favorites/count`);
  }
  
  // Get folder favorites count
  async getFolderFavoritesCount(): Promise<FavoriteCountResponse> {
    return apiClient.get<FavoriteCountResponse>(`${this.baseUrl}/my-folder-favorites/count`);
  }

  // Get my document favorites
  async getDocumentFavorites(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'createdAt',
    sortDir: 'asc' | 'desc' = 'desc'
  ): Promise<PageResponse<Favorite>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDir,
    });

    return apiClient.get<PageResponse<Favorite>>(`${this.baseUrl}/my-favorites?${params}`);
  }

  // Get my folder favorites
  async getFolderFavorites(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'createdAt',
    sortDir: 'asc' | 'desc' = 'desc'
  ): Promise<PageResponse<Favorite>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDir,
    });

    return apiClient.get<PageResponse<Favorite>>(`${this.baseUrl}/my-folder-favorites?${params}`);
  }

  // ========== UNIMPLEMENTED METHODS (No backend endpoints) ==========
  // TODO: Implement these endpoints in the backend if needed
  
  // // Search favorites
  // async searchFavorites(
  //   query: string,
  //   page: number = 0,
  //   size: number = 20
  // ): Promise<PageResponse<Favorite>> {
  //   throw new Error('Not implemented: Search favorites endpoint does not exist in backend');
  // }

  // // Get recent favorites
  // async getRecentFavorites(limit: number = 10): Promise<Favorite[]> {
  //   throw new Error('Not implemented: Recent favorites endpoint does not exist in backend');
  // }

  // // Get favorite statistics
  // async getFavoriteStatistics(): Promise<{
  //   totalFavorites: number;
  //   documentFavorites: number;
  //   folderFavorites: number;
  //   favoritesByUser: Record<string, number>;
  // }> {
  //   throw new Error('Not implemented: Favorite statistics endpoint does not exist in backend');
  // }

  // // Bulk operations
  // async bulkRemoveFavorites(favoriteIds: number[]): Promise<void> {
  //   throw new Error('Not implemented: Bulk remove favorites endpoint does not exist in backend');
  // }

  // // Clear all favorites
  // async clearAllFavorites(): Promise<void> {
  //   throw new Error('Not implemented: Clear all favorites endpoint does not exist in backend');
  // }

  // // Export favorites
  // async exportFavorites(): Promise<Blob> {
  //   throw new Error('Not implemented: Export favorites endpoint does not exist in backend');
  // }

  // // Import favorites
  // async importFavorites(file: File): Promise<{
  //   imported: number;
  //   failed: number;
  //   errors: string[];
  // }> {
  //   throw new Error('Not implemented: Import favorites endpoint does not exist in backend');
  // }
}

export const favoriteService = new FavoriteService();