import { apiClient } from '../client'
import { notificationApiClient } from '../notificationClient'
import { Favorite, FolderFavorite, FavoriteCheckResponse, FavoriteCountResponse, PageResponse } from '../../types/api'

export class FavoriteService {
  // ==================== FAVORITE ENDPOINTS ====================

  /**
   * Add document to favorites
   */
  async addToFavorites(documentId: number): Promise<Favorite> {
    return notificationApiClient.addToFavorites(documentId)
  }

  /**
   * Remove document from favorites
   */
  async removeFromFavorites(documentId: number): Promise<void> {
    return notificationApiClient.removeFromFavorites(documentId)
  }

  /**
   * Check if document is favorite
   */
  async isFavorite(documentId: number): Promise<FavoriteCheckResponse> {
    return notificationApiClient.isFavorite(documentId)
  }

  /**
   * Get current user's favorites
   */
  async getMyFavorites(params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<PageResponse<Favorite>> {
    return notificationApiClient.getMyFavorites(params)
  }

  /**
   * Get favorites by user
   */
  async getFavoritesByUser(userId: string, params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<PageResponse<Favorite>> {
    return notificationApiClient.getFavoritesByUser(userId, params)
  }

  /**
   * Get favorites for document
   */
  async getFavoritesByDocument(documentId: number, params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<PageResponse<Favorite>> {
    return notificationApiClient.getFavoritesByDocument(documentId, params)
  }

  /**
   * Get current user's favorite count
   */
  async getMyFavoritesCount(): Promise<FavoriteCountResponse> {
    return notificationApiClient.getMyFavoritesCount()
  }

  /**
   * Get user's favorite count
   */
  async getUserFavoritesCount(userId: string): Promise<FavoriteCountResponse> {
    return notificationApiClient.getUserFavoritesCount(userId)
  }

  /**
   * Get document's favorite count
   */
  async getDocumentFavoritesCount(documentId: number): Promise<FavoriteCountResponse> {
    return notificationApiClient.getDocumentFavoritesCount(documentId)
  }

  /**
   * Get all favorites (admin)
   */
  async getAllFavorites(params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<PageResponse<Favorite>> {
    return notificationApiClient.getAllFavorites(params)
  }

  // ==================== FOLDER FAVORITE ENDPOINTS ====================

  /**
   * Add folder to favorites
   */
  async addFolderToFavorites(folderId: number): Promise<FolderFavorite> {
    return notificationApiClient.addFolderToFavorites(folderId)
  }

  /**
   * Remove folder from favorites
   */
  async removeFolderFromFavorites(folderId: number): Promise<void> {
    return notificationApiClient.removeFolderFromFavorites(folderId)
  }

  /**
   * Check if folder is favorite
   */
  async isFolderFavorite(folderId: number): Promise<FavoriteCheckResponse> {
    return notificationApiClient.isFolderFavorite(folderId)
  }

  /**
   * Get current user's folder favorites
   */
  async getMyFolderFavorites(params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<PageResponse<FolderFavorite>> {
    return notificationApiClient.getMyFolderFavorites(params)
  }

  /**
   * Get folder favorites by folder
   */
  async getFolderFavoritesByFolder(folderId: number, params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<PageResponse<FolderFavorite>> {
    return notificationApiClient.getFolderFavoritesByFolder(folderId, params)
  }

  /**
   * Get current user's folder favorite count
   */
  async getMyFolderFavoritesCount(): Promise<FavoriteCountResponse> {
    return notificationApiClient.getMyFolderFavoritesCount()
  }

  // ==================== COMBINED FAVORITES (getMyRepo) ====================

  /**
   * Get all favorites (documents and folders) for current user
   */
  async getMyRepo(params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<PageResponse<any>> {
    return notificationApiClient.getMyRepo(params)
  }

  /**
   * Get count of all favorites for current user
   */
  async getMyRepoCount(): Promise<FavoriteCountResponse> {
    return notificationApiClient.getMyRepoCount()
  }

  /**
   * Check favorite status for multiple documents and folders
   */
  async checkFavoriteStatus(request: {
    documentIds?: number[];
    folderIds?: number[];
  }): Promise<{
    documents?: Record<number, boolean>;
    folders?: Record<number, boolean>;
  }> {
    return notificationApiClient.checkFavoriteStatus(request)
  }
}

// Create and export a singleton instance
export const favoriteService = new FavoriteService()
export default favoriteService

