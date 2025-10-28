import { apiClient } from '../client';
import {
  Favorite,
  FavoriteCheckResponse,
  FavoriteCountResponse,
  PageResponse,
} from '../../types/api';

export class FavoriteService {
  private baseUrl = '/api/v1/favorites';

  // Get user's favorites with pagination
  async getFavorites(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'createdAt',
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Promise<PageResponse<Favorite>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDirection,
    });

    return apiClient.get<PageResponse<Favorite>>(`${this.baseUrl}?${params}`);
  }

  // Get favorite by ID
  async getFavoriteById(favoriteId: number): Promise<Favorite> {
    return apiClient.get<Favorite>(`${this.baseUrl}/${favoriteId}`);
  }

  // Add document to favorites
  async addDocumentToFavorites(documentId: number): Promise<Favorite> {
    return apiClient.post<Favorite>(`${this.baseUrl}/documents/${documentId}`);
  }

  // Add folder to favorites
  async addFolderToFavorites(folderId: number): Promise<Favorite> {
    return apiClient.post<Favorite>(`${this.baseUrl}/folders/${folderId}`);
  }

  // Remove document from favorites
  async removeDocumentFromFavorites(documentId: number): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/documents/${documentId}`);
  }

  // Remove folder from favorites
  async removeFolderFromFavorites(folderId: number): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/folders/${folderId}`);
  }

  // Remove favorite by ID
  async removeFavorite(favoriteId: number): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${favoriteId}`);
  }

  // Check if document is favorite
  async checkDocumentFavorite(documentId: number): Promise<FavoriteCheckResponse> {
    return apiClient.get<FavoriteCheckResponse>(`${this.baseUrl}/documents/${documentId}/check`);
  }

  // Check if folder is favorite
  async checkFolderFavorite(folderId: number): Promise<FavoriteCheckResponse> {
    return apiClient.get<FavoriteCheckResponse>(`${this.baseUrl}/folders/${folderId}/check`);
  }

  // Get favorite count
  async getFavoriteCount(): Promise<FavoriteCountResponse> {
    return apiClient.get<FavoriteCountResponse>(`${this.baseUrl}/count`);
  }

  // Get document favorites
  async getDocumentFavorites(
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<Favorite>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<Favorite>>(`${this.baseUrl}/documents?${params}`);
  }

  // Get folder favorites
  async getFolderFavorites(
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<Favorite>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<Favorite>>(`${this.baseUrl}/folders?${params}`);
  }

  // Search favorites
  async searchFavorites(
    query: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<Favorite>> {
    const params = new URLSearchParams({
      query,
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<Favorite>>(`${this.baseUrl}/search?${params}`);
  }

  // Get recent favorites
  async getRecentFavorites(limit: number = 10): Promise<Favorite[]> {
    return apiClient.get<Favorite[]>(`${this.baseUrl}/recent`, {
      params: { limit },
    });
  }

  // Get favorite statistics
  async getFavoriteStatistics(): Promise<{
    totalFavorites: number;
    documentFavorites: number;
    folderFavorites: number;
    favoritesByUser: Record<string, number>;
  }> {
    return apiClient.get(`${this.baseUrl}/statistics`);
  }

  // Bulk operations
  async bulkRemoveFavorites(favoriteIds: number[]): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/bulk`, {
      data: { favoriteIds },
    });
  }

  // Clear all favorites
  async clearAllFavorites(): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/clear`);
  }

  // Export favorites
  async exportFavorites(): Promise<Blob> {
    return apiClient.downloadFile(`${this.baseUrl}/export`);
  }

  // Import favorites
  async importFavorites(file: File): Promise<{
    imported: number;
    failed: number;
    errors: string[];
  }> {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.uploadFile(`${this.baseUrl}/import`, formData);
  }
}

export const favoriteService = new FavoriteService();